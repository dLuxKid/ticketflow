import Guest from '../models/guestModel.js';

/**
 * Persistence layer for Guest documents.
 * No business logic — only database operations.
 */

export const create = (data) => Guest.create(data);

export const findByEvent = (eventId) =>
  Guest.find({ event: eventId }).sort({ createdAt: -1 });

export const findOneByEventAndEmail = (eventId, email) =>
  Guest.findOne({ event: eventId, email });

export const linkBooking = (guestId, bookingId) =>
  Guest.findByIdAndUpdate(guestId, { booking: bookingId }, { new: true });
