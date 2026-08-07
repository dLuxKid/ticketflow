import * as bookingService from './bookingService.js';
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
    // Confirms the reservation and delivers tickets. Safe under Paystack's retries - the
    // guarded transition inside confirmReservation makes repeat deliveries impossible.
    const result = await bookingService.confirmReservation(reference, {
      transactionNumber: payload?.data?.id,
      message: payload?.data?.gateway_response,
    });
    return { handled: true, event: eventType, ...result };
  }

  if (
    (eventType === 'charge.failed' || eventType === 'charge.abandoned') &&
    reference != null
  ) {
    // Give the seats back - an abandoned checkout must not shrink sellable inventory.
    const result = await bookingService.releaseReservation(reference, 'failed');
    return { handled: true, event: eventType, ...result };
  }

  // Unknown/irrelevant event - acknowledged but no state change.
  return { handled: false, event: eventType };
};

/** Paystack's transaction-verification endpoint. */
const VERIFY_URL = 'https://api.paystack.co/transaction/verify';

/**
 * Asks Paystack directly whether a reference was actually paid.
 *
 * Exported so tests can stub the network call.
 *
 * @returns {Promise<{paid: boolean, id?: number, message?: string}>}
 */
export const verifyTransaction = async (reference, fetchImpl = fetch) => {
  const secretKey = process.env.PAYSTACK_SECRET_KEY;
  const res = await fetchImpl(
    `${VERIFY_URL}/${encodeURIComponent(reference)}`,
    {
      headers: { Authorization: `Bearer ${secretKey}` },
    },
  );

  if (!res.ok) return { paid: false };

  const body = await res.json();
  return {
    paid: body?.data?.status === 'success',
    id: body?.data?.id,
    message: body?.data?.gateway_response,
    // Returned in the currency's minor unit. Verifying that a charge *succeeded* without
    // checking what it was FOR leaves underpayment undetected - see confirmCheckout.
    amountMinor: body?.data?.amount,
    currency: body?.data?.currency,
  };
};

/**
 * Confirms a checkout from the buyer's browser callback, after verifying the charge with
 * Paystack server-side.
 *
 * The webhook is the primary confirmation path, but it is not guaranteed to arrive - it can
 * be delayed, misconfigured, or blocked in local development. Without this the buyer's
 * reservation would sit `pending` and be swept away 15 minutes after they successfully paid.
 * The client's claim of success is never trusted: it only names the reference, and the
 * charge is checked against Paystack's API before anything is confirmed.
 *
 * When no secret key is configured the deployment cannot take real payments at all, so the
 * reservation is confirmed directly. That keeps local development working without turning
 * into a bypass in production, where the key is always present.
 *
 * @param {number|string} reference
 * @returns {Promise<{confirmed:boolean, ticketsSent:number}>}
 */
export const confirmCheckout = async (reference) => {
  if (reference == null || reference === '') {
    throw new AppError('A payment reference is required', 400);
  }

  const secretKey = process.env.PAYSTACK_SECRET_KEY;
  if (!secretKey) {
    console.warn(
      'PAYSTACK_SECRET_KEY is not set - confirming checkout without verification. ' +
        'This is development-only behaviour; configure the key before taking payments.',
    );
    return bookingService.confirmReservation(reference);
  }

  const verified = await verifyTransaction(reference);
  if (!verified.paid) {
    throw new AppError('Payment could not be verified', 402);
  }

  // A successful charge is not the same as a *sufficient* one. Checking only `status` meant
  // any completed payment against this reference confirmed the booking, whatever its value.
  // The expected amount is recomputed from the reservation's own stored prices - which are
  // now written from the event's tiers, not the request - so this compares the charge
  // against the server's number rather than against anything the payer influenced.
  const expectedMinor = await bookingService.expectedAmountMinor(reference);
  if (expectedMinor > 0 && Number(verified.amountMinor) < expectedMinor) {
    throw new AppError(
      'The amount paid does not match the amount due for this reservation',
      402,
    );
  }

  return bookingService.confirmReservation(reference, {
    transactionNumber: verified.id,
    message: verified.message,
  });
};
