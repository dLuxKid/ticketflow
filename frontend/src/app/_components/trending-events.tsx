import { getTrendingEvents } from "@/utils/queries";
import EventCard from "../../components/ui/event-card";

export default async function TrendingEvents() {
  const data = await getTrendingEvents();
  const event: AllEventData[] = data?.data?.event || [];

  if (event.length)
    return (
      <div className="flex-center flex-col gap-8">
        <h1 className="title-text text-main-black text-center w-full">
          Trending Events
        </h1>
        <div className="w-full grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6">
          {event.map((event, i) => (
            <EventCard event={event} key={i} />
          ))}
        </div>
      </div>
    );

  return <div className="-mt-16 md:-mt-24"></div>;
}
