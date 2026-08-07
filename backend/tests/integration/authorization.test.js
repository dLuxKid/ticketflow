import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import Event from '../../src/models/eventModel.js';
import Booking from '../../src/models/bookingModel.js';
import AuditLog from '../../src/models/auditLogModel.js';
import * as eventService from '../../src/services/eventService.js';
import * as bookingService from '../../src/services/bookingService.js';
import { connect, disconnect, buildEvent, skipReason } from '../helpers/db.js';

/**
 * Phase 0.2 - proves ownership is enforced on event update and ticket check-in.
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
    // `currency` is set explicitly: the sales view renders it beside gross sales, so the
    // test needs it present to prove it survives the response narrowing.
    const event = await Event.create(
      buildEvent({ user: owner._id, currency: 'NGN' }),
    );
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
      () =>
        eventService.updateEvent(eventId, { eventName: 'Hacked' }, stranger),
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
    const ticket = await bookingService.checkInAttendee(bookingId, true, owner);
    assert.equal(ticket.isCheckedIn, true);
  });

  test('an usher assigned to the event can check in manually', async () => {
    // The door fallback for a QR that will not scan: a cracked screen or a flat battery
    // used to stop the queue entirely, because only the owner or an admin could do this.
    const usher = {
      _id: new mongoose.Types.ObjectId(),
      role: 'usher',
      assignedEvents: [eventId],
    };

    const ticket = await bookingService.checkInAttendee(bookingId, true, usher);
    assert.equal(ticket.isCheckedIn, true);
  });

  test('an usher not assigned to the event is refused (403)', async () => {
    const usher = {
      _id: new mongoose.Types.ObjectId(),
      role: 'usher',
      assignedEvents: [new mongoose.Types.ObjectId()],
    };

    await assert.rejects(
      () => bookingService.checkInAttendee(bookingId, true, usher),
      (err) => err.statusCode === 403,
    );
  });

  // ─── Sales view (booker list + gross sales) ──────────────────────────────────
  // This endpoint took only an event ID and checked nothing, so any authenticated account
  // could read any event's bookers: every attendee's name and email, the event's revenue,
  // and `ticketId` - the credential the door scanner admits on. Same defect class as the
  // event-update IDOR above, and the reason these tests sit in the same file.

  test('non-owner cannot read another user’s event sales/booker list (403)', async () => {
    await assert.rejects(
      () => bookingService.getBookingsForEvent(eventId, stranger),
      (err) => err.statusCode === 403,
    );
  });

  test('an unauthenticated caller cannot read the sales/booker list', async () => {
    // `protect` should stop this first, but the service must not depend on that: a missing
    // user has to be a denial in its own right, not an unhandled read.
    await assert.rejects(
      () => bookingService.getBookingsForEvent(eventId, undefined),
      (err) => err.statusCode === 403 || err.statusCode === 404,
    );
  });

  test('an usher assigned to the event still cannot read the sales list (403)', async () => {
    // Door staff need to admit people, not to see what the event earned or who bought what.
    // Scan scope deliberately does not widen into the organiser's commercial data.
    const usher = {
      _id: new mongoose.Types.ObjectId(),
      role: 'usher',
      assignedEvents: [eventId],
    };

    await assert.rejects(
      () => bookingService.getBookingsForEvent(eventId, usher),
      (err) => err.statusCode === 403,
    );
  });

  test('owner can read their own event’s sales/booker list', async () => {
    const { bookers, event } = await bookingService.getBookingsForEvent(
      eventId,
      owner,
    );
    assert.ok(Array.isArray(bookers));
    assert.ok(
      bookers.some((b) => b.ticketId === 'TID-1'),
      'the seeded booking should be present for the owner',
    );
    assert.equal(event.currency, 'NGN');
    assert.equal(typeof event.totalQuantity, 'number');
  });

  test('admin can read any event’s sales/booker list', async () => {
    const { bookers } = await bookingService.getBookingsForEvent(
      eventId,
      admin,
    );
    assert.ok(bookers.some((b) => b.ticketId === 'TID-1'));
  });

  test('the sales response exposes only the two event fields the view renders', async () => {
    // getEventForViewer returns the whole event document; passing it straight through would
    // silently widen the response every time a field is added to the schema.
    const { event } = await bookingService.getBookingsForEvent(eventId, owner);
    assert.deepEqual(Object.keys(event).sort(), ['currency', 'totalQuantity']);
  });

  test('a missing event is a 404, not an empty sales list', async () => {
    await assert.rejects(
      () =>
        bookingService.getBookingsForEvent(
          new mongoose.Types.ObjectId(),
          admin,
        ),
      (err) => err.statusCode === 404,
    );
  });

  test('a manual check-in is written to the audit log, flagged manual', async () => {
    await AuditLog.deleteMany({ booking: bookingId });

    await bookingService.checkInAttendee(bookingId, true, owner);
    await bookingService.checkInAttendee(bookingId, false, owner);

    const rows = await AuditLog.find({ booking: bookingId }).sort({
      createdAt: 1,
    });
    assert.equal(rows.length, 2, 'both directions are recorded');
    assert.ok(
      rows.every((r) => r.manual === true),
      'manual entries are marked so anomaly detection can exclude them',
    );
    assert.deepEqual(
      rows.map((r) => r.outcome),
      ['admitted', 'revoked'],
    );
    assert.ok(
      rows.every((r) => String(r.actor) === String(owner._id)),
      'the log records who did it',
    );
  });
}
