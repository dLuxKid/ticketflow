import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import Event from '../../src/models/eventModel.js';
import Booking from '../../src/models/bookingModel.js';
import * as revenueService from '../../src/services/revenueService.js';
import { platformFeeMinor } from '../../src/services/pricingService.js';
import { connect, disconnect, buildEvent, skipReason } from '../helpers/db.js';

/**
 * Revenue reporting: the figures, and - more importantly - who can see whose.
 *
 * Scope is the security property here. An organiser must never see another organiser's
 * takings, and an admin must see everything; both are decided inside the service from the
 * caller's role rather than from anything the request supplies.
 */

if (skipReason) {
  test('revenue summary (DB integration)', { skip: skipReason }, () => {});
} else {
  const alice = { _id: new mongoose.Types.ObjectId(), role: 'creator' };
  const bob = { _id: new mongoose.Types.ObjectId(), role: 'creator' };
  const admin = { _id: new mongoose.Types.ObjectId(), role: 'admin' };

  let aliceEventId;
  let bobEventId;
  let adminEventId;

  const paidBooking = (eventId, reference, price) =>
    Booking.create({
      event: eventId,
      email: 'revenue@example.com',
      name: 'Revenue Buyer',
      price,
      currency: 'NGN',
      ticketId: `RV${Math.random().toString(36).slice(2, 10).toUpperCase()}`,
      ticketUser: 'Guest',
      ticketType: 'General',
      source: 'purchase',
      transactionStatus: 'success',
      transactionNumber: 1,
      reference,
      redirectUrl: 'https://example.com',
      message: 'ok',
    });

  before(async () => {
    await connect();

    const aliceEvent = await Event.create(
      buildEvent({
        eventName: 'Alice Revenue Event',
        user: alice._id,
        currency: 'NGN',
      }),
    );
    aliceEventId = aliceEvent._id;

    const bobEvent = await Event.create(
      buildEvent({
        eventName: 'Bob Revenue Event',
        user: bob._id,
        currency: 'NGN',
      }),
    );
    bobEventId = bobEvent._id;

    // Alice: two separate transactions, ₦10,000 and ₦5,000.
    await paidBooking(aliceEventId, 111111, 10000);
    await paidBooking(aliceEventId, 222222, 5000);
    // A pending hold that must NOT count - it has not been paid.
    await Booking.create({
      event: aliceEventId,
      email: 'revenue@example.com',
      name: 'Pending Buyer',
      price: 99999,
      currency: 'NGN',
      ticketId: 'RVPENDING001',
      ticketUser: 'Guest',
      ticketType: 'General',
      source: 'purchase',
      transactionStatus: 'pending',
      reference: 333333,
      redirectUrl: 'https://example.com',
      message: 'pending',
    });

    await paidBooking(bobEventId, 444444, 20000);

    // The admin also organises. Their OWN revenue and the PLATFORM's revenue are different
    // questions with different answers, which is the whole point of `scope`.
    const adminEvent = await Event.create(
      buildEvent({
        eventName: 'Admin Own Event',
        user: admin._id,
        currency: 'NGN',
      }),
    );
    adminEventId = adminEvent._id;
    await paidBooking(adminEventId, 555555, 8000);
  });

  after(async () => {
    await Promise.all([
      Event.deleteMany({
        eventName: {
          $in: ['Alice Revenue Event', 'Bob Revenue Event', 'Admin Own Event'],
        },
      }),
      Booking.deleteMany({ email: 'revenue@example.com' }),
    ]);
    await disconnect();
  });

  test('an organiser sees only their own events', async () => {
    const summary = await revenueService.getRevenueSummary(alice);

    assert.equal(summary.scope, 'own');
    const names = summary.events.map((e) => e.eventName);
    assert.ok(names.includes('Alice Revenue Event'));
    assert.ok(
      !names.includes('Bob Revenue Event'),
      "another organiser's event must not appear",
    );
  });

  test('gross, platform fee and net are reported per event', async () => {
    const summary = await revenueService.getRevenueSummary(alice);
    const row = summary.events.find(
      (e) => e.eventName === 'Alice Revenue Event',
    );

    // ₦15,000 gross = 1,500,000 kobo; the pending ₦99,999 is excluded.
    assert.equal(row.grossMinor, 1_500_000);
    assert.equal(row.ticketsSold, 2);
    assert.equal(row.transactions, 2);

    // Fee is per transaction: 3% of 1,000,000 + 3% of 500,000 = 30,000 + 15,000.
    const expectedFee = platformFeeMinor(1_000_000) + platformFeeMinor(500_000);
    assert.equal(row.platformFeeMinor, expectedFee);
    assert.equal(row.platformFeeMinor, 45_000);
    assert.equal(row.netMinor, 1_500_000 - 45_000);
  });

  test('unpaid reservations are excluded from revenue', async () => {
    const summary = await revenueService.getRevenueSummary(alice);
    const row = summary.events.find(
      (e) => e.eventName === 'Alice Revenue Event',
    );
    // Reporting a pending hold as revenue would overstate takings by ₦99,999 here.
    assert.ok(
      row.grossMinor < toMinor(99999),
      'pending money must not be counted',
    );
  });

  test('an admin sees every event on the platform', async () => {
    const summary = await revenueService.getRevenueSummary(admin, {
      scope: 'platform',
    });

    assert.equal(summary.scope, 'platform');
    const names = summary.events.map((e) => e.eventName);
    assert.ok(names.includes('Alice Revenue Event'));
    assert.ok(names.includes('Bob Revenue Event'));
  });

  test("the admin total is the platform's fee income across all events", async () => {
    const summary = await revenueService.getRevenueSummary(admin, {
      scope: 'platform',
    });

    const alicePart = summary.events.find(
      (e) => e.eventName === 'Alice Revenue Event',
    );
    const bobPart = summary.events.find(
      (e) => e.eventName === 'Bob Revenue Event',
    );

    assert.equal(bobPart.grossMinor, 2_000_000);
    assert.equal(bobPart.platformFeeMinor, platformFeeMinor(2_000_000));

    // Totals must be the sum of the rows, or the report contradicts itself on screen.
    assert.ok(
      summary.totals.platformFeeMinor >=
        alicePart.platformFeeMinor + bobPart.platformFeeMinor,
    );
    assert.equal(
      summary.totals.grossMinor,
      summary.events.reduce((s, e) => s + e.grossMinor, 0),
    );
    assert.equal(
      summary.totals.netMinor,
      summary.totals.grossMinor - summary.totals.platformFeeMinor,
    );
  });

  test('an organiser with no events gets an empty report, not an error', async () => {
    const nobody = { _id: new mongoose.Types.ObjectId(), role: 'creator' };
    const summary = await revenueService.getRevenueSummary(nobody);

    assert.deepEqual(summary.events, []);
    assert.equal(summary.totals.grossMinor, 0);
  });

  const toMinor = (n) => Math.round(n * 100);

  // ─── Scope: platform revenue is the FEE, not the gross or the net ────────────

  test('platform revenue is the platform fee alone', async () => {
    const summary = await revenueService.getRevenueSummary(admin, {
      scope: 'platform',
    });

    // The distinction this whole feature exists for. Gross belongs to organisers; net is
    // what is paid away to them. Only the fee is TicketFlow's income, and reporting either
    // of the others as platform revenue overstates it by more than an order of magnitude.
    assert.equal(
      summary.totals.platformFeeMinor,
      summary.events.reduce((s, e) => s + e.platformFeeMinor, 0),
    );
    assert.ok(
      summary.totals.platformFeeMinor < summary.totals.netMinor,
      'the fee must be far smaller than what organisers are paid',
    );
    assert.ok(
      summary.totals.grossMinor >
        summary.totals.platformFeeMinor + summary.totals.netMinor - 1,
      'gross must reconcile as fee + net',
    );
  });

  test("an admin's own scope excludes other organisers' events", async () => {
    const own = await revenueService.getRevenueSummary(admin, { scope: 'own' });
    const names = own.events.map((e) => e.eventName);

    assert.equal(own.scope, 'own');
    assert.ok(names.includes('Admin Own Event'));
    assert.ok(!names.includes('Alice Revenue Event'));
    assert.ok(!names.includes('Bob Revenue Event'));
  });

  test('a non-admin cannot request platform scope', async () => {
    // Enforced in the service, not the route, so no other caller can bypass it.
    await assert.rejects(
      () => revenueService.getRevenueSummary(alice, { scope: 'platform' }),
      (err) => err.statusCode === 403,
    );
  });

  test('an unknown scope is refused rather than silently defaulted', async () => {
    await assert.rejects(
      () => revenueService.getRevenueSummary(admin, { scope: 'everything' }),
      (err) => err.statusCode === 400,
    );
  });

  // ─── Daily series ─────────────────────────────────────────────────────────────

  test('the daily series reconciles with the totals', async () => {
    const summary = await revenueService.getRevenueSummary(admin, {
      scope: 'platform',
    });

    const seriesGross = summary.series.reduce((s, d) => s + d.grossMinor, 0);
    const seriesFee = summary.series.reduce(
      (s, d) => s + d.platformFeeMinor,
      0,
    );

    // A chart that disagrees with the headline figure above it is worse than no chart.
    assert.equal(seriesGross, summary.totals.grossMinor);
    assert.equal(seriesFee, summary.totals.platformFeeMinor);
  });

  test('days with no sales are present as zeroes, not skipped', async () => {
    const summary = await revenueService.getRevenueSummary(admin, {
      scope: 'platform',
    });

    // Omitting empty days silently compresses time and makes a quiet week look like
    // continuous trading. Every date between the first and last sale must appear.
    const dates = summary.series.map((d) => d.date);
    assert.deepEqual(dates, [...dates].sort(), 'series must be chronological');

    for (let i = 1; i < dates.length; i += 1) {
      const gap = (new Date(dates[i]) - new Date(dates[i - 1])) / 86_400_000;
      assert.equal(gap, 1, `gap between ${dates[i - 1]} and ${dates[i]}`);
    }
  });
}
