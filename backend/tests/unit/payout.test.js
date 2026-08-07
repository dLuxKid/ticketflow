import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  listBanks,
  resolveAccount,
  maskAccountNumber,
  describePayout,
} from '../../src/services/payoutService.js';

/**
 * Payout onboarding - the Paystack calls that connect an organiser's bank account.
 *
 * Network is injected rather than mocked at the module level, matching the pattern
 * chatbotService already uses. No real Paystack call is made here.
 */

// The service refuses to build a request without a key, so every test needs one present.
process.env.PAYSTACK_SECRET_KEY ??= 'sk_test_unit';

const okResponse = (data) => ({
  ok: true,
  status: 200,
  json: async () => ({ status: true, data }),
});

const errorResponse = (status, message) => ({
  ok: false,
  status,
  json: async () => ({ status: false, message }),
});

// ─── Account masking ───────────────────────────────────────────────────────────

test('only the last four digits of an account number are ever kept', () => {
  // The full number is deliberately never persisted: Paystack holds it, and storing it
  // here would create a payment-data liability with no matching capability.
  assert.equal(maskAccountNumber('0123456789'), '6789');
  assert.equal(maskAccountNumber('012-345-6789'), '6789');
  assert.equal(maskAccountNumber(undefined), '');
});

// ─── Bank list ─────────────────────────────────────────────────────────────────

test('the bank list is narrowed to the fields the picker needs', async () => {
  const banks = await listBanks('nigeria', async () =>
    okResponse([
      {
        name: 'Test Bank',
        code: '001',
        currency: 'NGN',
        // Paystack returns many more fields; none should survive into the client bundle.
        id: 99,
        slug: 'test-bank',
        gateway: 'emandate',
      },
    ]),
  );

  assert.deepEqual(banks, [
    { name: 'Test Bank', code: '001', currency: 'NGN' },
  ]);
});

// ─── Account resolution ────────────────────────────────────────────────────────

test('a malformed account number is refused before any network call', async () => {
  let called = false;
  const spy = async () => {
    called = true;
    return okResponse({});
  };

  await assert.rejects(
    () => resolveAccount({ accountNumber: '123', bankCode: '001' }, spy),
    (err) => err.statusCode === 400,
  );
  assert.equal(called, false, 'must not call Paystack with known-bad input');
});

test('a missing bank is refused before any network call', async () => {
  await assert.rejects(
    () =>
      resolveAccount({ accountNumber: '0123456789' }, async () => {
        throw new Error('should not be called');
      }),
    (err) => err.statusCode === 400,
  );
});

test('a valid account resolves to the name it is registered under', async () => {
  // This is the step that stops a mistyped digit sending an event's revenue to a stranger:
  // the organiser sees the real account holder before anything is saved.
  const account = await resolveAccount(
    { accountNumber: '0123456789', bankCode: '001' },
    async () =>
      okResponse({
        account_name: 'ADA LOVELACE',
        account_number: '0123456789',
      }),
  );

  assert.equal(account.accountName, 'ADA LOVELACE');
});

test("Paystack's own refusal message is surfaced, not replaced", async () => {
  // An organiser stuck on this screen needs "Account number is invalid", not "request
  // failed" - the provider's message is the only actionable information available.
  await assert.rejects(
    () =>
      resolveAccount(
        { accountNumber: '0123456789', bankCode: '001' },
        async () => errorResponse(422, 'Account number is invalid'),
      ),
    (err) =>
      err.statusCode === 400 && /Account number is invalid/.test(err.message),
  );
});

test('an unreachable provider is a 502, not a validation error', async () => {
  await assert.rejects(
    () =>
      resolveAccount(
        { accountNumber: '0123456789', bankCode: '001' },
        async () => {
          throw new Error('ECONNREFUSED');
        },
      ),
    (err) => err.statusCode === 502,
  );
});

test("a provider-side 500 is not reported as the organiser's mistake", async () => {
  await assert.rejects(
    () =>
      resolveAccount(
        { accountNumber: '0123456789', bankCode: '001' },
        async () => errorResponse(500, 'Internal server error'),
      ),
    (err) => err.statusCode === 502,
  );
});

// ─── Response shaping ──────────────────────────────────────────────────────────

test('the payout summary never exposes the subaccount code', async () => {
  const described = describePayout({
    subaccountCode: 'ACCT_secret',
    bankName: 'Test Bank',
    accountNameMasked: 'ADA LOVELACE',
    accountNumberLast4: '6789',
    platformFeePercent: 3,
    connectedAt: new Date(),
  });

  assert.equal(described.connected, true);
  assert.equal(described.accountNumberLast4, '6789');
  assert.equal(
    JSON.stringify(described).includes('ACCT_secret'),
    false,
    'the subaccount code must not travel to the client',
  );
});

test('an organiser with no payout account reads as not connected', () => {
  assert.deepEqual(describePayout(undefined), { connected: false });
  assert.deepEqual(describePayout({}), { connected: false });
});
