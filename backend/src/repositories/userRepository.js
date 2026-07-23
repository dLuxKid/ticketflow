import User from '../models/userModel.js';

/**
 * Persistence layer for User documents.
 * No business logic — only database operations.
 */

export const create = (data) => User.create(data);

export const findById = (id) => User.findById(id);

export const findByIdWithPassword = (id) =>
  User.findById(id).select('+password +role');

export const findByEmail = (email) =>
  User.findOne({ email }).select('+password +role');

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
