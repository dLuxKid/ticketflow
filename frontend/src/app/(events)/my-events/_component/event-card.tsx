import Image from "next/image";
import Link from "next/link";

import DateIcon from "@/assets/svg/my-events-date-icon";
import LocationIcon from "@/assets/svg/my-events-location-icon";
import TimeIcon from "@/assets/svg/my-events-time-icon";

import { formatDateRange, formatTimeRange } from "@/utils/utils";

export default function EventCard({ event }: { event: MyEvent }) {
  return (
    <div className="p-3 sm:p-4 md:p-8 border-b border-b-main-light-grey/10 shadow shadow-black/25 w-full flex gap-4 md:gap-6 flex-wrap sm:flex-nowrap">
      <div className="w-full sm:w-72 md:w-80 h-60 sm:h-48">
        <Image
          src={event.coverImage}
          alt={`Image for ${event.eventName}`}
          className="object-fill object-center w-full h-full rounded-big"
          height={200}
          width={300}
          unoptimized
          loading="lazy"
        />
      </div>
      <div className="flex justify-center flex-col gap-4 w-full">
        <div className="flex-between w-full gap-4">
          <h1 className="text-lg md:text-xl lg:text-2xl font-semibold">
            {event.eventName}
            {event.isLive == "live" && (
              <span className="px-2 py-1 text-sm font-normal text-main-white ml-4 rounded bg-red-500">
                Live
              </span>
            )}
          </h1>
          <Link href={`/edit-event/${event.slug}`}>
            <button
              type="button"
              className="py-2 px-6 bg-main-purple text-main-white body-text rounded-md"
            >
              Edit
            </button>
          </Link>
        </div>
        <div className="flex-start gap-4 flex-wrap">
          <div className="flex-center gap-2">
            <span>
              <DateIcon />
            </span>
            <p className="text-sm font-semibold text-[#1f1f1f] align-middle">
              {formatDateRange(
                new Date(event.startDate),
                new Date(event.endDate)
              )}
            </p>
          </div>
          <div className="flex-center gap-2">
            <span>
              <TimeIcon />
            </span>
            <p className="text-sm font-semibold text-[#1f1f1f] align-middle">
              {formatTimeRange(
                new Date(event.startTime),
                new Date(event.endTime)
              )}{" "}
              {event.timezone}
            </p>
          </div>
        </div>
        <div className="flex-start">
          <div className="flex-center gap-2">
            <span>
              <LocationIcon />
            </span>
            <p className="text-sm text-[#1f1f1f] font-semibold">
              {event.eventLocation.address} {event.eventLocation.city},{" "}
              {event.eventLocation.state}, {event.eventLocation.country}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
