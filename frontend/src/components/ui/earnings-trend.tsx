"use client";

import { useId, useState } from "react";

/**
 * Daily earnings — one series of per-day totals, drawn as columns.
 *
 * **Form.** Columns, not a line. Each value is everything earned *within* one day — a flow
 * summed over a bucket, not a reading taken at an instant. A line interpolates between the
 * points, which asserts a value halfway through the night that does not exist and cannot be
 * looked up. Columns say what the data says: discrete daily quantities, side by side. The
 * difference is most obvious at the size this chart usually runs, where a two-day series as
 * a line is a single diagonal stroke that reads as a placeholder, while two columns read
 * correctly and honestly.
 *
 * Deliberately NOT two series: the organiser's net and the platform's 3% fee differ by more
 * than an order of magnitude, and plotting both would need two y-scales — a dual axis is the
 * single most misleading thing a chart can do. Each scope plots the one number that scope is
 * about, and the caller says which in the title.
 *
 * **Scale.** Zero baseline, always — a column's meaning is the length of the bar, so a
 * truncated axis makes it lie. The top of the scale is chosen by trying 4, 5 and 6 gridlines
 * and keeping whichever wastes the least headroom (see `chooseScale`).
 *
 * **Colour.** One brand hue at full strength. Validated with the design system's palette
 * checker against a white chart surface — lightness band, chroma floor and ≥3:1 contrast all
 * pass — rather than eyeballed.
 *
 * **No legend**: with a single series there is nothing to disambiguate, and a one-swatch box
 * would only restate the title. Identity comes from the title, the direct labels and the
 * hover readout — never from colour alone.
 */

const SERIES = "#6c5ce7";
const GRID = "#e4e6f1";
const INK_MUTED = "#9aa0b5";

export type TrendPoint = {
  date: string;
  grossMinor: number;
  platformFeeMinor: number;
  netMinor: number;
  ticketsSold: number;
};

type Props = {
  points: TrendPoint[];
  /** Which measure to plot — the caller's scope decides. */
  metric: "netMinor" | "platformFeeMinor" | "grossMinor";
  title: string;
  subtitle?: string;
  currency: string;
};

// The viewBox is close to the width this renders at in the revenue card, so an 11px label is
// drawn at roughly 11px on screen. The previous 720-wide box was stretched to ~1050px, which
// scaled every glyph up by 1.4x — which is why the axis labels looked oversized next to the
// surrounding UI while being nominally the same size.
const W = 1000;
// Sized down twice at the user's request (380 -> 304 -> 243): the chart is a companion to
// the stat tiles above it, not the page's main event, and at full height it pushed the
// "By event" table below the fold. Roughly a 4:1 plot — comparisons between days survive
// because the y-scale hugs the tallest column (chooseScale), not because the plot is tall.
const H = 243;
const PAD = { top: 28, right: 16, bottom: 34, left: 76 };

/** Round n up to 1, 2, 2.5 or 5 x a power of ten. */
export const niceStep = (n: number) => {
  const mag = 10 ** Math.floor(Math.log10(n));
  const m = [1, 2, 2.5, 5, 10].find((k) => n <= k * mag) ?? 10;
  return m * mag;
};

/**
 * Pick the gridline step and the top of the scale.
 *
 * Fixing the gridline count at 4 and rounding `peak / 4` up to a nice number wastes an
 * unbounded amount of headroom: a peak of 220 gives 220/4 = 55, which rounds up to 100, for a
 * scale topping out at **400** — nearly twice the tallest bar, with every column squashed into
 * the bottom half of the plot. Trying several counts and keeping the tightest fit costs three
 * iterations and bounds the waste: 220 now picks 5 gridlines of 50, topping out at 250.
 */
export const chooseScale = (peak: number) => {
  let best = { step: peak, top: peak, count: 1 };
  let bestTop = Infinity;
  for (const count of [4, 5, 6]) {
    const step = niceStep(peak / count);
    const top = step * count;
    if (top >= peak && top < bestTop) {
      best = { step, top, count };
      bestTop = top;
    }
  }
  return best;
};

export default function EarningsTrend({
  points,
  metric,
  title,
  subtitle,
  currency,
}: Props) {
  const clipId = useId();
  const [hover, setHover] = useState<number | null>(null);

  const code = currency || "NGN";

  const money = (minor: number) =>
    new Intl.NumberFormat("en-GB", {
      style: "currency",
      currency: code,
      maximumFractionDigits: 0,
    }).format(minor / 100);

  if (points.length === 0) {
    return (
      <section className="rounded-big border border-main-light-grey/70 bg-main-white p-5">
        <h2 className="text-base font-bold text-main-black">{title}</h2>
        <p className="mt-6 pb-4 text-center text-sm text-sec-black/60">
          No confirmed sales yet — the trend appears once tickets are bought.
        </p>
      </section>
    );
  }

  const values = points.map((p) => p[metric]);
  // Floored at 100 minor units (one whole unit of currency) so an all-zero series still gets
  // a sane axis instead of gridlines a fraction of a penny apart.
  const rawPeak = Math.max(...values, 100);
  const { step, top: peak, count } = chooseScale(rawPeak);

  // Tick precision follows the step, so a small scale does not print "NGN 0" three times.
  const stepMajor = step / 100;
  const decimals = stepMajor >= 1 ? 0 : stepMajor >= 0.1 ? 1 : 2;

  // Axis ticks are abbreviated ("NGN 700K"). Spelling every gridline out in full both
  // overflowed the left gutter — clipping the currency symbol clean off — and repeated the
  // same six characters five times for no gain. Full precision stays in the hover readout
  // and the table, so nothing is lost.
  //
  // Formatted by hand rather than with `Intl` compact notation, which is NOT deterministic
  // across environments: Node's ICU renders 0 as "NGN 0" and the browser's as "NGN 0.0",
  // which React reports as a hydration mismatch and then re-renders the whole tree to fix.
  // A formatter whose output depends on which ICU build is running has no place in
  // server-rendered markup.
  const axisLabel = (minor: number) => {
    const major = minor / 100;
    const abbr = (n: number, suffix: string) =>
      `${code} ${Number.isInteger(n) ? n : n.toFixed(1)}${suffix}`;

    if (Math.abs(major) >= 1_000_000_000) return abbr(major / 1_000_000_000, "B");
    if (Math.abs(major) >= 1_000_000) return abbr(major / 1_000_000, "M");
    if (Math.abs(major) >= 1_000) return abbr(major / 1_000, "K");
    return `${code} ${major.toFixed(decimals)}`;
  };

  const innerW = W - PAD.left - PAD.right;
  const innerH = H - PAD.top - PAD.bottom;
  const baseline = PAD.top + innerH;

  // Each day owns an equal slot; the column sits centred in it and never fills it, so the
  // leftover is the air that separates neighbours. Capped at 24px because a very wide bar
  // stops reading as a measured length and starts reading as a block of colour.
  //
  // The SLOT is capped too, and that is the part that matters for a short series. Dividing
  // the full plot width between two days puts 450px of empty air around each 24px column —
  // the chart reads as broken rather than as young. Holding the slot at a sensible daily
  // width keeps the columns a readable distance apart however few of them there are, and the
  // band simply grows to fill the plot as history accumulates.
  //
  // The band is centred rather than left-aligned because with a handful of points the x-axis
  // is not a fixed window - it is exactly the days that have data - so there is no start-of-
  // window to anchor to, and left-aligning would leave an empty right half that reads as
  // missing future data.
  const MAX_SLOT = 64;
  const plotW = Math.min(innerW, points.length * MAX_SLOT);
  const originX = PAD.left + (innerW - plotW) / 2;
  const slot = plotW / points.length;
  const gap = slot > 6 ? 2 : 0;
  const barW = Math.max(1, Math.min(24, slot - gap));

  const xSlot = (i: number) => originX + i * slot;
  const xMid = (i: number) => xSlot(i) + slot / 2;
  const y = (v: number) => baseline - (v / peak) * innerH;

  /**
   * A column with a rounded cap and square feet. `rx` on a `<rect>` would round all four
   * corners, lifting the bar off its own baseline and making short bars look like pills that
   * float — the baseline is the thing a column is measured from, so it stays sharp.
   */
  const columnPath = (i: number, v: number) => {
    const h = baseline - y(v);
    const x0 = xMid(i) - barW / 2;
    const y0 = y(v);
    const r = Math.min(4, barW / 2, h);
    return [
      `M ${x0} ${baseline}`,
      `L ${x0} ${y0 + r}`,
      `Q ${x0} ${y0} ${x0 + r} ${y0}`,
      `L ${x0 + barW - r} ${y0}`,
      `Q ${x0 + barW} ${y0} ${x0 + barW} ${y0 + r}`,
      `L ${x0 + barW} ${baseline}`,
      "Z",
    ].join(" ");
  };

  const ticks = Array.from({ length: count + 1 }, (_, i) => step * i);
  const last = points[points.length - 1];
  const lastIndex = points.length - 1;
  const active = hover === null ? null : points[hover];

  const peakIndex = values.indexOf(Math.max(...values));

  // Direct-label only the tallest column and the latest one — never a number on every bar,
  // which turns the plot into a table that happens to have shapes behind it. Suppressed
  // entirely once the columns are too narrow for the text to sit over one without colliding
  // with its neighbours; the axis and the tooltip still carry every value.
  const labelled = slot >= 56 ? new Set([peakIndex, lastIndex]) : new Set<number>();

  const shortDate = (iso: string) =>
    new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short" });

  // At most ~8 date labels, always including the first and last. Drawing one per column
  // overlaps into an unreadable smear as soon as a series covers more than a fortnight.
  const labelEvery = Math.max(1, Math.ceil(points.length / 8));
  const showDate = (i: number) =>
    i === 0 || i === lastIndex || (i % labelEvery === 0 && lastIndex - i >= labelEvery);

  return (
    <section className="rounded-big border border-main-light-grey/70 bg-main-white p-5">
      <header className="mb-1 flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <h2 className="text-base font-bold text-main-black">{title}</h2>
          {subtitle && (
            <p className="mt-0.5 text-xs text-sec-black/60">{subtitle}</p>
          )}
        </div>
        {/* The reading the chart is for, stated in text so it is never colour-only. */}
        <p className="text-sm text-sec-black/70">
          {active ? (
            <>
              <span className="font-semibold text-main-black">
                {money(active[metric])}
              </span>{" "}
              on {shortDate(active.date)} · {active.ticketsSold} ticket
              {active.ticketsSold === 1 ? "" : "s"}
            </>
          ) : (
            <>
              Latest:{" "}
              <span className="font-semibold text-main-black">
                {money(last[metric])}
              </span>
            </>
          )}
        </p>
      </header>

      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full"
        role="img"
        aria-label={`${title}. ${points.length} day${points.length === 1 ? "" : "s"}, peaking at ${money(Math.max(...values))} on ${shortDate(points[peakIndex].date)}.`}
        onMouseLeave={() => setHover(null)}
      >
        <defs>
          <clipPath id={clipId}>
            <rect
              x={PAD.left}
              y={PAD.top - 4}
              width={innerW}
              height={innerH + 4}
            />
          </clipPath>
        </defs>

        {/* Gridlines: solid hairlines one step off the surface. Never dashed — dashing reads
            as data rather than as scaffolding. */}
        {ticks.map((t) => (
          <g key={t}>
            <line
              x1={PAD.left}
              x2={W - PAD.right}
              y1={y(t)}
              y2={y(t)}
              stroke={GRID}
              strokeWidth={1}
            />
            <text
              x={PAD.left - 10}
              y={y(t) + 4}
              textAnchor="end"
              fontSize={11}
              fill={INK_MUTED}
            >
              {axisLabel(t)}
            </text>
          </g>
        ))}

        {/* Hovered slot gets a wash behind it. A backdrop rather than a colour change on the
            bar itself: recolouring the mark would imply the value means something different. */}
        {hover !== null && (
          <rect
            x={xSlot(hover)}
            y={PAD.top - 4}
            width={slot}
            height={innerH + 4}
            fill={SERIES}
            fillOpacity={0.07}
          />
        )}

        <g clipPath={`url(#${clipId})`}>
          {points.map((p, i) =>
            // A zero day draws no mark. A zero-height bar is invisible anyway, and faking a
            // stub would show earnings on a day that had none. The hit band below still
            // covers it, so hovering a gap reports "NGN 0" rather than nothing.
            p[metric] > 0 ? (
              <path key={p.date} d={columnPath(i, p[metric])} fill={SERIES} />
            ) : null,
          )}
        </g>

        {/* Selective direct labels, on the cap. */}
        {points.map((p, i) =>
          labelled.has(i) ? (
            <text
              key={`label-${p.date}`}
              x={xMid(i)}
              y={y(p[metric]) - 8}
              textAnchor="middle"
              fontSize={11}
              fontWeight={600}
              // Text never wears the series colour — the column beside it carries identity.
              fill="#2e3244"
            >
              {money(p[metric])}
            </text>
          ) : null,
        )}

        {/* Baseline, drawn over the columns' feet so every bar is measured from one line. */}
        <line
          x1={PAD.left}
          x2={W - PAD.right}
          y1={baseline}
          y2={baseline}
          stroke={INK_MUTED}
          strokeWidth={1}
        />

        {/* Hit bands span the whole slot height, so hovering is not a game of hitting a
            narrow column — especially the short ones. */}
        {points.map((p, i) => (
          <rect
            key={`hit-${p.date}`}
            x={xSlot(i)}
            y={PAD.top - 4}
            width={slot}
            height={innerH + 4}
            fill="transparent"
            onMouseEnter={() => setHover(i)}
          />
        ))}

        {points.map((p, i) =>
          showDate(i) ? (
            <text
              key={`date-${p.date}`}
              x={xMid(i)}
              y={H - 12}
              textAnchor="middle"
              fontSize={11}
              fill={INK_MUTED}
            >
              {shortDate(p.date)}
            </text>
          ) : null,
        )}
      </svg>

      {/* Table view: the chart is never the only way to reach the numbers. */}
      <details className="mt-2">
        <summary className="cursor-pointer text-xs text-sec-black/60 hover:text-main-black">
          View as table
        </summary>
        <div className="mt-2 max-h-56 overflow-y-auto">
          <table className="w-full text-left text-xs">
            <thead className="sticky top-0 bg-main-white text-sec-black/60">
              <tr>
                <th className="py-1">Date</th>
                <th className="py-1 text-right">Tickets</th>
                <th className="py-1 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-main-light-grey/50">
              {points.map((p) => (
                <tr key={p.date}>
                  <td className="py-1">
                    {new Date(p.date).toLocaleDateString("en-GB")}
                  </td>
                  <td className="py-1 text-right tabular-nums">
                    {p.ticketsSold}
                  </td>
                  <td className="py-1 text-right tabular-nums">
                    {money(p[metric])}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </section>
  );
}
