import * as userService from '../../services/userService.js';
import catchAsync from '../../shared/middleware/catchAsync.js';

/**
 * Presentation layer for user management.
 * Handles HTTP concerns only — delegates all business logic to userService.
 */

export const getAllUsers = catchAsync(async (req, res) => {
  const users = await userService.getAllUsers();

  res.status(200).json({
    status: 'success',
    requestedAt: req.requestTime,
    results: users.length,
    data: { users },
  });
});

export const getMyAccount = catchAsync(async (req, res) => {
  res.status(200).json({
    status: 'success',
    data: { user: req.user || null },
  });
});

export const getUser = catchAsync(async (req, res, next) => {
  const user = await userService.getUserById(req.params.id || req.user.id);

  res.status(200).json({
    status: 'success',
    data: { user },
  });
});

export const updateMe = catchAsync(async (req, res, next) => {
  const updatedUser = await userService.updateMe(req.user.id, req.body);

  res.status(200).json({
    status: 'success',
    data: { user: updatedUser },
  });
});

export const deleteMe = catchAsync(async (req, res) => {
  await userService.deleteMe(req.user.id);

  res.status(204).json({ status: 'success', data: null });
});
