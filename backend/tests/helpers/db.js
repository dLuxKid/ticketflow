import mongoose from 'mongoose';

/**
 * Shared helpers for DB-backed integration tests.
 *
 * These tests run only when MONGO_TEST_URI is set (a throwaway test database - in CI a
 * single-node replica set; see the Phase 0 note on transactions). When it is unset the
 * test files register a single skipped test so the suite stays green locally without a
 * database, and exercises the real invariants in CI.
 */

export const MONGO_TEST_URI = process.env.MONGO_TEST_URI;
export const skipReason = MONGO_TEST_URI
  ? false
  : 'set MONGO_TEST_URI to run DB integration tests';

export const connect = () => mongoose.connect(MONGO_TEST_URI);
export const disconnect = () => mongoose.disconnect();

/**
 * Creates an organiser who is able to receive money, and ensures a public key is present.
 *
 * Selling a paid ticket now requires two things that used to be implicit: a configured
 * Paystack public key, and an organiser with a connected payout account for the revenue to
 * be split to. Any integration test that reserves a *paid* booking therefore needs a
 * payable organiser - not because the test is about payouts, but because a paid event with
 * nowhere to send the money is refused by design (bookingService.buildCheckoutConfig).
 *
 * Kept here rather than repeated per file so the fixture tracks the requirement in one
 * place if the money path changes again.
 */
export const createPayableOrganiser = async (overrides = {}) => {
  process.env.PAYSTACK_PUBLIC_KEY ??= 'pk_test_integration';

  const User = (await import('../../src/models/userModel.js')).default;
  const unique = Math.random().toString(36).slice(2, 10);

  return User.create({
    name: 'Test Organiser',
    email: `organiser-${unique}@example.com`,
    password: 'test-password-123',
    passwordConfirm: 'test-password-123',
    payout: {
      subaccountCode: `ACCT_test_${unique}`,
      bankName: 'Test Bank',
      bankCode: '001',
      accountNameMasked: 'TEST ORGANISER',
      accountNumberLast4: '6789',
      platformFeePercent: 3,
      connectedAt: new Date(),
    },
    ...overrides,
  });
};

/** A fully-valid Event payload; override any field via `overrides`. */
export const buildEvent = (overrides = {}) => {
  const now = new Date();
  const later = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  return {
    eventName: 'Test Event',
    startDate: later,
    startTime: later,
    endDate: later,
    endTime: later,
    eventDescription: 'A test event',
    eventLocation: {
      address: '1 Test Street',
      city: 'Testville',
      state: 'Test State',
      country: 'Testland',
    },
    eventCategory: 'Test',
    salesStartDate: now,
    salesEndDate: later,
    salesStartTime: now,
    salesEndTime: later,
    coverImage: 'https://example.com/cover.png',
    ticketDetails: [
      { ticketName: 'General', ticketPrice: 100, ticketQuantity: 1 },
    ],
    ...overrides,
  };
};
