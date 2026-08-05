import Image from "next/image";
import Link from "next/link";

import DateIcon from "@/assets/svg/my-events-date-icon";
import LocationIcon from "@/assets/svg/my-events-location-icon";
import TimeIcon from "@/assets/svg/my-events-time-icon";

import { formatDateRange, formatTimeRange } from "@/utils/utils";

/**
 * An event the user works as door staff, rather than one they created.
 *
 * Deliberately not the owner card: no Edit, no guest list, no dashboard. An usher's
 * authority is admission only (see admissionService.authorizeScan), so offering controls
 * they would be refused on would be worse than not offering them. Scanning is the primary
 * action, so it is the one prominent button.
 */
export default function AssignedEventCard({ event }: { event: MyEvent }) {
  const isLive = event.isLive === "live";

  return (
    <article className="group flex w-full flex-wrap gap-5 rounded-2xl border border-main-light-grey/70 bg-main-white p-4 shadow-[0_2px_10px_-6px_rgba(46,50,68,0.25)] transition-all duration-300 hover:border-main-purple/30 hover:shadow-[0_20px_40px_-24px_rgba(46,50,68,0.4)] sm:flex-nowrap md:p-5">
      <div className="relative h-40 w-full shrink-0 overflow-hidden rounded-xl bg-main-grey-bg sm:h-32 sm:w-44">
        <Image
          src={event.coverImage}
          alt=""
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          height={160}
          width={220}
          unoptimized
          loading="lazy"
        />
      </div>

      <div className="flex w-full min-w-0 flex-col gap-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="mb-1.5 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-main-purple/10 px-2.5 py-1 text-[11px] font-semibold text-main-purple ring-1 ring-main-purple/25">
                Door staff
              </span>
              {isLive && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-1 text-[11px] font-semibold text-emerald-700 ring-1 ring-emerald-500/25">
                  <span
                    aria-hidden="true"
                    className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500"
                  />
                  Live now
                </span>
              )}
            </div>
            <h3 className="truncate text-lg font-bold text-main-black">
              {event.eventName}
            </h3>
          </div>

          <Link
            href={`/scan/${event._id}`}
            className="inline-flex shrink-0 items-center gap-2 rounded-full bg-main-purple px-5 py-2.5 text-sm font-semibold text-main-white shadow-md shadow-main-purple/25 transition-all hover:-translate-y-0.5 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-main-purple/40 focus-visible:ring-offset-2"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
              className="h-4 w-4"
            >
              <path d="M3 7V5a2 2 0 0 1 2-2h2M17 3h2a2 2 0 0 1 2 2v2M21 17v2a2 2 0 0 1-2 2h-2M7 21H5a2 2 0 0 1-2-2v-2M3 12h18" />
            </svg>
            Scan tickets
          </Link>
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
      </div>
    </article>
  );
}
