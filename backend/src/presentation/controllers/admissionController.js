import * as admissionService from '../../services/admissionService.js';
import catchAsync from '../../shared/middleware/catchAsync.js';

/**
 * Presentation layer for door admission.
 * HTTP concerns only — the atomic admit, audit, and events live in admissionService.
 */

/**
 * Scans a ticket and admits the guest. Body: { code, deviceId? } — the scanned QR
 * payload (invite token or ticketId) and an optional client-supplied device fingerprint.
 * Errors surface as 403/404/409 with a clear reason.
 */
export const scan = catchAsync(async (req, res) => {
  const result = await admissionService.checkInByScan(req.body.code, req.user, {
    deviceId: req.body.deviceId,
    ip: req.ip,
  });

  res.status(200).json({
    status: 'success',
    message: 'Guest admitted',
    data: result,
  });
});
