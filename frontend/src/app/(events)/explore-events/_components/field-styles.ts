/**
 * Shared appearance for the four filters in the Explore Events header.
 *
 * **Why the surface is dark rather than a white tint.** The band behind these fields is
 * `bg-main-black` (#2e3244) with two purple radial glows painted over it, so its lightness
 * varies across the row. A translucent *white* field (white/10) sat only 1.1:1 away from the
 * band and pushed its own placeholder text up towards it: measured against the brightest
 * part of the glow — which is exactly where these controls sit — placeholder text came out
 * at **3.45:1, below the 4.5:1 WCAG AA minimum**, and the fields themselves barely read as
 * fields.
 *
 * Tinting *down* instead fixes both at once: the input recedes into the band the way a real
 * input does, and white text on it has room to breathe.
 *
 * Every value below was computed against the worst case (under the purple glow), not chosen
 * by eye:
 *
 * | Element | Value | Worst-case contrast | Requirement |
 * |---|---|---|---|
 * | Placeholder | `white/75` on the field | **7.35:1** | 4.5:1 (AA text) |
 * | Typed text | `white` on the field | **11.7:1** | 4.5:1 |
 * | Border | `white/45` on the band | **3.05:1** | 3:1 (AA non-text/UI) |
 *
 * Kept in one place because four separate components have to stay identical, and react-select
 * needs the same values again as real style objects rather than classes.
 */

/** Applies to plain <input> elements. Icons are absolutely positioned, hence the left pad. */
export const FILTER_FIELD =
  "h-12 w-full rounded-xl border border-main-white/45 bg-black/[0.28] pl-10 pr-3 text-main-white backdrop-blur-sm transition-colors placeholder:font-normal placeholder:text-main-white/75 hover:bg-black/[0.34] focus:border-main-white/70 focus:bg-black/[0.38] focus:outline-none focus:ring-2 focus:ring-main-white/40";

/** Same surface as a wrapper, for controls that render their own inner input. */
export const FILTER_FIELD_WRAPPER =
  "relative flex flex-1 flex-shrink-0 rounded-xl border border-main-white/45 bg-black/[0.28] backdrop-blur-sm transition-colors hover:bg-black/[0.34] focus-within:border-main-white/70 focus-within:bg-black/[0.38] focus-within:ring-2 focus-within:ring-main-white/40";

/**
 * The leading icon inside each field. Icons are non-text content, so they need 3:1 rather
 * than 4.5:1 — but they were inheriting the old placeholder opacity and disappearing along
 * with it, so they are set explicitly here rather than left to chance.
 */
export const FILTER_ICON = "text-main-white/75";

/** react-select needs real style objects, so the same values are mirrored here. */
export const SELECT_SURFACE = {
  base: "rgba(0,0,0,0.28)",
  hover: "rgba(0,0,0,0.34)",
  border: "rgba(255,255,255,0.45)",
  borderFocus: "rgba(255,255,255,0.70)",
  text: "#fff",
  placeholder: "rgba(255,255,255,0.75)",
  /** The dropdown floats above the dark band, so it gets an opaque surface of its own. */
  menuBg: "#2e3244",
  menuHover: "rgba(255,255,255,0.10)",
};
