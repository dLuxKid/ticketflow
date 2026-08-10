import { test } from 'node:test';
import assert from 'node:assert/strict';
import { hasGuestList } from '../../src/models/eventModel.js';

/**
 * One definition of "this event has a guest list", used by guestService's authorisation
 * check, by the workspace lookup that decides whether the UI offers the tab, and (through
 * that lookup) by the My Events card.
 *
 * The rule previously existed twice, written in opposite directions - `accessMode ===
 * 'public'` on the server and `invite_only || hybrid` in the browser - which disagreed on
 * any event whose accessMode was absent. These tests pin the direction so the two cannot
 * drift again.
 */

test('invite-only events have a guest list', () => {
  assert.equal(hasGuestList({ accessMode: 'invite_only' }), true);
});

test('hybrid events have a guest list', () => {
  assert.equal(hasGuestList({ accessMode: 'hybrid' }), true);
});

test('public events do not', () => {
  assert.equal(hasGuestList({ accessMode: 'public' }), false);
});

test('an event with no access mode is treated as having none', () => {
  // Tested positively on purpose. Offering a guest list the API then refuses is worse than
  // hiding one that might have worked, so the unknown case fails closed.
  assert.equal(hasGuestList({}), false);
  assert.equal(hasGuestList({ accessMode: undefined }), false);
});

test('a missing event does not throw', () => {
  assert.equal(hasGuestList(null), false);
  assert.equal(hasGuestList(undefined), false);
});
