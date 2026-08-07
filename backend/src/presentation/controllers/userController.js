import * as userService from '../../services/userService.js';
import * as payoutService from '../../services/payoutService.js';
import catchAsync from '../../shared/middleware/catchAsync.js';

/**
 * Presentation layer for user management.
 * Handles HTTP concerns only - delegates all business logic to userService.
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

/**
 * Changes another user's role. Admin-only; the guards live in userService.canChangeRole.
 * Body: { role }.
 */
export const updateUserRole = catchAsync(async (req, res) => {
  const user = await userService.changeUserRole(
    req.user,
    req.params.id,
    req.body.role,
  );

  res.status(200).json({
    status: 'success',
    message: `Role updated to ${user.role}`,
    data: { user },
  });
});

/** Deactivates another user. Admin-only; guards live in userService.canDeleteUser. */
export const deleteUser = catchAsync(async (req, res) => {
  const user = await userService.deleteUser(req.user, req.params.id);

  res.status(200).json({
    status: 'success',
    message: `${user.name} has been deactivated`,
    data: null,
  });
});

export const deleteMe = catchAsync(async (req, res) => {
  await userService.deleteMe(req.user.id);

  res.status(204).json({ status: 'success', data: null });
});

// ─── Payout onboarding ─────────────────────────────────────────────────────────

/** The signed-in organiser's own payout setup. Never exposes the subaccount code. */
export const getMyPayout = catchAsync(async (req, res) => {
  const payout = await payoutService.getPayoutFor(req.user.id);

  res.status(200).json({ status: 'success', data: { payout } });
});

/** Banks available for payout, for the onboarding dropdown. */
export const getPayoutBanks = catchAsync(async (req, res) => {
  const banks = await payoutService.listBanks(req.query.country || undefined);

  res.status(200).json({ status: 'success', data: { banks } });
});

/**
 * Resolves a bank account to its registered name so the organiser can confirm the
 * destination BEFORE it is saved. A mistyped digit here would send an event's entire
 * revenue to a stranger, and bank transfers are not reversible on request.
 */
export const resolvePayoutAccount = catchAsync(async (req, res) => {
  const account = await payoutService.resolveAccount({
    accountNumber: req.body.accountNumber,
    bankCode: req.body.bankCode,
  });

  res.status(200).json({ status: 'success', data: { account } });
});

/** Creates the Paystack subaccount and attaches it to the signed-in user. */
export const connectPayout = catchAsync(async (req, res) => {
  const payout = await payoutService.connectPayoutAccount(req.user, {
    bankCode: req.body.bankCode,
    accountNumber: req.body.accountNumber,
    businessName: req.body.businessName,
  });

  res.status(200).json({
    status: 'success',
    message: 'Payout account connected - your events can now sell tickets',
    data: { payout },
  });
});
