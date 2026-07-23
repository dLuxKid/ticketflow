import * as bookingRepository from '../repositories/bookingRepository.js';
import * as eventRepository from '../repositories/eventRepository.js';
import { sendPdf } from '../shared/utils/generatePdf.js';
import AppError from '../shared/errors/AppError.js';

/**
 * Business logic layer for bookings.
 * Framework-agnostic: no req/res/next.
 */

/**
 * Creates booking records for each ticket buyer, decrements ticket quantities
 * on the event, increments attendee count, and dispatches PDF email tickets.
 *
 * @param {object[]} ticketBuyers - Array of buyer objects from the request
 * @param {string} eventId - The event being booked
 * @param {string|undefined} userId - The authenticated user's ID (optional for guest bookings)
 * @returns {Promise<object[]>} The inserted booking documents
 */
export const createBooking = async (ticketBuyers, eventId, userId) => {
  // Attach the authenticated user ID to each buyer record
  const buyers = ticketBuyers.map((buyer) => ({ ...buyer, user: userId }));

  // Count how many of each ticket type are being purchased
  const ticketsCount = {};
  for (const buyer of buyers) {
    ticketsCount[buyer.ticketType] = (ticketsCount[buyer.ticketType] || 0) + 1;
  }

  const booking = await bookingRepository.insertMany(buyers);

  const event = await eventRepository.findByIdWithOrganizer(eventId);

  if (event?.ticketDetails) {
    // Decrement available quantity for each ticket type purchased
    for (const [ticketType, count] of Object.entries(ticketsCount)) {
      const idx = event.ticketDetails.findIndex(
        (t) => t.ticketName === ticketType,
      );
      if (idx !== -1) {
        event.ticketDetails[idx].ticketQuantity =
          parseInt(event.ticketDetails[idx].ticketQuantity) - count;
      }
    }
    event.numberOfAttendees += buyers.length;
    await eventRepository.save(event);
  }

  await Promise.all(
    buyers.map((buyer) =>
      sendPdf({ ...event._doc, organizer: event.user?.name, ...buyer }),
    ),
  );

  return booking;
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
 * Returns all bookings and summary data for a specific event.
 */
export const getBookingsForEvent = async (eventId) => {
  const [bookers, event] = await Promise.all([
    bookingRepository.findByEvent(eventId),
    eventRepository.updateById(
      eventId,
      {},
      { new: true, fields: 'totalQuantity currency' },
    ),
  ]);

  if (!bookers)
    throw new AppError('Error fetching bookings for this event', 404);

  return { bookers, event };
};

/**
 * Updates the check-in status of a single booking ticket.
 */
export const checkInAttendee = (ticketId, isCheckedIn) =>
  bookingRepository.updateById(ticketId, { $set: { isCheckedIn } });
