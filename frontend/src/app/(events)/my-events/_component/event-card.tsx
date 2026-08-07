import Image from "next/image";
import Link from "next/link";

import DateIcon from "@/assets/svg/my-events-date-icon";
import LocationIcon from "@/assets/svg/my-events-location-icon";
import TimeIcon from "@/assets/svg/my-events-time-icon";

import { formatDateRange, formatTimeRange } from "@/utils/utils";

/**
 * A row in the organiser's event list.
 *
 * The cover previously used object-fill, which stretched every image to the box instead of
 * cropping it - portraits and logos came out visibly squashed. `object-cover` preserves the
 * aspect ratio, which matters more here than showing the whole image.
 */

const STATUS: Record<string, { label: string; className: string; dot: string }> =
  {
    live: {
      label: "Live now",
      className: "bg-emerald-500/10 text-emerald-700 ring-emerald-500/25",
      dot: "bg-emerald-500",
    },
    upcoming: {
      label: "Upcoming",
      className: "bg-main-purple/10 text-main-purple ring-main-purple/25",
      dot: "bg-main-purple",
    },
    past: {
      label: "Past",
      className: "bg-main-black/[0.06] text-sec-black/70 ring-main-black/10",
      dot: "bg-sec-black/50",
    },
  };

const ACCESS_LABEL: Record<string, string> = {
  invite_only: "Invite only",
  hybrid: "Hybrid",
};

const actionIcon: Record<string, string> = {
  guests: "M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM23 21v-2a4 4 0 0 0-3-3.87",
  dashboard: "M3 3v18h18M7 16l4-4 3 3 5-6",
  scan: "M3 7V5a2 2 0 0 1 2-2h2M17 3h2a2 2 0 0 1 2 2v2M21 17v2a2 2 0 0 1-2 2h-2M7 21H5a2 2 0 0 1-2-2v-2M3 12h18",
  team: "M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z",
};

const ActionLink = ({
  href,
  icon,
  children,
}: {
  href: string;
  icon: string;
  children: React.ReactNode;
}) => (
  <Link
    href={href}
    className="inline-flex items-center gap-1.5 rounded-full border border-main-light-grey bg-main-white px-3 py-1.5 text-xs font-semibold text-sec-black transition-all hover:-translate-y-0.5 hover:border-main-purple/40 hover:text-main-purple focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-main-purple/40"
  >
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="h-3.5 w-3.5"
    >
      <path d={actionIcon[icon]} />
    </svg>
    {children}
  </Link>
);

export default function EventCard({
  event,
  canDelete = false,
  onDelete,
}: {
  event: MyEvent;
  /** Admin-only. The server enforces this too - hiding the control is a courtesy. */
  canDelete?: boolean;
  onDelete?: (event: MyEvent) => void;
}) {
  const status = STATUS[event.isLive] ?? STATUS.upcoming;
  const access = event.accessMode ? ACCESS_LABEL[event.accessMode] : undefined;

  return (
    <article className="group flex w-full flex-wrap gap-5 rounded-2xl border border-main-light-grey/70 bg-main-white p-4 shadow-[0_2px_10px_-6px_rgba(46,50,68,0.25)] transition-all duration-300 hover:border-main-purple/30 hover:shadow-[0_20px_40px_-24px_rgba(46,50,68,0.4)] sm:flex-nowrap md:p-5">
      <div className="relative h-48 w-full shrink-0 overflow-hidden rounded-xl bg-main-grey-bg sm:h-40 sm:w-56 md:h-44 md:w-64">
        <Image
          src={event.coverImage}
          alt=""
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          height={200}
          width={300}
          unoptimized
          loading="lazy"
        />
      </div>

      <div className="flex w-full min-w-0 flex-col gap-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="mb-1.5 flex flex-wrap items-center gap-2">
              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ${status.className}`}
              >
                <span
                  aria-hidden="true"
                  className={`h-1.5 w-1.5 rounded-full ${status.dot} ${
                    event.isLive === "live" ? "animate-pulse" : ""
                  }`}
                />
                {status.label}
              </span>
              {access && (
                <span className="rounded-full bg-main-grey-bg px-2.5 py-1 text-[11px] font-semibold text-sec-black/70">
                  {access}
                </span>
              )}
            </div>
            <h2 className="truncate text-lg font-bold text-main-black md:text-xl">
              {event.eventName}
            </h2>
          </div>

          <div className="flex shrink-0 items-center gap-2">
          {canDelete && (
            <button
              type="button"
              onClick={() => onDelete?.(event)}
              title={`Archive ${event.eventName}`}
              className="inline-flex items-center gap-1.5 rounded-full border border-main-error-red/30 px-3 py-2 text-sm font-semibold text-main-error-red transition-all hover:bg-main-error-red/[0.07] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-main-error-red/40"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
                className="h-3.5 w-3.5"
              >
                <path d="M3 6h18M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
              </svg>
              Archive
              <span className="sr-only"> {event.eventName}</span>
            </button>
          )}

          <Link
            href={`/edit-event/${event.slug}`}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-main-purple px-4 py-2 text-sm font-semibold text-main-white shadow-md shadow-main-purple/25 transition-all hover:-translate-y-0.5 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-main-purple/40 focus-visible:ring-offset-2"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
              className="h-3.5 w-3.5"
            >
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7M18.5 2.5a2.1 2.1 0 0 1 3 3L12 15l-4 1 1-4z" />
            </svg>
            Edit
          </Link>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-sec-black/75">
          <span className="inline-flex items-center gap-2">
            <DateIcon />
            {formatDateRange(new Date(event.startDate), new Date(event.endDate))}
          </span>
          <span className="inline-flex items-center gap-2">
            <TimeIcon />
            {formatTimeRange(new Date(event.startTime), new Date(event.endTime))}{" "}
            {event.timezone}
          </span>
        </div>

        <div className="flex items-start gap-2 text-sm text-sec-black/75">
          <span className="mt-0.5 shrink-0">
            <LocationIcon />
          </span>
          <span className="min-w-0 truncate">
            {event.eventLocation.address} {event.eventLocation.city},{" "}
            {event.eventLocation.state}, {event.eventLocation.country}
          </span>
        </div>

        {/* Management tools. Chips rather than underlined text: four links in a row read as
            prose and gave no hit target worth aiming at on a phone. */}
        <div className="mt-auto flex flex-wrap gap-2 border-t border-main-light-grey/70 pt-3">
          {/* Tested positively rather than as `!== "public"`. Legacy events created before
              accessMode existed return it as undefined, which that check treated as
              non-public - so a plain ticketed event advertised a guest list it does not
              have. Only the two modes that actually carry one qualify. */}
          {(event.accessMode === "invite_only" ||
            event.accessMode === "hybrid") && (
            <ActionLink href={`/guest-list/${event._id}`} icon="guests">
              Guest list
            </ActionLink>
          )}
          <ActionLink href={`/dashboard/${event._id}`} icon="dashboard">
            Live dashboard
          </ActionLink>
          <ActionLink href={`/scan/${event._id}`} icon="scan">
            Scan tickets
          </ActionLink>
          <ActionLink href={`/event-team/${event._id}`} icon="team">
            Door staff
          </ActionLink>
        </div>
      </div>
    </article>
  );
}
