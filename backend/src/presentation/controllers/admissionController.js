import * as admissionService from '../../services/admissionService.js';
import catchAsync from '../../shared/middleware/catchAsync.js';

/**
 * Presentation layer for door admission.
 * HTTP concerns only - the atomic admit, audit, and events live in admissionService.
 */

/**
 * Scans a ticket and admits the guest. Body: { code, deviceId?, overrideCapacity? } - the
 * scanned QR payload (invite token or ticketId), an optional client-supplied device
 * fingerprint, and an explicit acknowledgement that the venue is already at its safe
 * occupancy. Errors surface as 403/404/409 with a clear reason.
 *
 * `overrideCapacity` must be re-sent deliberately after a 409 `at_capacity`; it is not
 * sticky, so each admission past capacity is an individual recorded decision rather than a
 * mode someone switches on at the start of the night and forgets.
 */
export const scan = catchAsync(async (req, res) => {
  const result = await admissionService.checkInByScan(req.body.code, req.user, {
    deviceId: req.body.deviceId,
    ip: req.ip,
    overrideCapacity: req.body.overrideCapacity === true,
  });

  res.status(200).json({
    status: 'success',
    message: 'Guest admitted',
    data: result,
  });
});
