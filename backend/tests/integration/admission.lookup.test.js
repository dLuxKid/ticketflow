import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import Event from '../../src/models/eventModel.js';
import Booking from '../../src/models/bookingModel.js';
import * as bookingRepository from '../../src/repositories/bookingRepository.js';
import * as admissionService from '../../src/services/admissionService.js';
import { connect, disconnect, buildEvent, skipReason } from '../helpers/db.js';

/**
 * Door-scan code resolution and the capacity projection.
 *
 * Both defects here were invisible rather than noisy: a correct code typed in the wrong case
 * reported "invalid ticket" (indistinguishable from a forgery), and the capacity guardrail
 * read its limit from fields the query never selected, so it silently never fired.
 */

if (skipReason) {
  test('admission lookup (DB integration)', { skip: skipReason }, () => {});
} else {
  const organiser = { _id: new mongoose.Types.ObjectId(), role: 'creator' };
  let eventId;

  before(async () => {
    await connect();
    const event = await Event.create(
      buildEvent({
        eventName: 'Scan Lookup Event',
        user: organiser._id,
        venueCapacity: 1,
        ticketDetails: [
          { ticketName: 'General', ticketPrice: 0, ticketQuantity: 50 },
        ],
      }),
    );
    eventId = event._id;
  });

  after(async () => {
    await Promise.all([
      Event.deleteMany({ eventName: 'Scan Lookup Event' }),
      Booking.deleteMany({ email: 'scan-test@example.com' }),
    ]);
    await disconnect();
  });

  const makeBooking = async (ticketId) =>
    Booking.create({
      event: eventId,
      email: 'scan-test@example.com',
      name: 'Scan Guest',
      ticketId,
      ticketUser: 'Guest',
      ticketType: 'General',
      source: 'invite',
      status: 'issued',
    });

  test('a hand-typed code resolves regardless of case or surrounding space', async () => {
    await makeBooking('ABCD1234EFGH');

    for (const typed of [
      'ABCD1234EFGH',
      'abcd1234efgh',
      '  ABCD1234EFGH  ',
      'AbCd1234EfGh',
    ]) {
      const found = await bookingRepository.findByScanCode(typed);
      assert.ok(found, `"${typed}" should resolve to the booking`);
      assert.equal(found.ticketId, 'ABCD1234EFGH');
    }
  });

  test('a legacy hash-prefixed ticket resolves with or without the hash', async () => {
    // Bookings issued before server-side IDs display as "#6F557BD"; the hash is easy to
    // omit when typing, and was previously the difference between admitted and "invalid".
    await makeBooking('#6F557BD');

    for (const typed of ['#6F557BD', '6F557BD', '6f557bd']) {
      const found = await bookingRepository.findByScanCode(typed);
      assert.ok(found, `"${typed}" should resolve`);
      assert.equal(found.ticketId, '#6F557BD');
    }
  });

  test('an unknown code still resolves to nothing', async () => {
    // The normalisation must not become so permissive that it matches the wrong booking.
    assert.equal(await bookingRepository.findByScanCode('NOSUCHCODE99'), null);
  });

  test('the scan lookup selects the fields the capacity limit is read from', async () => {
    // The regression: the populate selected only `user`, so venueCapacity and totalQuantity
    // arrived undefined, admissionService computed a limit of 0, and capacityDecision reads
    // 0 as "unlimited" - disabling fire-safety enforcement on every scan without any error.
    const booking = await makeBooking('CAPACITYFIELD');
    const loaded = await bookingRepository.findByScanCode(booking.ticketId);

    assert.equal(loaded.event.venueCapacity, 1);
    assert.ok(
      loaded.event.totalQuantity !== undefined,
      'totalQuantity must be selected as the fallback limit',
    );
  });

  test('capacity is actually enforced at the door', async () => {
    // End to end, against the real projection: the event admits one person, so the second
    // scan must be refused rather than silently admitted.
    const first = await makeBooking('CAPFIRST00001');
    const second = await makeBooking('CAPSECOND0001');

    const ok = await admissionService.checkInByScan(first.ticketId, organiser);
    assert.equal(ok.outcome, 'admitted');

    await assert.rejects(
      () => admissionService.checkInByScan(second.ticketId, organiser),
      (err) => err.statusCode === 409 && err.code === 'at_capacity',
    );
  });

  test('an override admits past capacity and is recorded as such', async () => {
    const third = await makeBooking('CAPTHIRD00001');

    const res = await admissionService.checkInByScan(
      third.ticketId,
      organiser,
      {
        overrideCapacity: true,
      },
    );
    assert.equal(res.outcome, 'admitted');

    const AuditLog = (await import('../../src/models/auditLogModel.js'))
      .default;
    const row = await AuditLog.findOne({ booking: third._id });
    assert.equal(row.reason, 'capacity_override');
  });

  test('re-scanning an admitted ticket at a full venue says already admitted', async () => {
    // The venue is at capacity by now. Re-scanning someone already inside adds nobody, so
    // answering "the venue is full" - and offering a supervisor override - would be both
    // wrong and alarming at a door. The guest is already in.
    const already = await makeBooking('ALREADYIN0001');
    await admissionService.checkInByScan(already.ticketId, organiser, {
      overrideCapacity: true,
    });

    await assert.rejects(
      () => admissionService.checkInByScan(already.ticketId, organiser),
      (err) =>
        err.statusCode === 409 && /already been admitted/i.test(err.message),
    );
  });

  test('a ticket for an archived event reports the archive, not a forgery', async () => {
    const booking = await makeBooking('ARCHIVEDEVENT');
    await Event.findByIdAndUpdate(eventId, {
      $set: { isActive: false, deletedAt: new Date() },
    });

    try {
      await assert.rejects(
        () => admissionService.checkInByScan(booking.ticketId, organiser),
        (err) => err.statusCode === 409 && /archived/i.test(err.message),
      );
    } finally {
      await Event.findByIdAndUpdate(
        eventId,
        { $set: { isActive: true } },
        { includeArchived: true },
      );
    }
  });
}
