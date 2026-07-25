import mongoose from 'mongoose';
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
  if (!Array.isArray(ticketBuyers) || ticketBuyers.length === 0) {
    throw new AppError('At least one ticket buyer is required', 400);
  }

  // Attach the authenticated user ID to each buyer record
  const buyers = ticketBuyers.map((buyer) => ({ ...buyer, user: userId }));

  // Count how many of each ticket type are being purchased
  const ticketsCount = {};
  for (const buyer of buyers) {
    ticketsCount[buyer.ticketType] = (ticketsCount[buyer.ticketType] || 0) + 1;
  }

  // Fail fast with a clear 404 if the event doesn't exist, rather than reporting it
  // as "not enough tickets" from the reservation guard below.
  const eventExists = await eventRepository.findById(eventId);
  if (!eventExists) throw new AppError('No event found with that ID', 404);

  // Invite-only events admit guests from the organiser's guest list, not by purchase.
  if (eventExists.accessMode === 'invite_only') {
    throw new AppError(
      'This event is invite-only; tickets are not available for purchase',
      403,
    );
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

  // Side effects (email/PDF) run only after the transaction has committed, so we never
  // email a ticket for a booking that was rolled back.
  const event = await eventRepository.findByIdWithOrganizer(eventId);
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
 *
 * Only the organiser who owns the ticket's event (or an admin) may check attendees in.
 * Previously any authenticated user could check in any ticket (broken access control).
 */
export const checkInAttendee = async (ticketId, isCheckedIn, user) => {
  const booking = await bookingRepository.findByIdWithEventOwner(ticketId);
  if (!booking) throw new AppError('No booking found with that ID', 404);

  const isOwner = booking.event?.user?.equals(user._id);
  if (user.role !== 'admin' && !isOwner) {
    throw new AppError(
      'You do not have permission to check in this ticket',
      403,
    );
  }

  // Bridge the legacy boolean API onto the new state machine: checking in an attendee
  // moves the booking to `admitted`; un-checking returns it to `issued`. Phase 2 adds
  // the full atomic scan endpoint; this keeps the existing check-in contract working.
  const status = isCheckedIn ? 'admitted' : 'issued';
  return bookingRepository.updateById(ticketId, { $set: { status } });
};
