import Booking from '../models/bookingModel.js';
import APIFeatures from '../shared/utils/apiFeatures.js';

/**
 * Persistence layer for Booking documents.
 * No business logic - only database operations.
 */

export const insertMany = (data, session) =>
  Booking.insertMany(data, session ? { session } : undefined);

export const create = (data) => Booking.create(data);

export const updateById = (id, data, options = { new: true }) =>
  Booking.findByIdAndUpdate(id, data, options);

/**
 * Returns a booking with its event's owner populated - used for ownership checks.
 */
export const findByIdWithEventOwner = (id) =>
  Booking.findById(id).populate({ path: 'event', select: 'user' });

/** Every booking held under one Paystack reference (one checkout, N ticket buyers). */
export const findByReference = (reference) => Booking.find({ reference });

/**
 * Confirms a reservation: flips every still-`pending` booking under this reference to
 * `success` and drops the expiry hold.
 *
 * Guarded on `transactionStatus: 'pending'` so it is idempotent - Paystack retries its
 * webhook, and the client also calls the verify endpoint, so this runs more than once per
 * checkout by design. `modifiedCount > 0` identifies the single call that actually won the
 * transition, which is what gates ticket delivery so nobody is emailed twice.
 */
export const confirmByReference = (reference, fields = {}, session) =>
  Booking.updateMany(
    { reference, transactionStatus: 'pending' },
    {
      $set: { transactionStatus: 'success', ...fields },
      $unset: { reservationExpiresAt: '' },
    },
    session ? { session } : undefined,
  );

/**
 * Marks a reservation dead (`failed` or `expired`) and revokes its tickets, but only while
 * it is still `pending`. Same guard, same reason: whoever gets `modifiedCount > 0` is the
 * one call responsible for returning the inventory, so seats are never released twice.
 */
export const releaseByReference = (reference, transactionStatus, session) =>
  Booking.updateMany(
    { reference, transactionStatus: 'pending' },
    {
      $set: { transactionStatus, status: 'revoked' },
      $unset: { reservationExpiresAt: '' },
    },
    session ? { session } : undefined,
  );

/**
 * Distinct references of reservations whose hold has lapsed. Returns references rather than
 * documents because release operates per checkout, not per ticket.
 */
export const findExpiredPendingReferences = (now = new Date()) =>
  Booking.distinct('reference', {
    transactionStatus: 'pending',
    reservationExpiresAt: { $ne: null, $lte: now },
  });

export const findById = (id) => Booking.findById(id);

export const countByEventAndStatus = (eventId, status, session) =>
  Booking.countDocuments(
    { event: eventId, status },
    session ? { session } : undefined,
  );

/**
 * Bookings not yet admitted/rejected/revoked - the population a no-show prediction is
 * meaningful for (there is no "will they show up" question once they already have).
 */
export const findPendingByEvent = (eventId) =>
  Booking.find({
    event: eventId,
    status: { $in: ['issued', 'delivered', 'scanned'] },
  }).select('_id source createdAt');

/** Not-yet-PII-erased bookings belonging to any of the given (expired) events. */
export const findUnerasedByEvents = (eventIds) =>
  Booking.find({ event: { $in: eventIds }, piiErasedAt: null });

/** Overwrites a booking's PII in place and marks it erased. Keeps analytics-relevant
 * fields (price, status, ticketType, source) intact. */
export const anonymize = (bookingId) =>
  Booking.findByIdAndUpdate(bookingId, {
    $set: {
      name: 'Erased Guest',
      email: `erased-${bookingId}@erased.invalid`,
      ticketUser: 'Erased Guest',
      piiErasedAt: new Date(),
    },
  });

/**
 * Resolves a scanned QR payload to its booking. The code may be an invite token (invited
 * guests) or a ticketId (purchased guests) - one lookup covers every guest type. Selects
 * the normally-hidden inviteToken and populates the event owner for authorization.
 */
/**
 * Candidate forms of a hand-typed ticket code.
 *
 * Scanned codes arrive exactly as issued, but a code read off a phone screen and typed in by
 * hand at a door does not. Ticket IDs are Crockford base32 and always uppercase, and legacy
 * IDs carry a leading `#` that is displayed on the ticket but is easy to omit (or to add).
 * Matching only the raw string meant an usher who typed a correct code in lowercase, or
 * without the `#`, was told the ticket was invalid - indistinguishable at the door from a
 * forged one.
 *
 * Invite tokens are deliberately NOT case-folded: they are random 24-byte values where case
 * is significant, so they are only ever matched exactly.
 */
const ticketIdCandidates = (code) => {
  const trimmed = String(code).trim();
  const upper = trimmed.toUpperCase();
  const withoutHash = upper.replace(/^#/, '');

  return [...new Set([trimmed, upper, withoutHash, `#${withoutHash}`])];
};

export const findByScanCode = (code) =>
  Booking.findOne({
    $or: [
      { inviteToken: String(code).trim() },
      { ticketId: { $in: ticketIdCandidates(code) } },
    ],
  })
    .select('+inviteToken')
    // `venueCapacity` and `totalQuantity` are required, not optional extras: the door reads
    // them to decide whether the room is full. Selecting only `user` here left both
    // undefined, so admissionService computed a capacity of 0 - which capacityDecision
    // treats as "no limit configured" - and the fire-safety guardrail silently never fired
    // on a single real scan. A projection that omits a field a decision depends on disables
    // that decision without failing.
    .populate({ path: 'event', select: 'user venueCapacity totalQuantity' });

/**
 * Atomically admits a booking: flips status to `admitted` only if it is currently in an
 * admittable state. Because this is a single-document conditional update, two concurrent
 * scans of the same ticket cannot both admit - exactly one matches, the other gets null.
 *
 * @returns {Promise<object|null>} the admitted booking, or null if it wasn't admittable
 */
export const admitById = (bookingId, session) =>
  Booking.findOneAndUpdate(
    { _id: bookingId, status: { $in: ['issued', 'delivered', 'scanned'] } },
    { $set: { status: 'admitted' } },
    { new: true, session },
  );

/**
 * Returns all bookings for a user, sorted by most recent, with event details populated.
 */
export const findByUser = (userId) =>
  new APIFeatures(Booking.find({ user: userId }), {
    sort: '-createdAt',
    fields: 'event ticketId',
  })
    .sort()
    // `slug` is what the event detail page is addressed by, so without it a ticket cannot
    // link through to the event it is for.
    .populate(
      'event',
      'coverImage eventName startDate startTime eventLocation slug',
    )
    .limitFields().query;

/**
 * Returns all bookings for a specific event, with a limited field selection for the attendee list.
 */
export const findByEvent = (eventId) =>
  new APIFeatures(Booking.find({ event: eventId }), {
    // Select `status` (not the old stored boolean); the `isCheckedIn` virtual is derived
    // from it and included in the JSON response via toJSON virtuals.
    fields: 'name email ticketType ticketId price status',
  }).limitFields().query;

// ─── Guest networking (Phase 7) ─────────────────────────────────────────────────

const NOT_ADMITTABLE = ['revoked', 'rejected'];

/**
 * Resolves an attendee's booking by event + email. Email, not `user`, is the identifier
 * guaranteed present on every booking regardless of source - a guest-checkout purchase or
 * an organiser-issued invite may both exist with no `user` set yet (see claimBooking).
 */
export const findByEventAndEmail = (eventId, email) =>
  Booking.findOne({ event: eventId, email, status: { $nin: NOT_ADMITTABLE } });

/** Same lookup, with the one-time networking code fields (both `select: false`). */
export const findByEventAndEmailWithOtp = (eventId, email) =>
  Booking.findOne({
    event: eventId,
    email,
    status: { $nin: NOT_ADMITTABLE },
  }).select('+networkingOtpHash +networkingOtpExpires');

export const setNetworkingOtp = (bookingId, { hash, expiresAt }) =>
  Booking.findByIdAndUpdate(bookingId, {
    $set: { networkingOtpHash: hash, networkingOtpExpires: expiresAt },
  });

/** Burns the code. `$unset` rather than null so a stale value can never linger. */
export const clearNetworkingOtp = (bookingId) =>
  Booking.findByIdAndUpdate(bookingId, {
    $unset: { networkingOtpHash: '', networkingOtpExpires: '' },
  });

/** Resolves an attendee's booking by event + linked user id (set once they've claimed it). */
export const findByEventAndUser = (eventId, userId) =>
  Booking.findOne({
    event: eventId,
    user: userId,
    status: { $nin: NOT_ADMITTABLE },
  });

/**
 * Links a booking to the account that just authenticated as its owner. Bookings created
 * before the attendee had (or used) an account - an invite, or a guest checkout - only
 * carry an email; this is what makes them DM-addressable by user id afterward.
 */
export const claimBooking = (bookingId, userId) =>
  Booking.findByIdAndUpdate(
    bookingId,
    { $set: { user: userId } },
    { new: true },
  );

/** Opted-in attendees for an event's networking directory. */
export const findOptedInByEvent = (eventId) =>
  Booking.find({
    event: eventId,
    networkingOptIn: true,
    status: { $nin: NOT_ADMITTABLE },
  }).select('name networkingBio user vip');

export const setNetworkingProfile = (
  bookingId,
  { networkingOptIn, networkingBio },
) =>
  Booking.findByIdAndUpdate(
    bookingId,
    { $set: { networkingOptIn: Boolean(networkingOptIn), networkingBio } },
    { new: true },
  );

/** Every admittable attendee of an event - the recipient list for the "event is live" email. */
export const findNotifiableByEvent = (eventId) =>
  Booking.find({ event: eventId, status: { $nin: NOT_ADMITTABLE } }).select(
    'name email',
  );
