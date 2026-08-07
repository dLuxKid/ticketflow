"use client";

import Link from "next/link";
import { useRevenue, type RevenueRow } from "@/store/useRevenue";

/**
 * Revenue report — per event and in total, net of the platform fee.
 *
 * One page serves both audiences because the underlying question is the same ("what has
 * been earned, and what was deducted"); only the scope differs, and the server decides that
 * from the caller's role. An admin sees every event and the platform's fee income; an
 * organiser sees their own events and what they are due.
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
  const { data, isLoading, error } = useRevenue();

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
  // Reports mixing currencies cannot be summed into one figure honestly. Where every event
  // shares a currency the totals are shown in it; otherwise the per-event rows still carry
  // their own and the total is labelled as mixed rather than quietly wrong.
  const currencies = new Set(data.events.map((e) => e.currency || "NGN"));
  const single = currencies.size <= 1 ? [...currencies][0] || "NGN" : null;

  return (
    <div className="flex flex-col gap-8">
      <header>
        <h1 className="sub-title-text text-main-black">
          {isPlatform ? "Platform revenue" : "Your revenue"}
        </h1>
        <p className="body-text mt-1 text-sec-black/70">
          {isPlatform
            ? "Every event on the platform, with the fee income TicketFlow earned."
            : "What your events have taken, and what you are due after the platform fee."}
        </p>
      </header>

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat
          label="Gross sales"
          value={single ? money(data.totals.grossMinor, single) : "Mixed"}
          hint={`${data.totals.transactions} transaction(s)`}
        />
        <Stat
          label="Platform fee"
          value={single ? money(data.totals.platformFeeMinor, single) : "Mixed"}
          hint={isPlatform ? "TicketFlow's income" : "Deducted from your sales"}
          emphasis={isPlatform}
        />
        <Stat
          label={isPlatform ? "Paid to organisers" : "Your net"}
          value={single ? money(data.totals.netMinor, single) : "Mixed"}
          hint="Before the payment provider's own charge"
          emphasis={!isPlatform}
        />
        <Stat
          label="Tickets sold"
          value={String(data.totals.ticketsSold)}
          hint={`${data.totals.eventsWithSales} of ${data.totals.events} event(s) with sales`}
        />
      </section>

      {/* Stated rather than left for the reader to discover: the organiser bears Paystack's
          processing charge, which this system never sees, so "net" here is provider-gross. */}
      <p className="rounded-big border border-main-light-grey/70 bg-main-grey-bg p-4 text-sm text-sec-black/70">
        Figures cover <strong>confirmed payments only</strong> — reservations that were never
        paid are excluded. The platform fee is calculated per transaction. Amounts shown as
        net are before the payment provider&apos;s own processing charge, which is deducted
        by Paystack at settlement and is not visible to TicketFlow.
      </p>

      <section>
        <h2 className="mb-3 text-base font-bold text-main-black">By event</h2>

        {data.events.length === 0 ? (
          <p className="body-text text-sec-black/70">
            No events yet — revenue appears here once tickets are sold.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-big border border-main-light-grey/70">
            <table className="w-full min-w-[46rem] text-left text-sm">
              <thead className="bg-main-grey-bg text-xs uppercase tracking-wider text-sec-black/70">
                <tr>
                  <th scope="col" className="px-4 py-3">Event</th>
                  {isPlatform && (
                    <th scope="col" className="px-4 py-3">Organiser</th>
                  )}
                  <th scope="col" className="px-4 py-3 text-right">Sold</th>
                  <th scope="col" className="px-4 py-3 text-right">Gross</th>
                  <th scope="col" className="px-4 py-3 text-right">Fee</th>
                  <th scope="col" className="px-4 py-3 text-right">Net</th>
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
                    <td className="px-4 py-3 text-right tabular-nums text-sec-black/70">
                      {money(row.platformFeeMinor, row.currency)}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold tabular-nums text-main-black">
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
