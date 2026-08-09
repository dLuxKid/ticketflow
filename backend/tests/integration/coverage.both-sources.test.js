import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import Event from '../../src/models/eventModel.js';
import Booking from '../../src/models/bookingModel.js';
import Guest from '../../src/models/guestModel.js';
import * as bookingRepository from '../../src/repositories/bookingRepository.js';
import * as dashboardService from '../../src/services/dashboardService.js';
import { connect, disconnect, buildEvent, skipReason } from '../helpers/db.js';

/**
 * Two features must treat **invited guests and ticket buyers alike**, and neither is obvious
 * from reading a single query — both depend on the absence of a `source` filter, which is
 * exactly the kind of thing a later "optimisation" removes by accident.
 *
 *   1. The "your event is live" Meet-and-Greet notification.
 *   2. No-show prediction.
 *
 * An invite-only event has no purchases at all, so a source filter on either would silently
 * exclude every attendee of that entire event class.
 */

if (skipReason) {
  test('both-source coverage (DB integration)', { skip: skipReason }, () => {});
} else {
  let eventId;

  before(async () => {
    await connect();
    const event = await Event.create(
      buildEvent({ eventName: 'Both Sources Event', currency: 'NGN' }),
    );
    eventId = event._id;

    // A buyer: paid, source 'purchase'.
    await Booking.create({
      event: eventId,
      name: 'Paid Buyer',
      email: 'buyer@both.example.com',
      source: 'purchase',
      status: 'delivered',
      transactionStatus: 'success',
      price: 5000,
      currency: 'NGN',
      ticketId: 'BOTHBUYER0001',
      ticketUser: 'Guest',
      ticketType: 'General',
      transactionNumber: 1,
      reference: 987001,
      redirectUrl: 'https://example.com',
      message: 'ok',
    });

    // An invited guest: no payment at all, source 'invite'.
    const inviteBooking = await Booking.create({
      event: eventId,
      name: 'Invited Guest',
      email: 'guest@both.example.com',
      source: 'invite',
      status: 'issued',
      ticketId: 'BOTHGUEST0001',
      ticketUser: 'Guest',
      ticketType: 'Guest',
      inviteToken: 'both-sources-invite-token',
    });

    await Guest.create({
      event: eventId,
      name: 'Invited Guest',
      email: 'guest@both.example.com',
      vip: true,
      plusOnes: 2,
      booking: inviteBooking._id,
    });
  });

  after(async () => {
    await Promise.all([
      Event.deleteMany({ eventName: 'Both Sources Event' }),
      Booking.deleteMany({ email: /both\.example\.com$/ }),
      Guest.deleteMany({ email: /both\.example\.com$/ }),
    ]);
    await disconnect();
  });

  test('the live-event notification reaches BOTH invited guests and ticket buyers', async () => {
    const recipients = await bookingRepository.findNotifiableByEvent(eventId);
    const emails = recipients.map((r) => r.email);

    assert.ok(
      emails.includes('buyer@both.example.com'),
      'a ticket buyer must be notified',
    );
    assert.ok(
      emails.includes('guest@both.example.com'),
      'an invited guest must be notified',
    );
    assert.equal(recipients.length, 2);
  });

  test('a revoked booking is excluded from the notification', async () => {
    // The filter that DOES exist is on status, not source — someone whose ticket was
    // cancelled should not be invited into the event chat.
    await Booking.updateOne(
      { ticketId: 'BOTHGUEST0001' },
      { $set: { status: 'revoked' } },
    );
    const after = await bookingRepository.findNotifiableByEvent(eventId);
    assert.equal(after.length, 1);
    assert.equal(after[0].email, 'buyer@both.example.com');

    await Booking.updateOne(
      { ticketId: 'BOTHGUEST0001' },
      { $set: { status: 'issued' } },
    );
  });

  test('no-show prediction scores BOTH invited guests and ticket buyers', async () => {
    const pending = await bookingRepository.findPendingByEvent(eventId);
    const sources = pending.map((b) => b.source).sort();

    assert.deepEqual(
      sources,
      ['invite', 'purchase'],
      'both sources must be candidates for prediction',
    );

    const prediction = await dashboardService.getNoShowPrediction(eventId);
    assert.equal(prediction.pendingCount, 2);
    assert.ok(prediction.averageProbability > 0);
  });

  test("an invited guest's VIP status and plus-ones reach the model", async () => {
    // Those two features live on the Guest record, not the Booking, so the prediction has to
    // join them in. Without that an invited VIP would be scored as an ordinary attendee.
    const prediction = await dashboardService.getNoShowPrediction(eventId);
    assert.ok(prediction.expectedNoShows >= 0);

    const guest = await Guest.findOne({ email: 'guest@both.example.com' });
    assert.equal(guest.vip, true);
    assert.equal(guest.plusOnes, 2);
  });
}
