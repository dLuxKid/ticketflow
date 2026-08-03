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
                className="w-full h-full object-fill object-center rounded-[1.25rem]"
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
                    <p className="text-sm font-medium text-[#1f1f1f]">
                      {formatDateRange(
                        new Date(event.startDate),
                        new Date(event.endDate),
                      )}
                    </p>
                    <p className="text-sm font-medium text-[#1f1f1f]/80">
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
                    <p className="text-sm font-medium text-[#1f1f1f]">
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
              className="w-full h-full object-fill object-center rounded-full"
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
