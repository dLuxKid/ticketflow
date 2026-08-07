/**
 * Evaluates the chatbot's tool-selection against the held-out set in
 * tests/fixtures/chatbotEvalSet.js and prints accuracy - "did the LLM pick the right tool
 * (or correctly pick none)". This is the one eval in the repo that needs a real hosted LLM
 * to mean anything: unlike nlQuery's exact-match (a deterministic parser) or anomaly's
 * precision/recall/F1 (a numeric classifier), there is no rule-based stand-in for "did the
 * model route correctly" - a stubbed provider would just replay whatever this script
 * hardcoded, which isn't an evaluation of anything.
 *
 * Self-skips (exit 0, not a failure) if neither OPENAI_API_KEY nor GEMINI_API_KEY is
 * configured - same convention as the MONGO_TEST_URI-gated integration tests: no keys, no
 * claim of a result.
 *
 * Run: node scripts/eval-chatbot.js
 */
import dotenv from 'dotenv';
dotenv.config({ path: './config.env' });

import { complete } from '../src/services/chatbot/llmProvider.js';
import {
  SYSTEM_PROMPT,
  TOOLS,
} from '../src/services/chatbot/chatbotService.js';
import { CHATBOT_EVAL_SET } from '../tests/fixtures/chatbotEvalSet.js';

if (!process.env.OPENAI_API_KEY && !process.env.GEMINI_API_KEY) {
  console.warn(
    'Skipping chatbot eval: set OPENAI_API_KEY and/or GEMINI_API_KEY in config.env to run it.',
  );
  process.exit(0);
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Free-tier keys (confirmed against a real Gemini key during Phase 8 development) can cap
// at 5 requests/minute per model - comfortably under that, not just under the total-request
// quota, since this script fires sequentially and has nothing else to batch against.
const REQUEST_SPACING_MS = 13_000;

let correct = 0;
const misses = [];

for (const [i, { message, expectedTool }] of CHATBOT_EVAL_SET.entries()) {
  if (i > 0) await sleep(REQUEST_SPACING_MS);

  let actualTool = null;
  try {
    const result = await complete({
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: message }],
      tools: TOOLS,
    });
    actualTool = result.toolCall?.name ?? null;
  } catch (err) {
    actualTool = `<error: ${err.message.split('\n')[0]}>`;
  }

  if (actualTool === expectedTool) correct++;
  else misses.push({ message, expectedTool, actualTool });

  process.stdout.write(actualTool === expectedTool ? '.' : 'x');
}
console.log('\n');

const accuracy = correct / CHATBOT_EVAL_SET.length;

console.log('Chatbot tool-selection evaluation');
console.log('==================================');
console.log(`Messages:  ${CHATBOT_EVAL_SET.length}`);
console.log(`Correct:   ${correct}`);
console.log(`Accuracy:  ${accuracy.toFixed(3)}`);
console.log();

if (misses.length > 0) {
  console.log(`Misrouted (${misses.length}):`);
  for (const m of misses) {
    console.log(
      `  "${m.message}" → expected ${m.expectedTool ?? '(no tool)'} got ${m.actualTool ?? '(no tool)'}`,
    );
  }
} else {
  console.log('No misroutes on this held-out set.');
}
