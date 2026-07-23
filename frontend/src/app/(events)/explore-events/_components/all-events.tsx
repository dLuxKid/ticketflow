"use client";

import { useSearchParams } from "next/navigation";

import { getAllEvents, getAllEventsLength } from "@/utils/queries";
import { useQuery } from "@tanstack/react-query";

import ErrorPage from "@/components/error-page";
import { LoadingAllEvents } from "@/components/skeletons";
import NoEvents from "@/components/ui/no-events-card";
import EventCard from "@/components/ui/event-card";
import Pagination from "./pagination-btns";

export default function AllEvents() {
  const params = useSearchParams();
  const query = params.toString().replace("query", "eventName");

  const { data, isLoading, error } = useQuery({
    queryKey: ["all-events", query],
    queryFn: async () => await getAllEvents(`?${query}`),
  });

  const {
    data: AllEvents,
    isLoading: AllEventsLoading,
    error: AllEventsError,
  } = useQuery({
    queryKey: ["all-events"],
    queryFn: async () => await getAllEventsLength(),
  });

  if (isLoading)
    return (
      <div className="w-full grid sm:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <LoadingAllEvents key={i} />
        ))}
      </div>
    );

  if (error) return <ErrorPage error={error} />;

  if (data.data.event.length == 0)
    return (
      <div className="h-screen">
        <NoEvents />
      </div>
    );

  return (
    <>
      <div className="w-full grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6">
        {data.data.event.map((event: AllEventData, i: number) => (
          <EventCard event={event} key={i} />
        ))}
      </div>
      {!AllEventsLoading && !AllEventsError && (
        <Pagination length={AllEvents.results} />
      )}
    </>
  );
}
