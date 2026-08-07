import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import Event from '../../src/models/eventModel.js';
import * as eventRepository from '../../src/repositories/eventRepository.js';
import { connect, disconnect, buildEvent, skipReason } from '../helpers/db.js';

/**
 * Phase 0.1 - proves the oversell race is closed.
 *
 * Two buyers race for the single remaining ticket. Because reserveTicketInventory issues
 * a guarded atomic $inc (single-document, so it can't interleave), exactly one succeeds
 * and quantity lands at 0 - never negative, never double-sold. This test would FAIL
 * against the old read-then-write createBooking.
 */

if (skipReason) {
  test(
    'inventory reservation (DB integration)',
    { skip: skipReason },
    () => {},
  );
} else {
  let eventId;

  before(async () => {
    await connect();
  });

  after(async () => {
    await Event.deleteMany({ eventName: 'Test Event' });
    await disconnect();
  });

  test('two concurrent reservations of the last ticket → exactly one succeeds', async () => {
    const event = await Event.create(buildEvent()); // ticketQuantity: 1
    eventId = event._id;

    const [a, b] = await Promise.all([
      eventRepository.reserveTicketInventory(eventId, 'General', 1),
      eventRepository.reserveTicketInventory(eventId, 'General', 1),
    ]);

    const successes = [a, b].filter(Boolean);
    assert.equal(successes.length, 1, 'exactly one reservation should succeed');

    const fresh = await Event.findById(eventId);
    const tier = fresh.ticketDetails.find((t) => t.ticketName === 'General');
    assert.equal(tier.ticketQuantity, 0, 'quantity must not go negative');
    assert.equal(
      fresh.numberOfAttendees,
      1,
      'attendee count reflects one sale',
    );
  });

  test('reservation for more tickets than remain fails without mutating', async () => {
    const event = await Event.create(
      buildEvent({
        ticketDetails: [
          { ticketName: 'General', ticketPrice: 100, ticketQuantity: 2 },
        ],
      }),
    );

    const result = await eventRepository.reserveTicketInventory(
      event._id,
      'General',
      5,
    );
    assert.equal(result, null, 'over-reservation returns null');

    const fresh = await Event.findById(event._id);
    const tier = fresh.ticketDetails.find((t) => t.ticketName === 'General');
    assert.equal(
      tier.ticketQuantity,
      2,
      'quantity unchanged on failed reserve',
    );
  });
}
