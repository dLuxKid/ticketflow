import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import Event from '../../src/models/eventModel.js';
import Booking from '../../src/models/bookingModel.js';
import * as networkingNotificationService from '../../src/services/networkingNotificationService.js';
import { connect, disconnect, buildEvent, skipReason } from '../helpers/db.js';

/**
 * Phase 7 — the event-live notification sweep only fires for events inside their live
 * window, exactly once per event (idempotent). No SMTP is configured under test, so
 * individual sends fail — that must not stop the event from being marked notified, same
 * non-fatal-delivery rule sendInvite.js already established for guest invites.
 */

if (skipReason) {
  test(
    'event-live notification sweep (DB integration)',
    { skip: skipReason },
    () => {},
  );
} else {
  let owner;
  let liveEvent;
  let upcomingEvent;

  before(async () => {
    await connect();
    owner = { _id: new mongoose.Types.ObjectId(), role: 'creator' };

    const now = new Date();
    liveEvent = await Event.create(
      buildEvent({
        user: owner._id,
        startDate: new Date(now.getTime() - 60 * 60 * 1000),
        endDate: new Date(now.getTime() + 60 * 60 * 1000),
      }),
    );
    upcomingEvent = await Event.create(buildEvent({ user: owner._id })); // far-future default

    await Booking.create({
      event: liveEvent._id,
      email: 'notify-me@example.com',
      name: 'Notify Me',
      price: 0,
      currency: 'NGN',
      transactionNumber: 1,
      ticketId: 'TID-notify-1',
      ticketUser: 'Notify Me',
      transactionStatus: 'success',
      message: 'ok',
      reference: 999111,
      ticketType: 'General',
      status: 'admitted',
    });
  });

  after(async () => {
    await Promise.all([
      Event.deleteMany({ eventName: 'Test Event' }),
      Booking.deleteMany({ email: 'notify-me@example.com' }),
    ]);
    await disconnect();
  });

  test('sweeping notifies only the event inside its live window', async () => {
    const result = await networkingNotificationService.sweepNewlyLiveEvents(
      'http://localhost:3000',
    );
    assert.ok(result.eventsNotified >= 1);

    const refreshedLive = await Event.findById(liveEvent._id);
    assert.ok(
      refreshedLive.networkingEmailSentAt,
      'live event is marked notified',
    );

    const refreshedUpcoming = await Event.findById(upcomingEvent._id);
    assert.equal(
      refreshedUpcoming.networkingEmailSentAt,
      undefined,
      'an upcoming event is untouched',
    );
  });

  test('sweeping twice is idempotent (no re-notification)', async () => {
    const first = await Event.findById(liveEvent._id);
    const firstSentAt = first.networkingEmailSentAt;

    await networkingNotificationService.sweepNewlyLiveEvents(
      'http://localhost:3000',
    );

    const second = await Event.findById(liveEvent._id);
    assert.equal(
      second.networkingEmailSentAt?.getTime(),
      firstSentAt?.getTime(),
    );
  });
}
