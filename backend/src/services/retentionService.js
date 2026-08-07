import * as eventRepository from '../repositories/eventRepository.js';
import * as guestRepository from '../repositories/guestRepository.js';
import * as bookingRepository from '../repositories/bookingRepository.js';
import { canViewDashboard } from './dashboardService.js';
import AppError from '../shared/errors/AppError.js';

/**
 * GDPR data retention and erasure.
 *
 * Guest and buyer personal data (name, email) is anonymized - not the whole record
 * deleted, since status/vip/plusOnes/ticketType remain useful for post-event analytics and
 * the no-show model's training data. Two paths:
 *  - a scheduled sweep (scripts/gdpr-retention-sweep.js) that anonymizes anyone on an
 *    event that ended more than `retentionDays` ago;
 *  - a manual erasure request an organiser/admin can trigger immediately for one guest.
 */

export const DEFAULT_RETENTION_DAYS = 30;

/** Pure: is `event` past its retention window as of `now`? Exported for unit testing. */
export const isPastRetentionWindow = (
  event,
  retentionDays,
  now = new Date(),
) => {
  if (!event?.endDate) return false;
  const cutoff = new Date(event.endDate);
  cutoff.setDate(cutoff.getDate() + retentionDays);
  return now >= cutoff;
};

/**
 * Anonymizes a single guest and, if it has one, its linked booking.
 * Used by both the manual erasure endpoint and the sweep.
 */
export const eraseGuest = async (guestId) => {
  const guest = await guestRepository.findById(guestId);
  if (!guest) throw new AppError('No guest found with that ID', 404);

  await guestRepository.anonymize(guestId);
  if (guest.booking) {
    await bookingRepository.anonymize(guest.booking);
  }
};

/**
 * Manual erasure request: an organiser (or admin) erases one guest's PII immediately,
 * ahead of the scheduled sweep. Reuses the dashboard's owner/admin access rule.
 */
export const requestErasure = async (eventId, guestId, user) => {
  const event = await eventRepository.findById(eventId);
  if (!event) throw new AppError('No event found with that ID', 404);
  if (!canViewDashboard(user, event)) {
    throw new AppError('You do not have permission to manage this event', 403);
  }
  await eraseGuest(guestId);
};

/**
 * Scheduled sweep: anonymizes every not-yet-erased guest and booking on any event that
 * ended more than `retentionDays` ago. Idempotent - safe to run on a repeating schedule
 * (see scripts/gdpr-retention-sweep.js); already-erased documents are excluded by the
 * repository queries themselves ({ erasedAt: null } / { piiErasedAt: null }).
 *
 * @returns {Promise<{expiredEvents:number, guestsErased:number, bookingsErased:number}>}
 */
export const sweepExpiredEvents = async (
  retentionDays = DEFAULT_RETENTION_DAYS,
) => {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - retentionDays);

  const expiredEvents = await eventRepository.findEndedBefore(cutoff);
  const eventIds = expiredEvents.map((e) => e._id);

  if (eventIds.length === 0) {
    return { expiredEvents: 0, guestsErased: 0, bookingsErased: 0 };
  }

  const [guests, bookings] = await Promise.all([
    guestRepository.findUnerasedByEvents(eventIds),
    bookingRepository.findUnerasedByEvents(eventIds),
  ]);

  // Guests are erased via eraseGuest (which also erases their linked booking) so a booking
  // isn't double-processed; bookings with no Guest (purchase-sourced) are erased directly.
  const guestBookingIds = new Set(
    guests.filter((g) => g.booking).map((g) => String(g.booking)),
  );

  await Promise.all(guests.map((g) => eraseGuest(g._id)));
  await Promise.all(
    bookings
      .filter((b) => !guestBookingIds.has(String(b._id)))
      .map((b) => bookingRepository.anonymize(b._id)),
  );

  return {
    expiredEvents: eventIds.length,
    guestsErased: guests.length,
    bookingsErased: bookings.length,
  };
};
