import Booking from '../models/bookingModel.js';
import APIFeatures from '../shared/utils/apiFeatures.js';

/**
 * Persistence layer for Booking documents.
 * No business logic — only database operations.
 */

export const insertMany = (data) => Booking.insertMany(data);

export const updateById = (id, data, options = { new: true }) =>
  Booking.findByIdAndUpdate(id, data, options);

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
