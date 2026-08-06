import * as llmProvider from './llmProvider.js';
import * as eventService from '../eventService.js';
import { faqs } from '../../assets/faqs.js';

/**
 * AI concierge chatbot (Phase 8): natural-language event discovery, per-event Q&A, and
 * general site help, backed by a hosted LLM through llmProvider's OpenAI/Gemini split.
 *
 * The model is never the source of truth for event data — it picks a tool via
 * function-calling, this service executes it against the real repositories/services, and
 * the model only phrases the final answer from real results. One function-calling round
 * trip (route -> execute -> final answer), not a multi-hop agent loop — enough for three
 * narrow tools, and keeps latency/cost bounded.
 */

// Exported so scripts/eval-chatbot.js routes against the exact same prompt/tool schema
// production uses — an eval against a slightly different config wouldn't mean anything.
export const SYSTEM_PROMPT = `You are the TicketFlow concierge, a helpful assistant for an event
ticketing platform. You can search for public events, look up details on one specific
event by its slug, and answer frequently asked questions about how TicketFlow works
(payment, refunds, missing tickets, etc). Use a tool when the user's question needs real
data; answer directly for greetings or chit-chat. Never invent event details, prices, or
dates that a tool didn't return. Keep replies short and conversational.`;

export const TOOLS = [
  {
    name: 'search_events',
    description:
      'Search public (non invite-only) events by category, city, and/or name. Returns a short list.',
    parameters: {
      type: 'object',
      properties: {
        category: {
          type: 'string',
          description: 'Event category, e.g. Music, Tech, Sports',
        },
        city: { type: 'string', description: 'City the event is held in' },
        name: { type: 'string', description: 'Event name, or part of it' },
      },
    },
  },
  {
    name: 'get_event_details',
    description:
      'Get venue, dates, ticket tiers/prices, and refund policy for one specific event by its slug (from a prior search_events result).',
    parameters: {
      type: 'object',
      properties: { slug: { type: 'string', description: 'The event slug' } },
      required: ['slug'],
    },
  },
  {
    name: 'answer_faq',
    description:
      "Look up TicketFlow's site FAQ (how to pay, refunds, missing tickets, wrong email, how to create an event).",
    parameters: { type: 'object', properties: {} },
  },
];

/** Compact projection — small enough for a chat reply, no internal/organiser-only fields. */
const summarizeEvent = (event) => ({
  name: event.eventName,
  slug: event.slug,
  city: event.eventLocation?.city,
  startDate: event.startDate,
});

const executeTool = async (name, args = {}) => {
  switch (name) {
    case 'search_events': {
      const events = await eventService.searchEvents(args);
      return { events: events.map(summarizeEvent) };
    }
    case 'get_event_details': {
      const event = await eventService.getEventBySlug(args.slug);
      return {
        name: event.eventName,
        description: event.eventDescription,
        venue: event.eventLocation,
        startDate: event.startDate,
        endDate: event.endDate,
        accessMode: event.accessMode,
        refundPolicy: event.refundPolicy,
        ticketTiers: (event.ticketDetails ?? []).map((t) => ({
          name: t.ticketName,
          price: t.ticketPrice,
          available: t.ticketQuantity,
        })),
      };
    }
    case 'answer_faq':
      return { faqs };
    default:
      return { error: `Unknown tool: ${name}` };
  }
};

export const FALLBACK_REPLY =
  "Sorry, I'm having trouble answering that right now — please try again in a moment.";

/**
 * @param {{message: string, history?: Array<{role:'user'|'assistant', content:string}>}} input
 * @param {{complete?: typeof llmProvider.complete}} [deps] - injection point for tests;
 *   defaults to the real llmProvider so production callers never pass this.
 * @returns {Promise<{reply: string, toolUsed: string|null}>}
 */
export const handleMessage = async ({ message, history = [] }, deps = {}) => {
  const complete = deps.complete ?? llmProvider.complete;

  if (typeof message !== 'string' || !message.trim()) {
    return {
      reply: 'Ask me about events, tickets, or how TicketFlow works!',
      toolUsed: null,
    };
  }

  const messages = [...history, { role: 'user', content: message.trim() }];

  let first;
  try {
    first = await complete({ system: SYSTEM_PROMPT, messages, tools: TOOLS });
  } catch (err) {
    // The client only ever sees the graceful FALLBACK_REPLY — this is the one place that
    // says why, so a string of these in the logs is diagnosable (quota exhausted, both
    // providers down, a bad key) instead of just "the chatbot doesn't work" with no lead.
    console.error(
      'Chatbot: both LLM providers failed on the routing call:',
      err.message,
    );
    return { reply: FALLBACK_REPLY, toolUsed: null };
  }

  if (!first.toolCall) {
    return { reply: first.reply ?? FALLBACK_REPLY, toolUsed: null };
  }

  // A tool failing (bad/hallucinated argument, a 404 on a slug that doesn't exist, a DB
  // hiccup) is still information the model can phrase gracefully ("I couldn't find that
  // event") — it must not crash the whole request. catchAsync/the controller never see this
  // error; it's folded into the tool result instead of thrown.
  let result;
  try {
    result = await executeTool(first.toolCall.name, first.toolCall.args);
  } catch (err) {
    result = { error: err.message || 'That request could not be completed' };
  }

  let second;
  try {
    second = await complete({
      system: SYSTEM_PROMPT,
      messages: [
        ...messages,
        { role: 'assistant', toolCall: first.toolCall },
        {
          role: 'tool',
          toolCallId: first.toolCall.id,
          name: first.toolCall.name,
          content: JSON.stringify(result),
        },
      ],
      tools: [], // one hop only — no chained tool calls off the tool result
    });
  } catch (err) {
    console.error(
      `Chatbot: both LLM providers failed phrasing the final answer after ${first.toolCall.name}:`,
      err.message,
    );
    return { reply: FALLBACK_REPLY, toolUsed: first.toolCall.name };
  }

  return {
    reply: second.reply ?? FALLBACK_REPLY,
    toolUsed: first.toolCall.name,
  };
};
