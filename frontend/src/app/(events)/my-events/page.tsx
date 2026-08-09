"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";

import ErrorPage from "@/components/error-page";
import { LoadingMyEvent } from "@/components/skeletons";
import NoEvents from "@/components/ui/no-events-card";
import Search from "@/components/ui/searchbar";
import EventCard from "./_component/event-card";
import AssignedEventCard from "./_component/assigned-event-card";

import { useMyEvents, useDeleteEvent } from "@/store/useMyEvents";
import { useAssignedEvents } from "@/store/useAssignedEvents";
import { useUser } from "@/store/useUser";
import { toast } from "sonner";

/**
 * Organiser's event list.
 *
 * The header band was `bg-main-black` with a `bg-red-900` wrapper around the filter tabs -
 * the red was leftover debug styling that shipped, and the black clashed with the cotton
 * palette every other page uses. It is now a white band consistent with the rest of the app.
 *
 * Filters are real <button>s with `aria-pressed`. They were <li onClick>, so the whole
 * filter control was unreachable by keyboard and announced as a plain list item.
 */

const EVENT_CATEGORIES: category[] = ["all", "live", "upcoming", "past"];

function MyEventContent() {
  const [eventCategory, setEventCategory] = useState<category>("all");
  const [myEvents, setMyEvents] = useState<MyEvent[]>([]);

  const searchParams = useSearchParams();
  const query = searchParams.get("query") || undefined;

  // Admin-only scope switch. An admin is usually also an organiser, so "all events" must
  // not be the only view available to them — their own events were previously buried among
  // everyone else's with no way to narrow the list.
  const [scope, setScope] = useState<"own" | "all">("own");

  const { data: events, isLoading, error } = useMyEvents(query, scope);
  const { data: assigned } = useAssignedEvents();
  const { data: me } = useUser();

  const assignedEvents: MyEvent[] = assigned?.data?.events ?? [];
  // An admin's list is every event on the platform, not just their own - so the heading and
  // empty state need to say so, otherwise "Events you created" would be plainly wrong.
  const isAdmin = me?.data?.user?.role === "admin";

  const deleteEvent = useDeleteEvent();

  const onArchive = (event: MyEvent) => {
    // Names the event and states plainly what survives - an admin archiving an event with
    // paying attendees needs to know it is reversible and that their tickets are not voided.
    const ok = window.confirm(
      `Archive "${event.eventName}"?\n\n` +
        "It will be hidden from listings and from its organiser. Bookings, guests, chat " +
        "history and the admission audit log are all kept, and it can be restored.",
    );
    if (!ok) return;

    deleteEvent.mutate(event._id, {
      onSuccess: (res: any) => {
        const a = res?.data?.affected;
        toast.success(
          a?.bookings
            ? `"${event.eventName}" archived - ${a.bookings} booking(s) kept${a.paidBookings ? `, ${a.paidBookings} of them paid` : ""}`
            : `"${event.eventName}" archived`,
        );
      },
      onError: (err: any) =>
        toast.error(
          err?.response?.data?.message ?? "Could not archive that event",
        ),
    });
  };

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

  const total: number = events?.data?.events?.length ?? 0;

  return (
    <>
      <div className="border-b border-main-light-grey/60 bg-main-white px-[5%] py-8 md:py-10">
        <div className="mx-auto max-w-screen-2xl">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-main-black md:text-3xl">
                {isAdmin && scope === "all" ? "All events" : "Your events"}
              </h1>
              <p className="mt-1 text-sm text-sec-black/65">
                {isLoading
                  ? "Loading your events…"
                  : isAdmin && scope === "all"
                    ? `${total} ${total === 1 ? "event" : "events"} across the platform`
                    : `${total} ${total === 1 ? "event" : "events"} created`}
              </p>
            </div>

            <Link
              href="/create-event"
              className="inline-flex items-center gap-2 rounded-full bg-main-purple px-5 py-2.5 text-sm font-semibold text-main-white shadow-lg shadow-main-purple/25 transition-all hover:-translate-y-0.5 hover:bg-main-purple/90 hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-main-purple/40 focus-visible:ring-offset-2"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
                className="h-4 w-4"
              >
                <path d="M12 5v14M5 12h14" />
              </svg>
              Create event
            </Link>
          </div>

          {isAdmin && (
            <div
              role="group"
              aria-label="Which events to show"
              className="mt-6 flex w-fit gap-1 rounded-full bg-main-grey-bg p-1"
            >
              {(
                [
                  ["own", "My events"],
                  ["all", "All events"],
                ] as const
              ).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  aria-pressed={scope === value}
                  onClick={() => setScope(value)}
                  className={`rounded-full px-5 py-1.5 text-sm font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-main-purple/40 ${
                    scope === value
                      ? "bg-main-white text-main-purple shadow-sm"
                      : "text-sec-black/70 hover:text-main-black"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          )}

          <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
            <div
              role="group"
              aria-label="Filter events by status"
              className="flex flex-wrap gap-1.5 rounded-full bg-main-grey-bg p-1"
            >
              {EVENT_CATEGORIES.map((cat) => {
                const active = cat === eventCategory;
                return (
                  <button
                    key={cat}
                    type="button"
                    aria-pressed={active}
                    onClick={() => setEventCategory(cat)}
                    className={`rounded-full px-4 py-1.5 text-sm font-semibold capitalize transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-main-purple/40 ${
                      active
                        ? "bg-main-white text-main-purple shadow-sm"
                        : "text-sec-black/70 hover:text-main-black"
                    }`}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>

            <div className="flex w-full max-w-sm">
              <Search
                placeholder="Search your events"
                className="h-11 w-full rounded-full border border-main-light-grey bg-main-grey-bg pl-10 pr-4 text-sm text-main-black transition-colors placeholder:text-sec-black/50 focus:border-main-purple/50 focus:bg-main-white"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="px-[5%] py-10 md:py-12">
        <div className="mx-auto max-w-screen-2xl">
          {/* Door-staff assignments come first: someone working a door is here to scan, not
              to browse events they created - and until this section existed they had no
              route to the scanner at all. Hidden entirely when there are none, so it never
              adds noise for organisers who do not work doors. */}
          {assignedEvents.length > 0 && (
            <div className="mb-12">
              <div className="mb-4 flex items-baseline gap-3">
                <h2 className="text-lg font-bold text-main-black">
                  Events you&apos;re working
                </h2>
                <span className="text-sm text-sec-black/60">
                  {assignedEvents.length} assigned to you as door staff
                </span>
              </div>
              <div className="flex flex-col gap-4">
                {assignedEvents.map((event) => (
                  <AssignedEventCard event={event} key={event._id} />
                ))}
              </div>
            </div>
          )}

          {assignedEvents.length > 0 && (
            <h2 className="mb-4 text-lg font-bold text-main-black">
              {isAdmin && scope === "all" ? "All events" : "Events you created"}
            </h2>
          )}

          {isLoading ? (
            <LoadingMyEvent />
          ) : myEvents.length === 0 ? (
            <NoEvents category={eventCategory} />
          ) : (
            <div className="flex flex-col gap-5">
              {myEvents.map((event: MyEvent, i: number) => (
                <EventCard
                  event={event}
                  key={i}
                  canDelete={isAdmin}
                  onDelete={onArchive}
                />
              ))}
            </div>
          )}
        </div>
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
