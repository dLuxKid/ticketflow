import crypto from 'crypto';

/**
 * Generates a single-use invite token - an unguessable opaque string carried in the QR a
 * guest receives and presented at the door. Uniqueness is additionally enforced by the
 * unique+sparse index on Booking.inviteToken, so a (astronomically unlikely) collision is
 * rejected at insert rather than silently reused.
 *
 * @returns {string} url-safe token (~32 chars)
 */
export const generateInviteToken = () =>
  crypto.randomBytes(24).toString('base64url');
