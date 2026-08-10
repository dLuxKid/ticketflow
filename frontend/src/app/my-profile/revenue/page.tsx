"use client";

import Link from "next/link";
import { useState } from "react";

import EarningsTrend from "@/components/ui/earnings-trend";
import { useRevenue, type RevenueRow } from "@/store/useRevenue";
import { useUser } from "@/store/useUser";

/**
 * Revenue reporting.
 *
 * **The distinction this page exists to make.** An organiser's revenue is the *net* after
 * the platform fee. The platform's revenue is the **fee alone** — not the gross (which
 * belongs to organisers) and not the net (which is paid away to them). Reporting either of
 * those as platform income overstates it by more than an order of magnitude.
 *
 * An admin is usually also an organiser, so the two are separate tabs rather than one merged
 * figure: "My events" answers *what am I owed*, "Platform" answers *what did TicketFlow
 * earn*. Non-admins only ever see the first, and the server enforces that independently.
 */

const money = (minor: number, currency: string) =>
  new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: currency || "NGN",
    maximumFractionDigits: 2,
  }).format(minor / 100);

function Stat({
  label,
  value,
  hint,
  emphasis,
}: {
  label: string;
  value: string;
  hint?: string;
  emphasis?: boolean;
}) {
  return (
    <div
      className={`rounded-big border p-4 ${
        emphasis
          ? "border-main-purple/30 bg-main-purple/5"
          : "border-main-light-grey/70 bg-main-grey-bg"
      }`}
    >
      <p className="text-xs uppercase tracking-[0.12em] text-sec-black/60">
        {label}
      </p>
      <p className="mt-1 text-xl font-bold text-main-black">{value}</p>
      {hint && <p className="mt-1 text-xs text-sec-black/60">{hint}</p>}
    </div>
  );
}

export default function RevenuePage() {
  const { data: me } = useUser();
  const isAdmin = me?.data?.user?.role === "admin";

  const [scope, setScope] = useState<"own" | "platform">("own");
  const { data, isLoading, error } = useRevenue(scope);

  if (isLoading)
    return <p className="body-text text-sec-black/70">Loading revenue…</p>;

  if (error)
    return (
      <p role="alert" className="body-text text-red-700">
        Could not load revenue right now.
      </p>
    );

  if (!data) return null;

  const isPlatform = data.scope === "platform";

  // Totals across mixed currencies cannot honestly be summed into one figure. Where every
  // event shares a currency the totals use it; otherwise they are labelled "Mixed" and the
  // per-event rows keep their own, rather than quietly adding naira to dollars.
  const currencies = new Set(data.events.map((e) => e.currency || "NGN"));
  const single = currencies.size <= 1 ? [...currencies][0] || "NGN" : null;
  const fmt = (minor: number) => (single ? money(minor, single) : "Mixed");

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="sub-title-text text-main-black">Revenue</h1>
        <p className="body-text mt-1 text-sec-black/70">
          {isPlatform
            ? "What TicketFlow earned in platform fees across every event."
            : "What your events have taken, and what you are due after the platform fee."}
        </p>
      </header>

      {isAdmin && (
        <div
          role="group"
          aria-label="Revenue scope"
          className="flex w-fit gap-1 rounded-full bg-main-grey-bg p-1"
        >
          {(
            [
              ["own", "My events"],
              ["platform", "Platform"],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              aria-pressed={scope === value}
              onClick={() => setScope(value)}
              className={`rounded-full px-5 py-1.5 text-sm font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-main-purple/40 ${
                scope === value
                  ? "bg-main-white text-main-purple shadow-sm"
                  : "text-sec-black/70 hover:text-main-black"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      )}

      {/* The headline figure changes with the scope, because the question does. On the
          platform tab the fee leads and is the emphasised tile; gross and "paid to
          organisers" are context, not income. */}
      {/* `p-0` is load-bearing. A global base rule gives every <section> page-band padding
          (px-[5%] py-[3.75rem] md:py-24), which is right for a full-width band and wrong for
          a row of stat tiles inside a card — it was adding ~96px of dead space above and
          below this grid and pushing the chart off the first screen. Same trap as the
          checkout summary card. */}
      <section className="grid grid-cols-1 gap-3 p-0 sm:grid-cols-2 lg:grid-cols-4">
        {isPlatform ? (
          <>
            <Stat
              label="Platform revenue"
              value={fmt(data.totals.platformFeeMinor)}
              hint="Total earned from platform fees"
              emphasis
            />
            <Stat
              label="Ticket sales processed"
              value={fmt(data.totals.grossMinor)}
              hint={`${data.totals.transactions} transaction(s)`}
            />
            <Stat
              label="Paid to organisers"
              value={fmt(data.totals.netMinor)}
              hint="Settled directly by Paystack"
            />
            <Stat
              label="Tickets sold"
              value={String(data.totals.ticketsSold)}
              hint={`across ${data.totals.eventsWithSales} event(s) with sales`}
            />
          </>
        ) : (
          <>
            <Stat
              label="Your earnings"
              value={fmt(data.totals.netMinor)}
              hint="After the platform fee"
              emphasis
            />
            <Stat
              label="Gross sales"
              value={fmt(data.totals.grossMinor)}
              hint={`${data.totals.transactions} transaction(s)`}
            />
            <Stat
              label="Platform fee"
              value={fmt(data.totals.platformFeeMinor)}
              hint="Deducted from your sales"
            />
            <Stat
              label="Tickets sold"
              value={String(data.totals.ticketsSold)}
              hint={`across ${data.totals.eventsWithSales} of ${data.totals.events} event(s)`}
            />
          </>
        )}
      </section>

      <EarningsTrend
        points={data.series}
        metric={isPlatform ? "platformFeeMinor" : "netMinor"}
        title={isPlatform ? "Platform fee income" : "Your daily earnings"}
        subtitle={
          isPlatform
            ? "Fees earned per day, from confirmed payments"
            : "Net of the platform fee, per day, from confirmed payments"
        }
        currency={single ?? "NGN"}
      />

      <p className="rounded-big border border-main-light-grey/70 bg-main-grey-bg p-4 text-sm text-sec-black/70">
        Figures cover <strong>confirmed payments only</strong> — reservations that
        were never paid are excluded. The platform fee is calculated per
        transaction. Amounts shown as net are before the payment provider&apos;s
        own processing charge, which Paystack deducts at settlement and TicketFlow
        never sees.
      </p>

      <section className="p-0">
        <h2 className="mb-3 text-base font-bold text-main-black">By event</h2>

        {data.events.length === 0 ? (
          <p className="body-text text-sec-black/70">
            {isPlatform
              ? "No events on the platform yet."
              : "No events yet — revenue appears here once tickets are sold."}
          </p>
        ) : (
          <div className="overflow-x-auto rounded-big border border-main-light-grey/70">
            <table className="w-full min-w-[46rem] text-left text-sm">
              <thead className="bg-main-grey-bg text-xs uppercase tracking-wider text-sec-black/70">
                <tr>
                  <th scope="col" className="px-4 py-3">
                    Event
                  </th>
                  {isPlatform && (
                    <th scope="col" className="px-4 py-3">
                      Organiser
                    </th>
                  )}
                  <th scope="col" className="px-4 py-3 text-right">
                    Sold
                  </th>
                  <th scope="col" className="px-4 py-3 text-right">
                    Gross
                  </th>
                  <th scope="col" className="px-4 py-3 text-right">
                    {isPlatform ? "Our fee" : "Fee"}
                  </th>
                  <th scope="col" className="px-4 py-3 text-right">
                    {isPlatform ? "To organiser" : "Your net"}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-main-light-grey/60 bg-main-white">
                {data.events.map((row: RevenueRow) => (
                  <tr key={row.eventId}>
                    <td className="px-4 py-3 font-medium text-main-black">
                      <Link
                        href={`/my-profile/event-history/${row.eventId}`}
                        className="hover:text-main-purple hover:underline"
                      >
                        {row.eventName}
                      </Link>
                    </td>
                    {isPlatform && (
                      <td className="px-4 py-3 text-sec-black/70">
                        {row.organiser ?? "—"}
                      </td>
                    )}
                    <td className="px-4 py-3 text-right tabular-nums">
                      {row.ticketsSold}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      {money(row.grossMinor, row.currency)}
                    </td>
                    <td
                      className={`px-4 py-3 text-right tabular-nums ${
                        isPlatform
                          ? "font-semibold text-main-black"
                          : "text-sec-black/70"
                      }`}
                    >
                      {money(row.platformFeeMinor, row.currency)}
                    </td>
                    <td
                      className={`px-4 py-3 text-right tabular-nums ${
                        isPlatform
                          ? "text-sec-black/70"
                          : "font-semibold text-main-black"
                      }`}
                    >
                      {money(row.netMinor, row.currency)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
