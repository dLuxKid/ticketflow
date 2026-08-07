import mongoose from 'mongoose';
import * as bookingRepository from '../repositories/bookingRepository.js';
import * as auditLogRepository from '../repositories/auditLogRepository.js';
import {
  emitAdmitted,
  emitRejected,
} from '../shared/events/admissionEvents.js';
import AppError from '../shared/errors/AppError.js';

/**
 * Door admission - the single check-in path for every guest type.
 *
 * A scan carries a code (an invite token for invited guests, a ticketId for purchased
 * ones). We resolve the booking, authorize the scanner, then flip status to `admitted`
 * atomically so the same ticket can never be admitted twice. Every decision - admit or
 * reject - is written to the audit log and published on the admission bus (Phase 3 pushes
 * these to the live dashboard).
 */

const equalsId = (a, b) => Boolean(a && b && a.equals?.(b));

/**
 * Statuses from which a booking can still be admitted. Mirrors the guard in
 * `bookingRepository.admitById`, which is what actually enforces single use - this copy is
 * only used to decide whether the capacity limit is even relevant to a given scan.
 */
const ADMITTABLE_STATUSES = ['issued', 'delivered', 'scanned'];

/**
 * Pure authorization decision: may `actor` admit guests for `event`?
 *  - admin: any event
 *  - the event's owner: their own event
 *  - usher: only events they are assigned to (otherwise it's a wrong-event scan)
 * Exported for unit testing.
 *
 * Ownership is checked on its own, not in combination with the `creator` role. Role is not
 * a reliable proxy for it: accounts that own events are not all labelled `creator` (see
 * eventService.updateEvent, which likewise gates on ownership alone), and pairing the two
 * locked an organiser out of admitting guests to the event they had just created.
 *
 * @returns {{ok: true} | {ok: false, httpStatus: number, reason?: string, auditable?: boolean}}
 */
export const authorizeScan = (actor, event) => {
  if (!actor || !event) return { ok: false, httpStatus: 403 };
  if (actor.role === 'admin') return { ok: true };
  if (equalsId(event.user, actor._id)) return { ok: true };
  if (actor.role === 'usher') {
    const assigned = (actor.assignedEvents || []).some((id) =>
      equalsId(id, event._id),
    );
    return assigned
      ? { ok: true }
      : { ok: false, httpStatus: 403, reason: 'wrong_event', auditable: true };
  }
  return { ok: false, httpStatus: 403 };
};

/**
 * Pure: maps a non-admittable booking status to an audit reason. Exported for testing.
 */
export const rejectionReasonForStatus = (status) => {
  if (status === 'admitted') return 'already_admitted';
  if (status === 'revoked') return 'revoked';
  return 'not_admittable';
};

const REJECTION_MESSAGE = {
  wrong_event: 'This ticket is not for an event you are checking in',
  already_admitted: 'This ticket has already been admitted',
  revoked: 'This ticket has been revoked',
  not_admittable: 'This ticket cannot be admitted',
  at_capacity:
    'The venue has reached its safe capacity. Admitting more people requires a supervisor override.',
};

/**
 * Pure: may one more person be admitted right now? Exported for unit testing.
 *
 * Venue occupancy limits are a fire-safety obligation, not a commercial one, so the door
 * enforces them rather than trusting ticket inventory - organisers deliberately oversell
 * against expected no-shows, which would make totalQuantity the wrong number to stop on if a
 * venueCapacity has been set.
 *
 * The limit is a stop-and-confirm, not a hard block: refusing entry outright would strand a
 * paying guest at the door with no recourse, so a supervisor may override. The override is
 * recorded on the audit row, which means exceeding capacity leaves evidence naming who
 * authorised it rather than happening silently.
 *
 * @param {{admitted:number, capacity:number, override?:boolean}} args
 * @returns {{allow:boolean, reason?:string}}
 */
export const capacityDecision = ({ admitted, capacity, override = false }) => {
  // No capacity configured - an invite-only event carries no ticket inventory, and blocking
  // admission because a number is absent would be worse than not enforcing one.
  if (!capacity || capacity <= 0) return { allow: true };
  if (admitted < capacity) return { allow: true };
  if (override) return { allow: true, reason: 'capacity_override' };
  return { allow: false, reason: 'at_capacity' };
};

/**
 * Admits a guest from a scanned code.
 *
 * @param {string} code - scanned QR payload (inviteToken or ticketId)
 * @param {object} actor - req.user (the usher/organiser/admin scanning)
 * @param {{deviceId?: string, ip?: string}} [context] - best-effort scanner fingerprint,
 *   recorded on the audit row only as a Phase 5 anomaly-detection signal - never used for
 *   authorization.
 * @returns {Promise<{outcome: 'admitted', booking: object}>}
 * @throws {AppError} 400/403/404/409 on invalid, unauthorized, unknown, or non-admittable
 */
export const checkInByScan = async (code, actor, context = {}) => {
  if (!code) throw new AppError('No ticket code provided', 400);

  const booking = await bookingRepository.findByScanCode(code);
  if (!booking) throw new AppError('Invalid or unrecognised ticket', 404);

  // A booking whose event does not load is not the same thing as an unknown code, and
  // saying so matters at a door: `Event.pre(/^find/)` hides archived events from every
  // query including this populate, so an admin archiving an event made all of its tickets
  // report as forgeries. The usher then has a real guest holding a real ticket and an error
  // message accusing them of fraud, with nothing to act on.
  if (!booking.event) {
    throw new AppError(
      'This ticket is valid, but its event has been archived and cannot admit guests. ' +
        'Ask an administrator to restore it.',
      409,
    );
  }
  const event = booking.event;

  const auth = authorizeScan(actor, event);
  if (!auth.ok) {
    // A usher scanning a ticket for an event they don't work is a recorded security event.
    if (auth.auditable) {
      await recordRejection(
        event._id,
        booking._id,
        actor._id,
        auth.reason,
        context,
      );
    }
    throw new AppError(
      REJECTION_MESSAGE[auth.reason] ??
        'You do not have permission to check in tickets',
      auth.httpStatus,
    );
  }

  // Atomically admit and record the admission together, so we never log an admission that
  // didn't happen (or vice versa). NOTE: requires MongoDB running as a replica set.
  const session = await mongoose.startSession();
  let admitted;
  let capacity = { allow: true };
  try {
    await session.withTransaction(async () => {
      // Capacity limits only admissions that would actually put another person in the room.
      // A ticket that is already admitted, revoked or otherwise unusable adds nobody, so
      // testing it against the limit produces a wrong and actively confusing answer at the
      // door: re-scanning a guest who is already inside a full venue would report "the venue
      // is full" and offer a supervisor override, when the correct - and reassuring - answer
      // is "this ticket has already been admitted". Admissibility is therefore established
      // first, and the limit applied only to a scan that would genuinely add someone.
      //
      // This ordering does not weaken the limit under concurrency. Two simultaneous scans of
      // one ticket both pass this pre-check, both evaluate capacity, and are then separated
      // by the atomic claim below, exactly as before - the claim, not this read, is what
      // guarantees single use.
      if (ADMITTABLE_STATUSES.includes(booking.status)) {
        // Counted inside the transaction, not before it: two scanners working the same door
        // at capacity-1 would otherwise both read "one seat left" and both admit.
        const effectiveCapacity =
          event.venueCapacity ?? event.totalQuantity ?? 0;
        const admittedCount = await bookingRepository.countByEventAndStatus(
          event._id,
          'admitted',
          session,
        );
        capacity = capacityDecision({
          admitted: admittedCount,
          capacity: effectiveCapacity,
          override: context.overrideCapacity === true,
        });
        if (!capacity.allow) return;
      }

      admitted = await bookingRepository.admitById(booking._id, session);
      if (admitted) {
        await auditLogRepository.record(
          {
            event: event._id,
            booking: booking._id,
            actor: actor._id,
            outcome: 'admitted',
            // Present only on an override, so the log distinguishes a routine admission
            // from one that knowingly took the room past its safe occupancy.
            reason: capacity.reason,
            deviceId: context.deviceId,
            ip: context.ip,
          },
          session,
        );
      }
    });
  } finally {
    await session.endSession();
  }

  // Refused on capacity: recorded outside the transaction, which was rolled back.
  if (!capacity.allow) {
    await recordRejection(
      event._id,
      booking._id,
      actor._id,
      'at_capacity',
      context,
    );
    // Coded so the scanner can offer a supervisor override for this refusal specifically,
    // and not for an already-admitted or revoked ticket, where overriding is meaningless.
    throw new AppError(REJECTION_MESSAGE.at_capacity, 409, 'at_capacity');
  }

  if (admitted) {
    emitAdmitted({
      eventId: String(event._id),
      bookingId: String(booking._id),
      name: admitted.name,
      ticketType: admitted.ticketType,
      at: new Date().toISOString(),
    });
    return { outcome: 'admitted', booking: admitted };
  }

  // Not admittable: re-read the current status for an accurate reason, then reject.
  const current = await bookingRepository.findById(booking._id);
  const reason = rejectionReasonForStatus(current?.status);
  await recordRejection(event._id, booking._id, actor._id, reason, context);
  throw new AppError(REJECTION_MESSAGE[reason], 409);
};

/** Writes a rejection audit row and publishes the rejection event. */
const recordRejection = async (
  eventId,
  bookingId,
  actorId,
  reason,
  context = {},
) => {
  await auditLogRepository.record({
    event: eventId,
    booking: bookingId,
    actor: actorId,
    outcome: 'rejected',
    reason,
    deviceId: context.deviceId,
    ip: context.ip,
  });
  emitRejected({
    eventId: String(eventId),
    bookingId: String(bookingId),
    reason,
  });
};
