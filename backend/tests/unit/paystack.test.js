import { test } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'crypto';
import { isValidPaystackSignature } from '../../src/shared/utils/paystack.js';

/**
 * Phase 0.3 - proves the webhook signature verifier accepts genuine Paystack signatures
 * and rejects everything else. This is what makes payment state server-authoritative
 * instead of trusting a client-reported status.
 */

const SECRET = 'sk_test_example_secret';
const body = Buffer.from(
  JSON.stringify({ event: 'charge.success', data: { reference: 'ref_123' } }),
);

const sign = (buf, secret) =>
  crypto.createHmac('sha512', secret).update(buf).digest('hex');

test('accepts a correctly signed body', () => {
  const signature = sign(body, SECRET);
  assert.equal(isValidPaystackSignature(body, signature, SECRET), true);
});

test('rejects a body signed with the wrong secret', () => {
  const signature = sign(body, 'wrong_secret');
  assert.equal(isValidPaystackSignature(body, signature, SECRET), false);
});

test('rejects a tampered body', () => {
  const signature = sign(body, SECRET);
  const tampered = Buffer.from(
    JSON.stringify({ event: 'charge.success', data: { reference: 'ref_999' } }),
  );
  assert.equal(isValidPaystackSignature(tampered, signature, SECRET), false);
});

test('rejects a missing signature', () => {
  assert.equal(isValidPaystackSignature(body, undefined, SECRET), false);
  assert.equal(isValidPaystackSignature(body, '', SECRET), false);
});

test('rejects a signature of the wrong length (no length-leak throw)', () => {
  assert.equal(isValidPaystackSignature(body, 'abc', SECRET), false);
});

test('rejects when secret key is missing', () => {
  const signature = sign(body, SECRET);
  assert.equal(isValidPaystackSignature(body, signature, undefined), false);
});
