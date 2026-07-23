import * as userRepository from '../repositories/userRepository.js';
import AppError from '../shared/errors/AppError.js';

/**
 * Business logic layer for user management.
 * Framework-agnostic: no req/res/next.
 */

const ALLOWED_UPDATE_FIELDS = [
  'name',
  'email',
  'photo',
  'gender',
  'phoneNumber',
];

/**
 * Returns all users (admin use).
 */
export const getAllUsers = () => userRepository.findAll();

/**
 * Returns a single user by ID.
 */
export const getUserById = (id) => userRepository.findById(id);

/**
 * Updates allowed profile fields for the current user.
 * Rejects any attempt to update passwords via this route.
 */
export const updateMe = async (userId, body) => {
  if (body.password || body.passwordConfirm) {
    throw new AppError(
      'This route is not for password updates. Please use /update-my-password',
      400,
    );
  }

  const filteredBody = {};
  Object.keys(body).forEach((key) => {
    if (ALLOWED_UPDATE_FIELDS.includes(key)) filteredBody[key] = body[key];
  });

  return userRepository.updateById(userId, filteredBody);
};

/**
 * Soft-deletes the current user by setting isActive: false.
 */
export const deleteMe = (userId) => userRepository.deactivate(userId);
