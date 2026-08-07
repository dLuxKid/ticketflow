import * as usherService from '../../services/usherService.js';
import catchAsync from '../../shared/middleware/catchAsync.js';

/**
 * Presentation layer for door-staff (usher) management.
 * HTTP concerns only - business logic lives in usherService.
 */

export const listUshers = catchAsync(async (req, res) => {
  const ushers = await usherService.listUshers(req.params.eventId, req.user);
  res.status(200).json({ status: 'success', data: { ushers } });
});

export const assignUsher = catchAsync(async (req, res) => {
  const usher = await usherService.assignUsher(
    req.params.eventId,
    req.body.email,
    req.user,
  );
  res.status(201).json({
    status: 'success',
    message: `${usher.name} can now scan tickets for this event`,
    data: { usher },
  });
});

export const unassignUsher = catchAsync(async (req, res) => {
  await usherService.unassignUsher(
    req.params.eventId,
    req.params.userId,
    req.user,
  );
  res
    .status(200)
    .json({ status: 'success', message: 'Usher removed from this event' });
});
