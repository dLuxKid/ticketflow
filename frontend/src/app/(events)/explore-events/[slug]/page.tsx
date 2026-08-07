import avatar from "@/assets/images/default-avatar.png";
import DateIcon from "@/assets/svg/date-icon";
import FacebookIcon from "@/assets/svg/fb-color";
import GlobeColor from "@/assets/svg/globe-color";
import InstagramIcon from "@/assets/svg/ig-color";
import LocationIcon from "@/assets/svg/location-icon";
import XIcon from "@/assets/svg/x-icon";
import Youtube from "@/assets/svg/youtube";
import Container from "@/components/container";
import NumberOfAttendees from "@/components/ui/number-of-attendees";
import { getEvent } from "@/utils/queries";
import { formatDateRange, formatTimeRange } from "@/utils/utils";
import { Metadata, ResolvingMetadata } from "next";
import Image from "next/image";
import { redirect } from "next/navigation";
import BuyTicketBtn from "../_components/buy-ticket-btn";

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata(
  { params }: Props,
  parent: ResolvingMetadata,
): Promise<Metadata> {
  const resolvedParams = await params;
  const data = await getEvent(resolvedParams.slug);
  const previousImages = (await parent).openGraph?.images || [];

  return {
    title: data.data.event.eventName || "Explore Event",
    description: data.data.event.eventDescription || "",
    openGraph: {
      images: [data.data.event.coverImage, ...previousImages],
    },
  };
}

export default async function Event({ params }: Props) {
  const resolvedParams = await params;
  const data = await getEvent(resolvedParams.slug);
  if (!data.status) redirect("/explore-events");
  const event: EventDetails = data.data.event;

  // One source of truth for the "Before you go" rows: built once, filtered once, so the
  // presence check and the render can never disagree about what is shown.
  const beforeYouGo = (
    [
      ["Venue", event.venueName, "M3 21h18M5 21V7l7-4 7 4v14M9 21v-6h6v6"],
      ["Dress code", event.dressCode, "M16 3l-4 3-4-3-5 4 3 3v11h12V10l3-3z"],
      ["Parking", event.parkingInfo, "M9 17V7h4a3 3 0 0 1 0 6H9M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z"],
      ["Accessibility", event.accessibilityInfo, "M12 4a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3zM6 8l6 1 6-1M12 9v5l4 7M12 14l-4 7"],
      ["Age restriction", event.ageRestriction, "M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM9 9h.01M15 9h.01M8 15s1.5 2 4 2 4-2 4-2"],
    ] as [string, string | undefined, string][]
  )
    .filter(([, value]) => value?.trim())
    .map(([label, value, path]) => ({ label, value, path }));

  return (
    <main>
      <Container>
        <div className="p-[5%] flex-center flex-col gap-6">
          <div>
            <h1 className="sub-title-text">Event Details</h1>
          </div>
          <div className="flex flex-col gap-4 w-full">
            <div className="h-[200px] sm:h-[300px] md:h-[400px] w-full">
              <Image
                src={event.coverImage}
                alt={`Image for ${event.eventName}`}
                className="w-full h-full object-cover object-center rounded-[1.25rem]"
                height={400}
                width={100}
                loading="lazy"
                unoptimized
              />
            </div>
            <div className="mt-4 flex-between flex-wrap gap-4">
              <div className="flex-start flex-col gap-2">
                <h2 className="text-xl font-bold text-main-black">
                  {event.eventName}
                </h2>
                <div className="flex-start gap-2">
                  <span className="pt-0.5">
                    <DateIcon />
                  </span>
                  <div>
                    <p className="text-sm font-medium text-main-black">
                      {formatDateRange(
                        new Date(event.startDate),
                        new Date(event.endDate),
                      )}
                    </p>
                    <p className="text-sm font-medium text-main-black/80">
                      {formatTimeRange(
                        new Date(event.startTime),
                        new Date(event.endTime),
                      )}{" "}
                      {event.timezone}
                    </p>
                  </div>
                </div>
                <div className="flex-start gap-2">
                  <span className="pt-0.5">
                    <LocationIcon />
                  </span>
                  <div>
                    <p className="text-sm font-medium text-main-black">
                      {event.eventLocation.address} {event.eventLocation.city},{" "}
                      {event.eventLocation.state}, {event.eventLocation.country}
                    </p>
                  </div>
                </div>
                <div className="relative z-0">
                  <NumberOfAttendees number={event.numberOfAttendees} />
                </div>
              </div>
              <BuyTicketBtn event={event} />
            </div>
            <div className="flex-start flex-col">
              <h4 className="text-lg md:text-xl font-semibold">Description</h4>
              <p className="text-black text-base font-normal leading-7 w-full break-words">
                {event.eventDescription}
              </p>
            </div>

            {/* Rendered only for the fields the organiser actually filled in - an empty
                "Dress code: -" row tells an attendee nothing and implies the organiser
                forgot rather than that it simply does not apply. */}
            {beforeYouGo.length > 0 && (
              <div className="flex w-full flex-col gap-3">
                <h4 className="text-lg font-semibold md:text-xl">
                  Before you go
                </h4>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {beforeYouGo.map(({ label, value, path }) => (
                    <div
                      key={label}
                      className="flex items-start gap-3 rounded-2xl border border-main-light-grey/70 bg-main-white p-4"
                    >
                      <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-main-purple/10 text-main-purple">
                        <svg
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          aria-hidden="true"
                          className="h-4 w-4"
                        >
                          <path d={path} />
                        </svg>
                      </span>
                      <span className="min-w-0">
                        <span className="block text-sm font-bold text-main-black">
                          {label}
                        </span>
                        <span className="block text-sm leading-relaxed text-sec-black/75">
                          {value}
                        </span>
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div className="flex flex-col gap-2">
              <div className="flex-between gap-4">
                <p className="text-lg md:text-xl font-semibold">Ticket Type</p>
                <p className="text-lg md:text-xl font-semibold">
                  Price ({event.currency})
                </p>
              </div>
              <div className="flex flex-col">
                {event.ticketDetails.map((ticket, i) => (
                  <div className="flex-between gap-4" key={i}>
                    <p className="text-black text-sm font-medium">
                      {ticket.ticketName.toUpperCase()}
                    </p>
                    <p className="text-black text-sm font-medium">
                      {ticket.ticketPrice}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
        {/* <div className="flex-start flex-col gap-2 bg-main-black px-[5%] py-[10%] md:py-[5%] w-full">
          <div className="flex flex-col gap-1 md:gap-2 mb-2">
            <h4 className="text-xl font-semibold -mt-2 text-main-white">
              Location
            </h4>
            <p className="text-base text-main-white">
              {event.eventLocation.address} {event.eventLocation.city},{" "}
              {event.eventLocation.state}, {event.eventLocation.country}
            </p>
          </div>
          <div className="bg-gray-600 h-52 sm:h-60 md:h-96 w-full rounded-xl" />
        </div> */}
        <div className="w-full flex-center flex-col gap-2 mt-4 p-[5%]">
          <div className="rounded-full h-20 w-20">
            <Image
              src={event.user.photo || avatar}
              alt={"Profile photo"}
              className="w-full h-full object-cover object-center rounded-full"
              height={80}
              width={80}
              loading="lazy"
              unoptimized
            />
          </div>
          <h4 className="sub-title-text -mt-1">{event.user.name}</h4>
          <p>{event.user.email}</p>
          <div className="flex-center flex-col gap-2 mt-4 w-full">
            <p className="text-lg font-semibold">Connect with us below</p>
            <div className="[&>p]:cursor-pointer flex-center gap-4 md:gap-8">
              {event.socialMediaLinks.facebook && (
                <span>
                  <a
                    href={event.socialMediaLinks.facebook}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <FacebookIcon />
                  </a>
                </span>
              )}
              {event.socialMediaLinks.twitter && (
                <span>
                  <a
                    href={event.socialMediaLinks.twitter}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <XIcon />
                  </a>
                </span>
              )}
              {event.socialMediaLinks.youtube && (
                <span>
                  <a
                    href={event.socialMediaLinks.youtube}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <Youtube />
                  </a>
                </span>
              )}
              {event.socialMediaLinks.instagram && (
                <span>
                  <a
                    href={event.socialMediaLinks.instagram}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <InstagramIcon />
                  </a>
                </span>
              )}
              {event.socialMediaLinks.others && (
                <span>
                  <a
                    href={event.socialMediaLinks.others}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <GlobeColor />
                  </a>
                </span>
              )}
            </div>
          </div>
        </div>
      </Container>
    </main>
  );
}
