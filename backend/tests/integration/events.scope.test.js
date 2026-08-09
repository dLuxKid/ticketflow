import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import Event from '../../src/models/eventModel.js';
import * as eventService from '../../src/services/eventService.js';
import { connect, disconnect, buildEvent, skipReason } from '../helpers/db.js';

/**
 * "My events" scoping.
 *
 * An admin previously received *every* event here with no way to narrow it, so the events
 * they personally organise were buried among everyone else's and the page's own heading
 * ("Events you created") was wrong for them. The scope is now explicit — and, importantly,
 * asking for it is not the same as being allowed it.
 */

if (skipReason) {
  test('event scope (DB integration)', { skip: skipReason }, () => {});
} else {
  const admin = { _id: new mongoose.Types.ObjectId(), role: 'admin' };
  const organiser = { _id: new mongoose.Types.ObjectId(), role: 'creator' };

  before(async () => {
    await connect();
    await Event.create(
      buildEvent({ eventName: 'Scope Admin Event', user: admin._id }),
    );
    await Event.create(
      buildEvent({ eventName: 'Scope Organiser Event', user: organiser._id }),
    );
  });

  after(async () => {
    await Event.deleteMany({
      eventName: { $in: ['Scope Admin Event', 'Scope Organiser Event'] },
    });
    await disconnect();
  });

  const names = (events) => events.map((e) => e.eventName);

  test('an admin defaults to only their own events', async () => {
    // The default matters: the page asks "what did I organise", so that must be the answer
    // without the caller having to opt out of seeing the whole platform.
    const events = await eventService.getMyEvents(admin, {});
    const found = names(events);

    assert.ok(found.includes('Scope Admin Event'));
    assert.ok(!found.includes('Scope Organiser Event'));
  });

  test('an admin can explicitly widen to every event', async () => {
    const events = await eventService.getMyEvents(admin, {}, { scope: 'all' });
    const found = names(events);

    assert.ok(found.includes('Scope Admin Event'));
    assert.ok(found.includes('Scope Organiser Event'));
  });

  test('a non-admin asking for scope "all" still gets only their own', async () => {
    // The parameter is ignored rather than honoured — otherwise any organiser could read
    // the whole platform's event list by adding a query string.
    const events = await eventService.getMyEvents(
      organiser,
      {},
      { scope: 'all' },
    );
    const found = names(events);

    assert.ok(found.includes('Scope Organiser Event'));
    assert.ok(
      !found.includes('Scope Admin Event'),
      "an organiser must not see another organiser's event",
    );
  });
}
