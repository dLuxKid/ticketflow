import Image from "next/image";
import Link from "next/link";

import DateIcon from "@/assets/svg/date-icon";
import LocationIcon from "@/assets/svg/location-icon";

import NumberOfAttendees from "@/components/ui/number-of-attendees";
import MoreDetailsBtn from "@/components/ui/more-details-btn";

import { formatDateRange, truncate } from "@/utils/utils";

export default function EventCard({ event }: { event: AllEventData }) {
  return (
    <Link href={`/explore-events/${event.slug}`} className="group block h-full">
      <div className="h-full rounded-big border border-main-light-grey/60 overflow-hidden cursor-pointer bg-main-white shadow-sm transition-all duration-300 group-hover:shadow-xl group-hover:-translate-y-1 group-hover:border-main-purple/40">
        <div className="h-52 w-full overflow-hidden bg-main-grey-bg relative">
          <Image
            src={event.coverImage}
            alt={`Image for ${event.eventName}`}
            width={400}
            height={260}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
            unoptimized
          />
        </div>
        <div className="p-4 sm:p-5 flex-between w-full sm:flex-nowrap flex-wrap gap-4 sm:gap-2">
          <div className="flex-start flex-col gap-2 min-w-0 flex-1">
            <h2 className="text-base font-bold text-main-black line-clamp-1 group-hover:text-main-purple transition-colors">
              {event.eventName}
            </h2>
            <p className="text-sm font-medium text-main-black/70 flex items-center gap-1.5">
              <DateIcon />
              {formatDateRange(
                new Date(event.startDate),
                new Date(event.startDate)
              )}
            </p>
            <p className="text-xs font-normal text-main-black/60 flex items-center gap-1.5">
              <LocationIcon />
              {truncate(event.eventLocation.address, 30)}
            </p>
            <NumberOfAttendees number={event.numberOfAttendees} />
          </div>

          <MoreDetailsBtn event={event} />
        </div>
      </div>
    </Link>
  );
}
