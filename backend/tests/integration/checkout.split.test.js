import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import Event from '../../src/models/eventModel.js';
import Booking from '../../src/models/bookingModel.js';
import User from '../../src/models/userModel.js';
import * as bookingService from '../../src/services/bookingService.js';
import * as eventRepository from '../../src/repositories/eventRepository.js';
import { platformFeeMinor } from '../../src/services/pricingService.js';
import { connect, disconnect, buildEvent, skipReason } from '../helpers/db.js';

/**
 * Checkout split and price authority, end to end against a real database.
 *
 * The unit tests prove the arithmetic; these prove the wiring - that the organiser's
 * subaccount is actually loaded and reaches the checkout config, that a client-supplied
 * price is really overwritten on the persisted booking, and that an organiser without a
 * payout account cannot sell tickets.
 */

if (skipReason) {
  test('checkout split (DB integration)', { skip: skipReason }, () => {});
} else {
  const PUBLIC_KEY = 'pk_test_integration';
  let paidOrganiser;
  let unpaidOrganiser;
  let paidEventId;
  let unpaidEventId;

  const TIERS = [
    {
      ticketName: 'General',
      ticketPrice: 5000,
      ticketQuantity: 100,
      minimumBuyingLimit: 1,
      maximumBuyingLimit: 10,
    },
    {
      ticketName: 'VIP',
      ticketPrice: 25000,
      ticketQuantity: 50,
      minimumBuyingLimit: 1,
      maximumBuyingLimit: 10,
    },
  ];

  before(async () => {
    process.env.PAYSTACK_PUBLIC_KEY = PUBLIC_KEY;
    await connect();

    paidOrganiser = await User.create({
      name: 'Paid Organiser',
      email: 'paid-organiser@example.com',
      password: 'test-password-123',
      passwordConfirm: 'test-password-123',
      payout: {
        subaccountCode: 'ACCT_integration',
        bankName: 'Test Bank',
        bankCode: '001',
        accountNameMasked: 'PAID ORGANISER',
        accountNumberLast4: '6789',
        platformFeePercent: 3,
        connectedAt: new Date(),
      },
    });

    unpaidOrganiser = await User.create({
      name: 'Unpaid Organiser',
      email: 'unpaid-organiser@example.com',
      password: 'test-password-123',
      passwordConfirm: 'test-password-123',
    });

    const paidEvent = await Event.create(
      buildEvent({
        eventName: 'Split Test Event',
        user: paidOrganiser._id,
        currency: 'NGN',
        ticketDetails: TIERS,
      }),
    );
    paidEventId = paidEvent._id;

    const unpaidEvent = await Event.create(
      buildEvent({
        eventName: 'Unpaid Test Event',
        user: unpaidOrganiser._id,
        currency: 'NGN',
        ticketDetails: TIERS,
      }),
    );
    unpaidEventId = unpaidEvent._id;
  });

  after(async () => {
    await Promise.all([
      Event.deleteMany({
        eventName: { $in: ['Split Test Event', 'Unpaid Test Event'] },
      }),
      Booking.deleteMany({ email: 'buyer@example.com' }),
      User.deleteMany({
        email: {
          $in: ['paid-organiser@example.com', 'unpaid-organiser@example.com'],
        },
      }),
    ]);
    await disconnect();
  });

  test('the organiser subaccount is actually loaded despite being select:false', async () => {
    // Pinned deliberately. `payout.subaccountCode` is select:false, so a repository method
    // that forgets `+payout.subaccountCode` sees undefined and concludes the organiser has
    // no payout account - failing open into "cannot sell tickets" with no error to explain
    // it. The root-admin guard was broken by exactly this once already.
    const event = await eventRepository.findByIdWithPayoutAccount(paidEventId);
    assert.equal(event.user.payout.subaccountCode, 'ACCT_integration');
  });

  test('checkout returns a split routed to the organiser', async () => {
    const { checkout, requiresPayment } = await bookingService.reserveBooking(
      [
        {
          name: 'Buyer',
          email: 'buyer@example.com',
          ticketType: 'General',
          ticketUser: 'Guest',
        },
      ],
      paidEventId,
      undefined,
    );

    assert.equal(requiresPayment, true);
    assert.equal(checkout.subaccount, 'ACCT_integration');
    assert.equal(checkout.bearer, 'subaccount');
    assert.equal(checkout.publicKey, PUBLIC_KEY);
    assert.equal(checkout.currency, 'NGN');
    // 5,000 NGN = 500,000 kobo; the platform's 3% = 15,000 kobo.
    assert.equal(checkout.amount, 500_000);
    assert.equal(checkout.transaction_charge, platformFeeMinor(500_000));
    assert.equal(checkout.transaction_charge, 15_000);
  });

  test('a client-supplied price does not reach the persisted booking', async () => {
    // The original defect, end to end: this payload claims a 25,000 NGN VIP ticket costs 1.
    const { reference, checkout } = await bookingService.reserveBooking(
      [
        {
          name: 'Buyer',
          email: 'buyer@example.com',
          ticketType: 'VIP',
          price: 1,
          currency: 'USD',
          ticketUser: 'Guest',
        },
      ],
      paidEventId,
      undefined,
    );

    const [booking] = await Booking.find({ reference });
    assert.equal(booking.price, 25000, 'price must come from the event tier');
    assert.equal(booking.currency, 'NGN', 'currency must come from the event');
    assert.equal(checkout.amount, 2_500_000);
  });

  test('the amount owed is recomputed from stored prices, not the request', async () => {
    const { reference } = await bookingService.reserveBooking(
      [
        {
          name: 'Buyer',
          email: 'buyer@example.com',
          ticketType: 'General',
          price: 1,
          ticketUser: 'Guest',
        },
      ],
      paidEventId,
      undefined,
    );

    // This is what payment confirmation compares the actual charge against, so it must
    // reflect the event's price rather than anything the payer influenced.
    const owed = await bookingService.expectedAmountMinor(reference);
    assert.equal(owed, 500_000);
  });

  test('an unknown ticket type is refused before any seat is held', async () => {
    await assert.rejects(
      () =>
        bookingService.reserveBooking(
          [
            {
              name: 'Buyer',
              email: 'buyer@example.com',
              ticketType: 'Backstage',
              ticketUser: 'Guest',
            },
          ],
          paidEventId,
          undefined,
        ),
      (err) => err.statusCode === 400,
    );

    const leaked = await Booking.find({
      event: paidEventId,
      ticketType: 'Backstage',
    });
    assert.equal(
      leaked.length,
      0,
      'no booking should survive a rejected price',
    );
  });

  test('an organiser with no payout account cannot sell tickets', async () => {
    // Refusing is the point: charging anyway would settle the whole amount into the
    // platform account, invisibly to both the organiser and the buyer - precisely the
    // silent revenue retention this feature exists to remove.
    await assert.rejects(
      () =>
        bookingService.reserveBooking(
          [
            {
              name: 'Buyer',
              email: 'buyer@example.com',
              ticketType: 'General',
              ticketUser: 'Guest',
            },
          ],
          unpaidEventId,
          undefined,
        ),
      (err) => err.statusCode === 409 && /payout/i.test(err.message),
    );
  });
}
