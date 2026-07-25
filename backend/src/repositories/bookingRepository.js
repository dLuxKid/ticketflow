import Booking from '../models/bookingModel.js';
import APIFeatures from '../shared/utils/apiFeatures.js';

/**
 * Persistence layer for Booking documents.
 * No business logic — only database operations.
 */

export const insertMany = (data, session) =>
  Booking.insertMany(data, session ? { session } : undefined);

export const create = (data) => Booking.create(data);

export const updateById = (id, data, options = { new: true }) =>
  Booking.findByIdAndUpdate(id, data, options);

/**
 * Returns a booking with its event's owner populated — used for ownership checks.
 */
export const findByIdWithEventOwner = (id) =>
  Booking.findById(id).populate({ path: 'event', select: 'user' });

/**
 * Sets the transaction status for every booking under a Paystack reference.
 * Called from the verified webhook so payment state is server-authoritative.
 */
export const updateStatusByReference = (reference, transactionStatus) =>
  Booking.updateMany({ reference }, { $set: { transactionStatus } });

export const findById = (id) => Booking.findById(id);

export const countByEventAndStatus = (eventId, status) =>
  Booking.countDocuments({ event: eventId, status });

/**
 * Bookings not yet admitted/rejected/revoked — the population a no-show prediction is
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
 * guests) or a ticketId (purchased guests) — one lookup covers every guest type. Selects
 * the normally-hidden inviteToken and populates the event owner for authorization.
 */
export const findByScanCode = (code) =>
  Booking.findOne({ $or: [{ inviteToken: code }, { ticketId: code }] })
    .select('+inviteToken')
    .populate({ path: 'event', select: 'user' });

/**
 * Atomically admits a booking: flips status to `admitted` only if it is currently in an
 * admittable state. Because this is a single-document conditional update, two concurrent
 * scans of the same ticket cannot both admit — exactly one matches, the other gets null.
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
    .populate('event', 'coverImage eventName startDate startTime eventLocation')
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
