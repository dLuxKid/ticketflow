import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import Event from '../../src/models/eventModel.js';
import Booking from '../../src/models/bookingModel.js';
import AuditLog from '../../src/models/auditLogModel.js';
import * as admissionService from '../../src/services/admissionService.js';
import { connect, disconnect, buildEvent, skipReason } from '../helpers/db.js';

/**
 * Phase 2 - proves the atomic single-use check-in.
 *
 * Two simultaneous scans of one ticket must yield exactly one admission; both a success
 * and a subsequent rejection must leave audit rows. Requires a MongoDB replica set (the
 * admit runs inside a transaction).
 */

if (skipReason) {
  test('admission scan (DB integration)', { skip: skipReason }, () => {});
} else {
  let owner;
  let event;

  const seedBooking = (inviteToken) =>
    Booking.create({
      event: event._id,
      email: 'g@example.com',
      name: 'Guest',
      price: 100,
      currency: 'NGN',
      transactionNumber: 1,
      ticketId: `TID-${inviteToken}`,
      ticketUser: 'Guest',
      transactionStatus: 'success',
      redirectUrl: 'https://x',
      message: 'ok',
      reference: 1,
      ticketType: 'General',
      source: 'invite',
      status: 'issued',
      inviteToken,
    });

  before(async () => {
    await connect();
    owner = { _id: new mongoose.Types.ObjectId(), role: 'creator' };
    // Ticket inventory is raised above 1 deliberately. `buildEvent`'s default of a single
    // ticket makes the event's own capacity 1 (venueCapacity is unset, so the door falls
    // back to totalQuantity), which means the second guest admitted in this file would be
    // refused for being over capacity rather than for the reason under test. That is the
    // capacity guardrail behaving correctly - the fixture, not the rule, was wrong.
    event = await Event.create(
      buildEvent({
        user: owner._id,
        ticketDetails: [
          { ticketName: 'General', ticketPrice: 100, ticketQuantity: 50 },
        ],
      }),
    );
  });

  after(async () => {
    await Promise.all([
      Event.deleteMany({ eventName: 'Test Event' }),
      Booking.deleteMany({ email: 'g@example.com' }),
      AuditLog.deleteMany({ event: event?._id }),
    ]);
    await disconnect();
  });

  test('two concurrent scans of one ticket → exactly one admission', async () => {
    const booking = await seedBooking('tok-concurrent');

    const results = await Promise.allSettled([
      admissionService.checkInByScan('tok-concurrent', owner),
      admissionService.checkInByScan('tok-concurrent', owner),
    ]);

    const admitted = results.filter(
      (r) => r.status === 'fulfilled' && r.value.outcome === 'admitted',
    );
    const rejected = results.filter((r) => r.status === 'rejected');
    assert.equal(admitted.length, 1, 'exactly one scan admits');
    assert.equal(rejected.length, 1, 'the other scan is rejected');

    const fresh = await Booking.findById(booking._id);
    assert.equal(fresh.status, 'admitted');
    assert.equal(fresh.isCheckedIn, true);

    const audits = await AuditLog.find({ booking: booking._id }).sort({
      createdAt: 1,
    });
    const outcomes = audits.map((a) => a.outcome).sort();
    assert.deepEqual(outcomes, ['admitted', 'rejected']);
    const rejectRow = audits.find((a) => a.outcome === 'rejected');
    assert.equal(rejectRow.reason, 'already_admitted');
  });

  test('a second scan after admission is rejected as already_admitted', async () => {
    await seedBooking('tok-sequential');

    const first = await admissionService.checkInByScan('tok-sequential', owner);
    assert.equal(first.outcome, 'admitted');

    await assert.rejects(
      () => admissionService.checkInByScan('tok-sequential', owner),
      (err) => err.statusCode === 409,
    );
  });

  test('an unknown code is a 404', async () => {
    await assert.rejects(
      () => admissionService.checkInByScan('does-not-exist', owner),
      (err) => err.statusCode === 404,
    );
  });

  test('a purchased ticket admits by its ticketId', async () => {
    const purchased = await Booking.create({
      event: event._id,
      email: 'g@example.com',
      name: 'Buyer',
      price: 100,
      currency: 'NGN',
      transactionNumber: 2,
      ticketId: 'PURCHASE-XYZ',
      ticketUser: 'Buyer',
      transactionStatus: 'success',
      redirectUrl: 'https://x',
      message: 'ok',
      reference: 2,
      ticketType: 'General',
      source: 'purchase',
      status: 'issued',
    });

    const result = await admissionService.checkInByScan('PURCHASE-XYZ', owner);
    assert.equal(result.outcome, 'admitted');
    const fresh = await Booking.findById(purchased._id);
    assert.equal(fresh.status, 'admitted');
  });
}
