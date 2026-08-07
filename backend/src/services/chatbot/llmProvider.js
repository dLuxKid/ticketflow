/**
 * Provider-agnostic LLM client (Phase 8) - OpenAI primary, Gemini fallback.
 *
 * One shape in, one shape out, regardless of which provider actually answers:
 *   complete({ system, messages, tools }) -> { reply: string|null, toolCall: {id,name,args}|null }
 *
 * Plain `fetch` (global since Node 20) against each provider's REST endpoint, not their
 * SDKs - this codebase already hand-rolls its third-party integrations (paystack.js's HMAC
 * check, generateQrCode.js) rather than pulling in a dependency for single-endpoint usage,
 * and two REST calls don't justify two new packages.
 *
 * Fallback is a single retry, not a circuit breaker: if `callOpenAI` throws (network error,
 * non-2xx, missing key), `complete` immediately retries the same request once against
 * `callGemini`. One attempt per provider keeps worst-case latency bounded - this is not a
 * health-checked, load-balanced multi-provider router, just "the primary is down right now,
 * try the other one."
 *
 * `messages` is a small generic shape both adapters translate to/from their own wire format:
 *   { role: 'user'|'assistant', content: string }
 *   { role: 'assistant', toolCall: { id, name, args } }        - a model's tool-call turn
 *   { role: 'tool', toolCallId, name, content: string }        - that tool's JSON result
 * `toolCallId` is OpenAI's `tool_call_id` (needed to pair a result with its call); Gemini
 * has no such id and matches by `name` instead - the shape carries both so either adapter
 * can take what it needs, regardless of which provider produced the earlier turn.
 */

// Overridable so tests can inject a fake without touching global fetch.
let fetchImpl = fetch;
export const __setFetchForTesting = (fn) => {
  fetchImpl = fn ?? fetch;
};

const OPENAI_URL = 'https://api.openai.com/v1/chat/completions';
const GEMINI_URL = (model) =>
  `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

// ─── OpenAI adapter ──────────────────────────────────────────────────────────────

const toOpenAIMessages = (system, messages) => [
  { role: 'system', content: system },
  ...messages.map((m) => {
    if (m.role === 'assistant' && m.toolCall) {
      return {
        role: 'assistant',
        content: null,
        tool_calls: [
          {
            id: m.toolCall.id,
            type: 'function',
            function: {
              name: m.toolCall.name,
              arguments: JSON.stringify(m.toolCall.args ?? {}),
            },
          },
        ],
      };
    }
    if (m.role === 'tool') {
      return { role: 'tool', tool_call_id: m.toolCallId, content: m.content };
    }
    return { role: m.role, content: m.content };
  }),
];

const toOpenAITools = (tools) =>
  tools.map((t) => ({
    type: 'function',
    function: {
      name: t.name,
      description: t.description,
      parameters: t.parameters,
    },
  }));

/** @returns {Promise<{reply: string|null, toolCall: object|null}>} */
export const callOpenAI = async ({ system, messages, tools }) => {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error('OPENAI_API_KEY is not set');

  const res = await fetchImpl(OPENAI_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      messages: toOpenAIMessages(system, messages),
      ...(tools?.length ? { tools: toOpenAITools(tools) } : {}),
    }),
  });

  if (!res.ok) {
    throw new Error(
      `OpenAI request failed: ${res.status} ${await res.text().catch(() => '')}`,
    );
  }

  const data = await res.json();
  const message = data.choices?.[0]?.message;
  const toolCall = message?.tool_calls?.[0];

  if (toolCall) {
    return {
      reply: null,
      toolCall: {
        id: toolCall.id,
        name: toolCall.function.name,
        args: JSON.parse(toolCall.function.arguments || '{}'),
      },
    };
  }
  return { reply: message?.content ?? null, toolCall: null };
};

// ─── Gemini adapter ──────────────────────────────────────────────────────────────

const toGeminiContents = (messages) =>
  messages.map((m) => {
    if (m.role === 'assistant' && m.toolCall) {
      return {
        role: 'model',
        parts: [
          {
            functionCall: {
              name: m.toolCall.name,
              args: m.toolCall.args ?? {},
            },
          },
        ],
      };
    }
    if (m.role === 'tool') {
      let response;
      try {
        response = JSON.parse(m.content);
      } catch {
        response = { result: m.content };
      }
      return {
        role: 'function',
        parts: [{ functionResponse: { name: m.name, response } }],
      };
    }
    return {
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    };
  });

const toGeminiTools = (tools) => [
  {
    functionDeclarations: tools.map((t) => ({
      name: t.name,
      description: t.description,
      parameters: t.parameters,
    })),
  },
];

/** @returns {Promise<{reply: string|null, toolCall: object|null}>} */
export const callGemini = async ({ system, messages, tools }) => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY is not set');
  // "-latest" alias, not a pinned version: free-tier API keys can have zero quota granted
  // against a specific pinned model (e.g. gemini-2.0-flash) while the -latest alias for the
  // same family works fine - confirmed against a real key during Phase 8 development.
  const model = process.env.GEMINI_MODEL || 'gemini-flash-latest';

  const res = await fetchImpl(`${GEMINI_URL(model)}?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: system }] },
      contents: toGeminiContents(messages),
      ...(tools?.length ? { tools: toGeminiTools(tools) } : {}),
    }),
  });

  if (!res.ok) {
    throw new Error(
      `Gemini request failed: ${res.status} ${await res.text().catch(() => '')}`,
    );
  }

  const data = await res.json();
  const parts = data.candidates?.[0]?.content?.parts ?? [];
  const functionCallPart = parts.find((p) => p.functionCall);

  if (functionCallPart) {
    // Gemini doesn't hand back a call id - matching is by name (see toGeminiContents' tool
    // role). `id: null` is carried through so a caller pairing this with OpenAI's shape
    // doesn't need a special case.
    return {
      reply: null,
      toolCall: {
        id: null,
        name: functionCallPart.functionCall.name,
        args: functionCallPart.functionCall.args ?? {},
      },
    };
  }

  const textPart = parts.find((p) => typeof p.text === 'string');
  return { reply: textPart?.text ?? null, toolCall: null };
};

// ─── Fallback wrapper ────────────────────────────────────────────────────────────

/**
 * @param {{system: string, messages: Array<object>, tools?: Array<object>}} request
 * @returns {Promise<{reply: string|null, toolCall: object|null}>}
 * @throws when both providers fail
 */
export const complete = async (request) => {
  try {
    return await callOpenAI(request);
  } catch (openaiError) {
    try {
      return await callGemini(request);
    } catch (geminiError) {
      const err = new Error(
        `Both LLM providers failed - OpenAI: ${openaiError.message}; Gemini: ${geminiError.message}`,
      );
      err.cause = { openaiError, geminiError };
      throw err;
    }
  }
};
