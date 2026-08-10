import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import EarningsTrend, {
  chooseScale,
  niceStep,
  type TrendPoint,
} from "./earnings-trend";

const day = (date: string, netMinor: number, ticketsSold = 1): TrendPoint => ({
  date,
  grossMinor: Math.round(netMinor / 0.97),
  platformFeeMinor: Math.round(netMinor * 0.03),
  netMinor,
  ticketsSold,
});

/**
 * The y-scale is the part of this chart that was actually wrong: a peak of NGN 220 was
 * plotted on an axis running to NGN 400, so every column sat in the bottom half of the plot
 * and the chart read as mostly empty. These pin the headroom.
 */
describe("chooseScale", () => {
  it("does not waste half the plot on headroom", () => {
    // The reported case: 22,000 kobo = NGN 220.
    const { top } = chooseScale(22_000);
    expect(top).toBe(25_000); // NGN 250, not the old NGN 400
  });

  it("keeps the top of the scale within 25% of the tallest bar", () => {
    for (const peak of [1, 7, 42, 220, 999, 1234, 8888, 25_000, 750_000]) {
      const { top } = chooseScale(peak);
      expect(top).toBeGreaterThanOrEqual(peak);
      expect(top / peak).toBeLessThanOrEqual(1.25);
    }
  });

  it("lands exactly on the peak when the peak is already round", () => {
    expect(chooseScale(1000).top).toBe(1000);
    expect(chooseScale(500).top).toBe(500);
  });

  it("produces a step that divides the top into whole gridlines", () => {
    for (const peak of [220, 1337, 90_000]) {
      const { step, top, count } = chooseScale(peak);
      expect(step * count).toBe(top);
      expect(count).toBeGreaterThanOrEqual(4);
    }
  });

  it("rounds steps to 1, 2, 2.5 or 5 times a power of ten", () => {
    expect(niceStep(55)).toBe(100);
    expect(niceStep(44)).toBe(50);
    expect(niceStep(21)).toBe(25);
    expect(niceStep(9)).toBe(10);
  });
});

describe("EarningsTrend", () => {
  const points = [day("2026-08-09", 10_000, 3), day("2026-08-10", 22_000, 5)];

  it("draws one column per day, not a line", () => {
    const { container } = render(
      <EarningsTrend
        points={points}
        metric="netMinor"
        title="Your daily earnings"
        currency="NGN"
      />,
    );
    // Columns are paths; a polyline/polygon would mean the line chart came back.
    expect(container.querySelectorAll("path").length).toBe(2);
    expect(container.querySelector("polyline")).toBeNull();
    expect(container.querySelector("polygon")).toBeNull();
  });

  it("starts every column from a zero baseline", () => {
    const { container } = render(
      <EarningsTrend
        points={points}
        metric="netMinor"
        title="Your daily earnings"
        currency="NGN"
      />,
    );
    // Truncating the axis would make the bar lengths lie, so 0 must be a labelled tick.
    const ticks = [...container.querySelectorAll("text")].map((t) => t.textContent);
    expect(ticks).toContain("NGN 0");
  });

  it("draws no mark for a day with no earnings", () => {
    const withGap = [
      day("2026-08-09", 10_000),
      day("2026-08-10", 0, 0),
      day("2026-08-11", 22_000),
    ];
    const { container } = render(
      <EarningsTrend
        points={withGap}
        metric="netMinor"
        title="Your daily earnings"
        currency="NGN"
      />,
    );
    expect(container.querySelectorAll("path").length).toBe(2);
  });

  it("keeps the numbers reachable without the chart", () => {
    render(
      <EarningsTrend
        points={points}
        metric="netMinor"
        title="Your daily earnings"
        currency="NGN"
      />,
    );
    expect(screen.getByText("View as table")).toBeInTheDocument();
  });

  it("says what it is showing without relying on colour", () => {
    render(
      <EarningsTrend
        points={points}
        metric="netMinor"
        title="Your daily earnings"
        currency="NGN"
      />,
    );
    expect(screen.getByRole("img")).toHaveAttribute(
      "aria-label",
      expect.stringContaining("peaking at"),
    );
  });

  it("handles an empty series without drawing an axis", () => {
    render(
      <EarningsTrend
        points={[]}
        metric="netMinor"
        title="Your daily earnings"
        currency="NGN"
      />,
    );
    expect(screen.getByText(/No confirmed sales yet/)).toBeInTheDocument();
  });
});
