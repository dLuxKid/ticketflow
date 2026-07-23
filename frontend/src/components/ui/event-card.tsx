import Image from "next/image";
import Link from "next/link";

import DateIcon from "@/assets/svg/date-icon";
import LocationIcon from "@/assets/svg/location-icon";

import NumberOfAttendees from "@/components/ui/number-of-attendees";
import MoreDetailsBtn from "@/components/ui/more-details-btn";

import { formatDateRange, truncate } from "@/utils/utils";

export default function EventCard({ event }: { event: AllEventData }) {
  return (
    <Link href={`/explore-events/${event.slug}`}>
      <div className="rounded-2xl border border-[#1f1f1f]/30 overflow-hidden cursor-pointer shadow-sm">
        <div className="h-60 w-full">
          <Image
            src={event.coverImage}
            alt={`Image for ${event.eventName}`}
            width={260}
            height={200}
            className="w-full h-full object-center"
            loading="lazy"
            unoptimized
          />
        </div>
        <div className="p-2 sm:p-4 bg-main-white flex-between w-full sm:flex-nowrap flex-wrap gap-4 sm:gap-2">
          <div className="flex-start flex-col gap-2 overflow-x-auto relative ">
            <h2 className="text-base font-bold text-main-black">
              {event.eventName}
            </h2>
            <p className="text-sm font-medium text-[#1f1f1f] flex-center">
              <span className="mr-1">
                <DateIcon />
              </span>
              {formatDateRange(
                new Date(event.startDate),
                new Date(event.startDate)
              )}
            </p>
            <p className="text-xs font-normal text-[#1f1f1f] flex-center">
              <span className="mr-1">
                <LocationIcon />
              </span>
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
