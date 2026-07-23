import type { Metadata, ResolvingMetadata } from "next";
import { redirect } from "next/navigation";

import EditEventForm from "../_component/edit-event-form";

import { getEvent } from "@/utils/queries";

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata(
  { params }: Props,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const resolvedParams = await params;
  const data = await getEvent(resolvedParams.slug);
  const previousImages = (await parent).openGraph?.images || [];

  return {
    title: `Connect - Edit ${data.data.event.eventName}` || "Edit Event",
    openGraph: {
      images: [data.data.event.coverImage, ...previousImages],
    },
  };
}

export default async function EditEvent({ params }: Props) {
  const resolvedParams = await params;
  const data = await getEvent(resolvedParams.slug);
  if (!data.status) redirect("/my-events");
  const event: eventData = data.data.event;

  return (
    <>
      <div className="flex items-center h-24 px-[5%] bg-main-black">
        <h1 className="sub-title-text text-main-white">Edit Event</h1>
      </div>
      <div className="flex-between flex-col gap-8 md:gap-12 pt-8 pb-12 px-[5%] relative">
        <EditEventForm event={event} />
      </div>
    </>
  );
}
