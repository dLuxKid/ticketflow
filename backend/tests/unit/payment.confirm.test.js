import { test, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'crypto';
import * as paymentService from '../../src/services/paymentService.js';

/**
 * Proves the checkout-confirmation rules that keep a buyer's money and their ticket
 * together, without needing a database:
 *
 *  - a browser callback alone never confirms anything - the charge is verified with
 *    Paystack server-side first;
 *  - a webhook whose signature does not check out changes nothing.
 *
 * The DB-backed half of this behaviour (idempotent confirm, inventory release) lives in
 * tests/integration/reservation.lifecycle.test.js.
 */

const SECRET = 'sk_test_example_secret';
const originalKey = process.env.PAYSTACK_SECRET_KEY;

beforeEach(() => {
  process.env.PAYSTACK_SECRET_KEY = SECRET;
});

afterEach(() => {
  if (originalKey === undefined) delete process.env.PAYSTACK_SECRET_KEY;
  else process.env.PAYSTACK_SECRET_KEY = originalKey;
});

const jsonResponse = (body, ok = true) => ({
  ok,
  json: async () => body,
});

test('verifyTransaction reports paid only when Paystack says the charge succeeded', async () => {
  const paid = await paymentService.verifyTransaction('ref_1', async () =>
    jsonResponse({
      data: { status: 'success', id: 42, gateway_response: 'Approved' },
    }),
  );
  assert.equal(paid.paid, true);
  assert.equal(paid.id, 42);

  const failed = await paymentService.verifyTransaction('ref_1', async () =>
    jsonResponse({ data: { status: 'failed' } }),
  );
  assert.equal(failed.paid, false);
});

test('verifyTransaction treats a non-OK response as unpaid', async () => {
  const result = await paymentService.verifyTransaction('ref_1', async () =>
    jsonResponse({}, false),
  );
  assert.equal(result.paid, false);
});

test('confirmCheckout requires a reference', async () => {
  await assert.rejects(
    () => paymentService.confirmCheckout(''),
    (err) => err.statusCode === 400,
  );
});

test('an unsigned webhook is rejected before any state change', async () => {
  const body = Buffer.from(
    JSON.stringify({ event: 'charge.success', data: { reference: 1 } }),
  );
  await assert.rejects(
    () => paymentService.handlePaystackWebhook(body, 'not-a-signature'),
    (err) => err.statusCode === 401,
  );
});

test('a webhook event we do not act on is acknowledged without effect', async () => {
  const payload = { event: 'transfer.success', data: { reference: 1 } };
  const body = Buffer.from(JSON.stringify(payload));
  const signature = crypto
    .createHmac('sha512', SECRET)
    .update(body)
    .digest('hex');

  const result = await paymentService.handlePaystackWebhook(body, signature);
  assert.equal(result.handled, false);
});
