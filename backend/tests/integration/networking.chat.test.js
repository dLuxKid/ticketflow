import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import Event from '../../src/models/eventModel.js';
import Booking from '../../src/models/bookingModel.js';
import Message from '../../src/models/messageModel.js';
import User from '../../src/models/userModel.js';
import * as networkingService from '../../src/services/networkingService.js';
import { connect, disconnect, buildEvent, skipReason } from '../helpers/db.js';

/**
 * Phase 7 - guest networking: eligibility (and lazy account-linking), the live-only
 * posting gate, group chat, DMs, and the opt-in directory.
 */

if (skipReason) {
  test('guest networking (DB integration)', { skip: skipReason }, () => {});
} else {
  let owner;
  let liveEvent;
  let notLiveEvent;
  let alice;
  let bob;
  let stranger;

  const liveWindow = () => {
    const now = new Date();
    return {
      startDate: new Date(now.getTime() - 60 * 60 * 1000),
      endDate: new Date(now.getTime() + 60 * 60 * 1000),
    };
  };

  const makeUser = (email) =>
    User.create({
      name: email.split('@')[0],
      email,
      password: 'password123',
      passwordConfirm: 'password123',
    });

  const makeBooking = (event, user) =>
    Booking.create({
      event: event._id,
      email: user.email,
      name: user.name,
      price: 0,
      currency: 'NGN',
      transactionNumber: 1,
      ticketId: `TID-${user._id}`,
      ticketUser: user.name,
      transactionStatus: 'success',
      message: 'ok',
      reference: Math.floor(Math.random() * 1e9),
      ticketType: 'General',
      status: 'admitted',
    });

  before(async () => {
    await connect();
    owner = { _id: new mongoose.Types.ObjectId(), role: 'creator' };

    liveEvent = await Event.create(
      buildEvent({ user: owner._id, ...liveWindow() }),
    );
    notLiveEvent = await Event.create(buildEvent({ user: owner._id })); // far-future default

    const [aliceUser, bobUser, strangerUser] = await Promise.all([
      makeUser('alice-network@example.com'),
      makeUser('bob-network@example.com'),
      makeUser('stranger-network@example.com'),
    ]);
    stranger = strangerUser;

    const [aliceBooking, bobBooking] = await Promise.all([
      makeBooking(liveEvent, aliceUser),
      makeBooking(liveEvent, bobUser),
    ]);

    alice = { user: aliceUser, booking: aliceBooking };
    bob = { user: bobUser, booking: bobBooking };
  });

  after(async () => {
    await Promise.all([
      Event.deleteMany({ eventName: 'Test Event' }),
      Booking.deleteMany({ email: /-network@example\.com$/ }),
      Message.deleteMany({}),
      User.deleteMany({ email: /-network@example\.com$/ }),
    ]);
    await disconnect();
  });

  test('a booking created without an account is claimed on first access', async () => {
    const { booking } = await networkingService.resolveViewer(
      liveEvent._id,
      alice.user,
    );
    assert.ok(booking.user, 'booking now carries the authenticated user id');
    assert.equal(String(booking.user), String(alice.user._id));
  });

  test('a user with no booking for the event is denied (403)', async () => {
    await assert.rejects(
      () => networkingService.resolveViewer(liveEvent._id, stranger),
      (err) => err.statusCode === 403,
    );
  });

  test('the organiser can view without a booking', async () => {
    const { event } = await networkingService.resolveViewer(
      liveEvent._id,
      owner,
    );
    assert.equal(String(event._id), String(liveEvent._id));
  });

  test('posting a group message while live succeeds and is retrievable', async () => {
    const message = await networkingService.postGroupMessage(
      liveEvent._id,
      alice.user,
      'Hey everyone!',
    );
    assert.equal(message.body, 'Hey everyone!');
    assert.equal(message.recipient, null);

    const history = await networkingService.getGroupHistory(
      liveEvent._id,
      bob.user,
    );
    assert.ok(history.some((m) => m.body === 'Hey everyone!'));
  });

  test('posting to a not-live event is rejected (403) regardless of who asks', async () => {
    await assert.rejects(
      () =>
        networkingService.postGroupMessage(
          notLiveEvent._id,
          owner,
          'too early',
        ),
      (err) => err.statusCode === 403,
    );
  });

  test('a DM round-trips between two eligible attendees', async () => {
    await networkingService.resolveViewer(liveEvent._id, bob.user); // ensure bob is claimed
    const sent = await networkingService.postDm(
      liveEvent._id,
      alice.user,
      bob.user._id,
      'hi bob',
    );
    assert.equal(String(sent.recipient), String(bob.user._id));

    const threadForBob = await networkingService.getDmThread(
      liveEvent._id,
      bob.user,
      alice.user._id,
    );
    assert.ok(threadForBob.some((m) => m.body === 'hi bob'));
  });

  test('a DM to someone not part of the event is rejected (404)', async () => {
    await assert.rejects(
      () =>
        networkingService.postDm(
          liveEvent._id,
          alice.user,
          stranger._id,
          'hi?',
        ),
      (err) => err.statusCode === 404,
    );
  });

  test('the directory only lists opted-in attendees', async () => {
    await networkingService.setOptIn(liveEvent._id, alice.user, {
      networkingOptIn: true,
      networkingBio: 'Say hi!',
    });

    const directory = await networkingService.getDirectory(
      liveEvent._id,
      bob.user,
    );
    assert.ok(directory.some((b) => String(b.user) === String(alice.user._id)));
    assert.ok(
      !directory.some((b) => String(b.user) === String(bob.user._id)),
      'bob has not opted in',
    );
  });
}
