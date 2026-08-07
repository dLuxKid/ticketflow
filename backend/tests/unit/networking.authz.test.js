import { test } from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import {
  canAccessNetworking,
  canPostToNetworking,
  isNetworkingEnabled,
} from '../../src/services/networkingService.js';

/**
 * Phase 7 - pure access-gate logic for guest networking. No DB required.
 */

const oid = () => new mongoose.Types.ObjectId();

test('an attendee with a booking can access the networking space', () => {
  const event = { _id: oid(), user: oid() };
  const booking = { _id: oid() };
  assert.equal(
    canAccessNetworking({ _id: oid(), role: 'user' }, event, booking),
    true,
  );
});

test('the event owner can access it even without a booking (moderation view)', () => {
  const ownerId = oid();
  const event = { _id: oid(), user: ownerId };
  assert.equal(
    canAccessNetworking({ _id: ownerId, role: 'creator' }, event, null),
    true,
  );
});

test('an admin can access any event without a booking', () => {
  const event = { _id: oid(), user: oid() };
  assert.equal(
    canAccessNetworking({ _id: oid(), role: 'admin' }, event, null),
    true,
  );
});

test('a user with no booking who is not the owner/admin is denied', () => {
  const event = { _id: oid(), user: oid() };
  assert.equal(
    canAccessNetworking({ _id: oid(), role: 'user' }, event, null),
    false,
  );
});

test('missing user or event is denied', () => {
  assert.equal(
    canAccessNetworking(null, { _id: oid(), user: oid() }, { _id: oid() }),
    false,
  );
  assert.equal(
    canAccessNetworking({ _id: oid(), role: 'user' }, null, { _id: oid() }),
    false,
  );
});

test('posting is allowed only while the event is live', () => {
  assert.equal(canPostToNetworking({ isLive: 'live' }), true);
  assert.equal(canPostToNetworking({ isLive: 'upcoming' }), false);
  assert.equal(canPostToNetworking({ isLive: 'past' }), false);
  assert.equal(canPostToNetworking(null), false);
});

/**
 * Per-event networking opt-out. `networkingEnabled` is chosen at event creation; only an
 * explicit `false` disables it, so the thousands of events created before the field existed
 * (which store `undefined`) keep the networking they already had.
 */

test('networking is enabled unless explicitly turned off', () => {
  assert.equal(isNetworkingEnabled({ networkingEnabled: true }), true);
  // Pre-existing events predate the field - absence must not read as "off".
  assert.equal(isNetworkingEnabled({}), true);
  assert.equal(isNetworkingEnabled({ networkingEnabled: undefined }), true);
  assert.equal(isNetworkingEnabled({ networkingEnabled: false }), false);
});

test('a disabled event refuses access even to its own organiser', () => {
  const organiser = { _id: { equals: () => true }, role: 'creator' };
  const event = { user: { equals: () => true }, networkingEnabled: false };
  assert.equal(canAccessNetworking(organiser, event, null), false);
});

test('a disabled event accepts no posts even while live', () => {
  assert.equal(
    canPostToNetworking({ isLive: 'live', networkingEnabled: false }),
    false,
  );
  assert.equal(
    canPostToNetworking({ isLive: 'live', networkingEnabled: true }),
    true,
  );
});
