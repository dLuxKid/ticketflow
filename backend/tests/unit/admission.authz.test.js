import { test } from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import {
  authorizeScan,
  rejectionReasonForStatus,
} from '../../src/services/admissionService.js';

/**
 * Phase 2 — pure authorization and reason logic for door admission. No DB required.
 */

const oid = () => new mongoose.Types.ObjectId();

test('admin may admit for any event', () => {
  const event = { _id: oid(), user: oid() };
  assert.deepEqual(authorizeScan({ _id: oid(), role: 'admin' }, event), {
    ok: true,
  });
});

test('creator may admit only for their own event', () => {
  const creatorId = oid();
  const owned = { _id: oid(), user: creatorId };
  const other = { _id: oid(), user: oid() };
  assert.equal(
    authorizeScan({ _id: creatorId, role: 'creator' }, owned).ok,
    true,
  );
  assert.equal(
    authorizeScan({ _id: creatorId, role: 'creator' }, other).ok,
    false,
  );
});

test('usher may admit for an assigned event', () => {
  const eventId = oid();
  const event = { _id: eventId, user: oid() };
  const usher = { _id: oid(), role: 'usher', assignedEvents: [eventId] };
  assert.equal(authorizeScan(usher, event).ok, true);
});

test('usher scanning an unassigned event is a wrong_event rejection (auditable)', () => {
  const event = { _id: oid(), user: oid() };
  const usher = { _id: oid(), role: 'usher', assignedEvents: [oid()] };
  const result = authorizeScan(usher, event);
  assert.equal(result.ok, false);
  assert.equal(result.httpStatus, 403);
  assert.equal(result.reason, 'wrong_event');
  assert.equal(result.auditable, true);
});

test('a plain user may not admit', () => {
  const event = { _id: oid(), user: oid() };
  assert.equal(authorizeScan({ _id: oid(), role: 'user' }, event).ok, false);
});

test('the event owner may admit whatever their role label is', () => {
  // Owning the event is the authorising fact; not every organiser account carries the
  // `creator` role, and requiring both locked owners out of their own door.
  const ownerId = oid();
  const event = { _id: oid(), user: ownerId };
  assert.equal(authorizeScan({ _id: ownerId, role: 'user' }, event).ok, true);
});

test('missing actor or event is denied', () => {
  assert.equal(authorizeScan(null, { _id: oid() }).ok, false);
  assert.equal(authorizeScan({ role: 'admin' }, null).ok, false);
});

test('rejectionReasonForStatus maps status to an audit reason', () => {
  assert.equal(rejectionReasonForStatus('admitted'), 'already_admitted');
  assert.equal(rejectionReasonForStatus('revoked'), 'revoked');
  assert.equal(rejectionReasonForStatus('issued'), 'not_admittable');
});
