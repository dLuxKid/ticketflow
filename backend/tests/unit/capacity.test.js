import { test } from 'node:test';
import assert from 'node:assert/strict';
import { capacityDecision } from '../../src/services/admissionService.js';

/**
 * Venue occupancy is a fire-safety limit, so the decision to admit past it must be explicit
 * and attributable. These cases pin the three behaviours that matter: enforce when a limit
 * exists, never block when one does not, and label an override so the audit row records it.
 */

test('admits while the room is below capacity', () => {
  assert.deepEqual(capacityDecision({ admitted: 49, capacity: 50 }), {
    allow: true,
  });
});

test('refuses once admitted has reached capacity', () => {
  const decision = capacityDecision({ admitted: 50, capacity: 50 });
  assert.equal(decision.allow, false);
  assert.equal(decision.reason, 'at_capacity');
});

test('refuses when already over capacity', () => {
  assert.equal(capacityDecision({ admitted: 62, capacity: 50 }).allow, false);
});

test('an explicit override admits and is labelled for the audit log', () => {
  const decision = capacityDecision({
    admitted: 50,
    capacity: 50,
    override: true,
  });
  assert.equal(decision.allow, true);
  assert.equal(decision.reason, 'capacity_override');
});

test('an override below capacity is not labelled as one', () => {
  // Sending the flag when it is not needed must not pollute the log with a false override.
  const decision = capacityDecision({
    admitted: 10,
    capacity: 50,
    override: true,
  });
  assert.equal(decision.allow, true);
  assert.equal(decision.reason, undefined);
});

test('no configured capacity means no limit, not a closed door', () => {
  // Invite-only events carry no ticket inventory; blocking them for a missing number would
  // break admission entirely.
  for (const capacity of [0, undefined, null, NaN]) {
    assert.deepEqual(
      capacityDecision({ admitted: 500, capacity }),
      { allow: true },
      `capacity ${String(capacity)} should impose no limit`,
    );
  }
});

test('a negative capacity is treated as unset rather than blocking everyone', () => {
  assert.equal(capacityDecision({ admitted: 0, capacity: -5 }).allow, true);
});
