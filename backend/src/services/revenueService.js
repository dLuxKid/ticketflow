import Booking from '../models/bookingModel.js';
import * as eventRepository from '../repositories/eventRepository.js';
import { platformFeeMinor, toMinorUnits } from './pricingService.js';
import AppError from '../shared/errors/AppError.js';

/**
 * Revenue reporting for organisers and administrators.
 *
 * **Two different questions, deliberately kept apart.**
 *
 *   - An **organiser** asks "what did my events take, and what am I due?" — their revenue is
 *     the *net* after the platform fee.
 *   - The **platform** asks "what did TicketFlow earn?" — that is the **fee alone**, not the
 *     gross and certainly not the net. Gross belongs to the organisers; net is what is paid
 *     away to them. Reporting either as platform revenue overstates it by more than an order
 *     of magnitude.
 *
 * An admin is usually also an organiser, so the two must not be merged into one figure:
 * `scope` selects which question is being asked, and the answer is framed accordingly.
 */

/**
 * The fee is computed **per transaction, then summed** — never as a percentage of the
 * grand total.
 *
 * `platformFeeMinor` rounds down, so 3% of ten separate ₦101 charges is ten lots of 3 kobo
 * (30), whereas 3% of ₦1,010 charged once is 30.3 → 30. Those agree here, but they do not in
 * general, and Paystack deducts per transaction. Reporting a figure derived differently from
 * the way the money actually moved would produce a statement that never reconciles with the
 * provider's — the kind of discrepancy that is very hard to explain after the fact.
 */
const feeForTransactions = (grossByReference) =>
  grossByReference.reduce(
    (sum, grossMajor) => sum + platformFeeMinor(toMinorUnits(grossMajor)),
    0,
  );

/** Only confirmed purchases are money. Pending holds may never be paid; expired ones never will. */
const CONFIRMED_SALE = { source: 'purchase', transactionStatus: 'success' };

export const SCOPES = Object.freeze(['own', 'platform']);

/**
 * Per-event revenue, a daily series, and totals — for whatever the viewer is entitled to see.
 *
 * @param {object} user - the authenticated user
 * @param {{scope?: 'own'|'platform'}} [options]
 * @returns {Promise<object>}
 */
export const getRevenueSummary = async (user, { scope = 'own' } = {}) => {
  if (!SCOPES.includes(scope)) {
    throw new AppError(`Unknown revenue scope "${scope}"`, 400);
  }
  // Platform-wide figures are an administrative view, and the check lives here rather than
  // on the route so it cannot be bypassed by any other caller of this service.
  if (scope === 'platform' && user?.role !== 'admin') {
    throw new AppError(
      'Only an administrator can view platform-wide revenue',
      403,
    );
  }

  const events =
    scope === 'platform'
      ? await eventRepository.findAllForReporting()
      : await eventRepository.findByOwnerForReporting(user._id);

  const eventIds = events.map((e) => e._id);
  if (eventIds.length === 0) {
    return { scope, events: [], series: [], totals: empty() };
  }

  // Grouped by transaction first (`reference`), because that is the unit the fee is charged
  // on, then rolled up per event.
  const rows = await Booking.aggregate([
    { $match: { event: { $in: eventIds }, ...CONFIRMED_SALE } },
    {
      $group: {
        _id: { event: '$event', reference: '$reference' },
        grossMajor: { $sum: '$price' },
        tickets: { $sum: 1 },
      },
    },
    {
      $group: {
        _id: '$_id.event',
        transactions: { $sum: 1 },
        tickets: { $sum: '$tickets' },
        grossMajor: { $sum: '$grossMajor' },
        perTransactionGross: { $push: '$grossMajor' },
      },
    },
  ]);

  const byEvent = new Map(rows.map((r) => [String(r._id), r]));

  const summaries = events.map((event) => {
    const row = byEvent.get(String(event._id));
    const feeMinor = row ? feeForTransactions(row.perTransactionGross) : 0;
    const grossMinor = toMinorUnits(row?.grossMajor ?? 0);

    return {
      eventId: String(event._id),
      eventName: event.eventName,
      slug: event.slug,
      currency: event.currency,
      startDate: event.startDate,
      organiser: event.user?.name,
      ticketsSold: row?.tickets ?? 0,
      transactions: row?.transactions ?? 0,
      grossMinor,
      platformFeeMinor: feeMinor,
      // What the organiser is due from the provider, before Paystack's own processing
      // charge — which they bear (`bearer: 'subaccount'`) and which this system never sees.
      netMinor: grossMinor - feeMinor,
    };
  });

  summaries.sort((a, b) => b.grossMinor - a.grossMinor);

  return {
    scope,
    events: summaries,
    series: await dailySeries(eventIds),
    totals: summaries.reduce(
      (acc, e) => ({
        events: acc.events + 1,
        eventsWithSales: acc.eventsWithSales + (e.ticketsSold > 0 ? 1 : 0),
        ticketsSold: acc.ticketsSold + e.ticketsSold,
        transactions: acc.transactions + e.transactions,
        grossMinor: acc.grossMinor + e.grossMinor,
        platformFeeMinor: acc.platformFeeMinor + e.platformFeeMinor,
        netMinor: acc.netMinor + e.netMinor,
      }),
      empty(),
    ),
  };
};

/**
 * Earnings per calendar day, for the trend chart.
 *
 * **Dated by `createdAt`** — when the booking was made. There is no separate `paidAt` on a
 * booking, and confirmation follows reservation within minutes, so this is the closest
 * honest proxy for the transaction date. It is stated here rather than left implicit because
 * a revenue chart dated by the wrong field is the sort of thing nobody notices until it is
 * being reconciled against a bank statement.
 *
 * Days with no sales are **filled with zeroes** rather than omitted: a line chart that skips
 * empty days silently compresses time and makes a quiet week look like continuous trading.
 */
const dailySeries = async (eventIds) => {
  const rows = await Booking.aggregate([
    { $match: { event: { $in: eventIds }, ...CONFIRMED_SALE } },
    {
      // Per transaction first, so the fee is calculated on the amount actually charged.
      $group: {
        _id: {
          day: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' },
          },
          reference: '$reference',
        },
        grossMajor: { $sum: '$price' },
        tickets: { $sum: 1 },
      },
    },
    {
      $group: {
        _id: '$_id.day',
        grossMajor: { $sum: '$grossMajor' },
        tickets: { $sum: '$tickets' },
        transactions: { $sum: 1 },
        perTransactionGross: { $push: '$grossMajor' },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  if (rows.length === 0) return [];

  const byDay = new Map(
    rows.map((r) => {
      const grossMinor = toMinorUnits(r.grossMajor);
      const feeMinor = feeForTransactions(r.perTransactionGross);
      return [
        r._id,
        {
          date: r._id,
          ticketsSold: r.tickets,
          transactions: r.transactions,
          grossMinor,
          platformFeeMinor: feeMinor,
          netMinor: grossMinor - feeMinor,
        },
      ];
    }),
  );

  const series = [];
  const cursor = new Date(`${rows[0]._id}T00:00:00Z`);
  const last = new Date(`${rows[rows.length - 1]._id}T00:00:00Z`);

  while (cursor <= last) {
    const key = cursor.toISOString().slice(0, 10);
    series.push(
      byDay.get(key) ?? {
        date: key,
        ticketsSold: 0,
        transactions: 0,
        grossMinor: 0,
        platformFeeMinor: 0,
        netMinor: 0,
      },
    );
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }

  return series;
};

const empty = () => ({
  events: 0,
  eventsWithSales: 0,
  ticketsSold: 0,
  transactions: 0,
  grossMinor: 0,
  platformFeeMinor: 0,
  netMinor: 0,
});
