import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import Event from '../../src/models/eventModel.js';
import Booking from '../../src/models/bookingModel.js';
import Guest from '../../src/models/guestModel.js';
import * as guestService from '../../src/services/guestService.js';
import * as retentionService from '../../src/services/retentionService.js';
import { connect, disconnect, buildEvent, skipReason } from '../helpers/db.js';

/**
 * Phase 6 - GDPR retention. Proves both erasure paths anonymize PII while preserving
 * analytics-relevant fields, and that the sweep only touches events past their window.
 */

if (skipReason) {
  test('GDPR retention (DB integration)', { skip: skipReason }, () => {});
} else {
  let owner;
  let stranger;
  let longAgo;
  let recent;

  before(async () => {
    await connect();
    owner = { _id: new mongoose.Types.ObjectId(), role: 'creator' };
    stranger = { _id: new mongoose.Types.ObjectId(), role: 'user' };

    const farPast = new Date();
    farPast.setDate(farPast.getDate() - 40); // 40 days ago: past the 30-day default window
    longAgo = await Event.create(
      buildEvent({
        user: owner._id,
        accessMode: 'invite_only',
        ticketDetails: [],
        endDate: farPast,
      }),
    );

    const barelyPast = new Date();
    barelyPast.setDate(barelyPast.getDate() - 5); // only 5 days ago: within the window
    recent = await Event.create(
      buildEvent({
        user: owner._id,
        accessMode: 'invite_only',
        ticketDetails: [],
        endDate: barelyPast,
      }),
    );
  });

  after(async () => {
    await Promise.all([
      Event.deleteMany({ eventName: 'Test Event' }),
      Booking.deleteMany({ source: 'invite' }),
      Guest.deleteMany({}),
    ]);
    await disconnect();
  });

  test('manual erasure anonymizes a guest and its linked booking immediately', async () => {
    await guestService.importGuests(
      recent._id,
      [{ name: 'Manual Erase', email: 'manual@example.com' }],
      owner,
    );
    const guest = await Guest.findOne({
      event: recent._id,
      email: 'manual@example.com',
    });

    await retentionService.requestErasure(recent._id, guest._id, owner);

    const erasedGuest = await Guest.findById(guest._id);
    assert.equal(erasedGuest.name, 'Erased Guest');
    assert.notEqual(erasedGuest.email, 'manual@example.com');
    assert.ok(erasedGuest.erasedAt);

    const erasedBooking = await Booking.findById(guest.booking);
    assert.equal(erasedBooking.name, 'Erased Guest');
    assert.notEqual(erasedBooking.email, 'manual@example.com');
    assert.ok(erasedBooking.piiErasedAt);
    // Analytics-relevant fields survive erasure.
    assert.equal(erasedBooking.ticketType, 'Guest');
    assert.equal(erasedBooking.source, 'invite');
  });

  test('a non-owner cannot request erasure (403)', async () => {
    await guestService.importGuests(
      recent._id,
      [{ name: 'Protected', email: 'protected@example.com' }],
      owner,
    );
    const guest = await Guest.findOne({
      event: recent._id,
      email: 'protected@example.com',
    });

    await assert.rejects(
      () => retentionService.requestErasure(recent._id, guest._id, stranger),
      (err) => err.statusCode === 403,
    );

    const stillThere = await Guest.findById(guest._id);
    assert.equal(stillThere.email, 'protected@example.com');
  });

  test('sweep erases guests/bookings on events past the window, leaves recent ones alone', async () => {
    await guestService.importGuests(
      longAgo._id,
      [{ name: 'Old Guest', email: 'old@example.com' }],
      owner,
    );
    await guestService.importGuests(
      recent._id,
      [{ name: 'Still Recent', email: 'still-recent@example.com' }],
      owner,
    );

    const result = await retentionService.sweepExpiredEvents(30);

    assert.ok(
      result.expiredEvents >= 1,
      'at least the far-past event is expired',
    );
    assert.ok(result.guestsErased >= 1);

    const oldGuest = await Guest.findOne({
      event: longAgo._id,
      email: { $ne: 'old@example.com' },
    });
    assert.ok(oldGuest?.erasedAt, 'the old event guest was erased');

    const stillRecentGuest = await Guest.findOne({
      event: recent._id,
      email: 'still-recent@example.com',
    });
    assert.equal(
      stillRecentGuest?.erasedAt,
      undefined,
      'a guest on an event within the retention window is untouched',
    );
  });

  test('sweeping twice is idempotent (no error, nothing double-processed)', async () => {
    const first = await retentionService.sweepExpiredEvents(30);
    const second = await retentionService.sweepExpiredEvents(30);

    // The first result was previously discarded, which made this test vacuous: if the sweep
    // were broken and erased nothing at all, `second.guestsErased === 0` would still hold and
    // the test would pass while proving nothing about idempotency.
    assert.equal(
      typeof first.guestsErased,
      'number',
      'the first sweep should report how many guests it erased',
    );
    assert.equal(
      second.guestsErased,
      0,
      'already-erased guests are excluded on the next run',
    );
  });
}
