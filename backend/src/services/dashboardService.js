import * as eventRepository from '../repositories/eventRepository.js';
import * as bookingRepository from '../repositories/bookingRepository.js';
import * as auditLogRepository from '../repositories/auditLogRepository.js';
import * as guestRepository from '../repositories/guestRepository.js';
import {
  predictNoShowProbability,
  featuresFromBooking,
} from './noShowService.js';
import AppError from '../shared/errors/AppError.js';

/**
 * Read model for the live arrivals dashboard.
 *
 * The organiser who owns an event (or an admin) may watch it. This is also the gate that
 * stops anyone subscribing to another event's live stream - the SSE controller authorizes
 * through here before opening the connection.
 */

/** Pure: may this user view the given event's dashboard? Exported for unit testing. */
export const canViewDashboard = (user, event) => {
  if (!user || !event) return false;
  if (user.role === 'admin') return true;
  return Boolean(event.user && user._id && event.user.equals?.(user._id));
};

/** Loads the event and authorizes the viewer; throws 404/403. */
export const getEventForViewer = async (eventId, user) => {
  const event = await eventRepository.findById(eventId);
  if (!event) throw new AppError('No event found with that ID', 404);
  if (!canViewDashboard(user, event)) {
    throw new AppError(
      'You do not have permission to view this dashboard',
      403,
    );
  }
  return event;
};

/**
 * Point-in-time snapshot sent when a dashboard first connects, so it is populated before
 * the next scan arrives over the stream.
 */
export const getSnapshot = async (eventId) => {
  const [event, admitted, recent, noShow] = await Promise.all([
    eventRepository.findById(eventId),
    bookingRepository.countByEventAndStatus(eventId, 'admitted'),
    auditLogRepository.findByEvent(eventId, 10),
    getNoShowPrediction(eventId),
  ]);

  // Safe occupancy if the organiser set one, otherwise ticket inventory - the same
  // precedence the door enforces (admissionService.capacityDecision).
  const capacity = event?.venueCapacity ?? event?.totalQuantity ?? 0;

  return {
    eventId: String(eventId),
    capacity,
    // Surfaced so the dashboard can warn before the door starts refusing people, rather
    // than the organiser first learning of it from a queue outside.
    remaining: capacity > 0 ? Math.max(capacity - admitted, 0) : null,
    atCapacity: capacity > 0 && admitted >= capacity,
    capacitySource: event?.venueCapacity ? 'venueCapacity' : 'ticketInventory',
    sold: event?.numberOfAttendees ?? 0,
    admitted,
    noShow,
    recent: recent.map((row) => ({
      bookingId: String(row.booking ?? ''),
      outcome: row.outcome,
      reason: row.reason,
      at: row.createdAt,
    })),
  };
};

/**
 * No-show prediction (Phase 5, feature 3/3) for guests not yet admitted.
 *
 * Scores every pending booking with noShowService (a logistic model trained offline in
 * Python; see ml/no_show/train.py) and aggregates into a confidence band the dashboard can
 * render alongside the live arrivals feed - "expect ~6 of these 20 remaining guests not to
 * show" is more decision-useful to an organiser than a single number with no context.
 */
export const getNoShowPrediction = async (eventId) => {
  const [event, pending] = await Promise.all([
    eventRepository.findById(eventId),
    bookingRepository.findPendingByEvent(eventId),
  ]);

  if (pending.length === 0) {
    return { pendingCount: 0, expectedNoShows: 0, averageProbability: 0 };
  }

  const guestByBooking = new Map(
    (await guestRepository.findByBookingIds(pending.map((b) => b._id))).map(
      (g) => [String(g.booking), g],
    ),
  );

  const probabilities = pending.map((booking) => {
    const guest = guestByBooking.get(String(booking._id));
    const features = featuresFromBooking(booking, event);
    if (guest) {
      features.isVip = guest.vip;
      features.plusOnes = guest.plusOnes;
    }
    return predictNoShowProbability(features);
  });

  const averageProbability =
    probabilities.reduce((sum, p) => sum + p, 0) / probabilities.length;

  return {
    pendingCount: pending.length,
    // Sum of individual probabilities, not count * average - same value here, but this is
    // the form that stays correct if probabilities are ever computed per-guest with
    // meaningfully different inputs (which they already are).
    expectedNoShows: Math.round(probabilities.reduce((sum, p) => sum + p, 0)),
    averageProbability,
  };
};
