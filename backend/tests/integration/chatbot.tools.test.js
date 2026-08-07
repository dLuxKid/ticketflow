import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import Event from '../../src/models/eventModel.js';
import {
  handleMessage,
  FALLBACK_REPLY,
} from '../../src/services/chatbot/chatbotService.js';
import { connect, disconnect, buildEvent, skipReason } from '../helpers/db.js';

/**
 * Phase 8 - the search_events/get_event_details tools execute against real data, not
 * invented answers. Driven through handleMessage with an injected `complete` that requests
 * each tool, so this proves the same wiring a real LLM response would trigger, without
 * needing live API keys (see chatbot.llmProvider.test.js / chatbot.service.test.js for the
 * network-free coverage of the parts that don't need a database).
 */

if (skipReason) {
  test('chatbot tools (DB integration)', { skip: skipReason }, () => {});
} else {
  let owner;
  let event;

  before(async () => {
    await connect();
    owner = { _id: new mongoose.Types.ObjectId(), role: 'creator' };
    event = await Event.create(
      buildEvent({
        user: owner._id,
        eventName: 'Chatbot Tool Test Concert',
        eventCategory: 'Music',
        eventLocation: {
          address: '1 Test St',
          city: 'Lagos',
          state: 'Lagos',
          country: 'Nigeria',
        },
      }),
    );
  });

  after(async () => {
    await Event.deleteMany({
      eventName: { $in: ['Test Event', 'Chatbot Tool Test Concert'] },
    });
    await disconnect();
  });

  test('search_events returns the real seeded event, not an invented one', async () => {
    let toolResultSeen;
    const complete = async (req) => {
      if (req.messages.some((m) => m.role === 'tool')) {
        toolResultSeen = JSON.parse(
          req.messages.find((m) => m.role === 'tool').content,
        );
        return {
          reply: `Found ${toolResultSeen.events.length} event(s) in Lagos.`,
          toolCall: null,
        };
      }
      return {
        reply: null,
        toolCall: { id: 'c1', name: 'search_events', args: { city: 'Lagos' } },
      };
    };

    const result = await handleMessage(
      { message: 'find events in Lagos' },
      { complete },
    );

    assert.equal(result.toolUsed, 'search_events');
    assert.ok(toolResultSeen.events.some((e) => e.slug === event.slug));
    assert.match(result.reply, /Found \d+ event/);
  });

  test('get_event_details returns real venue/ticket data for the given slug', async () => {
    let toolResultSeen;
    const complete = async (req) => {
      if (req.messages.some((m) => m.role === 'tool')) {
        toolResultSeen = JSON.parse(
          req.messages.find((m) => m.role === 'tool').content,
        );
        return { reply: 'Here are the details.', toolCall: null };
      }
      return {
        reply: null,
        toolCall: {
          id: 'c1',
          name: 'get_event_details',
          args: { slug: event.slug },
        },
      };
    };

    const result = await handleMessage(
      { message: `tell me about ${event.slug}` },
      { complete },
    );

    assert.equal(result.toolUsed, 'get_event_details');
    assert.equal(toolResultSeen.name, 'Chatbot Tool Test Concert');
    assert.equal(toolResultSeen.venue.city, 'Lagos');
    assert.ok(Array.isArray(toolResultSeen.ticketTiers));
  });

  test('get_event_details on a non-existent slug degrades gracefully, not a crash', async () => {
    // eventService.getEventBySlug throws a 404 AppError for an unknown slug.
    // executeTool's try/catch turns that into a {error} tool result instead of letting it
    // propagate - the model still gets a second turn to phrase something sensible from it,
    // rather than the whole request blowing up with a raw 404.
    let toolResultSeen;
    const complete = async (req) => {
      if (req.messages.some((m) => m.role === 'tool')) {
        toolResultSeen = JSON.parse(
          req.messages.find((m) => m.role === 'tool').content,
        );
        return {
          reply: "I couldn't find that event - could you check the name?",
          toolCall: null,
        };
      }
      return {
        reply: null,
        toolCall: {
          id: 'c1',
          name: 'get_event_details',
          args: { slug: 'no-such-event' },
        },
      };
    };

    const result = await handleMessage(
      { message: 'tell me about no-such-event' },
      { complete },
    );

    assert.ok(
      toolResultSeen.error,
      'the 404 became a tool result, not a thrown exception',
    );
    assert.notEqual(
      result.reply,
      FALLBACK_REPLY,
      'the model still got to phrase a real answer',
    );
    assert.equal(result.toolUsed, 'get_event_details');
  });
}
