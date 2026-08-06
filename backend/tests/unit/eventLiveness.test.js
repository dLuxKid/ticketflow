import { test } from 'node:test';
import assert from 'node:assert/strict';
import Event from '../../src/models/eventModel.js';

/**
 * Event.isLive drives the networking channel (networkingService.canPostToNetworking) and the
 * "Live now" badges. It previously compared exact instants, so a single-day event stored with
 * startDate === endDate had a zero-length window and was never live — its chat could not be
 * opened at all, on the day it was actually happening.
 *
 * `new Event({...})` builds a document without touching the database, so the virtual can be
 * exercised directly.
 */

const at = (iso) => new Date(iso);
const build = (startDate, endDate) => new Event({ startDate, endDate });

test('a single-day event with identical start and end is live that day', () => {
  const today = new Date();
  const sameInstant = new Date(today);
  sameInstant.setUTCHours(9, 0, 0, 0);

  // The regression: an exact-instant window here is zero-length and never matches.
  assert.equal(build(sameInstant, sameInstant).isLive, 'live');
});

test('an event still running later today is live, not past', () => {
  const earlierToday = new Date();
  earlierToday.setUTCHours(0, 30, 0, 0);
  assert.equal(build(earlierToday, earlierToday).isLive, 'live');
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
