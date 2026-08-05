import { test } from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import {
  canAccessNetworking,
  canPostToNetworking,
} from '../../src/services/networkingService.js';

/**
 * Phase 7 — pure access-gate logic for guest networking. No DB required.
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
