import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  handleMessage,
  FALLBACK_REPLY,
} from '../../src/services/chatbot/chatbotService.js';

/**
 * Phase 8 - chatbot orchestration (routing, tool execution, fallback), tested via dependency
 * injection rather than mocking the ESM `llmProvider` module directly - `handleMessage`
 * accepts an optional `{complete}` override, defaulting to the real provider for production
 * callers. No network, no DB: only `answer_faq` (pure, no DB) is exercised here;
 * `search_events`/`get_event_details` are covered by the DB-gated integration test.
 */

test('an empty message short-circuits without calling the model', async () => {
  let called = false;
  const complete = async () => {
    called = true;
    return { reply: 'x', toolCall: null };
  };
  const result = await handleMessage({ message: '   ' }, { complete });
  assert.equal(called, false);
  assert.match(result.reply, /events|tickets|TicketFlow/i);
  assert.equal(result.toolUsed, null);
});

test("no tool call: returns the model's reply directly", async () => {
  const complete = async () => ({
    reply: 'Hi! How can I help?',
    toolCall: null,
  });
  const result = await handleMessage({ message: 'hello' }, { complete });
  assert.equal(result.reply, 'Hi! How can I help?');
  assert.equal(result.toolUsed, null);
});

test('a tool call executes the tool and asks the model for a final answer', async () => {
  const calls = [];
  const complete = async (req) => {
    calls.push(req);
    if (calls.length === 1) {
      return {
        reply: null,
        toolCall: { id: 'call_1', name: 'answer_faq', args: {} },
      };
    }
    return { reply: 'You can pay via Paystack.', toolCall: null };
  };

  const result = await handleMessage(
    { message: 'how do I pay?' },
    { complete },
  );

  assert.equal(result.reply, 'You can pay via Paystack.');
  assert.equal(result.toolUsed, 'answer_faq');
  assert.equal(
    calls.length,
    2,
    'one call to route, one to phrase the final answer',
  );

  // The second call must carry the tool's real result back to the model, not re-ask blind.
  const toolMessage = calls[1].messages.find((m) => m.role === 'tool');
  assert.ok(toolMessage, 'a tool-result message was included');
  const parsed = JSON.parse(toolMessage.content);
  assert.ok(Array.isArray(parsed.faqs) && parsed.faqs.length > 0);

  // Second call must not offer tools again - one hop only, no chained calls.
  assert.deepEqual(calls[1].tools, []);
});

test('the model failing on the routing call returns the graceful fallback', async () => {
  const complete = async () => {
    throw new Error('OpenAI and Gemini both down');
  };
  const result = await handleMessage({ message: 'anything' }, { complete });
  assert.equal(result.reply, FALLBACK_REPLY);
  assert.equal(result.toolUsed, null);
});

test('the model failing on the final-answer call still reports which tool ran', async () => {
  let callCount = 0;
  const complete = async () => {
    callCount++;
    if (callCount === 1) {
      return {
        reply: null,
        toolCall: { id: 'c1', name: 'answer_faq', args: {} },
      };
    }
    throw new Error('down on the second call');
  };
  const result = await handleMessage({ message: 'refund?' }, { complete });
  assert.equal(result.reply, FALLBACK_REPLY);
  assert.equal(
    result.toolUsed,
    'answer_faq',
    'we know which tool ran even though phrasing failed',
  );
});

test('conversation history is forwarded and capped by the caller, not silently dropped', async () => {
  const history = [
    { role: 'user', content: 'hi' },
    { role: 'assistant', content: 'hello!' },
  ];
  let seenMessages;
  const complete = async (req) => {
    seenMessages = req.messages;
    return { reply: 'ok', toolCall: null };
  };
  await handleMessage({ message: 'follow up', history }, { complete });
  assert.equal(seenMessages.length, 3);
  assert.equal(seenMessages.at(-1).content, 'follow up');
});
