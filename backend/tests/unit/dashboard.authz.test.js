import { test } from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import { canViewDashboard } from '../../src/services/dashboardService.js';

/**
 * Phase 3 - proves only an event's owner (or an admin) may watch its live dashboard.
 * This is the gate that stops anyone subscribing to another event's stream.
 */

const oid = () => new mongoose.Types.ObjectId();

test('owner can view their own event dashboard', () => {
  const ownerId = oid();
  const event = { _id: oid(), user: ownerId };
  assert.equal(
    canViewDashboard({ _id: ownerId, role: 'creator' }, event),
    true,
  );
});

test('a different user cannot view the dashboard', () => {
  const event = { _id: oid(), user: oid() };
  assert.equal(canViewDashboard({ _id: oid(), role: 'creator' }, event), false);
});

test('admin can view any dashboard', () => {
  const event = { _id: oid(), user: oid() };
  assert.equal(canViewDashboard({ _id: oid(), role: 'admin' }, event), true);
});

test('missing user or event is denied', () => {
  assert.equal(canViewDashboard(null, { _id: oid(), user: oid() }), false);
  assert.equal(canViewDashboard({ _id: oid(), role: 'admin' }, null), false);
});
