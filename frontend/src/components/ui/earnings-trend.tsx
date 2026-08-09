"use client";

import { useId, useState } from "react";

/**
 * Daily earnings trend — one series, drawn as an inline SVG line + area wash.
 *
 * **Form.** The job is change-over-time for a single measure, so this is a line (with a
 * light area fill, which a single series is allowed). Deliberately NOT two series: the
 * organiser's net and the platform's 3% fee differ by more than an order of magnitude, and
 * plotting both would need two y-scales — a dual axis is the single most misleading thing a
 * chart can do. Each scope plots the one number that scope is about, and the caller says
 * which in the title.
 *
 * **Colour.** One brand hue at full strength for the line, the same hue at ~10% for the
 * fill; gridlines one step off the surface, hairline and solid. Validated against a white
 * chart surface (lightness band, chroma floor, ≥3:1 contrast) rather than eyeballed.
 *
 * **No legend**: with a single series there is nothing to disambiguate, and a one-swatch box
 * would only restate the title. Identity comes from the title, the endpoint label and the
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

const W = 720;
const H = 220;
const PAD = { top: 16, right: 16, bottom: 28, left: 64 };

export default function EarningsTrend({
  points,
  metric,
  title,
  subtitle,
  currency,
}: Props) {
  const clipId = useId();
  const [hover, setHover] = useState<number | null>(null);

  const money = (minor: number) =>
    new Intl.NumberFormat("en-GB", {
      style: "currency",
      currency: currency || "NGN",
      maximumFractionDigits: 0,
    }).format(minor / 100);

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
  const compact = (minor: number) => {
    const major = minor / 100;
    const code = currency || "NGN";
    const abbr = (n: number, suffix: string) =>
      `${code} ${Number.isInteger(n) ? n : n.toFixed(1)}${suffix}`;

    if (Math.abs(major) >= 1_000_000_000) return abbr(major / 1_000_000_000, "B");
    if (Math.abs(major) >= 1_000_000) return abbr(major / 1_000_000, "M");
    if (Math.abs(major) >= 1_000) return abbr(major / 1_000, "K");
    return `${code} ${Math.round(major)}`;
  };

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
  const rawPeak = Math.max(...values, 1);

  // Round the top of the scale up to a "nice" number (1, 2 or 5 x a power of ten) so the
  // gridlines land on values a reader recognises — 700,000 rather than 698,400. Ticks are
  // the values that are NOT directly labelled, so they have to be readable at a glance.
  const niceCeil = (n: number) => {
    const mag = 10 ** Math.floor(Math.log10(n));
    const step = [1, 2, 2.5, 5, 10].find((m) => n <= m * mag) ?? 10;
    return step * mag;
  };
  // The nice number is applied to the STEP, not just the top of the scale: rounding only
  // the maximum still leaves quarters like 18.75K on the intermediate lines. Four round
  // steps means every gridline is a number a reader recognises.
  const step = niceCeil(rawPeak / 4);
  const peak = step * 4;
  const innerW = W - PAD.left - PAD.right;
  const innerH = H - PAD.top - PAD.bottom;

  // A single point has no line to draw, so it is nudged off the left edge to stay visible.
  const x = (i: number) =>
    PAD.left + (points.length === 1 ? innerW / 2 : (i / (points.length - 1)) * innerW);
  const y = (v: number) => PAD.top + innerH - (v / peak) * innerH;

  const line = points.map((p, i) => `${x(i)},${y(p[metric])}`).join(" ");
  const area = `${PAD.left},${PAD.top + innerH} ${line} ${x(points.length - 1)},${PAD.top + innerH}`;

  // Four rounded gridlines. Ticks carry the values that are not directly labelled.
  const ticks = [0, 1, 2, 3, 4].map((i) => step * i);
  const last = points[points.length - 1];
  const active = hover === null ? null : points[hover];

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
              on{" "}
              {new Date(active.date).toLocaleDateString("en-GB", {
                day: "numeric",
                month: "short",
              })}
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
        aria-label={`${title}. ${points.length} days, peaking at ${money(peak)}.`}
        onMouseLeave={() => setHover(null)}
      >
        <defs>
          <clipPath id={clipId}>
            <rect x={PAD.left} y={PAD.top} width={innerW} height={innerH} />
          </clipPath>
        </defs>

        {ticks.map((t, i) => {
          const ty = y(t);
          return (
            <g key={i}>
              <line
                x1={PAD.left}
                x2={W - PAD.right}
                y1={ty}
                y2={ty}
                stroke={GRID}
                strokeWidth={1}
              />
              <text
                x={PAD.left - 8}
                y={ty + 4}
                textAnchor="end"
                fontSize={11}
                fill={INK_MUTED}
              >
                {compact(t)}
              </text>
            </g>
          );
        })}

        <g clipPath={`url(#${clipId})`}>
          <polygon points={area} fill={SERIES} fillOpacity={0.1} />
          <polyline
            points={line}
            fill="none"
            stroke={SERIES}
            strokeWidth={2}
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        </g>

        {/* End marker: ≥8px and ringed in the surface colour so it stays legible on the line. */}
        <circle
          cx={x(points.length - 1)}
          cy={y(last[metric])}
          r={4.5}
          fill={SERIES}
          stroke="#ffffff"
          strokeWidth={2}
        />

        {active && hover !== null && (
          <>
            <line
              x1={x(hover)}
              x2={x(hover)}
              y1={PAD.top}
              y2={PAD.top + innerH}
              stroke={SERIES}
              strokeWidth={1}
              strokeOpacity={0.4}
            />
            <circle
              cx={x(hover)}
              cy={y(active[metric])}
              r={4.5}
              fill={SERIES}
              stroke="#ffffff"
              strokeWidth={2}
            />
          </>
        )}

        {/* Invisible hit bands — far wider than the marks, so hovering is not a game of
            hitting a 9px dot. */}
        {points.map((p, i) => (
          <rect
            key={p.date}
            x={x(i) - innerW / points.length / 2}
            y={PAD.top}
            width={innerW / points.length}
            height={innerH}
            fill="transparent"
            onMouseEnter={() => setHover(i)}
          />
        ))}

        <text x={PAD.left} y={H - 8} fontSize={11} fill={INK_MUTED}>
          {new Date(points[0].date).toLocaleDateString("en-GB", {
            day: "numeric",
            month: "short",
          })}
        </text>
        <text
          x={W - PAD.right}
          y={H - 8}
          fontSize={11}
          fill={INK_MUTED}
          textAnchor="end"
        >
          {new Date(last.date).toLocaleDateString("en-GB", {
            day: "numeric",
            month: "short",
          })}
        </text>
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
