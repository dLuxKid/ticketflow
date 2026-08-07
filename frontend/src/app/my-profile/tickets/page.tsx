import { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import Button from "@/components/ui/cta-btn";
import { getMyBookings } from "@/utils/queries";

type Booking = {
  ticketId: string;
  event: {
    _id: string;
    eventName: string;
    startDate: string;
    startTime: string;
    eventLocation: any;
    coverImage: string;
    isLive: string;
    id: string;
    slug: string;
  };
};

export const metadata: Metadata = {
  title: "My Tickets",
};

export default async function Tickets() {
  const data = await getMyBookings();
  const bookings: Booking[] = data.data.bookings;

  return (
    <div className="flex-center flex-col gap-6">
      {bookings.length ? (
        bookings.map(({ event, ticketId }, i) => (
          <div
            className="w-full max-w-[40rem] h-full sm:max-h-48 relative bg-main-purple rounded-big sm:bg-transparent"
            key={i}
          >
            <span className="w-full max-w-[40rem] h-48 inset-x-0 inset-y-0 hidden sm:block absolute z-0">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="100%"
                height="100%"
                viewBox="0 0 653 191"
                fill="none"
              >
                <path
                  d="M637.054 48.3573C637.054 53.7386 644.202 58.1109 653 58.1109V70.1442C644.202 70.1442 637.054 74.5165 637.054 79.8979C637.054 85.2792 644.202 89.6515 653 89.6515V101.647C644.202 101.647 637.054 106.02 637.054 111.401C637.054 116.782 644.202 121.155 653 121.155V133.188C644.202 133.188 637.054 137.56 637.054 142.942C637.054 148.323 644.202 152.695 653 152.695V165.439C651.289 165.289 649.517 165.214 647.685 165.214C647.318 165.214 647.013 165.214 646.646 165.214C625.201 165.551 608.033 176.276 608.033 189.468C608.033 189.991 608.033 190.477 608.094 191L44.8449 191C44.906 190.477 44.906 189.991 44.906 189.468C44.906 176.313 27.7378 165.588 6.29295 165.214C4.21566 164.99 2.13838 164.915 0 164.915L0 152.695C8.7979 152.695 15.9462 148.323 15.9462 142.942C15.9462 137.56 8.7979 133.188 0 133.188L0 121.155C8.7979 121.155 15.9462 116.782 15.9462 111.401C15.9462 106.02 8.7979 101.647 0 101.647L0 89.6142C8.7979 89.6142 15.9462 85.2418 15.9462 79.8605C15.9462 74.4792 8.7979 70.1068 0 70.1068L0 58.0736C8.7979 58.0736 15.9462 53.7012 15.9462 48.3199C15.9462 42.9386 8.7979 38.5662 0 38.5662L0 25.8603C1.7107 26.0098 3.4825 26.0845 5.3154 26.0845C27.188 26.0845 44.9671 15.2097 44.9671 1.83115C44.9671 1.23322 44.906 0.597926 44.8449 0L608.155 0C608.094 0.597926 608.033 1.23322 608.033 1.83115C608.033 15.2097 625.751 26.0845 647.685 26.0845C649.456 26.0845 651.228 26.0098 653 25.8603V38.641C644.141 38.641 637.054 42.9759 637.054 48.3573Z"
                  fill="#6c5ce7"
                />
              </svg>
            </span>
            <div className="relative z-10 flex items-center sm:justify-center flex-wrap sm:flex-nowrap gap-4 sm:gap-6 flex-1 sm:px-8 p-4">
              <div className="h-40 md:h-32 my-auto w-full sm:w-[12rem] rounded-sm">
                <Image
                  src={event.coverImage}
                  alt={`Image for ${event.eventName}`}
                  className="object-cover object-center w-full h-full rounded-big"
                  height={200}
                  width={300}
                  unoptimized
                  loading="lazy"
                />
              </div>
              <div className="h-40 w-0.5 hidden sm:block rounded bg-white/50" />
              <div className="flex-start my-auto flex-col gap-1">
                {/* The ticket links through to the event it is for - previously the only
                    route to those details was searching the public listing again. */}
                <Link
                  href={`/explore-events/${event.slug}`}
                  className="group inline-flex items-center gap-1.5 text-base font-bold text-main-white underline-offset-4 hover:underline md:text-lg"
                >
                  <h2>{event.eventName}</h2>
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                    className="h-4 w-4 shrink-0 transition-transform group-hover:translate-x-0.5"
                  >
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                  <span className="sr-only">View event details</span>
                </Link>
                <div className="text-sm flex-center gap-1 font-medium text-main-white/70">
                  <span>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="14"
                      viewBox="0 0 16 14"
                      fill="none"
                    >
                      <path
                        d="M3.55556 7H5.33333V8.4H3.55556V7ZM16 2.8V12.6C16 12.9713 15.8127 13.3274 15.4793 13.5899C15.1459 13.8525 14.6937 14 14.2222 14H1.77778C1.30628 14 0.854097 13.8525 0.520699 13.5899C0.187301 13.3274 0 12.9713 0 12.6V2.8C0 2.4287 0.187301 2.0726 0.520699 1.81005C0.854097 1.5475 1.30628 1.4 1.77778 1.4H2.66667V0H4.44444V1.4H11.5556V0H13.3333V1.4H14.2222C14.6937 1.4 15.1459 1.5475 15.4793 1.81005C15.8127 2.0726 16 2.4287 16 2.8ZM1.77778 4.2H14.2222V2.8H1.77778V4.2ZM14.2222 12.6V5.6H1.77778V12.6H14.2222ZM10.6667 8.4V7H12.4444V8.4H10.6667ZM7.11111 8.4V7H8.88889V8.4H7.11111ZM3.55556 9.8H5.33333V11.2H3.55556V9.8ZM10.6667 11.2V9.8H12.4444V11.2H10.6667ZM7.11111 11.2V9.8H8.88889V11.2H7.11111Z"
                        fill="#FFFFFFB2"
                        fillOpacity="0.7"
                      />
                    </svg>
                  </span>
                  <p className="text-sm md:text-base">
                    {new Date(event.startDate).toLocaleDateString("en-GB", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                    })}
                  </p>
                  <p className="my-1">
                    {new Date(event.startTime).toLocaleTimeString("en-US", {
                      hour: "numeric",
                      minute: "2-digit",
                      hour12: true,
                    })}
                  </p>
                </div>
                <div className="text-sm font-medium text-main-white/70">
                  <p className="flex-center text-sm md:text-base">
                    <span className="mr-1">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="14"
                        height="16"
                        viewBox="0 0 14 16"
                        fill="none"
                      >
                        <path
                          d="M7 3.6C7.66304 3.6 8.29893 3.81071 8.76777 4.18579C9.23661 4.56086 9.5 5.06957 9.5 5.6C9.5 5.86264 9.43534 6.12272 9.3097 6.36537C9.18406 6.60802 8.99991 6.8285 8.76777 7.01421C8.53562 7.19993 8.26002 7.34725 7.95671 7.44776C7.65339 7.54827 7.3283 7.6 7 7.6C6.33696 7.6 5.70107 7.38929 5.23223 7.01421C4.76339 6.63914 4.5 6.13043 4.5 5.6C4.5 5.06957 4.76339 4.56086 5.23223 4.18579C5.70107 3.81071 6.33696 3.6 7 3.6ZM7 0C8.85652 0 10.637 0.589998 11.9497 1.6402C13.2625 2.69041 14 4.11479 14 5.6C14 9.8 7 16 7 16C7 16 0 9.8 0 5.6C0 4.11479 0.737498 2.69041 2.05025 1.6402C3.36301 0.589998 5.14348 0 7 0ZM7 1.6C5.67392 1.6 4.40215 2.02143 3.46447 2.77157C2.52678 3.52172 2 4.53913 2 5.6C2 6.4 2 8 7 13.368C12 8 12 6.4 12 5.6C12 4.53913 11.4732 3.52172 10.5355 2.77157C9.59785 2.02143 8.32608 1.6 7 1.6Z"
                          fill="#FFFFFFB2"
                          fillOpacity="0.5"
                        />
                      </svg>
                    </span>
                    {event.eventLocation.address} {event.eventLocation.city},{" "}
                    {event.eventLocation.state}, {event.eventLocation.country}
                  </p>
                </div>
                <p className="text-sm text-main-white font-semibold">
                  {ticketId}
                </p>
              </div>
            </div>
          </div>
        ))
      ) : (
        <div className="w-full flex-center flex-col gap-6">
          <p className="text-base font-semibold text-black">
            You have no events due anytime soon, click the button below to
            purchase events
          </p>
          <Link href={"/explore-events"}>
            <Button> Buy Tickets</Button>
          </Link>
        </div>
      )}
    </div>
  );
}
