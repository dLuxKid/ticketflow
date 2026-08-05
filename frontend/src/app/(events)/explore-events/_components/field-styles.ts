/**
 * Shared appearance for the four filters in the Explore Events header.
 *
 * They previously used `bg-main-black` (and `#1f1f1f` inside react-select) sitting on a
 * `bg-main-black` band with `border: 0` — the fields were the same colour as the surface
 * behind them, so nothing signalled they were inputs at all.
 *
 * The fix is a translucent white surface with a visible edge: readable on the dark band,
 * lifting on hover and focus so each control clearly reads as interactive. Kept in one
 * place because four separate components have to stay identical.
 */

/** Applies to plain <input> elements. Icons are absolutely positioned, hence the left pad. */
export const FILTER_FIELD =
  "h-12 w-full rounded-xl border border-main-white/25 bg-main-white/10 pl-10 pr-3 text-main-white backdrop-blur-sm transition-colors placeholder:font-normal placeholder:text-main-white/60 hover:bg-main-white/[0.15] focus:border-main-white/50 focus:bg-main-white/20 focus:outline-none focus:ring-2 focus:ring-main-white/25";

/** Same surface as a wrapper, for controls that render their own inner input. */
export const FILTER_FIELD_WRAPPER =
  "relative flex flex-1 flex-shrink-0 rounded-xl border border-main-white/25 bg-main-white/10 backdrop-blur-sm transition-colors hover:bg-main-white/[0.15] focus-within:border-main-white/50 focus-within:bg-main-white/20 focus-within:ring-2 focus-within:ring-main-white/25";

/** react-select needs real style objects, so the same values are mirrored here. */
export const SELECT_SURFACE = {
  base: "rgba(255,255,255,0.10)",
  hover: "rgba(255,255,255,0.15)",
  border: "rgba(255,255,255,0.25)",
  borderFocus: "rgba(255,255,255,0.50)",
  text: "#fff",
  placeholder: "rgba(255,255,255,0.60)",
  /** The dropdown floats above the dark band, so it gets an opaque surface of its own. */
  menuBg: "#2e3244",
  menuHover: "rgba(255,255,255,0.10)",
};
