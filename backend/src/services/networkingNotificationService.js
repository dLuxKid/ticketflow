import * as eventRepository from '../repositories/eventRepository.js';
import * as bookingRepository from '../repositories/bookingRepository.js';
import { sendNetworkingLive } from '../shared/utils/sendNetworkingLive.js';
import { isNetworkingEnabled } from './networkingService.js';

/**
 * "Event is live" notification (Phase 7) - every attendee gets an email with the link to
 * join the networking space.
 *
 * By explicit choice, this fires on **every trigger**, not once ever per event: a manual
 * `npm run notify:event-live` always re-sends to every currently-live event, and so would
 * the scheduled cron in scheduled-jobs.yml if it were enabled. There is deliberately no
 * "already notified" gate. `Event.networkingEmailSentAt` is kept only as a "last sent at"
 * timestamp for diagnostics - it is never read as a filter.
 *
 * Known consequence: the cron currently runs every 15 minutes. Left as-is, turning it on
 * would re-email every attendee of every live event every 15 minutes for the event's whole
 * duration - acceptable for now because the cron isn't wired to real secrets yet, but worth
 * revisiting (either a much longer interval, or a real rate-limited reminder feature) before
 * it is.
 */

/** Pure: is `event` currently inside its live window? Exported for unit testing. */
export const isCurrentlyLive = (event, now = new Date()) => {
  if (!event?.startDate || !event?.endDate) return false;
  return now >= new Date(event.startDate) && now <= new Date(event.endDate);
};

/**
 * Emails every admittable attendee of every currently-live event, then records when it was
 * last sent (informational only, not idempotency).
 *
 * A per-recipient send failure does not stop the sweep (matching sendInvite.js's "delivery
 * is non-fatal" rule) - the networking space is reachable by URL regardless of whether any
 * one email landed.
 *
 * @returns {Promise<{eventsNotified: number, emailsSent: number}>}
 */
export const sweepLiveEvents = async (frontendUrl) => {
  const events = await eventRepository.findLiveEvents();
  let emailsSent = 0;

  for (const event of events) {
    // Skip events whose organiser turned networking off - inviting attendees into a space
    // they will then be refused entry to would be worse than sending nothing.
    if (!isNetworkingEnabled(event)) continue;

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
