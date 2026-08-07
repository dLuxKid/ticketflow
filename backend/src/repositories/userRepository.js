import User from '../models/userModel.js';

/**
 * Persistence layer for User documents.
 * No business logic - only database operations.
 */

export const create = (data) => User.create(data);

export const findById = (id) => User.findById(id);

/**
 * Loads a user including their `role` (which is `select: false` by default).
 * Used when building the authenticated request context so that authorization
 * middleware (restrictTo) and ownership checks have the role available.
 */
// `+isRootAdmin` travels with the role: userService.canChangeRole refuses to demote the
// root admin, and without it selected that guard would read undefined and never fire.
export const findByIdWithRole = (id) =>
  User.findById(id).select('+role +isRootAdmin');

/**
 * Loads a user including their payout account.
 *
 * `+payout.subaccountCode` is explicit for the same reason `+isRootAdmin` is above: the
 * field is `select: false`, so a caller that forgets it silently sees "no payout account
 * connected" rather than an error.
 */
export const findByIdWithPayout = (id) =>
  User.findById(id).select('+payout.subaccountCode');

/**
 * Sets a user's role on an admin's authority.
 *
 * `isRootAdmin` is deliberately not settable here - root status comes only from
 * scripts/seed-admin.js, so no API path can mint a second unremovable administrator.
 *
 * @param {string} id
 * @param {string} role
 * @param {{clearAssignments?: boolean}} [options] - drop door assignments when the user is
 *   no longer an usher; they authorise nothing in any other role and would silently re-arm.
 */
export const setRole = (id, role, { clearAssignments = false } = {}) =>
  User.findByIdAndUpdate(
    id,
    clearAssignments
      ? { $set: { role }, $unset: { assignedEvents: '' } }
      : { $set: { role } },
    { new: true, runValidators: true },
  ).select('+role +isRootAdmin');

export const findByIdWithPassword = (id) =>
  User.findById(id).select('+password +role');

export const findByEmail = (email) =>
  User.findOne({ email }).select('+password +role');

/** Loads a user by email including role/assignedEvents, for usher management. */
export const findByEmailWithRole = (email) =>
  User.findOne({ email }).select('+role');

/**
 * Adds `eventId` to a user's assignedEvents, promoting them to the `usher` role if they
 * aren't already `creator`/`admin`. `$addToSet` so assigning the same event twice is a
 * no-op, not a duplicate entry.
 */
export const assignToEvent = (userId, eventId) =>
  User.findOneAndUpdate(
    { _id: userId, role: { $nin: ['creator', 'admin'] } },
    { $set: { role: 'usher' }, $addToSet: { assignedEvents: eventId } },
    { new: true, select: '+role' },
  ).then(
    (updated) =>
      updated ??
      // Already a creator/admin - leave their role untouched, just record the assignment.
      User.findByIdAndUpdate(
        userId,
        { $addToSet: { assignedEvents: eventId } },
        { new: true, select: '+role' },
      ),
  );

export const unassignFromEvent = (userId, eventId) =>
  User.findByIdAndUpdate(
    userId,
    { $pull: { assignedEvents: eventId } },
    { new: true, select: '+role' },
  );

/** Users (any role) assigned to a given event - the event's door-staff roster. */
export const findAssignedToEvent = (eventId) =>
  User.find({ assignedEvents: eventId }).select('+role');

export const updateById = (
  id,
  data,
  options = { new: true, runValidators: true },
) => User.findByIdAndUpdate(id, data, options);

export const deactivate = (id) =>
  User.findByIdAndUpdate(id, { isActive: false });

export const findByResetToken = (hashedToken) =>
  User.findOne({
    passwordResetToken: hashedToken,
    passwordResetTokenExpires: { $gt: Date.now() },
  });

/**
 * Every user, for the admin directory.
 *
 * `+role +isRootAdmin` are essential, not incidental: both are `select: false`, so without
 * them the directory would list every account with an undefined role - leaving an admin
 * unable to see who holds what, or which account is the undemotable root.
 *
 * Note this still excludes soft-deleted accounts: the schema's pre-find hook filters
 * `isActive: false`, so deactivated users are invisible even to an admin.
 */
export const findAll = () =>
  User.find().select('+role +isRootAdmin').sort('name');

/** Clears an archived event from every usher's assignments - see eventService.deleteEvent. */
export const unassignAllFromEvent = (eventId) =>
  User.updateMany(
    { assignedEvents: eventId },
    { $pull: { assignedEvents: eventId } },
  );
