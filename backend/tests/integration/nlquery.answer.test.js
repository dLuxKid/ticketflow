import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import Event from '../../src/models/eventModel.js';
import Booking from '../../src/models/bookingModel.js';
import Guest from '../../src/models/guestModel.js';
import * as guestService from '../../src/services/guestService.js';
import * as nlGuestQueryService from '../../src/services/nlGuestQueryService.js';
import { connect, disconnect, buildEvent, skipReason } from '../helpers/db.js';

/**
 * Phase 5 - end-to-end: a plain question against a real guest list returns the correct
 * guests and count, and access control matches the dashboard's rule.
 */

if (skipReason) {
  test('NL guest query (DB integration)', { skip: skipReason }, () => {});
} else {
  let owner;
  let stranger;
  let event;

  before(async () => {
    await connect();
    owner = { _id: new mongoose.Types.ObjectId(), role: 'creator' };
    stranger = { _id: new mongoose.Types.ObjectId(), role: 'user' };
    event = await Event.create(
      buildEvent({
        user: owner._id,
        accessMode: 'invite_only',
        ticketDetails: [],
      }),
    );
    await guestService.importGuests(
      event._id,
      [
        { name: 'Ada Lovelace', email: 'ada@example.com', vip: true },
        { name: 'Bo Diddley', email: 'bo@example.com', vip: false },
      ],
      owner,
    );
    // Admit Ada so the question set has a real mix of arrived/not-arrived.
    const adaGuest = await Guest.findOne({
      event: event._id,
      email: 'ada@example.com',
    });
    await Booking.findByIdAndUpdate(adaGuest.booking, { status: 'admitted' });
  });

  after(async () => {
    await Promise.all([
      Event.deleteMany({ eventName: 'Test Event' }),
      Booking.deleteMany({ source: 'invite' }),
      Guest.deleteMany({}),
    ]);
    await disconnect();
  });

  test('"who hasn\'t arrived" returns exactly the unadmitted guest', async () => {
    const result = await nlGuestQueryService.answerQuestion(
      event._id,
      "who hasn't arrived",
      owner,
    );
    assert.equal(result.count, 1);
    assert.equal(result.guests[0].email, 'bo@example.com');
  });

  test('"how many VIPs have arrived" counts correctly', async () => {
    const result = await nlGuestQueryService.answerQuestion(
      event._id,
      'how many VIPs have arrived',
      owner,
    );
    assert.equal(result.count, 1);
  });

  test('a non-owner cannot query the guest list (403)', async () => {
    await assert.rejects(
      () =>
        nlGuestQueryService.answerQuestion(
          event._id,
          'who has arrived',
          stranger,
        ),
      (err) => err.statusCode === 403,
    );
  });

  test('an unrecognised question is a 400, not a guess', async () => {
    await assert.rejects(
      () =>
        nlGuestQueryService.answerQuestion(
          event._id,
          'what time does the bar close',
          owner,
        ),
      (err) => err.statusCode === 400,
    );
  });
}
