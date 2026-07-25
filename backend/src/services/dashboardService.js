import * as eventRepository from '../repositories/eventRepository.js';
import * as bookingRepository from '../repositories/bookingRepository.js';
import * as auditLogRepository from '../repositories/auditLogRepository.js';
import AppError from '../shared/errors/AppError.js';

/**
 * Read model for the live arrivals dashboard.
 *
 * The organiser who owns an event (or an admin) may watch it. This is also the gate that
 * stops anyone subscribing to another event's live stream — the SSE controller authorizes
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
    throw new AppError('You do not have permission to view this dashboard', 403);
  }
  return event;
};

/**
 * Point-in-time snapshot sent when a dashboard first connects, so it is populated before
 * the next scan arrives over the stream.
 */
export const getSnapshot = async (eventId) => {
  const [event, admitted, recent] = await Promise.all([
    eventRepository.findById(eventId),
    bookingRepository.countByEventAndStatus(eventId, 'admitted'),
    auditLogRepository.findByEvent(eventId, 10),
  ]);

  return {
    eventId: String(eventId),
    capacity: event?.totalQuantity ?? 0,
    sold: event?.numberOfAttendees ?? 0,
    admitted,
    recent: recent.map((row) => ({
      bookingId: String(row.booking ?? ''),
      outcome: row.outcome,
      reason: row.reason,
      at: row.createdAt,
    })),
  };
};
