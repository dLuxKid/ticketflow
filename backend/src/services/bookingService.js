import mongoose from 'mongoose';
import * as bookingRepository from '../repositories/bookingRepository.js';
import * as eventRepository from '../repositories/eventRepository.js';
import * as auditLogRepository from '../repositories/auditLogRepository.js';
import { authorizeScan } from './admissionService.js';
import { getEventForViewer } from './dashboardService.js';
import {
  priceBuyers,
  buildSplit,
  toMinorUnits,
  DEFAULT_CURRENCY,
} from './pricingService.js';
import { sendPdf } from '../shared/utils/generatePdf.js';
import generateTicketId from '../shared/utils/ticketIdGenerator.js';
import AppError from '../shared/errors/AppError.js';

/**
 * Business logic layer for bookings.
 * Framework-agnostic: no req/res/next.
 */

/** How long a reservation holds its seats before the sweep returns them to inventory. */
export const RESERVATION_TTL_MS = 15 * 60 * 1000;

/** Server-issued Paystack reference. Numeric to match the stored field's type. */
const generateReference = () =>
  Date.now() * 1000 + Math.floor(Math.random() * 1000);

/**
 * Reserves seats for each ticket buyer and creates their bookings in a `pending` state,
 * BEFORE the buyer is sent to Paystack.
 *
 * This ordering is the point of the function. Previously the client paid first and then
 * asked the API to create the booking, which meant a closed tab, a dropped connection or a
 * sold-out tier between payment and callback left the buyer charged with no booking and no
 * ticket - and because inventory was only decremented after payment, two buyers could both
 * pay for the last seat. Holding the seats first makes "charged" strictly imply "reserved".
 *
 * Nothing is emailed here: tickets go out from confirmReservation once the charge is
 * verified. Free events are confirmed inline since there is no charge to wait for.
 *
 * @param {object[]} ticketBuyers - buyer objects from the request
 * @param {string} eventId - the event being booked
 * @param {string|undefined} userId - authenticated user, if any (guest checkout is allowed)
 * @returns {Promise<{reference:number, bookings:object[], requiresPayment:boolean}>}
 */
export const reserveBooking = async (ticketBuyers, eventId, userId) => {
  if (!Array.isArray(ticketBuyers) || ticketBuyers.length === 0) {
    throw new AppError('At least one ticket buyer is required', 400);
  }

  const reference = generateReference();
  const expiresAt = new Date(Date.now() + RESERVATION_TTL_MS);

  // Fail fast with a clear 404 if the event doesn't exist, rather than reporting it
  // as "not enough tickets" from the reservation guard below. Loaded with the organiser's
  // payout account attached, because both the price and who gets paid are properties of
  // the event, not of the request.
  const eventExists = await eventRepository.findByIdWithPayoutAccount(eventId);
  if (!eventExists) throw new AppError('No event found with that ID', 404);

  // Invite-only events admit guests from the organiser's guest list, not by purchase.
  // Checked before pricing: such an event carries no ticket tiers at all, so pricing would
  // otherwise reject it as "ticket type not available" and hide the real reason.
  if (eventExists.accessMode === 'invite_only') {
    throw new AppError(
      'This event is invite-only; tickets are not available for purchase',
      403,
    );
  }

  // Price and currency come from the event's own tiers, discarding whatever the client
  // sent. Until this existed `price` was spread straight in from the request and never
  // checked - and the Paystack amount was computed in the browser too - so a buyer could
  // name their own price. See pricingService: this is a prerequisite of the platform fee,
  // since a percentage of an attacker-chosen number is not a fee.
  const { buyers: pricedBuyers, totalMinor } = priceBuyers(
    ticketBuyers,
    eventExists,
  );

  // Attach the authenticated user ID, the server-issued reference and the hold. The
  // reference is generated here, not accepted from the client, so a caller cannot attach
  // its reservation to somebody else's in-flight charge.
  //
  // `ticketId` is issued here for the same reason, and is listed after the spread so a
  // client-supplied value is discarded rather than trusted. It used to be minted in the
  // browser, which meant the caller chose the very code the door scanner admits on
  // (bookingRepository.findByInviteTokenOrTicketId matches inviteToken OR ticketId) - a
  // buyer could have set it to a value already issued to someone else, or simply picked
  // a guessable one. Uniqueness is enforced by the unique index on Booking.ticketId.
  //
  // `event` is stamped from the eventId argument for the same reason. It used to be taken
  // from each buyer object, so the event whose inventory was reserved and the event the
  // bookings were written against came from two separate client-supplied values - a caller
  // could hold a seat on a cheap event while issuing itself tickets to a sold-out one.
  const buyers = pricedBuyers.map((buyer) => ({
    ...buyer,
    event: eventId,
    user: userId,
    reference,
    ticketId: generateTicketId(),
    transactionStatus: 'pending',
    reservationExpiresAt: expiresAt,
  }));

  // Count how many of each ticket type are being purchased
  const ticketsCount = {};
  for (const buyer of buyers) {
    ticketsCount[buyer.ticketType] = (ticketsCount[buyer.ticketType] || 0) + 1;
  }

  // Reserve inventory and persist bookings atomically. Reservation uses a guarded
  // atomic $inc (see eventRepository.reserveTicketInventory) so concurrent buyers can
  // never oversell; the surrounding transaction guarantees bookings are only written
  // if every ticket type was successfully reserved, and rolled back otherwise.
  // NOTE: multi-document transactions require MongoDB to run as a replica set.
  const session = await mongoose.startSession();
  let booking;
  try {
    await session.withTransaction(async () => {
      for (const [ticketType, count] of Object.entries(ticketsCount)) {
        const reserved = await eventRepository.reserveTicketInventory(
          eventId,
          ticketType,
          count,
          session,
        );
        if (!reserved) {
          throw new AppError(
            `Not enough "${ticketType}" tickets remaining`,
            409,
          );
        }
      }
      booking = await bookingRepository.insertMany(buyers, session);
    });
  } finally {
    await session.endSession();
  }

  // A free event has nothing to charge for, so there is no webhook coming. Confirm the
  // reservation inline; the buyer gets their ticket immediately, exactly as before.
  const requiresPayment = totalMinor > 0;
  if (!requiresPayment) {
    await confirmReservation(reference);
    return { reference, bookings: booking, requiresPayment: false };
  }

  // The whole checkout configuration is built here rather than in the browser. The amount,
  // the destination subaccount and the platform's cut all decide who receives money, so
  // none of them can be a client-side value - the previous code opened Paystack with a
  // browser-computed amount and a public key hard-coded into the bundle.
  return {
    reference,
    bookings: booking,
    requiresPayment: true,
    checkout: buildCheckoutConfig({
      reference,
      amountMinor: totalMinor,
      currency: eventExists.currency || DEFAULT_CURRENCY,
      organiser: eventExists.user,
      eventName: eventExists.eventName,
    }),
  };
};

/**
 * Assembles the Paystack parameters the browser needs, including the split.
 *
 * Refusing outright when the organiser has no payout account is deliberate. The alternative
 * - charging the buyer anyway and settling the whole amount into the platform account - is
 * exactly the silent revenue retention this feature exists to remove, and it would be
 * invisible to both the organiser and the buyer. A clear refusal at checkout is recoverable
 * in minutes through the payout settings page; money quietly landing in the wrong account
 * is not.
 *
 * @throws {AppError} 409 when the organiser cannot be paid
 */
const buildCheckoutConfig = ({
  reference,
  amountMinor,
  currency,
  organiser,
  eventName,
}) => {
  const publicKey = process.env.PAYSTACK_PUBLIC_KEY;
  if (!publicKey) {
    throw new AppError('Payments are not configured on this deployment', 503);
  }

  const subaccountCode = organiser?.payout?.subaccountCode;
  if (!subaccountCode) {
    throw new AppError(
      `The organiser of "${eventName}" has not set up payouts yet, so tickets cannot be sold. ` +
        'If you are the organiser, add a payout account in your profile settings.',
      409,
    );
  }

  return {
    reference: String(reference),
    amount: amountMinor,
    currency,
    publicKey,
    ...buildSplit(amountMinor, subaccountCode),
  };
};

/**
 * The amount a reservation should have been charged, in minor units.
 *
 * Read back from the persisted bookings rather than recomputed from the request, so the
 * figure being verified against is the one the server itself wrote at reservation time.
 * Returns 0 when the reference is unknown, which callers treat as "nothing to check"
 * rather than "nothing owed" - an unknown reference cannot confirm anything anyway.
 *
 * @param {number|string} reference
 * @returns {Promise<number>}
 */
export const expectedAmountMinor = async (reference) => {
  const bookings = await bookingRepository.findByReference(reference);
  if (!bookings.length) return 0;
  return toMinorUnits(
    bookings.reduce((sum, b) => sum + Number(b.price ?? 0), 0),
  );
};

/**
 * Confirms a paid reservation: flips it out of `pending` and emails the tickets.
 *
 * Idempotent by construction. Both the Paystack webhook and the client's post-checkout
 * verify call land here, and Paystack retries webhooks, so this runs repeatedly for one
 * checkout. The guarded update in confirmByReference means exactly one call transitions the
 * bookings, and only that call sends email - the rest are no-ops that still return success.
 *
 * @param {number|string} reference
 * @param {{transactionNumber?:number, message?:string}} [details] - provider details, if known
 * @returns {Promise<{confirmed:boolean, ticketsSent:number}>}
 */
export const confirmReservation = async (reference, details = {}) => {
  const fields = {};
  if (details.transactionNumber != null)
    fields.transactionNumber = details.transactionNumber;
  if (details.message != null) fields.message = details.message;

  const result = await bookingRepository.confirmByReference(reference, fields);
  if (!result.modifiedCount) {
    // Already confirmed (webhook retry, or the client beat us to it) - or never existed.
    return { confirmed: false, ticketsSent: 0 };
  }

  const bookings = await bookingRepository.findByReference(reference);
  if (bookings.length === 0) return { confirmed: true, ticketsSent: 0 };

  const event = await eventRepository.findByIdWithOrganizer(bookings[0].event);

  // Delivery must not undo a confirmed payment: a bounced email is logged and the booking
  // stays valid, since the QR is still scannable from the buyer's account.
  let ticketsSent = 0;
  await Promise.all(
    bookings.map(async (booking) => {
      try {
        // sendPdf generates and attaches the QR itself (inline cid: attachment - a data
        // URL here would be stripped by Gmail and arrive as a blank square).
        await sendPdf({
          ...event._doc,
          organizer: event.user?.name,
          ...booking.toObject(),
        });
        ticketsSent += 1;
      } catch (err) {
        console.error(
          `Ticket delivery failed for booking ${booking._id} (${booking.email}):`,
          err.message,
        );
      }
    }),
  );

  return { confirmed: true, ticketsSent };
};

/**
 * Releases a reservation and returns its seats to inventory.
 *
 * Called when Paystack reports the charge failed or was abandoned, and by the expiry sweep.
 * The booking rows are kept (marked `revoked` with a terminal transactionStatus) rather than
 * deleted, so an abandoned checkout stays auditable.
 *
 * @param {number|string} reference
 * @param {'failed'|'expired'} transactionStatus
 * @returns {Promise<{released:boolean, seats:number}>}
 */
export const releaseReservation = async (reference, transactionStatus) => {
  const bookings = await bookingRepository.findByReference(reference);
  const pending = bookings.filter((b) => b.transactionStatus === 'pending');
  if (pending.length === 0) return { released: false, seats: 0 };

  // Flip the bookings first, guarded on `pending`. Whoever wins that transition owns the
  // inventory return, so a webhook retry racing the sweep cannot credit the seats twice.
  const result = await bookingRepository.releaseByReference(
    reference,
    transactionStatus,
  );
  if (!result.modifiedCount) return { released: false, seats: 0 };

  const perTier = {};
  for (const booking of pending) {
    perTier[booking.ticketType] = (perTier[booking.ticketType] || 0) + 1;
  }

  for (const [ticketType, count] of Object.entries(perTier)) {
    await eventRepository.releaseTicketInventory(
      pending[0].event,
      ticketType,
      count,
    );
  }

  return { released: true, seats: pending.length };
};

/**
 * Returns the seats held by every reservation whose hold has lapsed.
 *
 * Idempotent and safe to run on a schedule (scripts/release-expired-reservations.js):
 * releaseReservation is itself guarded, so overlapping runs cannot double-release.
 *
 * @returns {Promise<{references:number, seats:number}>}
 */
export const releaseExpiredReservations = async (now = new Date()) => {
  const references = await bookingRepository.findExpiredPendingReferences(now);

  let seats = 0;
  for (const reference of references) {
    const result = await releaseReservation(reference, 'expired');
    seats += result.seats;
  }

  return { references: references.length, seats };
};

/**
 * Returns all bookings for the authenticated user.
 */
export const getMyBookings = async (userId) => {
  const bookings = await bookingRepository.findByUser(userId);
  if (!bookings) throw new AppError('Error fetching your bookings', 404);
  return bookings;
};

/**
 * Returns all bookings and summary data for a specific event - the organiser's sales view
 * (booker names, emails, ticket IDs, prices and gross sales).
 *
 * **Authorisation is the load-bearing part.** This previously took only an event ID and
 * performed no ownership check at all, so any authenticated account could read any event's
 * booker list: every attendee's name and email, the event's revenue, and `ticketId` - the
 * credential the door scanner admits on. That is Broken Access Control (OWASP A01), and a
 * personal-data disclosure independent of any admission risk.
 *
 * It now reuses `getEventForViewer`, the same event-owner-or-admin rule already enforced by
 * the dashboard, guest list, NL query and erasure. Reusing it rather than re-implementing
 * the comparison is the point: this endpoint drifted precisely because it had its own
 * (absent) rule instead of the shared one.
 */
export const getBookingsForEvent = async (eventId, user) => {
  // Throws 404 if the event does not exist, 403 if this viewer may not see it. Deliberately
  // before the booking read, so an unauthorised caller cannot infer anything from timing.
  const event = await getEventForViewer(eventId, user);

  const bookers = await bookingRepository.findByEvent(eventId);
  if (!bookers)
    throw new AppError('Error fetching bookings for this event', 404);

  // Narrowed to what the sales view actually renders. `getEventForViewer` returns the whole
  // event document, and passing that straight through would widen the response beyond the
  // two fields the client reads.
  return {
    bookers,
    event: { totalQuantity: event.totalQuantity, currency: event.currency },
  };
};

/**
 * Manually sets the check-in status of a single booking - the fallback for when a QR cannot
 * be scanned (cracked screen, flat battery, damaged printout).
 *
 * Authorisation reuses `admissionService.authorizeScan`, the same rule the scanner uses, so
 * an usher assigned to the event may admit here too. Previously this required the event
 * owner or an admin, which meant the one person actually working the door was refused and
 * the queue stopped until an organiser could be found.
 *
 * Every manual change is written to the audit log (`manual: true`), so the log remains a
 * complete account of who admitted whom rather than only recording scans.
 */
export const checkInAttendee = async (ticketId, isCheckedIn, user) => {
  const booking = await bookingRepository.findByIdWithEventOwner(ticketId);
  if (!booking) throw new AppError('No booking found with that ID', 404);

  const auth = authorizeScan(user, booking.event);
  if (!auth.ok) {
    throw new AppError(
      'You do not have permission to check in this ticket',
      auth.httpStatus ?? 403,
    );
  }

  // Bridge the legacy boolean API onto the state machine: checking in moves the booking to
  // `admitted`; un-checking returns it to `issued`.
  const status = isCheckedIn ? 'admitted' : 'issued';
  const updated = await bookingRepository.updateById(ticketId, {
    $set: { status },
  });

  await auditLogRepository.record({
    event: booking.event?._id ?? booking.event,
    booking: booking._id,
    actor: user._id,
    outcome: isCheckedIn ? 'admitted' : 'revoked',
    reason: isCheckedIn ? 'manual_admit' : 'manual_undo',
    manual: true,
  });

  return updated;
};
