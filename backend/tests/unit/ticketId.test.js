import { test } from 'node:test';
import assert from 'node:assert/strict';
import generateTicketId from '../../src/shared/utils/ticketIdGenerator.js';

/**
 * Proves the ticket ID is fit to be an admission credential, not just a display reference:
 * the door scanner resolves a scanned QR against `ticketId`
 * (bookingRepository.findByInviteTokenOrTicketId), so it must be unguessable and unique.
 * These properties are what justify having moved generation out of the browser and into
 * bookingService.reserveBooking.
 */

const ALPHABET = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';

test('matches the documented format: # followed by 12 base32 characters', () => {
  for (let i = 0; i < 100; i++) {
    assert.match(generateTicketId(), /^#[0-9A-HJKMNP-TV-Z]{12}$/);
  }
});

test('never emits glyphs that are ambiguous when read from a printout', () => {
  // I/L/O/U are excluded so they cannot be confused with 1/0 at the door.
  for (let i = 0; i < 200; i++) {
    const body = generateTicketId().slice(1);
    for (const char of body) {
      assert.ok(
        ALPHABET.includes(char),
        `unexpected character ${char} in generated id`,
      );
    }
  }
});

test('does not repeat across a large sample', () => {
  const seen = new Set();
  for (let i = 0; i < 20000; i++) seen.add(generateTicketId());
  assert.equal(seen.size, 20000);
});

test('uses the full alphabet rather than a predictable subset', () => {
  // A weak generator (e.g. digits only, as the previous Math.random version emitted) would
  // fail this: over this many characters every symbol should appear at least once.
  const seen = new Set();
  for (let i = 0; i < 5000; i++) {
    for (const char of generateTicketId().slice(1)) seen.add(char);
  }
  assert.equal(seen.size, ALPHABET.length);
});
