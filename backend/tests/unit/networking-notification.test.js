import { test } from 'node:test';
import assert from 'node:assert/strict';
import { isCurrentlyLive } from '../../src/services/networkingNotificationService.js';

/**
 * Phase 7 - "is this event live right now" predicate behind the event-live notification.
 * Pure, no DB required. Deliberately keyed off the same startDate<=now<=endDate window
 * Event.isLive uses, so this and the dashboard/networking access gate never disagree.
 *
 * No "already notified" branch here (by design the notification fires on every trigger,
 * not once ever per event) - see networkingNotificationService.js for why.
 */

test('an event inside its live window is currently live', () => {
  const event = {
    startDate: '2026-01-10T00:00:00.000Z',
    endDate: '2026-01-12T00:00:00.000Z',
  };
  const now = new Date('2026-01-11T00:00:00.000Z');
  assert.equal(isCurrentlyLive(event, now), true);
});

test('an event that has not started yet is not live', () => {
  const event = {
    startDate: '2026-02-01T00:00:00.000Z',
    endDate: '2026-02-02T00:00:00.000Z',
  };
  const now = new Date('2026-01-11T00:00:00.000Z');
  assert.equal(isCurrentlyLive(event, now), false);
});

test('an event that already ended is not live', () => {
  const event = {
    startDate: '2026-01-01T00:00:00.000Z',
    endDate: '2026-01-02T00:00:00.000Z',
  };
  const now = new Date('2026-01-11T00:00:00.000Z');
  assert.equal(isCurrentlyLive(event, now), false);
});

test('a previously-notified event is still live if inside its window (no gate)', () => {
  const event = {
    startDate: '2026-01-10T00:00:00.000Z',
    endDate: '2026-01-12T00:00:00.000Z',
    networkingEmailSentAt: '2026-01-10T00:05:00.000Z',
  };
  const now = new Date('2026-01-11T00:00:00.000Z');
  assert.equal(isCurrentlyLive(event, now), true);
});

test('an event missing start/end dates is never live', () => {
  assert.equal(isCurrentlyLive({}), false);
  assert.equal(isCurrentlyLive(null), false);
});
