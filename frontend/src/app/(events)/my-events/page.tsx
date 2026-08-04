"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";

import ErrorPage from "@/components/error-page";
import { LoadingMyEvent } from "@/components/skeletons";
import Button from "@/components/ui/cta-btn";
import NoEvents from "@/components/ui/no-events-card";
import Search from "@/components/ui/searchbar";
import EventCard from "./_component/event-card";

import { useMyEvents } from "@/store/useMyEvents";

function MyEventContent() {
  const eventCategories: category[] = ["all", "live", "upcoming", "past"];
  const [eventCategory, setEventCategory] = useState<category>("all");
  const [myEvents, setMyEvents] = useState<MyEvent[]>([]);

  const searchParams = useSearchParams();
  const query = searchParams.get("query") || undefined;

  const { data: events, isLoading, error } = useMyEvents(query);

  useEffect(() => {
    if (events) {
      setMyEvents(events.data.events);

      if (eventCategory !== "all") {
        const oldEvents = [...events.data.events];
        const filteredEvents = oldEvents.filter(
          (event) => event.isLive === eventCategory,
        );

        setMyEvents(filteredEvents);
      }
    }
  }, [events, eventCategory]);

  if (error) return <ErrorPage error={error} />;

  return (
    <>
      <div className="px-[5%] bg-main-black">
        <div className="flex-between h-20 sm:h-32">
          <h1 className="sub-title-text text-sec-grey">Events</h1>
          <Link href={"/create-event"}>
            <Button>Create Event</Button>
          </Link>
        </div>
        <div className="w-full bg-red-900">
          <ul className="flex-start gap-4">
            {eventCategories.map((category) => (
              <li
                key={category}
                className="text-sec-grey body-text flex-center flex-col gap-0.5 capitalize cursor-pointer"
                onClick={() => setEventCategory(category)}
              >
                {category}
                <span
                  className={`h-1 w-full duration-200 transition-all transform ${
                    category === eventCategory
                      ? "bg-main-light-grey"
                      : "bg-transparent"
                  }`}
                />
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className="px-[5%] pb-16">
        <div className="py-14">
          <div className="flex-center w-full max-w-lg mx-auto">
            <Search
              placeholder="Search for event"
              className="w-full bg-sec-grey border border-main-purple text-main-black placeholder:font-normal placeholder:text-main-black h-12 rounded-sm pl-8 pr-3"
            />
          </div>
        </div>

        {isLoading ? (
          <LoadingMyEvent />
        ) : myEvents.length === 0 ? (
          <NoEvents category={eventCategory} />
        ) : (
          <div className="flex flex-col gap-8">
            {myEvents.map((event: MyEvent, i: number) => (
              <EventCard event={event} key={i} />
            ))}
          </div>
        )}
      </div>
    </>
  );
}

export default function MyEvent() {
  return (
    <Suspense fallback={<LoadingMyEvent />}>
      <MyEventContent />
    </Suspense>
  );
}
