import AppError from '../shared/errors/AppError.js';

/**
 * Server-authoritative pricing and the platform fee split.
 *
 * **Why this module exists.** `reserveBooking` used to spread the client's buyer objects
 * straight into the booking, so `price` was whatever the browser said it was - and the
 * Paystack popup was opened with a client-computed `amount` too. Nothing compared either
 * against the event's own ticket tiers, and `verifyTransaction` only checked that a charge
 * had *succeeded*, never that it was for the right amount. A buyer could therefore pay 1
 * naira for a 50,000 naira ticket and receive a valid, scannable ticket.
 *
 * That defect also makes a percentage fee meaningless: a percentage of a number the payer
 * chooses is not a fee. Price authority is therefore a prerequisite for the split below,
 * not a separate improvement.
 *
 * Everything here is pure - no database, no network - so the money arithmetic is unit
 * testable in isolation. The rule the rest of the system relies on: **the client may choose
 * WHAT to buy (ticket type and quantity); it may never choose what that costs.**
 */

/**
 * The platform's percentage cut of each paid ticket. Configurable so changing commercial
 * terms is a deployment decision rather than a code change, but with a default so the
 * system is never accidentally free.
 */
export const PLATFORM_FEE_PERCENT = Number(
  process.env.PLATFORM_FEE_PERCENT ?? 3,
);

/**
 * Currency used when an event does not name one.
 *
 * Events created before currency was captured have the field empty, and currency is now
 * stamped from the event rather than accepted from the request - so without a fallback
 * those events would fail booking validation instead of selling tickets. Falling back to
 * the *client's* value would defeat the point: currency is half of an amount, and a caller
 * free to pair a naira price with a cheaper code has simply found another way to underpay.
 * The default is therefore a server-side constant.
 */
export const DEFAULT_CURRENCY = process.env.DEFAULT_CURRENCY ?? 'NGN';

/**
 * Currencies Paystack can actually charge in.
 *
 * This list is a **payment-provider constraint, not a preference**. Events were previously
 * given a currency derived from their country — United Kingdom → GBP, Germany/France → EUR —
 * and neither is settleable by Paystack. Any organiser outside the supported set produced an
 * event whose tickets could never be bought: the charge would be rejected at the gateway,
 * after the buyer had already committed. Restricting the field at the point of creation turns
 * a payment-time failure into a form-time one.
 *
 * Kept in step with the `Currency` union in `react-paystack`, which is what the browser
 * checkout accepts; widening one without the other only moves the failure.
 */
export const SUPPORTED_CURRENCIES = Object.freeze([
  'NGN', // Nigerian naira
  'GHS', // Ghanaian cedi
  'ZAR', // South African rand
  'KES', // Kenyan shilling
  'USD', // US dollar
  'XOF', // West African CFA franc
]);

/** Is this a currency the payment provider will settle? */
export const isSupportedCurrency = (code) =>
  SUPPORTED_CURRENCIES.includes(String(code).toUpperCase());

/** Paystack (like most processors) works in the currency's minor unit - kobo, cents. */
export const MINOR_UNITS_PER_MAJOR = 100;

export const toMinorUnits = (majorAmount) =>
  Math.round(Number(majorAmount) * MINOR_UNITS_PER_MAJOR);

/**
 * The platform's cut of a transaction, in minor units.
 *
 * Rounded DOWN deliberately. Rounding a fee up takes money the organiser is owed on every
 * transaction where it makes a difference; over a large number of small tickets that is a
 * real sum, and it is the organiser - not the platform - who would have to notice it. When
 * a rounding rule can only favour one party, it should favour the party who did not write
 * it.
 *
 * @param {number} amountMinor - gross transaction amount in minor units
 * @param {number} [percent] - platform percentage
 * @returns {number} fee in minor units, never negative, never more than the amount
 */
export const platformFeeMinor = (
  amountMinor,
  percent = PLATFORM_FEE_PERCENT,
) => {
  const amount = Number(amountMinor);
  const pct = Number(percent);

  if (!Number.isFinite(amount) || amount <= 0) return 0;
  if (!Number.isFinite(pct) || pct <= 0) return 0;

  // Clamped so a misconfigured percentage can never invert the split and bill the organiser
  // more than the buyer actually paid.
  const fee = Math.floor((amount * Math.min(pct, 100)) / 100);
  return Math.max(0, Math.min(fee, amount));
};

/**
 * Resolves a requested ticket type against the event's own tiers.
 *
 * @param {object} event - the event document
 * @param {string} ticketType - the tier name the client asked for
 * @returns {object} the matching tier subdocument
 * @throws {AppError} 400 when the tier does not exist on this event
 */
export const findTier = (event, ticketType) => {
  const tiers = event?.ticketDetails ?? [];
  const tier = tiers.find((t) => t.ticketName === ticketType);

  if (!tier) {
    // Names the problem without echoing the client's string back into the message, which
    // would reflect unsanitised input into an error surface.
    throw new AppError('That ticket type is not available for this event', 400);
  }
  return tier;
};

/**
 * Rewrites each buyer with the price the EVENT says that tier costs, discarding whatever
 * the client claimed.
 *
 * Currency is stamped from the event for the same reason: it is half of an amount. A client
 * free to pair a naira price with a cheaper currency code has simply found a second way to
 * underpay.
 *
 * @param {object[]} ticketBuyers - buyer objects from the request
 * @param {object} event - the event document, with `ticketDetails`
 * @returns {{buyers: object[], totalMajor: number, totalMinor: number}}
 */
export const priceBuyers = (ticketBuyers, event) => {
  const buyers = ticketBuyers.map((buyer) => {
    const tier = findTier(event, buyer.ticketType);
    return {
      ...buyer,
      // Listed AFTER the spread so a client-supplied price or currency is overwritten
      // rather than trusted - the same ordering discipline reserveBooking already applies
      // to `event`, `reference` and `ticketId`.
      price: tier.ticketPrice,
      currency: event.currency || DEFAULT_CURRENCY,
    };
  });

  const totalMajor = buyers.reduce((sum, b) => sum + Number(b.price), 0);

  return { buyers, totalMajor, totalMinor: toMinorUnits(totalMajor) };
};

/**
 * Builds the split parameters for one Paystack transaction.
 *
 * **On `transaction_charge` rather than the subaccount's `percentage_charge`.** Paystack
 * subaccounts carry a stored `percentage_charge`, but the direction of that field (whether
 * it names the platform's cut or the organiser's share) is ambiguous in the documentation,
 * and this is money. `transaction_charge` is not ambiguous: it is an explicit amount in
 * minor units paid to the *main* account, and it overrides the stored configuration for
 * that transaction. Computing it here and sending it on **every** transaction means the
 * ambiguous field never decides who gets paid, whatever it happens to be set to.
 *
 * `bearer: 'subaccount'` puts Paystack's own processing fee on the organiser, so the
 * platform's margin is exactly `platformFeeMinor` and does not quietly shrink - or go
 * negative on a cheap ticket - as gateway pricing changes.
 *
 * @param {number} amountMinor - gross amount in minor units
 * @param {string} subaccountCode - the organiser's Paystack subaccount (ACCT_...)
 * @returns {{subaccount:string, transaction_charge:number, bearer:string}}
 */
export const buildSplit = (amountMinor, subaccountCode) => ({
  subaccount: subaccountCode,
  transaction_charge: platformFeeMinor(amountMinor),
  bearer: 'subaccount',
});
