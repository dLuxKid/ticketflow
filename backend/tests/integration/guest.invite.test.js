import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import Event from '../../src/models/eventModel.js';
import Booking from '../../src/models/bookingModel.js';
import Guest from '../../src/models/guestModel.js';
import * as guestService from '../../src/services/guestService.js';
import * as bookingService from '../../src/services/bookingService.js';
import * as admissionService from '../../src/services/admissionService.js';
import { connect, disconnect, buildEvent, skipReason } from '../helpers/db.js';

/**
 * Phase 4 - guest-list import issues admittable invites, duplicates are skipped, access
 * mode is enforced (public rejected for guest lists; invite_only rejected for purchase),
 * and an imported guest's QR admits exactly once end-to-end.
 *
 * Email delivery is not configured under test, so invites remain 'issued' (delivery is
 * non-fatal) - they are still admittable, which is what we assert.
 */

if (skipReason) {
  test('guest invite flow (DB integration)', { skip: skipReason }, () => {});
} else {
  let owner;

  before(async () => {
    await connect();
    owner = { _id: new mongoose.Types.ObjectId(), role: 'creator' };
  });

  after(async () => {
    await Promise.all([
      Event.deleteMany({ eventName: 'Test Event' }),
      Booking.deleteMany({ source: 'invite' }),
      Guest.deleteMany({}),
    ]);
    await disconnect();
  });

  test('import creates a guest + linked invite booking with a token', async () => {
    const event = await Event.create(
      buildEvent({
        user: owner._id,
        accessMode: 'invite_only',
        ticketDetails: [],
      }),
    );

    const result = await guestService.importGuests(
      event._id,
      [{ name: 'Ada', email: 'ada@example.com', vip: true }],
      owner,
    );
    assert.deepEqual(result.added, ['ada@example.com']);

    const guest = await Guest.findOne({
      event: event._id,
      email: 'ada@example.com',
    });
    assert.ok(guest.booking, 'guest is linked to its booking');

    const booking = await Booking.findById(guest.booking).select(
      '+inviteToken',
    );
    assert.equal(booking.source, 'invite');
    assert.equal(booking.ticketType, 'VIP');
    assert.ok(booking.inviteToken, 'invite booking carries a token');
  });

  test('re-importing the same email is skipped, not duplicated', async () => {
    const event = await Event.create(
      buildEvent({ user: owner._id, accessMode: 'hybrid' }),
    );
    await guestService.importGuests(
      event._id,
      [{ name: 'Bo', email: 'bo@example.com' }],
      owner,
    );
    const second = await guestService.importGuests(
      event._id,
      [{ name: 'Bo', email: 'bo@example.com' }],
      owner,
    );
    assert.deepEqual(second.skipped, ['bo@example.com']);
    const count = await Guest.countDocuments({
      event: event._id,
      email: 'bo@example.com',
    });
    assert.equal(count, 1);
  });

  test('a public event rejects guest-list management', async () => {
    const event = await Event.create(buildEvent({ user: owner._id })); // default public
    await assert.rejects(
      () =>
        guestService.importGuests(
          event._id,
          [{ name: 'X', email: 'x@e.com' }],
          owner,
        ),
      (err) => err.statusCode === 400,
    );
  });

  test('purchasing a ticket for an invite_only event is blocked (403)', async () => {
    const event = await Event.create(
      buildEvent({
        user: owner._id,
        accessMode: 'invite_only',
        ticketDetails: [],
      }),
    );
    await assert.rejects(
      () =>
        bookingService.reserveBooking(
          [{ ticketType: 'General', name: 'Buyer', email: 'b@e.com' }],
          event._id,
          owner._id,
        ),
      (err) => err.statusCode === 403,
    );
  });

  test('an imported guest QR admits exactly once', async () => {
    const event = await Event.create(
      buildEvent({
        user: owner._id,
        accessMode: 'invite_only',
        ticketDetails: [],
      }),
    );
    await guestService.importGuests(
      event._id,
      [{ name: 'Cy', email: 'cy@example.com' }],
      owner,
    );
    const guest = await Guest.findOne({
      event: event._id,
      email: 'cy@example.com',
    });
    const booking = await Booking.findById(guest.booking).select(
      '+inviteToken',
    );

    const admit = await admissionService.checkInByScan(
      booking.inviteToken,
      owner,
    );
    assert.equal(admit.outcome, 'admitted');

    await assert.rejects(
      () => admissionService.checkInByScan(booking.inviteToken, owner),
      (err) => err.statusCode === 409,
    );
  });
}
