import * as userRepository from '../repositories/userRepository.js';
import { PLATFORM_FEE_PERCENT } from './pricingService.js';
import AppError from '../shared/errors/AppError.js';

/**
 * Organiser payout onboarding - connecting a bank account so ticket revenue can be split
 * to it at checkout.
 *
 * Three calls to Paystack, each doing one job:
 *   1. `listBanks`      - the banks a user may choose from (their codes are Paystack's).
 *   2. `resolveAccount` - turns a bank + account number into the registered account NAME,
 *                         so the organiser confirms who will be paid before committing.
 *   3. `createSubaccount` - registers the destination and returns the `ACCT_...` code that
 *                         the split at checkout routes to.
 *
 * Step 2 exists to prevent the most likely and least recoverable failure in this flow:
 * a mistyped digit sending an event's entire revenue to a stranger's account. Bank
 * transfers are not reversible on request, so the confirmation has to happen before the
 * money exists, not after.
 *
 * Written against the REST API with `fetch` and no SDK, matching how `paystack.js` and
 * `llmProvider.js` already talk to third parties - one less dependency in the money path,
 * and the request shape stays visible at the call site.
 */

const PAYSTACK_API = 'https://api.paystack.co';

const secretKey = () => {
  const key = process.env.PAYSTACK_SECRET_KEY;
  if (!key) {
    throw new AppError('Payouts are not configured on this deployment', 503);
  }
  return key;
};

/**
 * One place that knows how to call Paystack and how to read its failures, so every caller
 * surfaces the provider's own message rather than a generic one. Paystack explains refusals
 * usefully ("Account number is invalid", "Unknown bank code") and an organiser stuck on
 * this screen needs that text, not "request failed".
 */
const paystackRequest = async (
  path,
  options = {},
  fetchImpl = fetch,
  { requiresAuth = true } = {},
) => {
  let res;
  try {
    res = await fetchImpl(`${PAYSTACK_API}${path}`, {
      ...options,
      headers: {
        // The bank directory is public data and Paystack serves it unauthenticated. Demanding
        // a secret key for it coupled the *first* step of payout onboarding to a key that a
        // deployment may not have configured yet - which presented as an empty bank dropdown
        // with no explanation, exactly when the organiser is trying to set payments up.
        ...(requiresAuth ? { Authorization: `Bearer ${secretKey()}` } : {}),
        'Content-Type': 'application/json',
        ...(options.headers ?? {}),
      },
    });
  } catch (err) {
    // Network-level failure: the provider is unreachable, which is not the caller's fault
    // and should not read as a validation error.
    throw new AppError(
      `Could not reach the payment provider: ${err.message}`,
      502,
    );
  }

  const body = await res.json().catch(() => ({}));

  if (!res.ok || body?.status === false) {
    throw new AppError(
      body?.message || 'The payment provider rejected that request',
      // 4xx from Paystack is nearly always bad input from the organiser; anything else is
      // an upstream problem and should not be presented as their mistake.
      res.status >= 400 && res.status < 500 ? 400 : 502,
    );
  }

  return body?.data;
};

/**
 * Banks available for payout, for the onboarding dropdown.
 *
 * @param {string} [country] - Paystack's country slug
 * @returns {Promise<{name:string, code:string, currency:string}[]>}
 */
export const listBanks = async (country = 'nigeria', fetchImpl = fetch) => {
  const data = await paystackRequest(
    `/bank?country=${encodeURIComponent(country)}`,
    { method: 'GET' },
    fetchImpl,
    { requiresAuth: false },
  );

  // Narrowed to the three fields the picker needs. Paystack returns a large record per bank
  // and passing it through would put fields in the client bundle that nothing reads.
  //
  // Inactive and deleted banks are filtered out: they are still returned by the directory
  // but cannot receive a payout, and offering one only produces a failure two steps later
  // at account resolution.
  return (data ?? [])
    .filter((bank) => bank.active !== false && bank.is_deleted !== true)
    .map((bank) => ({
      name: bank.name,
      code: bank.code,
      currency: bank.currency,
    }));
};

/**
 * Resolves a bank account to the name it is registered under.
 *
 * @returns {Promise<{accountName:string, accountNumber:string}>}
 */
export const resolveAccount = async (
  { accountNumber, bankCode },
  fetchImpl = fetch,
) => {
  if (!/^\d{10}$/.test(String(accountNumber ?? ''))) {
    throw new AppError('Enter a valid 10-digit account number', 400);
  }
  if (!bankCode) throw new AppError('Select the bank for this account', 400);

  const data = await paystackRequest(
    `/bank/resolve?account_number=${encodeURIComponent(accountNumber)}&bank_code=${encodeURIComponent(bankCode)}`,
    { method: 'GET' },
    fetchImpl,
  );

  return {
    accountName: data?.account_name,
    accountNumber: String(data?.account_number ?? accountNumber),
  };
};

/** Keeps only the last four digits of an account number for display. */
export const maskAccountNumber = (accountNumber) => {
  const digits = String(accountNumber ?? '').replace(/\D/g, '');
  return digits.slice(-4);
};

/**
 * Creates the organiser's Paystack subaccount and stores the reference to it.
 *
 * `percentage_charge` is sent because Paystack requires it, but nothing in this system
 * relies on it: every transaction overrides the split with an explicit `transaction_charge`
 * computed server-side (see pricingService.buildSplit). That is deliberate - the direction
 * of `percentage_charge` is ambiguous in Paystack's documentation, and a field whose
 * meaning cannot be verified must not be the thing that decides who gets paid.
 *
 * @param {object} user - the organiser (must be a persisted user document/id)
 * @param {{bankCode:string, accountNumber:string, businessName?:string}} details
 * @returns {Promise<object>} the stored, non-sensitive payout summary
 */
export const connectPayoutAccount = async (
  user,
  { bankCode, accountNumber, businessName },
  deps = {},
) => {
  const {
    resolve = resolveAccount,
    request = paystackRequest,
    banks = listBanks,
  } = deps;

  if (!user?._id) throw new AppError('You must be signed in', 401);

  // Confirm the account exists and learn whose it is, before creating anything.
  const { accountName } = await resolve({ accountNumber, bankCode });

  const bankList = await banks();
  const bank = bankList.find((b) => b.code === String(bankCode));
  if (!bank) throw new AppError('Select a supported bank', 400);

  const data = await request('/subaccount', {
    method: 'POST',
    body: JSON.stringify({
      business_name: businessName?.trim() || accountName || user.name,
      bank_code: String(bankCode),
      account_number: String(accountNumber),
      percentage_charge: PLATFORM_FEE_PERCENT,
    }),
  });

  const subaccountCode = data?.subaccount_code;
  if (!subaccountCode) {
    throw new AppError(
      'The payment provider did not return a payout account reference',
      502,
    );
  }

  const payout = {
    subaccountCode,
    bankName: bank.name,
    bankCode: String(bankCode),
    accountNameMasked: accountName,
    accountNumberLast4: maskAccountNumber(accountNumber),
    platformFeePercent: PLATFORM_FEE_PERCENT,
    connectedAt: new Date(),
  };

  await userRepository.updateById(user._id, { payout });

  return describePayout(payout);
};

/**
 * Loads and describes one user's payout setup. Exists so the controller never has to reach
 * for a repository - the layering rule this codebase relies on for testability.
 */
export const getPayoutFor = async (userId) => {
  const user = await userRepository.findByIdWithPayout(userId);
  return describePayout(user?.payout);
};

/**
 * The organiser-facing view of their payout setup. Never includes the subaccount code:
 * it is an identifier for the money path, not information the account holder needs, and
 * keeping it out of responses keeps it out of logs, screenshots and bug reports.
 */
export const describePayout = (payout) => {
  if (!payout?.subaccountCode && !payout?.connectedAt)
    return { connected: false };

  return {
    connected: true,
    bankName: payout.bankName,
    accountName: payout.accountNameMasked,
    accountNumberLast4: payout.accountNumberLast4,
    platformFeePercent: payout.platformFeePercent ?? PLATFORM_FEE_PERCENT,
    connectedAt: payout.connectedAt,
  };
};
