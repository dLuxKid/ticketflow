import { test } from 'node:test';
import assert from 'node:assert/strict';
import { detectAnomalies } from '../../src/services/anomalyService.js';
import { buildAnomalyEvalSet } from '../fixtures/anomalyCases.js';

/**
 * Phase 5 - anomaly detection. Hand-picked unit cases for each rule, plus a regression
 * guard on the full labelled eval set so a future threshold change can't silently tank
 * precision/recall without a test noticing. Full numbers + confusion matrix:
 * `node scripts/eval-anomaly.js`.
 */

const at = (msFromEpoch) => new Date(msFromEpoch).toISOString();

test('a single clean admission is not anomalous', () => {
  const result = detectAnomalies([
    { outcome: 'admitted', createdAt: at(0), deviceId: 'a' },
  ]);
  assert.equal(result.anomalous, false);
  assert.deepEqual(result.flags, []);
});

test('flags repeated_rejects at the threshold', () => {
  const rows = [0, 60000, 120000].map((ms) => ({
    outcome: 'rejected',
    createdAt: at(ms),
    deviceId: 'a',
  }));
  const result = detectAnomalies(rows);
  assert.equal(result.anomalous, true);
  assert.ok(result.flags.includes('repeated_rejects'));
});

test('two rejects (below threshold) alone are not flagged', () => {
  const rows = [0, 60000].map((ms) => ({
    outcome: 'rejected',
    createdAt: at(ms),
    deviceId: 'a',
  }));
  assert.equal(detectAnomalies(rows).anomalous, false);
});

test('flags multi_device when 3+ distinct fingerprints appear inside the window', () => {
  const rows = [
    { outcome: 'rejected', createdAt: at(0), deviceId: 'a' },
    { outcome: 'rejected', createdAt: at(60000), deviceId: 'b' },
    { outcome: 'admitted', createdAt: at(120000), deviceId: 'c' },
  ];
  const result = detectAnomalies(rows);
  assert.equal(result.anomalous, true);
  assert.ok(result.flags.includes('multi_device'));
});

test('does not flag multi_device once the 3rd device falls outside the window', () => {
  const rows = [
    { outcome: 'admitted', createdAt: at(0), deviceId: 'a' },
    { outcome: 'rejected', createdAt: at(4 * 60000), deviceId: 'b' },
    { outcome: 'rejected', createdAt: at(9 * 60000), deviceId: 'c' }, // outside 5-min window
  ];
  const result = detectAnomalies(rows);
  // Documented known limitation (see anomalyCases.js) - asserted here, not hidden.
  assert.equal(result.anomalous, false);
});

test('flags rapid_sequential for two scans under the millisecond threshold apart', () => {
  const rows = [
    { outcome: 'rejected', createdAt: at(0), deviceId: 'a' },
    { outcome: 'rejected', createdAt: at(500), deviceId: 'a' },
  ];
  const result = detectAnomalies(rows);
  assert.equal(result.anomalous, true);
  assert.ok(result.flags.includes('rapid_sequential'));
});

test('empty or missing rows are not anomalous', () => {
  assert.deepEqual(detectAnomalies([]), { anomalous: false, flags: [] });
  assert.deepEqual(detectAnomalies(undefined), { anomalous: false, flags: [] });
});

test('regression guard: full labelled eval set stays within reported bounds', () => {
  const cases = buildAnomalyEvalSet();
  let tp = 0;
  let fp = 0;
  let fn = 0;

  for (const c of cases) {
    const predicted = detectAnomalies(c.rows).anomalous;
    if (predicted && c.label) tp++;
    else if (predicted && !c.label) fp++;
    else if (!predicted && c.label) fn++;
  }

  const precision = tp / (tp + fp) || 0;
  const recall = tp / (tp + fn) || 0;

  // Bounds set just below the measured 0.948/0.821 (see scripts/eval-anomaly.js) so a
  // regression fails this test before it reaches a report or a demo.
  assert.ok(precision >= 0.93, `precision dropped: ${precision}`);
  assert.ok(recall >= 0.75, `recall dropped: ${recall}`);
});
