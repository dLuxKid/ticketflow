import { promisify } from 'util';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import * as userRepository from '../repositories/userRepository.js';
import AppError from '../shared/errors/AppError.js';

/**
 * Business logic layer for authentication.
 * Framework-agnostic: no req/res/next - only domain operations.
 */

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });

export const generateToken = (userId) => signToken(userId);

/**
 * Roles a visitor may choose for themselves at signup.
 *
 * `admin` and `usher` are deliberately absent. `role` is read from the request body, and the
 * schema enum accepts 'admin' - so before this whitelist existed, an unauthenticated POST to
 * /users/signup carrying `"role": "admin"` minted a platform administrator with the power to
 * read every user and act as owner of every event (OWASP A01, privilege escalation via mass
 * assignment). Admin is now only reachable through scripts/seed-admin.js or promotion by an
 * existing admin; usher only through being assigned to a door.
 */
export const SIGNUP_ROLES = Object.freeze(['user', 'creator']);

/**
 * Creates a new user account and returns the created document.
 *
 * An unrecognised or privileged `role` silently falls back to 'user' rather than erroring:
 * the caller has no legitimate reason to send one, and a 400 would only tell an attacker
 * which values the whitelist rejects.
 */
export const signup = async ({
  name,
  email,
  password,
  passwordConfirm,
  role,
}) => {
  const newUser = await userRepository.create({
    name,
    email,
    password,
    passwordConfirm,
    role: SIGNUP_ROLES.includes(role) ? role : 'user',
  });
  return newUser;
};

/**
 * Validates credentials and returns the authenticated user.
 * Throws AppError on invalid credentials.
 */
export const login = async (email, password) => {
  if (!email || !password) {
    throw new AppError('Please provide email and password', 400);
  }

  const user = await userRepository.findByEmail(email);

  if (!user || !(await user.correctPassword(password, user.password))) {
    throw new AppError('Incorrect email or password', 401);
  }

  return user;
};

/**
 * Verifies a JWT and returns the currently authenticated user.
 * Throws AppError if the token is invalid or the user no longer exists.
 */
export const verifyAndGetUser = async (token) => {
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
  // Load with role so downstream authorization (restrictTo) and ownership checks work;
  // role is `select: false` on the schema and would otherwise be undefined here.
  const currentUser = await userRepository.findByIdWithRole(decoded.id);

  if (!currentUser) {
    throw new AppError(
      'The user belonging to this token no longer exists',
      401,
    );
  }

  if (currentUser.changedPasswordAfter(decoded.iat)) {
    throw new AppError(
      'User recently changed password! Please log in again',
      401,
    );
  }

  return currentUser;
};

/**
 * Generates a password reset token, saves the hashed version to the DB,
 * and returns the plain-text token (to be sent in the email).
 */
export const initiatePasswordReset = async (email) => {
  const user = await userRepository.findByEmail(email);

  if (!user) {
    throw new AppError('There is no user with this email address', 404);
  }

  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });

  return { user, resetToken };
};

/**
 * Clears the password reset token from a user (called on email send failure).
 */
export const clearPasswordResetToken = async (user) => {
  user.passwordResetToken = undefined;
  user.passwordResetTokenExpires = undefined;
  await user.save({ validateBeforeSave: false });
};

/**
 * Validates the reset token, updates the password, and returns the updated user.
 */
export const resetPassword = async (token, password, passwordConfirm) => {
  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
  const user = await userRepository.findByResetToken(hashedToken);

  if (!user) {
    throw new AppError('Token is invalid or has expired', 400);
  }

  user.password = password;
  user.passwordConfirm = passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetTokenExpires = undefined;
  await user.save();

  return user;
};

/**
 * Updates the password for an authenticated user after verifying the current one.
 */
export const updatePassword = async (
  userId,
  currentPassword,
  newPassword,
  newPasswordConfirm,
) => {
  const user = await userRepository.findByIdWithPassword(userId);

  if (!user) {
    throw new AppError('This user does not exist', 400);
  }

  if (!(await user.correctPassword(currentPassword, user.password))) {
    throw new AppError('Incorrect password', 401);
  }

  user.password = newPassword;
  user.passwordConfirm = newPasswordConfirm;
  await user.save();

  return user;
};
