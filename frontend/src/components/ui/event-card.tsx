import Image from "next/image";
import Link from "next/link";

import LocationIcon from "@/assets/svg/location-icon";

import NumberOfAttendees from "@/components/ui/number-of-attendees";
import MoreDetailsBtn from "@/components/ui/more-details-btn";

import { truncate } from "@/utils/utils";

/**
 * Event card.
 *
 * The date moves onto the cover image as a calendar chip rather than sitting as a third line
 * of grey text in the body. Cover images are user-uploaded and wildly inconsistent - logos,
 * screenshots, photos - so a fixed aspect ratio with `object-cover` and a neutral backdrop
 * keeps a row of cards aligned regardless of what was uploaded, and the scrim underneath the
 * chip keeps it legible on a light image.
 */
export default function EventCard({ event }: { event: AllEventData }) {
  const start = new Date(event.startDate);
  const month = start.toLocaleDateString("en-GB", { month: "short" });
  const day = start.toLocaleDateString("en-GB", { day: "2-digit" });

  return (
    <Link
      href={`/explore-events/${event.slug}`}
      className="group block h-full focus-visible:outline-none"
    >
      <article className="flex h-full flex-col overflow-hidden rounded-2xl border border-main-light-grey/70 bg-main-white shadow-[0_2px_10px_-6px_rgba(46,50,68,0.25)] transition-all duration-300 group-hover:-translate-y-1 group-hover:border-main-purple/40 group-hover:shadow-[0_22px_44px_-20px_rgba(46,50,68,0.4)] group-focus-visible:ring-2 group-focus-visible:ring-main-purple/40">
        <div className="relative aspect-[16/10] w-full overflow-hidden bg-main-grey-bg">
          <Image
            src={event.coverImage}
            alt=""
            width={480}
            height={300}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.06]"
            loading="lazy"
            unoptimized
          />

          {/* No scrim: the chip is opaque, and a gradient across the top laid a grey band
              over light covers (logos, screenshots) for contrast it did not need. A ring
              carries the chip on a white image instead. */}
          <div className="absolute left-3 top-3 flex flex-col items-center rounded-xl bg-main-white px-2.5 py-1.5 shadow-[0_4px_12px_-4px_rgba(46,50,68,0.35)] ring-1 ring-main-black/[0.06]">
            <span className="text-[10px] font-bold uppercase leading-none tracking-wider text-main-purple">
              {month}
            </span>
            <span className="mt-0.5 text-lg font-bold leading-none text-main-black">
              {day}
            </span>
          </div>
        </div>

        <div className="flex flex-1 flex-col gap-3 p-4 sm:p-5">
          <div className="flex flex-col gap-1.5">
            <h2 className="line-clamp-2 text-base font-bold leading-snug text-main-black transition-colors group-hover:text-main-purple">
              {event.eventName}
            </h2>
            <p className="flex items-center gap-1.5 text-xs font-medium text-sec-black/65">
              <LocationIcon />
              {truncate(event.eventLocation.address, 34)}
            </p>
          </div>

          {/* mt-auto pins the action row to the bottom so buttons line up across a row of
              cards whose titles wrap to different heights. */}
          <div className="mt-auto flex items-center justify-between gap-3 border-t border-main-light-grey/70 pt-3">
            <NumberOfAttendees number={event.numberOfAttendees} />
            <div className="ml-auto">
              <MoreDetailsBtn event={event} />
            </div>
          </div>
        </div>
      </article>
    </Link>
  );
}
