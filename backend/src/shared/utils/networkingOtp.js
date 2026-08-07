import crypto from 'crypto';

/**
 * One-time codes for guest access to an event's networking channel.
 *
 * Six digits, because the recipient types it from an email on a phone at a venue - long
 * enough that guessing is impractical inside the short expiry, short enough to key in
 * without errors. Generated with `crypto.randomInt` rather than `Math.random`: this is a
 * credential, and a predictable one would let anyone holding a guest's email address into
 * the channel.
 */

export const OTP_TTL_MS = 10 * 60 * 1000; // 10 minutes, matching the password-reset window

/** @returns {string} a zero-padded six-digit code */
export const generateOtp = () =>
  String(crypto.randomInt(0, 1_000_000)).padStart(6, '0');

/**
 * Only the hash is ever persisted. SHA-256 without a salt is appropriate here - unlike a
 * password, the input has high entropy relative to its ten-minute life, and the hash must be
 * recomputable for a constant-time comparison on verify.
 */
export const hashOtp = (code) =>
  crypto.createHash('sha256').update(String(code)).digest('hex');

/**
 * Compares a submitted code against a stored hash in constant time, so response timing does
 * not leak how much of the code was correct.
 *
 * @param {string} code - what the guest typed
 * @param {string} storedHash
 * @param {Date} expiresAt
 * @returns {boolean}
 */
export const verifyOtp = (code, storedHash, expiresAt) => {
  if (!code || !storedHash || !expiresAt) return false;
  if (new Date(expiresAt).getTime() < Date.now()) return false;

  const submitted = Buffer.from(hashOtp(code), 'hex');
  const stored = Buffer.from(storedHash, 'hex');
  if (submitted.length !== stored.length) return false;

  return crypto.timingSafeEqual(submitted, stored);
};
