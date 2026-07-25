import Guest from '../models/guestModel.js';

/**
 * Persistence layer for Guest documents.
 * No business logic — only database operations.
 */

export const create = (data) => Guest.create(data);

export const findByEvent = (eventId) =>
  Guest.find({ event: eventId }).sort({ createdAt: -1 });

/**
 * Guests for an event with their booking's admission status populated — the join the
 * natural-language query executor runs its filters over.
 */
export const findByEventWithStatus = (eventId) =>
  Guest.find({ event: eventId })
    .populate({ path: 'booking', select: 'status' })
    .sort({ name: 1 });

export const findOneByEventAndEmail = (eventId, email) =>
  Guest.findOne({ event: eventId, email });

export const linkBooking = (guestId, bookingId) =>
  Guest.findByIdAndUpdate(guestId, { booking: bookingId }, { new: true });

/** Guest records for a set of bookings — used to pull vip/plusOnes for scoring. */
export const findByBookingIds = (bookingIds) =>
  Guest.find({ booking: { $in: bookingIds } }).select('booking vip plusOnes');
