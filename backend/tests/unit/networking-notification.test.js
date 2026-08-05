import { test } from 'node:test';
import assert from 'node:assert/strict';
import { isNewlyLive } from '../../src/services/networkingNotificationService.js';

/**
 * Phase 7 — "event just went live" predicate. Pure, no DB required. Deliberately keyed off
 * the same startDate<=now<=endDate window Event.isLive uses, so this and the dashboard/
 * networking access gate never disagree about whether an event is live.
 */

test('an event inside its live window, not yet notified, is newly live', () => {
  const event = {
    startDate: '2026-01-10T00:00:00.000Z',
    endDate: '2026-01-12T00:00:00.000Z',
  };
  const now = new Date('2026-01-11T00:00:00.000Z');
  assert.equal(isNewlyLive(event, now), true);
});

test('an event that has not started yet is not newly live', () => {
  const event = {
    startDate: '2026-02-01T00:00:00.000Z',
    endDate: '2026-02-02T00:00:00.000Z',
  };
  const now = new Date('2026-01-11T00:00:00.000Z');
  assert.equal(isNewlyLive(event, now), false);
});

test('an event that already ended is not newly live', () => {
  const event = {
    startDate: '2026-01-01T00:00:00.000Z',
    endDate: '2026-01-02T00:00:00.000Z',
  };
  const now = new Date('2026-01-11T00:00:00.000Z');
  assert.equal(isNewlyLive(event, now), false);
});

test('an event already notified is not newly live again', () => {
  const event = {
    startDate: '2026-01-10T00:00:00.000Z',
    endDate: '2026-01-12T00:00:00.000Z',
    networkingEmailSentAt: '2026-01-10T00:05:00.000Z',
  };
  const now = new Date('2026-01-11T00:00:00.000Z');
  assert.equal(isNewlyLive(event, now), false);
});

test('an event missing start/end dates is never newly live', () => {
  assert.equal(isNewlyLive({}), false);
  assert.equal(isNewlyLive(null), false);
});
