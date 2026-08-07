/**
 * Evaluates nlQuery/intentParser.js against the held-out set in
 * tests/fixtures/nlQueryEvalSet.js and prints exact-match accuracy on the structured
 * intent (action/status/vipOnly) - the deterministic, offline-checkable analogue of what a
 * hosted-LLM parser would be graded on for this feature.
 *
 * Run: node scripts/eval-nlquery.js
 */
import { parseQuestion } from '../src/services/nlQuery/intentParser.js';
import { NL_QUERY_EVAL_SET } from '../tests/fixtures/nlQueryEvalSet.js';

const sameIntent = (a, b) => {
  if (a === null || b === null) return a === b;
  return (
    a.action === b.action && a.status === b.status && a.vipOnly === b.vipOnly
  );
};

let correct = 0;
const misses = [];

for (const { q, expected } of NL_QUERY_EVAL_SET) {
  const actual = parseQuestion(q);
  if (sameIntent(actual, expected)) correct++;
  else misses.push({ q, expected, actual });
}

const accuracy = correct / NL_QUERY_EVAL_SET.length;

console.log('Natural-language guest-query evaluation');
console.log('========================================');
console.log(`Questions: ${NL_QUERY_EVAL_SET.length}`);
console.log(`Correct:   ${correct}`);
console.log(
  `Accuracy:  ${accuracy.toFixed(3)} (exact-match on {action, status, vipOnly})`,
);
console.log();

if (misses.length > 0) {
  console.log(`Misclassified (${misses.length}):`);
  for (const m of misses) {
    console.log(
      `  "${m.q}" → expected ${JSON.stringify(m.expected)} got ${JSON.stringify(m.actual)}`,
    );
  }
} else {
  console.log('No misclassifications on this held-out set.');
}
