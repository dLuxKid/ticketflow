import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  platformFeeMinor,
  toMinorUnits,
  priceBuyers,
  findTier,
  buildSplit,
  isSupportedCurrency,
  DEFAULT_CURRENCY,
} from '../../src/services/pricingService.js';

/**
 * Server-authoritative pricing and the platform fee.
 *
 * Two distinct properties are under test, and they are related: the fee is a percentage of
 * the transaction amount, so an amount the buyer can choose makes the fee meaningless. The
 * pricing tests are therefore part of the fee's correctness, not a separate concern.
 */

const event = {
  currency: 'NGN',
  ticketDetails: [
    { ticketName: 'General', ticketPrice: 5000 },
    { ticketName: 'VIP', ticketPrice: 25000 },
    { ticketName: 'Free entry', ticketPrice: 0 },
  ],
};

// ─── Fee arithmetic ────────────────────────────────────────────────────────────

test('the fee is the configured percentage of the amount', () => {
  // 3% of 10,000 NGN (1,000,000 kobo) = 300 NGN = 30,000 kobo
  assert.equal(platformFeeMinor(1_000_000, 3), 30_000);
});

test('the fee rounds DOWN, never up', () => {
  // 3% of 101 kobo is 3.03 kobo. Rounding up would take a fraction of a kobo more than
  // the stated rate on every such transaction, and always in the platform's favour.
  assert.equal(platformFeeMinor(101, 3), 3);
  assert.equal(platformFeeMinor(199, 3), 5);
});

test('a zero, negative or non-numeric amount yields no fee', () => {
  for (const bad of [0, -1, -100_000, NaN, undefined, null, 'free']) {
    assert.equal(platformFeeMinor(bad, 3), 0, `amount ${bad}`);
  }
});

test('a zero or negative percentage yields no fee', () => {
  assert.equal(platformFeeMinor(1_000_000, 0), 0);
  assert.equal(platformFeeMinor(1_000_000, -5), 0);
});

test('a misconfigured percentage above 100 cannot exceed the amount', () => {
  // Guards against a typo (300 instead of 3) billing the organiser more than the buyer
  // paid, which would invert the split rather than merely overcharging.
  assert.equal(platformFeeMinor(1_000_000, 300), 1_000_000);
});

test('free tickets carry no fee', () => {
  assert.equal(platformFeeMinor(toMinorUnits(0), 3), 0);
});

test('minor-unit conversion avoids floating-point drift', () => {
  // 0.1 + 0.2 style error would make this 1000.0000000000001 without rounding.
  assert.equal(toMinorUnits(10.1), 1010);
  assert.equal(toMinorUnits(0.07), 7);
  assert.equal(toMinorUnits(5000), 500_000);
});

// ─── Price authority ───────────────────────────────────────────────────────────

test('a client-supplied price is discarded in favour of the event tier', () => {
  // The original defect: this payload used to be written to the booking verbatim, so the
  // buyer paid 1 naira for a 25,000 naira ticket and received a valid, scannable ticket.
  const { buyers, totalMajor } = priceBuyers(
    [{ ticketType: 'VIP', price: 1, name: 'Mallory' }],
    event,
  );

  assert.equal(buyers[0].price, 25000);
  assert.equal(totalMajor, 25000);
});

test('a client-supplied currency is discarded in favour of the event', () => {
  // Currency is half of an amount: pairing a naira price with a cheaper code is simply a
  // second way to underpay.
  const { buyers } = priceBuyers(
    [{ ticketType: 'General', currency: 'USD' }],
    event,
  );
  assert.equal(buyers[0].currency, 'NGN');
});

test('an unknown ticket type is refused', () => {
  assert.throws(
    () => priceBuyers([{ ticketType: 'Backstage' }], event),
    (err) => err.statusCode === 400,
  );
});

test('the refusal does not echo the submitted ticket type back', () => {
  // Reflecting unsanitised input into an error message is how a validation surface becomes
  // an injection surface.
  try {
    findTier(event, '<script>alert(1)</script>');
    assert.fail('should have thrown');
  } catch (err) {
    assert.doesNotMatch(err.message, /script/i);
  }
});

test('multiple buyers total correctly across tiers', () => {
  const { totalMajor, totalMinor } = priceBuyers(
    [
      { ticketType: 'General' },
      { ticketType: 'General' },
      { ticketType: 'VIP' },
    ],
    event,
  );
  assert.equal(totalMajor, 35000);
  assert.equal(totalMinor, 3_500_000);
});

test('a genuinely free tier prices to zero rather than failing', () => {
  const { totalMinor } = priceBuyers([{ ticketType: 'Free entry' }], event);
  assert.equal(totalMinor, 0);
});

// ─── Split construction ────────────────────────────────────────────────────────

test('the split routes to the organiser and charges the platform fee explicitly', () => {
  const split = buildSplit(1_000_000, 'ACCT_test123');

  assert.equal(split.subaccount, 'ACCT_test123');
  assert.equal(split.transaction_charge, platformFeeMinor(1_000_000));
  // The organiser bears Paystack's own processing fee, so the platform's margin is exactly
  // transaction_charge and does not shrink as gateway pricing changes.
  assert.equal(split.bearer, 'subaccount');
});

test('the split always sends an explicit charge, never relying on percentage_charge', () => {
  // The stored subaccount `percentage_charge` has ambiguous direction in Paystack's docs.
  // Sending transaction_charge on every transaction means that field never decides the
  // money - this test pins that intent so it is not "simplified" away later.
  const split = buildSplit(250_000, 'ACCT_x');
  assert.equal(typeof split.transaction_charge, 'number');
  assert.ok(Object.hasOwn(split, 'transaction_charge'));
});

// ─── Supported currencies ──────────────────────────────────────────────────────

test('only currencies the payment provider can settle are supported', () => {
  // The list is a provider constraint, not a preference. Events used to take their currency
  // from their country — UK → GBP, Germany/France → EUR — and Paystack settles neither, so
  // those events could never sell a ticket: the charge is rejected at the gateway, after the
  // buyer has committed.
  for (const good of ['NGN', 'GHS', 'ZAR', 'KES', 'USD', 'XOF']) {
    assert.equal(
      isSupportedCurrency(good),
      true,
      `${good} should be supported`,
    );
  }
  for (const bad of ['GBP', 'EUR', 'JPY', 'CAD']) {
    assert.equal(isSupportedCurrency(bad), false, `${bad} must be refused`);
  }
});

test('currency support is case-insensitive', () => {
  // The schema uppercases on write; this keeps the check agreeing with it.
  assert.equal(isSupportedCurrency('ngn'), true);
  assert.equal(isSupportedCurrency('Usd'), true);
});

test('the default currency is itself supported', () => {
  // A misconfigured DEFAULT_CURRENCY would otherwise produce events that fail validation
  // only at save time, with nothing pointing at the environment variable as the cause.
  assert.equal(isSupportedCurrency(DEFAULT_CURRENCY), true);
});
