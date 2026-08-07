import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseGuestCsv } from '../../src/shared/utils/parseGuestCsv.js';
import { generateInviteToken } from '../../src/shared/utils/inviteToken.js';

/**
 * Phase 4 - pure CSV parsing and invite-token generation. No DB required.
 */

test('parses a CSV with a header row in any column order', () => {
  const { guests } = parseGuestCsv(
    'email,name,vip\nada@example.com,Ada Lovelace,yes\ngrace@example.com,Grace Hopper,no',
  );
  assert.equal(guests.length, 2);
  assert.deepEqual(guests[0], {
    name: 'Ada Lovelace',
    email: 'ada@example.com',
    vip: true,
    plusOnes: 0,
  });
  assert.equal(guests[1].vip, false);
});

test('parses a headerless CSV as name,email,vip,plusOnes', () => {
  const { guests } = parseGuestCsv('Alan Turing,alan@example.com,,2');
  assert.deepEqual(guests[0], {
    name: 'Alan Turing',
    email: 'alan@example.com',
    vip: false,
    plusOnes: 2,
  });
});

test('honours quoted fields containing commas', () => {
  const { guests } = parseGuestCsv('name,email\n"Doe, John",john@example.com');
  assert.equal(guests[0].name, 'Doe, John');
});

test('lowercases emails and collects invalid rows instead of throwing', () => {
  const { guests, invalid } = parseGuestCsv(
    'name,email\nValid Person,PERSON@Example.com\nNo Email,',
  );
  assert.equal(guests[0].email, 'person@example.com');
  assert.equal(invalid.length, 1);
  assert.equal(invalid[0].line, 3);
});

test('empty or non-string input yields empty result', () => {
  assert.deepEqual(parseGuestCsv(''), { guests: [], invalid: [] });
  assert.deepEqual(parseGuestCsv(null), { guests: [], invalid: [] });
});

test('invite tokens are url-safe and unique', () => {
  const a = generateInviteToken();
  const b = generateInviteToken();
  assert.notEqual(a, b);
  assert.match(a, /^[A-Za-z0-9_-]+$/);
  assert.ok(a.length >= 24);
});
