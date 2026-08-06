import * as dashboardService from '../../services/dashboardService.js';
import * as anomalyReportService from '../../services/anomalyReportService.js';
import catchAsync from '../../shared/middleware/catchAsync.js';
import {
  admissionBus,
  ADMISSION_ADMITTED,
  ADMISSION_REJECTED,
} from '../../shared/events/admissionEvents.js';

/**
 * Presentation layer for the live arrivals dashboard.
 *
 * Uses Server-Sent Events rather than Socket.IO: the dashboard only needs server→client
 * push, SSE rides the existing Express/HTTP stack with no extra dependency, and per-event
 * access control is just normal route authorization. The admissionService publishes to an
 * in-process bus, so switching transports later touches only this file.
 */

/** One-shot snapshot for initial render or manual refresh. */
export const getSnapshot = catchAsync(async (req, res) => {
  await dashboardService.getEventForViewer(req.params.eventId, req.user);
  const snapshot = await dashboardService.getSnapshot(req.params.eventId);
  res.status(200).json({ status: 'success', data: snapshot });
});

/** Tickets flagged by the anomaly detector (Phase 5) for this event. */
export const getAnomalies = catchAsync(async (req, res) => {
  const flagged = await anomalyReportService.getAnomaliesForEvent(
    req.params.eventId,
    req.user,
  );
  res.status(200).json({ status: 'success', data: { flagged } });
});

/**
 * Live stream of admissions for one event. Authorizes the viewer, sends an initial
 * snapshot, then forwards every admission decision for this event until the client
 * disconnects.
 */
export const streamEvent = catchAsync(async (req, res) => {
  // Authorize BEFORE switching to the event-stream protocol, so a 403/404 is returned as
  // normal JSON by the error handler.
  await dashboardService.getEventForViewer(req.params.eventId, req.user);
  const eventId = String(req.params.eventId);

  res.set({
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no', // disable proxy buffering (nginx) so events flush promptly
  });
  res.flushHeaders?.();

  const send = (name, data) =>
    res.write(`event: ${name}\ndata: ${JSON.stringify(data)}\n\n`);

  send('snapshot', await dashboardService.getSnapshot(eventId));

  // Forward only this event's decisions.
  const onAdmitted = (p) =>
    p.eventId === eventId && send(ADMISSION_ADMITTED, p);
  const onRejected = (p) =>
    p.eventId === eventId && send(ADMISSION_REJECTED, p);
  admissionBus.on(ADMISSION_ADMITTED, onAdmitted);
  admissionBus.on(ADMISSION_REJECTED, onRejected);

  // Keep intermediaries from timing the connection out.
  const heartbeat = setInterval(() => res.write(': ping\n\n'), 25000);

  req.on('close', () => {
    clearInterval(heartbeat);
    admissionBus.off(ADMISSION_ADMITTED, onAdmitted);
    admissionBus.off(ADMISSION_REJECTED, onRejected);
    res.end();
  });
});
