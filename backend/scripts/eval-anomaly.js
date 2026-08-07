/**
 * Evaluates anomalyService.detectAnomalies against the labelled synthetic set in
 * tests/fixtures/anomalyCases.js and prints precision/recall/F1 + a confusion matrix.
 *
 * Run: node scripts/eval-anomaly.js
 *
 * This is committed as the LO measurable evidence for the anomaly-detection feature (per
 * the assessment brief's requirement for reported precision/recall/F1 + confusion matrix).
 */
import { detectAnomalies } from '../src/services/anomalyService.js';
import { buildAnomalyEvalSet } from '../tests/fixtures/anomalyCases.js';

const cases = buildAnomalyEvalSet();

let tp = 0;
let fp = 0;
let tn = 0;
let fn = 0;
const misclassified = [];

for (const c of cases) {
  const result = detectAnomalies(c.rows);
  const predicted = result.anomalous;
  const actual = c.label;

  if (predicted && actual) tp++;
  else if (predicted && !actual) {
    fp++;
    misclassified.push({ ...c, predicted, flags: result.flags });
  } else if (!predicted && actual) {
    fn++;
    misclassified.push({ ...c, predicted, flags: result.flags });
  } else tn++;
}

const precision = tp / (tp + fp) || 0;
const recall = tp / (tp + fn) || 0;
const f1 = (2 * precision * recall) / (precision + recall) || 0;

console.log('Anomaly detection evaluation');
console.log('============================');
console.log(`Cases: ${cases.length}`);
console.log();
console.log('Confusion matrix:');
console.log(`                 predicted anomalous   predicted benign`);
console.log(`  actual anomalous     TP=${tp}                 FN=${fn}`);
console.log(`  actual benign        FP=${fp}                 TN=${tn}`);
console.log();
console.log(`Precision: ${precision.toFixed(3)}`);
console.log(`Recall:    ${recall.toFixed(3)}`);
console.log(`F1:        ${f1.toFixed(3)}`);
console.log();
if (misclassified.length > 0) {
  console.log(`Misclassified (${misclassified.length}):`);
  for (const m of misclassified) {
    console.log(
      `  ${m.name}: actual=${m.label} predicted=${m.predicted} flags=[${m.flags.join(',')}]`,
    );
  }
  console.log();
  console.log(
    'Known limitation: "slow_drip_sharing_known_limitation" cases are false negatives by',
  );
  console.log(
    'design - devices arrive further apart than the 5-minute multi-device window, so slow,',
  );
  console.log(
    'deliberate ticket-forwarding over ~10 minutes is not caught. Widening the window would',
  );
  console.log(
    'catch it but risks flagging legitimate late staff re-checks as false positives - a',
  );
  console.log(
    'precision/recall trade-off documented here rather than silently tuned away.',
  );
}
