import { test } from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import Booking from '../../src/models/bookingModel.js';
import Event from '../../src/models/eventModel.js';
import User from '../../src/models/userModel.js';
import Guest from '../../src/models/guestModel.js';
import AuditLog from '../../src/models/auditLogModel.js';

/**
 * Phase 1 - model-level schema guarantees. These run without a database: Mongoose applies
 * defaults at construction, computes virtuals on access, and validateSync() runs validators
 * in memory.
 */

const baseBooking = {
  event: new mongoose.Types.ObjectId(),
  email: 'g@example.com',
  name: 'Guest',
  price: 100,
  currency: 'NGN',
  transactionNumber: 1,
  ticketId: 'T1',
  ticketUser: 'Guest',
  transactionStatus: 'success',
  redirectUrl: 'https://x',
  message: 'ok',
  reference: 1,
  ticketType: 'General',
};

// ─── Booking state machine ───────────────────────────────────────────────────────
test('Booking defaults: status=issued, source=purchase, isCheckedIn=false', () => {
  const b = new Booking(baseBooking);
  assert.equal(b.status, 'issued');
  assert.equal(b.source, 'purchase');
  assert.equal(b.isCheckedIn, false);
});

test('Booking.isCheckedIn virtual is true only when status=admitted', () => {
  assert.equal(
    new Booking({ ...baseBooking, status: 'admitted' }).isCheckedIn,
    true,
  );
  assert.equal(
    new Booking({ ...baseBooking, status: 'scanned' }).isCheckedIn,
    false,
  );
});

test('Booking rejects an invalid status', () => {
  const err = new Booking({
    ...baseBooking,
    status: 'teleported',
  }).validateSync();
  assert.ok(err?.errors?.status, 'status enum should reject unknown value');
});

test('Booking rejects an invalid source', () => {
  const err = new Booking({
    ...baseBooking,
    source: 'smuggled',
  }).validateSync();
  assert.ok(err?.errors?.source, 'source enum should reject unknown value');
});

// ─── Event accessMode ────────────────────────────────────────────────────────────
test('Event.accessMode defaults to public', () => {
  assert.equal(new Event({}).accessMode, 'public');
});

test('Event rejects an invalid accessMode', () => {
  const err = new Event({ accessMode: 'members_only' }).validateSync();
  assert.ok(
    err?.errors?.accessMode,
    'accessMode enum should reject unknown value',
  );
});

// ─── User usher role ─────────────────────────────────────────────────────────────
test('User role enum accepts usher and rejects unknown roles', () => {
  assert.equal(
    new User({ role: 'usher' }).validateSync()?.errors?.role,
    undefined,
  );
  assert.ok(new User({ role: 'bouncer' }).validateSync()?.errors?.role);
});

// ─── Guest ───────────────────────────────────────────────────────────────────────
test('Guest requires event, name and email; defaults vip=false, plusOnes=0', () => {
  const missing = new Guest({}).validateSync();
  assert.ok(
    missing?.errors?.event && missing?.errors?.name && missing?.errors?.email,
  );

  const g = new Guest({
    event: new mongoose.Types.ObjectId(),
    name: 'Vee',
    email: 'V@Example.com',
  });
  assert.equal(g.validateSync(), undefined);
  assert.equal(g.vip, false);
  assert.equal(g.plusOnes, 0);
  assert.equal(g.email, 'v@example.com', 'email is lowercased');
});

// ─── AuditLog ────────────────────────────────────────────────────────────────────
test('AuditLog requires event, actor, outcome and validates the outcome enum', () => {
  const missing = new AuditLog({}).validateSync();
  assert.ok(
    missing?.errors?.event &&
      missing?.errors?.actor &&
      missing?.errors?.outcome,
  );

  const bad = new AuditLog({
    event: new mongoose.Types.ObjectId(),
    actor: new mongoose.Types.ObjectId(),
    outcome: 'maybe',
  }).validateSync();
  assert.ok(bad?.errors?.outcome, 'outcome enum should reject unknown value');
});
