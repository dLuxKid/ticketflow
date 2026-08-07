"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";

import {
  useBanks,
  useConnectPayout,
  usePayout,
  useResolveAccount,
} from "@/store/usePayout";

/**
 * Payout onboarding - connecting the bank account an organiser's ticket revenue is settled
 * to, and the only place the platform fee is stated to them.
 *
 * The flow is deliberately two-step: enter the account, then **confirm the name it resolves
 * to** before anything is saved. A mistyped digit would otherwise route an entire event's
 * revenue to a stranger's account, and bank transfers are not reversible on request. The
 * confirmation has to happen while the mistake is still free to make.
 */

const field =
  "h-12 w-full rounded-big border border-main-light-grey bg-main-grey-bg px-4 text-sm text-main-black transition-colors placeholder:text-sec-black/50 focus:border-main-purple/60 focus:bg-main-white focus:outline-none";

export default function PayoutsPage() {
  const { data: payout, isLoading } = usePayout();
  const {
    data: banks,
    isLoading: banksLoading,
    error: banksError,
  } = useBanks();

  const [bankCode, setBankCode] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [resolvedName, setResolvedName] = useState<string | null>(null);

  const resolve = useResolveAccount();
  const connect = useConnectPayout();

  const canResolve = /^\d{10}$/.test(accountNumber) && bankCode !== "";

  const sortedBanks = useMemo(
    () => [...(banks ?? [])].sort((a, b) => a.name.localeCompare(b.name)),
    [banks],
  );

  const onResolve = () => {
    setResolvedName(null);
    resolve.mutate(
      { accountNumber, bankCode },
      {
        onSuccess: (account) => setResolvedName(account.accountName),
        onError: (err: any) =>
          toast.error(
            err?.response?.data?.message ??
              "We could not verify that account. Check the number and bank.",
          ),
      },
    );
  };

  const onConnect = () => {
    connect.mutate(
      { accountNumber, bankCode, businessName },
      {
        onSuccess: () => {
          toast.success("Payout account connected");
          setAccountNumber("");
          setResolvedName(null);
          setBusinessName("");
        },
        onError: (err: any) =>
          toast.error(
            err?.response?.data?.message ??
              "Could not connect that payout account",
          ),
      },
    );
  };

  if (isLoading) {
    return <p className="body-text text-sec-black/70">Loading payout details…</p>;
  }

  return (
    <div className="flex flex-col gap-8">
      <header>
        <h1 className="sub-title-text text-main-black">Payouts</h1>
        <p className="body-text mt-1 text-sec-black/70">
          Where the money from your ticket sales is paid.
        </p>
      </header>

      {payout?.connected ? (
        <section className="rounded-big border border-main-purple/20 bg-main-purple/5 p-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-main-purple">
                Connected
              </p>
              <p className="mt-2 text-base font-semibold text-main-black">
                {payout.accountName}
              </p>
              <p className="text-sm text-sec-black/70">
                {payout.bankName} ···· {payout.accountNumberLast4}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-sec-black/70">Platform fee</p>
              <p className="text-lg font-bold text-main-black">
                {payout.platformFeePercent}%
              </p>
            </div>
          </div>
          <p className="mt-4 text-sm text-sec-black/70">
            You receive the ticket price minus the {payout.platformFeePercent}%
            platform fee and the payment provider&apos;s processing charge.
            Paystack settles it to this account directly - TicketFlow never
            holds your money.
          </p>
        </section>
      ) : (
        <section className="rounded-big border border-amber-300/60 bg-amber-50 p-5">
          <p className="text-sm font-semibold text-amber-900">
            No payout account connected
          </p>
          <p className="mt-1 text-sm text-amber-900/80">
            Your paid events cannot sell tickets until you add one. Free events
            are unaffected.
          </p>
        </section>
      )}

      <section className="flex flex-col gap-4">
        <h2 className="text-base font-bold text-main-black">
          {payout?.connected ? "Change payout account" : "Add a payout account"}
        </h2>

        {/* An empty dropdown with no explanation is the worst possible failure here: the
            organiser cannot tell whether the page is broken, still loading, or waiting on
            them. Say which, and say what to do about it. */}
        {banksError && (
          <div
            role="alert"
            className="rounded-big border border-red-300/60 bg-red-50 p-4"
          >
            <p className="text-sm font-semibold text-red-900">
              Could not load the bank list
            </p>
            <p className="mt-1 text-sm text-red-900/80">
              {(banksError as any)?.response?.data?.message ??
                "The payment provider could not be reached."}{" "}
              Payouts cannot be set up until this is resolved - if you run this
              deployment, check that the Paystack keys are configured.
            </p>
          </div>
        )}

        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-main-black">Bank</span>
          <select
            className={field}
            value={bankCode}
            onChange={(e) => {
              setBankCode(e.target.value);
              setResolvedName(null);
            }}
          >
            <option value="">
              {banksLoading
                ? "Loading banks…"
                : banksError
                  ? "Bank list unavailable"
                  : sortedBanks.length === 0
                    ? "No banks available"
                    : "Select your bank"}
            </option>
            {sortedBanks.map((bank) => (
              <option key={`${bank.code}-${bank.name}`} value={bank.code}>
                {bank.name}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-main-black">
            Account number
          </span>
          <input
            className={field}
            inputMode="numeric"
            maxLength={10}
            placeholder="10-digit account number"
            value={accountNumber}
            onChange={(e) => {
              // Digits only: the API requires exactly ten, and silently stripping
              // separators is friendlier than rejecting a number the user typed with them.
              setAccountNumber(e.target.value.replace(/\D/g, "").slice(0, 10));
              setResolvedName(null);
            }}
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-main-black">
            Business name{" "}
            <span className="font-normal text-sec-black/60">(optional)</span>
          </span>
          <input
            className={field}
            placeholder="Shown on your payout statements"
            value={businessName}
            onChange={(e) => setBusinessName(e.target.value)}
          />
        </label>

        {resolvedName ? (
          <div className="rounded-big border border-emerald-300/60 bg-emerald-50 p-4">
            <p className="text-sm text-emerald-900/80">
              This account belongs to
            </p>
            <p className="text-base font-semibold text-emerald-900">
              {resolvedName}
            </p>
            <p className="mt-2 text-sm text-emerald-900/80">
              Confirm this is correct before connecting - payments to a wrong
              account cannot be reversed.
            </p>
            <button
              type="button"
              onClick={onConnect}
              disabled={connect.isPending}
              className="mt-4 inline-flex h-11 items-center justify-center rounded-full bg-main-purple px-6 text-sm font-semibold text-main-white transition-all hover:bg-main-purple/90 disabled:opacity-60"
            >
              {connect.isPending ? "Connecting…" : "Yes, connect this account"}
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={onResolve}
            disabled={!canResolve || resolve.isPending}
            className="inline-flex h-12 w-full items-center justify-center rounded-full bg-main-purple px-6 text-sm font-semibold text-main-white transition-all hover:bg-main-purple/90 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
          >
            {resolve.isPending ? "Checking…" : "Verify account"}
          </button>
        )}

        <p className="text-xs text-sec-black/60">
          TicketFlow stores only the last four digits of your account number and
          a reference from the payment provider. Your full account details stay
          with Paystack.
        </p>
      </section>
    </div>
  );
}
