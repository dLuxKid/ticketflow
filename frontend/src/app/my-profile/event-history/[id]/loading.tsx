import {
  EventAnalyticsCard,
  EventAnalyticsTableSkeleton,
} from "@/components/skeletons";
import React from "react";

export default function Loading() {
  return (
    <div className="flex flex-col gap-6 w-full">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        <EventAnalyticsCard />
        <EventAnalyticsCard />
        <EventAnalyticsCard />
      </div>
      <EventAnalyticsTableSkeleton />
    </div>
  );
}
