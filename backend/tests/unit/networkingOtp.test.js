import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  generateOtp,
  hashOtp,
  verifyOtp,
  OTP_TTL_MS,
} from '../../src/shared/utils/networkingOtp.js';

/**
 * One-time codes are the only thing standing between a stranger and a private event's
 * networking channel, so they are treated as a credential: unguessable, hashed at rest,
 * short-lived, and compared without leaking timing.
 */

const future = () => new Date(Date.now() + OTP_TTL_MS);
const past = () => new Date(Date.now() - 1000);

test('codes are six digits', () => {
  for (let i = 0; i < 200; i++) assert.match(generateOtp(), /^\d{6}$/);
});

test('codes span the full range, including leading zeros', () => {
  const seen = new Set();
  for (let i = 0; i < 4000; i++) seen.add(generateOtp());
  // A generator stuck on a narrow band (or dropping leading zeros to 5 chars) fails this.
  assert.ok(seen.size > 3000, `only ${seen.size} distinct codes in 4000 draws`);
});

test('the plaintext code is never what gets stored', () => {
  const code = generateOtp();
  const hash = hashOtp(code);
  assert.notEqual(hash, code);
  assert.match(hash, /^[0-9a-f]{64}$/);
});

test('a correct code within its window verifies', () => {
  const code = generateOtp();
  assert.equal(verifyOtp(code, hashOtp(code), future()), true);
});

test('a wrong code is rejected', () => {
  const code = generateOtp();
  const wrong = code === '000000' ? '111111' : '000000';
  assert.equal(verifyOtp(wrong, hashOtp(code), future()), false);
});

test('an expired code is rejected even when correct', () => {
  const code = generateOtp();
  assert.equal(verifyOtp(code, hashOtp(code), past()), false);
});

test('missing inputs are rejected rather than throwing', () => {
  const code = generateOtp();
  assert.equal(verifyOtp(undefined, hashOtp(code), future()), false);
  assert.equal(verifyOtp(code, undefined, future()), false);
  assert.equal(verifyOtp(code, hashOtp(code), undefined), false);
  assert.equal(verifyOtp('', '', null), false);
});

test('a malformed stored hash cannot crash the comparison', () => {
  // timingSafeEqual throws on length mismatch - guarded before it is reached.
  assert.equal(verifyOtp('123456', 'deadbeef', future()), false);
});
