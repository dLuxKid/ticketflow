import * as eventRepository from '../repositories/eventRepository.js';
import * as bookingRepository from '../repositories/bookingRepository.js';
import { sendNetworkingLive } from '../shared/utils/sendNetworkingLive.js';

/**
 * "Event just went live" notification (Phase 7) — every attendee gets an email the moment
 * their event starts, with the link to join the networking space.
 *
 * Structured like the GDPR sweep (retentionService.sweepExpiredEvents): a pure predicate for
 * unit testing, a repository query implementing the same boundary for the real query
 * (eventRepository.findStartedNotNotified), and an idempotent sweep meant to be run
 * on a schedule (scripts/send-event-live-emails.js).
 */

/** Pure: has `event` just gone live and not yet been notified? Exported for unit testing. */
export const isNewlyLive = (event, now = new Date()) => {
  if (!event?.startDate || !event?.endDate) return false;
  if (event.networkingEmailSentAt) return false;
  return now >= new Date(event.startDate) && now <= new Date(event.endDate);
};

/**
 * Scheduled sweep: emails every admittable attendee of any event currently inside its live
 * window that hasn't been notified yet, then marks it sent. Idempotent — safe to run on a
 * repeating schedule; already-notified events are excluded by the repository query itself.
 *
 * A per-recipient send failure does not stop the sweep or leave the event unmarked (matching
 * sendInvite.js's "delivery is non-fatal" rule) — the networking space is reachable by URL
 * regardless of whether any one email landed.
 *
 * @returns {Promise<{eventsNotified: number, emailsSent: number}>}
 */
export const sweepNewlyLiveEvents = async (frontendUrl) => {
  const events = await eventRepository.findStartedNotNotified();
  let emailsSent = 0;

  for (const event of events) {
    const attendees = await bookingRepository.findNotifiableByEvent(event._id);
    const link = `${frontendUrl}/network/${event._id}`;

    const results = await Promise.allSettled(
      attendees.map((booking) =>
        sendNetworkingLive({
          to: booking.email,
          name: booking.name,
          eventName: event.eventName,
          link,
        }),
      ),
    );
    emailsSent += results.filter((r) => r.status === 'fulfilled').length;

    await eventRepository.markNetworkingEmailSent(event._id);
  }

  return { eventsNotified: events.length, emailsSent };
};
