import { test } from 'node:test';
import assert from 'node:assert/strict';
import Event from '../../src/models/eventModel.js';

/**
 * Event.isLive drives the networking channel (networkingService.canPostToNetworking) and the
 * "Live now" badges. It previously compared exact instants, so a single-day event stored with
 * startDate === endDate had a zero-length window and was never live - its chat could not be
 * opened at all, on the day it was actually happening.
 *
 * `new Event({...})` builds a document without touching the database, so the virtual can be
 * exercised directly.
 */

const at = (iso) => new Date(iso);
const build = (startDate, endDate) => new Event({ startDate, endDate });

/**
 * Times are expressed RELATIVE TO NOW, never as a fixed clock time.
 *
 * These two tests previously pinned "today at 09:00 UTC" and "today at 00:30 UTC" and
 * asserted `live`. Both are in the *future* when the suite runs early in the UTC day, so
 * they failed every morning before 09:00 - a real scheduling flake that would have broken
 * any CI run in that window, while passing all afternoon.
 *
 * Note that "a few minutes ago" is NOT a safe substitute: just after midnight UTC it lands
 * on the previous calendar day, whose end-of-day has already passed, making the event
 * `past`. The anchors below are safe at every hour.
 */
const startOfTodayUtc = () => {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  return d;
};

test('a single-day event with identical start and end is live that day', () => {
  // The regression: an exact-instant window here is zero-length and never matches.
  const sameInstant = startOfTodayUtc();
  assert.equal(build(sameInstant, sameInstant).isLive, 'live');
});

test('an event starting at this exact moment is live, not upcoming', () => {
  // The inclusive edge: `startDate > now` must be strict, or an event is dead on arrival
  // for the instant it begins.
  const now = new Date();
  assert.equal(build(now, now).isLive, 'live');
});

test('an event starting later today is still upcoming, not live', () => {
  // The other side of the boundary: end-of-day generosity applies to when an event STOPS
  // being live, not to when it starts.
  const soon = new Date(Date.now() + 60 * 60 * 1000);
  assert.equal(build(soon, soon).isLive, 'upcoming');
});

test('a future event is upcoming', () => {
  const start = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
  assert.equal(build(start, start).isLive, 'upcoming');
});

test('an event that ended on a previous day is past', () => {
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
  assert.equal(build(yesterday, yesterday).isLive, 'past');
});

test('a multi-day event is live throughout its range', () => {
  const start = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
  const end = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000);
  assert.equal(build(start, end).isLive, 'live');
});

test('missing dates report upcoming rather than throwing', () => {
  assert.equal(build(undefined, undefined).isLive, 'upcoming');
  assert.equal(build(at('2026-01-01'), undefined).isLive, 'upcoming');
});
