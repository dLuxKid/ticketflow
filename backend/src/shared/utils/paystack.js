import crypto from 'crypto';

/**
 * Paystack webhook helpers.
 *
 * Payment must be confirmed from Paystack's signed webhook (and/or a server-side verify
 * call), never from a client-reported status. These functions are pure so they can be
 * unit-tested without a running server or database.
 */

/**
 * Verifies a Paystack webhook signature.
 *
 * Paystack signs the exact raw request body with HMAC-SHA512 keyed by your secret key and
 * sends the hex digest in the `x-paystack-signature` header. We recompute it over the raw
 * bytes and compare in constant time.
 *
 * @param {Buffer|string} rawBody - the exact bytes of the request body (not re-serialized JSON)
 * @param {string} signature - value of the `x-paystack-signature` header
 * @param {string} secretKey - your Paystack secret key
 * @returns {boolean} true only if the signature is present and valid
 */
export const isValidPaystackSignature = (rawBody, signature, secretKey) => {
  if (!signature || !secretKey || rawBody == null) return false;

  const expected = crypto
    .createHmac('sha512', secretKey)
    .update(rawBody)
    .digest('hex');

  // Constant-time comparison; lengths must match for timingSafeEqual.
  const a = Buffer.from(expected, 'utf8');
  const b = Buffer.from(String(signature), 'utf8');
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
};
