import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import Event from '../../src/models/eventModel.js';
import Booking from '../../src/models/bookingModel.js';
import * as bookingService from '../../src/services/bookingService.js';
import {
  connect,
  disconnect,
  buildEvent,
  createPayableOrganiser,
  skipReason,
} from '../helpers/db.js';

/**
 * Proves the purchase flow's money-safety invariants.
 *
 * The failure this closes: the client used to pay first and create the booking afterwards,
 * so a dropped callback took the buyer's money and left no booking, and inventory was only
 * decremented after payment, so two buyers could both pay for the last seat. Seats are now
 * held before checkout, and every exit from that hold - confirmed, failed, or abandoned -
 * has to leave the inventory correct.
 */

if (skipReason) {
  test(
    'reservation lifecycle (DB integration)',
    { skip: skipReason },
    () => {},
  );
} else {
  const buyer = (overrides = {}) => ({
    name: 'Buyer',
    email: 'buyer@example.com',
    ticketType: 'General',
    ticketId: `#${Math.random().toString(36).slice(2, 9).toUpperCase()}`,
    ticketUser: 'Guest',
    currency: 'NGN',
    price: 100,
    ...overrides,
  });

  const seatsLeft = async (eventId) => {
    const fresh = await Event.findById(eventId);
    return fresh.ticketDetails.find((t) => t.ticketName === 'General')
      .ticketQuantity;
  };

  // A paid event needs an organiser who can actually be paid: checkout refuses to sell
  // tickets for an event whose organiser has no payout account.
  let organiser;

  before(async () => {
    await connect();
    organiser = await createPayableOrganiser();
  });

  after(async () => {
    await Booking.deleteMany({ email: /example\.com$/ });
    await Event.deleteMany({ eventName: 'Test Event' });
    const User = (await import('../../src/models/userModel.js')).default;
    await User.deleteMany({ _id: organiser._id });
    await disconnect();
  });

  test('reserving holds the seats and leaves the booking pending, unpaid', async () => {
    const event = await Event.create(
      buildEvent({
        user: organiser._id,
        ticketDetails: [
          { ticketName: 'General', ticketPrice: 100, ticketQuantity: 5 },
        ],
      }),
    );

    const { reference, requiresPayment } = await bookingService.reserveBooking(
      [buyer(), buyer()],
      event._id,
    );

    assert.equal(requiresPayment, true, 'a paid event must require payment');
    assert.equal(await seatsLeft(event._id), 3, 'seats are held immediately');

    const held = await Booking.find({ reference });
    assert.equal(held.length, 2);
    assert.ok(
      held.every((b) => b.transactionStatus === 'pending'),
      'bookings wait for payment confirmation',
    );
    assert.ok(
      held.every((b) => b.reservationExpiresAt instanceof Date),
      'every held booking carries an expiry',
    );
  });

  test('a failed charge returns the seats to inventory', async () => {
    const event = await Event.create(
      buildEvent({
        user: organiser._id,
        ticketDetails: [
          { ticketName: 'General', ticketPrice: 100, ticketQuantity: 2 },
        ],
      }),
    );

    const { reference } = await bookingService.reserveBooking(
      [buyer()],
      event._id,
    );
    assert.equal(await seatsLeft(event._id), 1);

    const released = await bookingService.releaseReservation(
      reference,
      'failed',
    );
    assert.equal(released.released, true);
    assert.equal(released.seats, 1);
    assert.equal(
      await seatsLeft(event._id),
      2,
      'an abandoned checkout must not shrink sellable inventory',
    );

    const [booking] = await Booking.find({ reference });
    assert.equal(booking.transactionStatus, 'failed');
    assert.equal(
      booking.status,
      'revoked',
      'a released ticket cannot be admitted',
    );
  });

  test('releasing twice does not credit the seats twice', async () => {
    const event = await Event.create(
      buildEvent({
        user: organiser._id,
        ticketDetails: [
          { ticketName: 'General', ticketPrice: 100, ticketQuantity: 3 },
        ],
      }),
    );

    const { reference } = await bookingService.reserveBooking(
      [buyer()],
      event._id,
    );

    const first = await bookingService.releaseReservation(reference, 'failed');
    const second = await bookingService.releaseReservation(reference, 'failed');

    assert.equal(first.released, true);
    assert.equal(second.released, false, 'the second release is a no-op');
    assert.equal(await seatsLeft(event._id), 3, 'inventory is credited once');
  });

  test('concurrent releases of one reservation credit the seats once', async () => {
    const event = await Event.create(
      buildEvent({
        user: organiser._id,
        ticketDetails: [
          { ticketName: 'General', ticketPrice: 100, ticketQuantity: 4 },
        ],
      }),
    );

    const { reference } = await bookingService.reserveBooking(
      [buyer(), buyer()],
      event._id,
    );
    assert.equal(await seatsLeft(event._id), 2);

    // The webhook and the expiry sweep can genuinely race here.
    const [a, b] = await Promise.all([
      bookingService.releaseReservation(reference, 'failed'),
      bookingService.releaseReservation(reference, 'expired'),
    ]);

    const winners = [a, b].filter((r) => r.released);
    assert.equal(winners.length, 1, 'exactly one release may take effect');
    assert.equal(await seatsLeft(event._id), 4);
  });

  test('an expired hold is swept, and a live one is left alone', async () => {
    const event = await Event.create(
      buildEvent({
        user: organiser._id,
        ticketDetails: [
          { ticketName: 'General', ticketPrice: 100, ticketQuantity: 6 },
        ],
      }),
    );

    const stale = await bookingService.reserveBooking([buyer()], event._id);
    const live = await bookingService.reserveBooking([buyer()], event._id);
    assert.equal(await seatsLeft(event._id), 4);

    // Age the first reservation past its hold.
    await Booking.updateMany(
      { reference: stale.reference },
      { $set: { reservationExpiresAt: new Date(Date.now() - 1000) } },
    );

    const swept = await bookingService.releaseExpiredReservations();
    assert.equal(swept.references, 1);
    assert.equal(swept.seats, 1);
    assert.equal(
      await seatsLeft(event._id),
      5,
      'only the lapsed hold is returned',
    );

    const stillHeld = await Booking.find({ reference: live.reference });
    assert.ok(
      stillHeld.every((b) => b.transactionStatus === 'pending'),
      'a reservation inside its window is untouched',
    );
  });

  test('a confirmed reservation is never released by the sweep', async () => {
    const event = await Event.create(
      buildEvent({
        user: organiser._id,
        ticketDetails: [
          { ticketName: 'General', ticketPrice: 100, ticketQuantity: 2 },
        ],
      }),
    );

    const { reference } = await bookingService.reserveBooking(
      [buyer()],
      event._id,
    );
    await bookingService.confirmReservation(reference, {
      transactionNumber: 1234,
    });

    // Even if the row is somehow aged, a paid booking must not lose its seat.
    await Booking.updateMany(
      { reference },
      { $set: { reservationExpiresAt: new Date(Date.now() - 1000) } },
    );

    const swept = await bookingService.releaseExpiredReservations();
    assert.equal(swept.seats, 0);
    assert.equal(await seatsLeft(event._id), 1, 'the paid seat stays sold');

    const [booking] = await Booking.find({ reference });
    assert.equal(booking.transactionStatus, 'success');
    assert.notEqual(booking.status, 'revoked');
  });

  test('confirming twice reports the second call as a no-op', async () => {
    const event = await Event.create(
      buildEvent({
        user: organiser._id,
        ticketDetails: [
          { ticketName: 'General', ticketPrice: 100, ticketQuantity: 2 },
        ],
      }),
    );

    const { reference } = await bookingService.reserveBooking(
      [buyer()],
      event._id,
    );

    // Paystack retries webhooks, and the browser callback confirms too.
    const first = await bookingService.confirmReservation(reference);
    const second = await bookingService.confirmReservation(reference);

    assert.equal(first.confirmed, true);
    assert.equal(
      second.confirmed,
      false,
      'only one confirmation may deliver tickets',
    );
  });
}
