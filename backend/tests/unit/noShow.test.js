import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  predictNoShowProbability,
  featuresFromBooking,
  loadModel,
} from '../../src/services/noShowService.js';

/**
 * Phase 5 - no-show prediction. Training happens offline in Python (ml/no_show/train.py);
 * this is the parity test proving the pure-JS runtime scorer reimplements scikit-learn's
 * predict_proba faithfully on the exported weights, so the running app never needs Python.
 *
 * Reference values were computed directly from the trained model.json using the same
 * standardize -> logistic formula scikit-learn's LogisticRegression.predict_proba uses
 * internally (see the one-off command in the Phase 5 commit message / PR description for
 * how these were generated).
 */

test('the trained model file loads and has the expected shape', () => {
  const model = loadModel();
  assert.deepEqual(model.feature_order, [
    'rsvp_lead_days',
    'is_purchase',
    'is_vip',
    'plus_ones',
  ]);
  assert.equal(model.mean.length, 4);
  assert.equal(model.std.length, 4);
  assert.equal(model.coef.length, 4);
  assert.equal(typeof model.intercept, 'number');
});

test('parity: JS scorer matches scikit-learn predict_proba on reference points', () => {
  const cases = [
    {
      features: {
        rsvpLeadDays: 0,
        isPurchase: true,
        isVip: false,
        plusOnes: 0,
      },
      expected: 0.10312,
    },
    {
      features: {
        rsvpLeadDays: 30,
        isPurchase: false,
        isVip: false,
        plusOnes: 2,
      },
      expected: 0.648666,
    },
    {
      features: { rsvpLeadDays: 5, isPurchase: true, isVip: true, plusOnes: 0 },
      expected: 0.066587,
    },
    {
      features: {
        rsvpLeadDays: 45,
        isPurchase: false,
        isVip: false,
        plusOnes: 3,
      },
      expected: 0.798612,
    },
  ];

  for (const { features, expected } of cases) {
    const actual = predictNoShowProbability(features);
    assert.ok(
      Math.abs(actual - expected) < 1e-4,
      `expected ~${expected}, got ${actual} for ${JSON.stringify(features)}`,
    );
  }
});

test('a purchased VIP with no lead time scores lower risk than a last-minute free invite', () => {
  const lowRisk = predictNoShowProbability({
    rsvpLeadDays: 0,
    isPurchase: true,
    isVip: true,
    plusOnes: 0,
  });
  const highRisk = predictNoShowProbability({
    rsvpLeadDays: 40,
    isPurchase: false,
    isVip: false,
    plusOnes: 3,
  });
  assert.ok(lowRisk < highRisk, `expected ${lowRisk} < ${highRisk}`);
});

test('probability is always within [0, 1]', () => {
  const p = predictNoShowProbability({
    rsvpLeadDays: 1000, // an extreme, out-of-distribution input
    isPurchase: false,
    isVip: false,
    plusOnes: 100,
  });
  assert.ok(p >= 0 && p <= 1);
});

test('featuresFromBooking derives rsvpLeadDays from booking/event dates', () => {
  const booking = {
    createdAt: '2026-07-01T00:00:00.000Z',
    source: 'invite',
    vip: true,
    plusOnes: 2,
  };
  const event = { startDate: '2026-07-11T00:00:00.000Z' };

  const features = featuresFromBooking(booking, event);
  assert.equal(features.rsvpLeadDays, 10);
  assert.equal(features.isPurchase, false);
  assert.equal(features.isVip, true);
  assert.equal(features.plusOnes, 2);
});

test('featuresFromBooking clamps a negative lead time (booked after event start) to 0', () => {
  const booking = { createdAt: '2026-07-15T00:00:00.000Z', source: 'purchase' };
  const event = { startDate: '2026-07-11T00:00:00.000Z' };
  assert.equal(featuresFromBooking(booking, event).rsvpLeadDays, 0);
});
