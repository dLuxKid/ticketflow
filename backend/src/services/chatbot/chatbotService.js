import * as llmProvider from './llmProvider.js';
import { getEventConditions } from '../weatherService.js';
import * as eventService from '../eventService.js';
import { faqs } from '../../assets/faqs.js';

/**
 * AI concierge chatbot (Phase 8): natural-language event discovery, per-event Q&A, and
 * general site help, backed by a hosted LLM through llmProvider's OpenAI/Gemini split.
 *
 * The model is never the source of truth for event data - it picks a tool via
 * function-calling, this service executes it against the real repositories/services, and
 * the model only phrases the final answer from real results. One function-calling round
 * trip (route -> execute -> final answer), not a multi-hop agent loop - enough for three
 * narrow tools, and keeps latency/cost bounded.
 */

// Exported so scripts/eval-chatbot.js routes against the exact same prompt/tool schema
// production uses - an eval against a slightly different config wouldn't mean anything.
export const SYSTEM_PROMPT = `You are the TicketFlow concierge, a helpful assistant for an event
ticketing platform. You can search for public events, look up details on one specific
event by its slug, check the weather and practical advice for an event, and answer
frequently asked questions about how TicketFlow works (payment, refunds, missing tickets,
etc).

If the user names an event, call get_event_details with that name directly - you do not
need to search first.

When you describe an event, give a COMPLETE picture in one reply, not a bare listing. Cover
what it is, when and where, what tickets cost, and then what the 'conditions' field returns:
the weather forecast for the day, what to wear, and the practical safety notes. If those
notes say the event finishes late, say so explicitly and pass on the advice about arranging
a route home in advance - someone deciding whether to attend needs that before they book,
not after.

For anything about weather, temperature, what to wear, dress code, parking, accessibility,
age limits, or whether an event is safe to attend, answer only from the 'conditions' returned
by get_event_details (or get_event_conditions, which returns the same thing on its own). Never guess a forecast, a dress code, or parking
arrangements - if the tool says no forecast is available, say exactly that. When you pass on
safety notes, present them as practical attendance advice; never imply they are a crime or
neighbourhood-safety rating, because TicketFlow has no such data.

Use a tool when the user's question needs real data; answer directly for greetings or
chit-chat. Never invent event details, prices, or dates that a tool didn't return.

FORMATTING - follow this exactly, because the chat window renders it:

- Open with ONE short sentence answering the question. No preamble like "Sure!" or
  "Great question".
- Then, when you are reporting several facts, put each on its own line as a bullet starting
  with "- ", with a bold label and a colon:
    - **Venue:** The Roundhouse, Main Hall
    - **Date:** 12 Sept 2026, 7:00 PM
    - **Tickets:** General Admission NGN 5,000 - VIP NGN 25,000
- Use **bold** only for those labels and for a figure that matters. Never bold a whole line.
- Separate sections with a blank line. Group related facts: details first, then what to wear,
  then getting there safely.
- Write prices with their currency code and thousands separators (NGN 25,000, not 25000).
  Write dates as "12 Sept 2026" and times as "7:00 PM".
- Never use markdown headings (#), tables, or code blocks - the window cannot render them.
- Keep the whole reply under about 120 words unless the user asks for more. A wall of text is
  unreadable in a small chat panel.

If a fact is missing, say so on its own bullet ("- **Parking:** not specified by the
organiser") rather than omitting the row silently or inventing a value.`;

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
      'Everything known about one specific event: venue, dates and times, ticket tiers and prices, dress code, parking, accessibility, age limit, refund policy, AND the weather forecast for the day plus practical attendance and safety notes. Use this for any general question about an event. Give its name directly - you do not need to search first.',
    parameters: {
      type: 'object',
      properties: {
        slug: { type: 'string', description: 'The event slug, if known' },
        name: {
          type: 'string',
          description:
            'The event name as the user said it, if the slug is unknown',
        },
      },
    },
  },
  {
    name: 'get_event_conditions',
    description:
      "Weather forecast for an event's location and date, plus what to wear and practical safety notes. Use when asked about weather, temperature, what to wear, dress code, parking, accessibility, or whether an event is safe to attend. Give the event name directly - you do not need to search first.",
    parameters: {
      type: 'object',
      properties: {
        slug: { type: 'string', description: 'The event slug, if known' },
        name: {
          type: 'string',
          description:
            'The event name as the user said it, if the slug is unknown',
        },
      },
    },
  },
  {
    name: 'answer_faq',
    description:
      "Look up TicketFlow's site FAQ (how to pay, refunds, missing tickets, wrong email, how to create an event).",
    parameters: { type: 'object', properties: {} },
  },
];

/** Compact projection - small enough for a chat reply, no internal/organiser-only fields. */
const summarizeEvent = (event) => ({
  name: event.eventName,
  slug: event.slug,
  city: event.eventLocation?.city,
  startDate: event.startDate,
});

/**
 * Resolves whichever identifier the model supplied to a single event.
 *
 * Both detail tools accept a name as well as a slug. Requiring a slug meant the model had to
 * call search_events first and use the result in a second call - but the loop runs one
 * function-calling round, so those questions stalled at "let me check…" and never produced
 * an answer. Resolving the name here keeps it to one round.
 */
const resolveEvent = async ({ slug, name }) => {
  if (slug) return eventService.getEventBySlug(slug);
  if (!name?.trim()) throw new Error('No event slug or name supplied');

  const [match] = await eventService.searchEvents({ name: name.trim() });
  if (!match) throw new Error(`No event found matching "${name}"`);
  return match;
};

const executeTool = async (name, args = {}) => {
  switch (name) {
    case 'search_events': {
      const events = await eventService.searchEvents(args);
      return { events: events.map(summarizeEvent) };
    }
    case 'get_event_details': {
      const event = await resolveEvent(args);

      // Conditions are folded into the details response rather than left to a second tool.
      // The loop runs exactly ONE function-calling round, so a model that answered "tell me
      // about X" by calling get_event_details could never then reach get_event_conditions —
      // the reply came back with venue and prices but no forecast, and no safety note about
      // an event finishing at 2am. Asking about an event should surface everything known
      // about attending it, which is what a person means by the question.
      //
      // Fail-soft: the forecast is a third-party call, and Open-Meteo being unreachable must
      // not turn "tell me about this event" into an error. The factual half is local data and
      // always available.
      let conditions = null;
      try {
        conditions = await getEventConditions(event);
      } catch (err) {
        conditions = {
          note: `Weather and attendance advice are unavailable right now (${err.message}).`,
        };
      }

      return {
        name: event.eventName,
        description: event.eventDescription,
        venue: event.eventLocation,
        startDate: event.startDate,
        endDate: event.endDate,
        startTime: event.startTime,
        endTime: event.endTime,
        accessMode: event.accessMode,
        refundPolicy: event.refundPolicy,
        venueName: event.venueName,
        dressCode: event.dressCode,
        parkingInfo: event.parkingInfo,
        accessibilityInfo: event.accessibilityInfo,
        ageRestriction: event.ageRestriction,
        ticketTiers: (event.ticketDetails ?? []).map((t) => ({
          name: t.ticketName,
          price: t.ticketPrice,
          available: t.ticketQuantity,
        })),
        conditions,
      };
    }
    case 'get_event_conditions': {
      const event = await resolveEvent(args);
      return getEventConditions(event);
    }
    case 'answer_faq':
      return { faqs };
    default:
      return { error: `Unknown tool: ${name}` };
  }
};

export const FALLBACK_REPLY =
  "Sorry, I'm having trouble answering that right now - please try again in a moment.";

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
    // The client only ever sees the graceful FALLBACK_REPLY - this is the one place that
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
  // event") - it must not crash the whole request. catchAsync/the controller never see this
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
      tools: [], // one hop only - no chained tool calls off the tool result
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
