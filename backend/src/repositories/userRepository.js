import User from '../models/userModel.js';

/**
 * Persistence layer for User documents.
 * No business logic — only database operations.
 */

export const create = (data) => User.create(data);

export const findById = (id) => User.findById(id);

/**
 * Loads a user including their `role` (which is `select: false` by default).
 * Used when building the authenticated request context so that authorization
 * middleware (restrictTo) and ownership checks have the role available.
 */
export const findByIdWithRole = (id) => User.findById(id).select('+role');

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
      // Already a creator/admin — leave their role untouched, just record the assignment.
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

/** Users (any role) assigned to a given event — the event's door-staff roster. */
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

export const findAll = () => User.find();
