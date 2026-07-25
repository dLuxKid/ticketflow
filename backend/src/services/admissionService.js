import mongoose from 'mongoose';
import * as bookingRepository from '../repositories/bookingRepository.js';
import * as auditLogRepository from '../repositories/auditLogRepository.js';
import { emitAdmitted, emitRejected } from '../shared/events/admissionEvents.js';
import AppError from '../shared/errors/AppError.js';

/**
 * Door admission — the single check-in path for every guest type.
 *
 * A scan carries a code (an invite token for invited guests, a ticketId for purchased
 * ones). We resolve the booking, authorize the scanner, then flip status to `admitted`
 * atomically so the same ticket can never be admitted twice. Every decision — admit or
 * reject — is written to the audit log and published on the admission bus (Phase 3 pushes
 * these to the live dashboard).
 */

const equalsId = (a, b) => Boolean(a && b && a.equals?.(b));

/**
 * Pure authorization decision: may `actor` admit guests for `event`?
 *  - admin: any event
 *  - creator: only their own event
 *  - usher: only events they are assigned to (otherwise it's a wrong-event scan)
 * Exported for unit testing.
 *
 * @returns {{ok: true} | {ok: false, httpStatus: number, reason?: string, auditable?: boolean}}
 */
export const authorizeScan = (actor, event) => {
  if (!actor || !event) return { ok: false, httpStatus: 403 };
  if (actor.role === 'admin') return { ok: true };
  if (actor.role === 'creator' && equalsId(event.user, actor._id)) {
    return { ok: true };
  }
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
};

/**
 * Admits a guest from a scanned code.
 *
 * @param {string} code - scanned QR payload (inviteToken or ticketId)
 * @param {object} actor - req.user (the usher/organiser/admin scanning)
 * @param {{deviceId?: string, ip?: string}} [context] - best-effort scanner fingerprint,
 *   recorded on the audit row only as a Phase 5 anomaly-detection signal — never used for
 *   authorization.
 * @returns {Promise<{outcome: 'admitted', booking: object}>}
 * @throws {AppError} 400/403/404/409 on invalid, unauthorized, unknown, or non-admittable
 */
export const checkInByScan = async (code, actor, context = {}) => {
  if (!code) throw new AppError('No ticket code provided', 400);

  const booking = await bookingRepository.findByScanCode(code);
  if (!booking || !booking.event) {
    throw new AppError('Invalid or unrecognised ticket', 404);
  }
  const event = booking.event;

  const auth = authorizeScan(actor, event);
  if (!auth.ok) {
    // A usher scanning a ticket for an event they don't work is a recorded security event.
    if (auth.auditable) {
      await recordRejection(event._id, booking._id, actor._id, auth.reason, context);
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
  try {
    await session.withTransaction(async () => {
      admitted = await bookingRepository.admitById(booking._id, session);
      if (admitted) {
        await auditLogRepository.record(
          {
            event: event._id,
            booking: booking._id,
            actor: actor._id,
            outcome: 'admitted',
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
const recordRejection = async (eventId, bookingId, actorId, reason, context = {}) => {
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
