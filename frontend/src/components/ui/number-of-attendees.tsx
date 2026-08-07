import { formatNumber } from "@/utils/utils";

/**
 * Attendee count.
 *
 * This previously rendered three overlapping `Eclipse` avatars - which were not avatars at
 * all: the SVG embedded a base64 PNG of a transparency checkerboard, a Figma placeholder
 * that shipped. It showed a fake crowd for every event regardless of who was going, and
 * `AllEventData` carries no attendee photos to replace it with.
 *
 * Renders nothing at zero. "0 going" on an event that has not sold yet is worse than
 * silence - it advertises emptiness on the card most likely to need the sale.
 */
export default function NumberOfAttendees({ number }: { number: number }) {
  if (!number || number <= 0) return null;

  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-main-grey-bg px-2.5 py-1 text-xs font-semibold text-sec-black">
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        className="h-3.5 w-3.5 text-main-purple"
      >
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
      {formatNumber(number)} going
    </span>
  );
}
