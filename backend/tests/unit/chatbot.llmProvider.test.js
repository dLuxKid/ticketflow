import { test, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import {
  callOpenAI,
  callGemini,
  complete,
  __setFetchForTesting,
} from '../../src/services/chatbot/llmProvider.js';

/**
 * Phase 8 - LLM provider adapters. No network: a fake `fetch` returns canned responses
 * shaped exactly like each provider's documented API, so this proves the request/response
 * translation is correct without needing real API keys or hitting a paid endpoint. This is
 * the part most likely to have a bug, since it can't be exercised end-to-end without live
 * keys - see the eval script / integration self-skip note for the live-key-gated coverage.
 */

const fakeResponse = (body, ok = true, status = 200) => ({
  ok,
  status,
  json: async () => body,
  text: async () => JSON.stringify(body),
});

let originalEnv;

before(() => {
  originalEnv = {
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    GEMINI_API_KEY: process.env.GEMINI_API_KEY,
  };
});

after(() => {
  process.env.OPENAI_API_KEY = originalEnv.OPENAI_API_KEY;
  process.env.GEMINI_API_KEY = originalEnv.GEMINI_API_KEY;
  __setFetchForTesting(null); // restore real fetch
});

beforeEach(() => {
  process.env.OPENAI_API_KEY = 'test-openai-key';
  process.env.GEMINI_API_KEY = 'test-gemini-key';
});

test('callOpenAI returns a tool call when the model requests one', async () => {
  __setFetchForTesting(async () =>
    fakeResponse({
      choices: [
        {
          message: {
            role: 'assistant',
            content: null,
            tool_calls: [
              {
                id: 'call_abc123',
                type: 'function',
                function: { name: 'answer_faq', arguments: '{}' },
              },
            ],
          },
        },
      ],
    }),
  );

  const result = await callOpenAI({
    system: 'sys',
    messages: [{ role: 'user', content: 'help' }],
  });
  assert.equal(result.reply, null);
  assert.deepEqual(result.toolCall, {
    id: 'call_abc123',
    name: 'answer_faq',
    args: {},
  });
});

test('callOpenAI returns plain text when no tool call is made', async () => {
  __setFetchForTesting(async () =>
    fakeResponse({
      choices: [
        { message: { role: 'assistant', content: 'Hello! How can I help?' } },
      ],
    }),
  );

  const result = await callOpenAI({
    system: 'sys',
    messages: [{ role: 'user', content: 'hi' }],
  });
  assert.equal(result.reply, 'Hello! How can I help?');
  assert.equal(result.toolCall, null);
});

test('callOpenAI parses tool-call arguments as JSON', async () => {
  __setFetchForTesting(async () =>
    fakeResponse({
      choices: [
        {
          message: {
            tool_calls: [
              {
                id: 'call_1',
                function: {
                  name: 'search_events',
                  arguments: '{"city":"Lagos"}',
                },
              },
            ],
          },
        },
      ],
    }),
  );

  const result = await callOpenAI({ system: 'sys', messages: [] });
  assert.deepEqual(result.toolCall.args, { city: 'Lagos' });
});

test('callOpenAI throws when the key is missing (no network attempted)', async () => {
  process.env.OPENAI_API_KEY = '';
  __setFetchForTesting(async () => {
    throw new Error('should not be called');
  });
  await assert.rejects(() => callOpenAI({ system: 's', messages: [] }));
});

test('callOpenAI throws on a non-2xx response', async () => {
  __setFetchForTesting(async () =>
    fakeResponse({ error: 'rate limited' }, false, 429),
  );
  await assert.rejects(() => callOpenAI({ system: 's', messages: [] }));
});

test('callGemini returns a tool call when the model requests one', async () => {
  __setFetchForTesting(async () =>
    fakeResponse({
      candidates: [
        {
          content: {
            role: 'model',
            parts: [
              {
                functionCall: {
                  name: 'search_events',
                  args: { city: 'Lagos' },
                },
              },
            ],
          },
        },
      ],
    }),
  );

  const result = await callGemini({
    system: 'sys',
    messages: [{ role: 'user', content: 'events?' }],
  });
  assert.equal(result.reply, null);
  assert.deepEqual(result.toolCall, {
    id: null,
    name: 'search_events',
    args: { city: 'Lagos' },
  });
});

test('callGemini returns plain text when no function call is made', async () => {
  __setFetchForTesting(async () =>
    fakeResponse({
      candidates: [
        { content: { role: 'model', parts: [{ text: 'Hi there!' }] } },
      ],
    }),
  );

  const result = await callGemini({
    system: 'sys',
    messages: [{ role: 'user', content: 'hi' }],
  });
  assert.equal(result.reply, 'Hi there!');
  assert.equal(result.toolCall, null);
});

test('callGemini throws when the key is missing', async () => {
  process.env.GEMINI_API_KEY = '';
  __setFetchForTesting(async () => {
    throw new Error('should not be called');
  });
  await assert.rejects(() => callGemini({ system: 's', messages: [] }));
});

test('complete() falls back to Gemini when OpenAI fails', async () => {
  let callCount = 0;
  __setFetchForTesting(async (url) => {
    callCount++;
    if (typeof url === 'string' && url.includes('openai.com')) {
      return fakeResponse({ error: 'down' }, false, 500);
    }
    return fakeResponse({
      candidates: [{ content: { parts: [{ text: 'from gemini' }] } }],
    });
  });

  const result = await complete({
    system: 's',
    messages: [{ role: 'user', content: 'hi' }],
  });
  assert.equal(result.reply, 'from gemini');
  assert.equal(callCount, 2, 'tried OpenAI once, then Gemini once');
});

test('complete() succeeds via OpenAI without ever calling Gemini', async () => {
  let geminiCalled = false;
  __setFetchForTesting(async (url) => {
    if (typeof url === 'string' && url.includes('generativelanguage'))
      geminiCalled = true;
    return fakeResponse({ choices: [{ message: { content: 'from openai' } }] });
  });

  const result = await complete({
    system: 's',
    messages: [{ role: 'user', content: 'hi' }],
  });
  assert.equal(result.reply, 'from openai');
  assert.equal(geminiCalled, false);
});

test('complete() throws a combined error when both providers fail', async () => {
  __setFetchForTesting(async () => fakeResponse({ error: 'down' }, false, 500));
  await assert.rejects(
    () => complete({ system: 's', messages: [] }),
    (err) => /Both LLM providers failed/.test(err.message),
  );
});
