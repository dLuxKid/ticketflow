import * as bookingRepository from '../repositories/bookingRepository.js';
import { isValidPaystackSignature } from '../shared/utils/paystack.js';
import AppError from '../shared/errors/AppError.js';

/**
 * Business logic for payment confirmation.
 *
 * Payment state is derived from Paystack's signed webhook, not from anything the client
 * reports. The client can still trigger booking creation, but a booking's
 * transactionStatus only becomes authoritative once Paystack confirms the charge here.
 */

/**
 * Verifies a Paystack webhook and applies its effect.
 *
 * @param {Buffer} rawBody - exact raw request bytes (for signature verification)
 * @param {string} signature - x-paystack-signature header
 * @returns {Promise<{handled: boolean, event: string}>}
 * @throws {AppError} 401 if the signature is missing or invalid
 */
export const handlePaystackWebhook = async (rawBody, signature) => {
  const secretKey = process.env.PAYSTACK_SECRET_KEY;
  if (!secretKey) {
    throw new AppError('Payment provider is not configured', 500);
  }

  if (!isValidPaystackSignature(rawBody, signature, secretKey)) {
    throw new AppError('Invalid payment signature', 401);
  }

  // Safe to parse now that authenticity is established.
  const payload = JSON.parse(rawBody.toString('utf8'));
  const eventType = payload?.event;
  const reference = payload?.data?.reference;

  if (eventType === 'charge.success' && reference != null) {
    await bookingRepository.updateStatusByReference(reference, 'success');
    return { handled: true, event: eventType };
  }

  if (
    (eventType === 'charge.failed' || eventType === 'charge.abandoned') &&
    reference != null
  ) {
    await bookingRepository.updateStatusByReference(reference, 'failed');
    return { handled: true, event: eventType };
  }

  // Unknown/irrelevant event — acknowledged but no state change.
  return { handled: false, event: eventType };
};
