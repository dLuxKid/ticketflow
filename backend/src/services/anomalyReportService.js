import * as eventRepository from '../repositories/eventRepository.js';
import * as auditLogRepository from '../repositories/auditLogRepository.js';
import { detectAnomalies } from './anomalyService.js';
import { canViewDashboard } from './dashboardService.js';
import AppError from '../shared/errors/AppError.js';

/**
 * Read-side wiring for anomaly detection: groups an event's audit rows by booking and
 * runs the pure detector (anomalyService) over each ticket's history. Reuses the
 * dashboard's access rule - the same organiser/admin who may watch the live dashboard may
 * see its anomaly flags.
 */
export const getAnomaliesForEvent = async (eventId, user) => {
  const event = await eventRepository.findById(eventId);
  if (!event) throw new AppError('No event found with that ID', 404);
  if (!canViewDashboard(user, event)) {
    throw new AppError('You do not have permission to view this event', 403);
  }

  const rows = await auditLogRepository.findByEvent(eventId, 1000);
  const byBooking = new Map();
  for (const r of rows) {
    // Manual check-ins are audited but never scanned, so they carry no device fingerprint
    // and no meaningful inter-scan timing. Including them would only fabricate flags.
    if (r.manual) continue;
    const key = String(r.booking);
    if (!byBooking.has(key)) byBooking.set(key, []);
    byBooking.get(key).push(r);
  }

  const flagged = [];
  for (const [bookingId, bookingRows] of byBooking) {
    const result = detectAnomalies(bookingRows);
    if (result.anomalous) {
      flagged.push({
        bookingId,
        flags: result.flags,
        scanCount: bookingRows.length,
      });
    }
  }
  return flagged;
};
