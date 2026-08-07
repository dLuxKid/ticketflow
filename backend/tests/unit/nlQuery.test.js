import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseQuestion } from '../../src/services/nlQuery/intentParser.js';
import { executeQuery } from '../../src/services/nlQuery/executeQuery.js';
import { NL_QUERY_EVAL_SET } from '../fixtures/nlQueryEvalSet.js';

/**
 * Phase 5 - natural-language guest queries. Hand-picked cases for the parser and executor,
 * plus a regression guard on the full held-out set so a future regex change can't silently
 * drop accuracy. Full report: `node scripts/eval-nlquery.js`.
 */

test('parses "who hasn\'t arrived"', () => {
  assert.deepEqual(parseQuestion("who hasn't arrived"), {
    action: 'list',
    status: 'not_admitted',
    vipOnly: false,
  });
});

test('parses a VIP-scoped count question', () => {
  assert.deepEqual(parseQuestion('how many VIPs have arrived'), {
    action: 'count',
    status: 'admitted',
    vipOnly: true,
  });
});

test('recognises "checked in" as an arrival synonym, negated or not', () => {
  assert.equal(parseQuestion('who checked in')?.status, 'admitted');
  assert.equal(
    parseQuestion("which guests haven't checked in")?.status,
    'not_admitted',
  );
});

test('declines an out-of-domain question rather than guessing', () => {
  assert.equal(parseQuestion('what is the weather like tonight'), null);
});

test('declines empty or whitespace-only input', () => {
  assert.equal(parseQuestion(''), null);
  assert.equal(parseQuestion('   '), null);
  assert.equal(parseQuestion(undefined), null);
});

test('executeQuery filters by status and vip, and counts match the list length', () => {
  const guests = [
    { name: 'Ada', vip: true, booking: { status: 'admitted' } },
    { name: 'Bo', vip: false, booking: { status: 'issued' } },
    { name: 'Cy', vip: true, booking: { status: 'issued' } },
  ];

  const notArrived = executeQuery(
    { action: 'list', status: 'not_admitted', vipOnly: false },
    guests,
  );
  assert.equal(notArrived.count, 2);
  assert.deepEqual(
    notArrived.matched.map((g) => g.name),
    ['Bo', 'Cy'],
  );

  const vipNotArrived = executeQuery(
    { action: 'count', status: 'not_admitted', vipOnly: true },
    guests,
  );
  assert.equal(vipNotArrived.count, 1);

  const allGuests = executeQuery(
    { action: 'list', status: 'any', vipOnly: false },
    guests,
  );
  assert.equal(allGuests.count, 3);
});

test('executeQuery treats a missing booking as not admitted', () => {
  const result = executeQuery(
    { action: 'list', status: 'not_admitted', vipOnly: false },
    [{ name: 'NoBooking', vip: false }],
  );
  assert.equal(result.count, 1);
});

test('regression guard: full held-out set stays at reported accuracy', () => {
  const sameIntent = (a, b) => {
    if (a === null || b === null) return a === b;
    return (
      a.action === b.action && a.status === b.status && a.vipOnly === b.vipOnly
    );
  };

  const correct = NL_QUERY_EVAL_SET.filter(({ q, expected }) =>
    sameIntent(parseQuestion(q), expected),
  ).length;
  const accuracy = correct / NL_QUERY_EVAL_SET.length;

  // Bound set at the measured 1.000 (see scripts/eval-nlquery.js) - this test fails before
  // a report or demo would silently show a regression.
  assert.ok(accuracy >= 0.95, `accuracy dropped: ${accuracy}`);
});
