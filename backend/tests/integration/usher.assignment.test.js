import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import Event from '../../src/models/eventModel.js';
import User from '../../src/models/userModel.js';
import * as usherService from '../../src/services/usherService.js';
import * as admissionService from '../../src/services/admissionService.js';
import Booking from '../../src/models/bookingModel.js';
import { connect, disconnect, buildEvent, skipReason } from '../helpers/db.js';

/**
 * Proves the piece that closes the loop between "assign an usher" (this feature) and
 * "an usher can actually scan" (Phase 2's authorizeScan, which reads assignedEvents) -
 * assigning someone here must be the SAME mechanism that grants real door access, not a
 * parallel permission system that looks right but does nothing.
 */

if (skipReason) {
  test('usher assignment (DB integration)', { skip: skipReason }, () => {});
} else {
  let owner;
  let event;
  let plainUser;

  before(async () => {
    await connect();
    owner = { _id: new mongoose.Types.ObjectId(), role: 'creator' };
    event = await Event.create(buildEvent({ user: owner._id }));
    plainUser = await User.create({
      name: 'Future Usher',
      email: `usher-${Date.now()}@example.com`,
      password: 'password1234',
      passwordConfirm: 'password1234',
    });
  });

  after(async () => {
    await Promise.all([
      Event.deleteMany({ eventName: 'Test Event' }),
      User.deleteMany({ _id: plainUser._id }),
    ]);
    await disconnect();
  });

  test('assigning a user by email promotes them to usher for that event', async () => {
    const usher = await usherService.assignUsher(
      event._id,
      plainUser.email,
      owner,
    );
    assert.equal(usher.role, 'usher');

    const list = await usherService.listUshers(event._id, owner);
    assert.ok(list.some((u) => u.email === plainUser.email));
  });

  test('the newly-assigned usher can actually authorize a scan for this event (closes the loop with Phase 2)', async () => {
    const refreshed = await User.findById(plainUser._id).select('+role');
    const actor = {
      _id: refreshed._id,
      role: refreshed.role,
      assignedEvents: refreshed.assignedEvents,
    };

    const booking = await Booking.create({
      event: event._id,
      email: 'guest@example.com',
      name: 'Guest',
      price: 100,
      currency: 'NGN',
      transactionNumber: 1,
      ticketId: 'USHER-TEST-1',
      ticketUser: 'Guest',
      transactionStatus: 'success',
      redirectUrl: 'https://x',
      message: 'ok',
      reference: 1,
      ticketType: 'General',
      status: 'issued',
    });

    const result = await admissionService.checkInByScan('USHER-TEST-1', actor);
    assert.equal(result.outcome, 'admitted');

    await Booking.deleteOne({ _id: booking._id });
  });

  test('a non-owner cannot assign an usher (403)', async () => {
    const stranger = { _id: new mongoose.Types.ObjectId(), role: 'user' };
    await assert.rejects(
      () => usherService.assignUsher(event._id, plainUser.email, stranger),
      (err) => err.statusCode === 403,
    );
  });

  test('assigning an email with no account gives a clear 404, not a crash', async () => {
    await assert.rejects(
      () =>
        usherService.assignUsher(
          event._id,
          'no-such-account@example.com',
          owner,
        ),
      (err) => err.statusCode === 404,
    );
  });

  test('unassigning removes door access', async () => {
    await usherService.unassignUsher(event._id, plainUser._id, owner);
    const list = await usherService.listUshers(event._id, owner);
    assert.equal(
      list.some((u) => u.email === plainUser.email),
      false,
    );
  });
}
