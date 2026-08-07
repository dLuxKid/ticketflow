import { test } from 'node:test';
import assert from 'node:assert/strict';
import { isPastRetentionWindow } from '../../src/services/retentionService.js';

/**
 * Phase 6 - GDPR retention window logic. Pure, no DB required.
 */

test('an event well past its retention window is eligible', () => {
  const event = { endDate: '2026-01-01T00:00:00.000Z' };
  const now = new Date('2026-03-01T00:00:00.000Z'); // ~59 days later
  assert.equal(isPastRetentionWindow(event, 30, now), true);
});

test('an event within its retention window is not yet eligible', () => {
  const event = { endDate: '2026-01-01T00:00:00.000Z' };
  const now = new Date('2026-01-10T00:00:00.000Z'); // 9 days later
  assert.equal(isPastRetentionWindow(event, 30, now), false);
});

test('exactly at the retention boundary is eligible (>=, not >)', () => {
  const event = { endDate: '2026-01-01T00:00:00.000Z' };
  const now = new Date('2026-01-31T00:00:00.000Z'); // exactly 30 days later
  assert.equal(isPastRetentionWindow(event, 30, now), true);
});

test('an event with no endDate is never eligible', () => {
  assert.equal(isPastRetentionWindow({}, 30), false);
  assert.equal(isPastRetentionWindow(null, 30), false);
});

test('a longer retention window delays eligibility', () => {
  const event = { endDate: '2026-01-01T00:00:00.000Z' };
  const now = new Date('2026-02-01T00:00:00.000Z'); // 31 days later
  assert.equal(isPastRetentionWindow(event, 30, now), true);
  assert.equal(isPastRetentionWindow(event, 90, now), false);
});
