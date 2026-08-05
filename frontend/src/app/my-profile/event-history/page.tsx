import { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";

import DateIcon from "@/assets/svg/date-icon";
import LocationIcon from "@/assets/svg/location-icon";

import NoEvents from "@/components/ui/no-events-card";
import Search from "@/components/ui/searchbar";

import { getMyEvents } from "@/utils/queries";
import { formatDateRange } from "@/utils/utils";

export const metadata: Metadata = {
  title: "Event History",
};

export default async function EventHistory({
  searchParams,
}: {
  searchParams?: Promise<{ [key: string]: string | undefined }>;
}) {
  const resolvedSearchParams = await searchParams;
  const data = await getMyEvents(resolvedSearchParams?.query || "");

  return (
    <Suspense fallback={<div />}>
      <div className="flex flex-col gap-6 py-2">
      <div className="self-center max-w-sm w-full">
        <Search
          placeholder="Search for events"
          className="w-full bg-sec-grey border border-main-purple text-main-black text-sm placeholder:text-sm placeholder:text-main-black h-12 rounded-sm pl-8 pr-3"
        />
      </div>

      <div className="w-full flex flex-col gap-6">
        {data.data.events.length === 0 ? (
          <NoEvents />
        ) : (
          data.data.events.map((event: MyEvent, i: number) => (
            <Link href={`/my-profile/event-history/${event._id}`} key={i}>
              <div className="flex-between gap-3 flex-wrap md:flex-nowrap cursor-pointer rounded-big bg-main-purple/10 p-4 md:p-6">
                <div className="flex-start flex-col md:flex-row w-full gap-4">
                  <div className="h-40 md:h-32 w-full md:w-52">
                    <Image
                      src={event.coverImage}
                      alt={`Image for ${event.eventName}`}
                      width={208}
                      height={160}
                      className="w-full h-full rounded object-center"
                      loading="lazy"
                    />
                  </div>
                  <div className="flex my-auto flex-col gap-2 md:gap-3">
                    <h2 className="text-lg md:text-xl font-bold text-main-black self-start">
                      {event.eventName}
                    </h2>
                    <p className="text-base font-medium text-main-black/70 self-start flex-center">
                      <span className="mr-1">
                        <DateIcon />
                      </span>
                      {formatDateRange(
                        new Date(event.startDate),
                        new Date(event.endDate)
                      )}
                    </p>
                    <p className="text-sm font-normal text-main-black/70 self-start flex-center">
                      <span className="mr-1">
                        <LocationIcon />
                      </span>
                      {event.eventLocation.address}
                    </p>
                  </div>
                </div>
                <div
                  className={`px-4 py-2 rounded-sm text-sm md:text-base font-medium text-main-white ${
                    event.isLive === "live"
                      ? "bg-red-600"
                      : event.isLive === "past"
                      ? "bg-main-black"
                      : "bg-[#00A95C]"
                  }`}
                >
                  {event.isLive}
                </div>
              </div>
            </Link>
          ))
        )}
      </div>
      </div>
    </Suspense>
  );
}
