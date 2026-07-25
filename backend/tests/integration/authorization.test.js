import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import Event from '../../src/models/eventModel.js';
import Booking from '../../src/models/bookingModel.js';
import * as eventService from '../../src/services/eventService.js';
import * as bookingService from '../../src/services/bookingService.js';
import { connect, disconnect, buildEvent, skipReason } from '../helpers/db.js';

/**
 * Phase 0.2 — proves ownership is enforced on event update and ticket check-in.
 *
 * Before this change any authenticated user could edit any event or check in any ticket
 * (broken access control / IDOR). These tests assert a non-owner is rejected with 403
 * while the owner and an admin succeed.
 */

if (skipReason) {
  test('authorization (DB integration)', { skip: skipReason }, () => {});
} else {
  const owner = { _id: new mongoose.Types.ObjectId(), role: 'user' };
  const stranger = { _id: new mongoose.Types.ObjectId(), role: 'user' };
  const admin = { _id: new mongoose.Types.ObjectId(), role: 'admin' };
  let eventId;
  let bookingId;

  before(async () => {
    await connect();
    const event = await Event.create(buildEvent({ user: owner._id }));
    eventId = event._id;
    const booking = await Booking.create({
      event: eventId,
      email: 'guest@example.com',
      name: 'Guest',
      price: 100,
      currency: 'NGN',
      transactionNumber: 1,
      ticketId: 'TID-1',
      ticketUser: 'Guest',
      transactionStatus: 'success',
      redirectUrl: 'https://example.com',
      message: 'ok',
      reference: 123,
      ticketType: 'General',
    });
    bookingId = booking._id;
  });

  after(async () => {
    await Promise.all([
      Event.deleteMany({ eventName: 'Test Event' }),
      Booking.deleteMany({ ticketId: 'TID-1' }),
    ]);
    await disconnect();
  });

  test('non-owner cannot update another user’s event (403)', async () => {
    await assert.rejects(
      () => eventService.updateEvent(eventId, { eventName: 'Hacked' }, stranger),
      (err) => err.statusCode === 403,
    );
  });

  test('owner can update their own event', async () => {
    const updated = await eventService.updateEvent(
      eventId,
      { additionalComments: 'by owner' },
      owner,
    );
    assert.equal(updated.additionalComments, 'by owner');
  });

  test('admin can update any event', async () => {
    const updated = await eventService.updateEvent(
      eventId,
      { additionalComments: 'by admin' },
      admin,
    );
    assert.equal(updated.additionalComments, 'by admin');
  });

  test('non-owner cannot check in a ticket for another user’s event (403)', async () => {
    await assert.rejects(
      () => bookingService.checkInAttendee(bookingId, true, stranger),
      (err) => err.statusCode === 403,
    );
  });

  test('owner can check in a ticket for their event', async () => {
    const ticket = await bookingService.checkInAttendee(
      bookingId,
      true,
      owner,
    );
    assert.equal(ticket.isCheckedIn, true);
  });
}
