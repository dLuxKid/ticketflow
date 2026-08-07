import * as guestService from '../../services/guestService.js';
import * as retentionService from '../../services/retentionService.js';
import { parseGuestCsv } from '../../shared/utils/parseGuestCsv.js';
import catchAsync from '../../shared/middleware/catchAsync.js';

/**
 * Presentation layer for guest-list management.
 * HTTP concerns only - business logic lives in guestService.
 */

/** Lists the guests for an event (organiser/admin). */
export const listGuests = catchAsync(async (req, res) => {
  const guests = await guestService.getGuests(req.params.eventId, req.user);
  res.status(200).json({ status: 'success', data: { guests } });
});

/**
 * Imports guests and issues invites. Accepts either a JSON `guests` array or a raw `csv`
 * string (parsed server-side), so the frontend can post structured rows or a pasted CSV.
 */
export const importGuests = catchAsync(async (req, res) => {
  let guests = req.body.guests;
  let invalidRows = [];

  if ((!guests || guests.length === 0) && typeof req.body.csv === 'string') {
    const parsed = parseGuestCsv(req.body.csv);
    guests = parsed.guests;
    invalidRows = parsed.invalid;
  }

  const result = await guestService.importGuests(
    req.params.eventId,
    guests,
    req.user,
  );

  res.status(201).json({
    status: 'success',
    message: `Imported ${result.added.length} guest(s)`,
    data: { ...result, invalidRows },
  });
});

/**
 * GDPR erasure request: anonymizes one guest's name/email (and their linked booking's)
 * immediately, ahead of the scheduled retention sweep. Organiser/admin only.
 */
export const eraseGuest = catchAsync(async (req, res) => {
  await retentionService.requestErasure(
    req.params.eventId,
    req.params.guestId,
    req.user,
  );
  res.status(200).json({ status: 'success', message: 'Guest data erased' });
});
