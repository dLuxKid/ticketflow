import Booking from '../models/bookingModel.js';
import APIFeatures from '../shared/utils/apiFeatures.js';

/**
 * Persistence layer for Booking documents.
 * No business logic — only database operations.
 */

export const insertMany = (data, session) =>
  Booking.insertMany(data, session ? { session } : undefined);

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
    fields: 'name email ticketType ticketId price isCheckedIn',
  }).limitFields().query;
