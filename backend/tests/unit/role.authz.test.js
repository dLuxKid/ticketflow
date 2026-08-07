import { test } from 'node:test';
import assert from 'node:assert/strict';
import { SIGNUP_ROLES } from '../../src/services/authService.js';
import {
  canChangeRole,
  canDeleteUser,
  ASSIGNABLE_ROLES,
} from '../../src/services/userService.js';

/**
 * Administration model: exactly one bootstrap admin (scripts/seed-admin.js), who may promote
 * others. These tests pin the two rules that keep that model intact - nobody can grant
 * themselves admin, and the platform can never end up with no admin at all.
 */

// ── Signup whitelist ────────────────────────────────────────────────────────────
// Regression cover for a privilege-escalation hole: `role` is read from the request body and
// the schema enum accepts 'admin', so an unauthenticated signup carrying "role":"admin" used
// to mint a platform administrator outright.

test('signup offers only the two self-selectable roles', () => {
  assert.deepEqual([...SIGNUP_ROLES].sort(), ['creator', 'user']);
});

test('signup cannot grant admin or usher', () => {
  assert.equal(SIGNUP_ROLES.includes('admin'), false);
  assert.equal(SIGNUP_ROLES.includes('usher'), false);
});

// ── Role change guards ──────────────────────────────────────────────────────────

const admin = { _id: 'admin1', role: 'admin' };
const target = { _id: 'user1', role: 'user' };

test('an admin can promote another user', () => {
  assert.deepEqual(canChangeRole(admin, target, 'creator'), { ok: true });
  assert.deepEqual(canChangeRole(admin, target, 'admin'), { ok: true });
});

test('non-admins cannot change roles at all', () => {
  for (const role of ['user', 'creator', 'usher']) {
    const decision = canChangeRole({ _id: 'x', role }, target, 'admin');
    assert.equal(decision.ok, false, `${role} should be refused`);
    assert.equal(decision.status, 403);
  }
});

test('an admin cannot change their own role', () => {
  // Guards against the last admin demoting themselves and locking everyone out - and, in the
  // same rule, against anyone self-promoting.
  const decision = canChangeRole(admin, { ...admin }, 'user');
  assert.equal(decision.ok, false);
  assert.equal(decision.status, 403);
  assert.match(decision.message, /your own role/i);
});

test('the root administrator cannot be demoted', () => {
  const root = { _id: 'root1', role: 'admin', isRootAdmin: true };
  const decision = canChangeRole(admin, root, 'user');
  assert.equal(decision.ok, false);
  assert.equal(decision.status, 403);
  assert.match(decision.message, /root administrator/i);
});

test('the root administrator may still be re-affirmed as admin', () => {
  const root = { _id: 'root1', role: 'admin', isRootAdmin: true };
  assert.deepEqual(canChangeRole(admin, root, 'admin'), { ok: true });
});

test('an unknown role is rejected before anything is written', () => {
  for (const role of ['superuser', '', null, undefined, 'ADMIN']) {
    const decision = canChangeRole(admin, target, role);
    assert.equal(decision.ok, false, `${String(role)} should be refused`);
    assert.equal(decision.status, 400);
  }
});

test('a missing target reports not-found rather than succeeding', () => {
  const decision = canChangeRole(admin, null, 'creator');
  assert.equal(decision.ok, false);
  assert.equal(decision.status, 404);
});

test('every assignable role is a real schema role', () => {
  assert.deepEqual([...ASSIGNABLE_ROLES].sort(), [
    'admin',
    'creator',
    'user',
    'usher',
  ]);
});

// ── Deletion guards ─────────────────────────────────────────────────────────────
// Deletion is deactivation, not removal - events, bookings and audit-log entries survive.
// The guards mirror canChangeRole because the failure modes are the same: an admin removing
// the last admin, or the root recovery account being destroyed.

test('an admin can delete an ordinary user', () => {
  assert.deepEqual(canDeleteUser(admin, target), { ok: true });
});

test('non-admins cannot delete anyone', () => {
  for (const role of ['user', 'creator', 'usher']) {
    const decision = canDeleteUser({ _id: 'x', role }, target);
    assert.equal(decision.ok, false, `${role} should be refused`);
    assert.equal(decision.status, 403);
  }
});

test('an admin cannot delete their own account from the directory', () => {
  const decision = canDeleteUser(admin, { ...admin });
  assert.equal(decision.ok, false);
  assert.equal(decision.status, 403);
  assert.match(decision.message, /your own account/i);
});

test('the root administrator cannot be deleted', () => {
  const root = { _id: 'root1', role: 'admin', isRootAdmin: true };
  const decision = canDeleteUser(admin, root);
  assert.equal(decision.ok, false);
  assert.match(decision.message, /root administrator/i);
});

test('deleting a missing user reports not-found', () => {
  const decision = canDeleteUser(admin, null);
  assert.equal(decision.ok, false);
  assert.equal(decision.status, 404);
});
