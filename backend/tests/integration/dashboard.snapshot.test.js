import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import Event from '../../src/models/eventModel.js';
import Booking from '../../src/models/bookingModel.js';
import * as dashboardService from '../../src/services/dashboardService.js';
import { connect, disconnect, buildEvent, skipReason } from '../helpers/db.js';

/**
 * Phase 3 - the dashboard snapshot reports capacity, sold and admitted counts correctly,
 * so a freshly-connected dashboard is populated before the next scan arrives.
 */

if (skipReason) {
  test('dashboard snapshot (DB integration)', { skip: skipReason }, () => {});
} else {
  let event;

  const seed = (status) =>
    Booking.create({
      event: event._id,
      email: 'g@example.com',
      name: 'Guest',
      price: 100,
      currency: 'NGN',
      transactionNumber: 1,
      ticketId: `TID-${Math.random()}`,
      ticketUser: 'Guest',
      transactionStatus: 'success',
      redirectUrl: 'https://x',
      message: 'ok',
      reference: 1,
      ticketType: 'General',
      status,
    });

  before(async () => {
    await connect();
    event = await Event.create(
      buildEvent({
        ticketDetails: [
          { ticketName: 'General', ticketPrice: 100, ticketQuantity: 50 },
        ],
        numberOfAttendees: 3,
      }),
    );
    await Promise.all([seed('admitted'), seed('admitted'), seed('issued')]);
  });

  after(async () => {
    await Promise.all([
      Event.deleteMany({ eventName: 'Test Event' }),
      Booking.deleteMany({ email: 'g@example.com' }),
    ]);
    await disconnect();
  });

  test('snapshot reflects capacity, sold and admitted', async () => {
    const snap = await dashboardService.getSnapshot(event._id);
    assert.equal(snap.capacity, 50);
    assert.equal(snap.sold, 3);
    assert.equal(snap.admitted, 2, 'only admitted bookings are counted');
  });

  test('snapshot includes a no-show prediction for the one pending booking', async () => {
    const snap = await dashboardService.getSnapshot(event._id);
    // Only the 'issued' booking from the before() seed is pending (not yet admitted).
    assert.equal(snap.noShow.pendingCount, 1);
    assert.ok(
      snap.noShow.averageProbability >= 0 &&
        snap.noShow.averageProbability <= 1,
    );
    assert.ok(Number.isInteger(snap.noShow.expectedNoShows));
  });
}
