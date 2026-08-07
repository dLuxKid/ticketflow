import Booking from '../models/bookingModel.js';
import * as eventRepository from '../repositories/eventRepository.js';
import { platformFeeMinor, toMinorUnits } from './pricingService.js';

/**
 * Revenue reporting for organisers and administrators.
 *
 * Answers two questions that the product previously could not answer at all: *what has this
 * event earned me, net of the platform fee*, and — for an administrator — *what has the
 * platform earned across every event*. Before this, the only financial figure anywhere was
 * a per-event "Gross Sales" total on one page, with no notion of the fee and no aggregate.
 *
 * Scope is the authorisation boundary: an organiser sees only events they own, an admin sees
 * every event. That decision is made here from `user.role`, not passed in by the caller.
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

/**
 * Per-event revenue, plus totals, for whatever the viewer is entitled to see.
 *
 * @param {object} user - the authenticated user (`role` decides scope)
 * @returns {Promise<{scope:string, events:object[], totals:object}>}
 */
export const getRevenueSummary = async (user) => {
  const isAdmin = user?.role === 'admin';

  // Admins report on the whole platform; everyone else only on what they own.
  const events = isAdmin
    ? await eventRepository.findAllForReporting()
    : await eventRepository.findByOwnerForReporting(user._id);

  const eventIds = events.map((e) => e._id);
  if (eventIds.length === 0) {
    return { scope: isAdmin ? 'platform' : 'own', events: [], totals: empty() };
  }

  // Grouped by transaction first (`reference`), because that is the unit the fee is charged
  // on. Only confirmed purchases count: pending holds have not been paid, and expired or
  // failed ones never will be, so including either would report money that does not exist.
  const rows = await Booking.aggregate([
    {
      $match: {
        event: { $in: eventIds },
        source: 'purchase',
        transactionStatus: 'success',
      },
    },
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
    const grossMajor = row?.grossMajor ?? 0;
    const feeMinor = row ? feeForTransactions(row.perTransactionGross) : 0;
    const grossMinor = toMinorUnits(grossMajor);

    return {
      eventId: String(event._id),
      eventName: event.eventName,
      slug: event.slug,
      currency: event.currency,
      startDate: event.startDate,
      // Present for admins so a platform-wide report names who each figure belongs to.
      organiser: event.user?.name,
      ticketsSold: row?.tickets ?? 0,
      transactions: row?.transactions ?? 0,
      grossMinor,
      platformFeeMinor: feeMinor,
      // What the organiser is due from the provider, before Paystack's own processing
      // charge — which they bear (`bearer: 'subaccount'`) and which this system never sees,
      // so it cannot be reported here without inventing it. Labelled accordingly in the UI.
      netMinor: grossMinor - feeMinor,
    };
  });

  // Busiest events first: a report opens on what matters, not on alphabetical order.
  summaries.sort((a, b) => b.grossMinor - a.grossMinor);

  return {
    scope: isAdmin ? 'platform' : 'own',
    events: summaries,
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

const empty = () => ({
  events: 0,
  eventsWithSales: 0,
  ticketsSold: 0,
  transactions: 0,
  grossMinor: 0,
  platformFeeMinor: 0,
  netMinor: 0,
});
