"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import DateIcon from "@/assets/svg/date-icon";
import LocationIcon from "@/assets/svg/location-icon";

import GoBack from "@/components/ui/back-btn";
import Loader from "@/components/ui/loader";
import NumberOfAttendees from "@/components/ui/number-of-attendees";
import Success from "./_component/success";

import { usePaystack } from "@/hooks/usePaystack";
import {
  formatNumber,
  formatDateRange,
  formatTimeRange,
} from "@/utils/utils";

import slugify from "react-slugify";

export default function Checkout() {
  const router = useRouter();

  const [event, setEvent] = useState<EventDetails | null>(null);
  const [tickets, setTickets] = useState<TicketForm[] | null>(null);
  const [buyerInfo, setBuyerInfo] = useState<BuyerInfo | null>(null);

  const [checkoutTicketDetails, setCheckoutTicketDetails] =
    useState<checkoutDetailsType | null>(null);
  const [total, setTotal] = useState<number>(0);

  useEffect(() => {
    const checkoutDetails = sessionStorage.getItem("checkoutDetails");
    if (!checkoutDetails) return router.back();

    const {
      eventDetails,
      tickets: allTickets,
      customer,
    }: {
      eventDetails: EventDetails;
      tickets: TicketForm[];
      customer: { name: string; email: string };
    } = JSON.parse(checkoutDetails);

    setEvent(eventDetails);
    setTickets(allTickets);
    setBuyerInfo(customer);

    setCheckoutTicketDetails(
      allTickets.map((ticket) => {
        return {
          name: ticket.name,
          quantity: ticket.buyers.length,
          price: Number(ticket.price) * ticket.buyers.length,
        };
      })
    );

    // The total is the plain sum of the tier prices — what the buyer is actually charged.
    //
    // This used to be run through `calculateFinalPrice`, which grossed the figure up by a
    // hardcoded "5% + 100" markup: a ₦5,000 ticket displayed as ₦5,380. That was a legacy
    // fee model, and it is now doubly wrong. The platform fee is 3% and is deducted from the
    // organiser's settlement rather than added to the buyer's bill, and the amount charged is
    // computed server-side from the event's own tiers — so the inflated figure was not even
    // what Paystack would take. The page was quoting the buyer a price nobody was charging.
    const totalPrice = allTickets.reduce(
      (total, ticket) =>
        total + parseFloat(ticket.price) * ticket.buyers.length,
      0
    );
    setTotal(totalPrice);
  }, [router]);

  const { PaystackHook, success, bookings, loading } = usePaystack({
    tickets: tickets as TicketForm[],
    event: event?._id as string,
    totalPrice: total,
    email: buyerInfo?.email as string,
    currency: event?.currency as string,
  });

  if (loading)
    return (
      <div className="w-screen h-screen fixed inset-x-0 inset-y-0 flex items-center justify-center">
        <div className="fixed inset-x-0 inset-y-0 bg-black/70 z-40" />
        <Loader />
      </div>
    );

  if (success)
    return <Success bookings={bookings} event={event as EventDetails} />;

  if (event && tickets && !success)
    return (
      // A single centred column with a max width. The old layout let both halves stretch to
      // the viewport, so on a wide screen the summary ran to ~1,900px while the image column
      // stayed short — a tall column of dead space beside a line of text.
      <div className="min-h-screen bg-main-grey-bg px-[5%] py-8">
        <div className="mx-auto max-w-5xl">
          <div className="mb-6 flex items-center gap-4">
            <span
              className="cursor-pointer"
              onClick={() =>
                router.push(
                  `/explore-events/${slugify(event.eventName)}?openModal=true`
                )
              }
            >
              <GoBack />
            </span>
            <h1 className="text-2xl font-bold text-main-black">Checkout</h1>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.1fr_1fr] lg:items-start">
            {/* Event */}
            {/* `p-0` is load-bearing: a global base rule gives every <section> page-band padding
                (px-[5%] py-24), which is right for a full-width band and wrong for a card. It put
                97px of dead space above this cover image. The order summary below escapes it only
                because its own `p-5` happens to override the shorthand. */}
            <section className="overflow-hidden rounded-big border border-main-light-grey/70 bg-main-white p-0">
              <Image
                src={event.coverImage as string}
                alt=""
                width={800}
                height={360}
                className="h-56 w-full object-cover object-center"
              />
              <div className="flex flex-col gap-4 p-5">
                <h2 className="text-xl font-bold text-main-black text-balance">
                  {event.eventName}
                </h2>

                <div className="flex flex-col gap-3">
                  <div className="flex items-start gap-2.5">
                    <span className="pt-0.5 shrink-0">
                      <DateIcon />
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-main-black">
                        {formatDateRange(
                          new Date(event.startDate),
                          new Date(event.endDate)
                        )}
                      </p>
                      <p className="text-sm text-sec-black/70">
                        {formatTimeRange(
                          new Date(event.startTime),
                          new Date(event.endTime)
                        )}{" "}
                        {event.timezone}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <span className="pt-0.5 shrink-0">
                      <LocationIcon />
                    </span>
                    <p className="text-sm text-main-black">
                      {event.eventLocation.address} {event.eventLocation.city},{" "}
                      {event.eventLocation.state}, {event.eventLocation.country}
                    </p>
                  </div>

                  <div className="relative z-0">
                    <NumberOfAttendees number={event.numberOfAttendees} />
                  </div>
                </div>

                <p className="text-sm leading-relaxed text-sec-black/75">
                  {event.eventDescription}
                </p>
              </div>
            </section>

            {/* Order summary. Sticky on desktop so the total and the pay button stay in
                view while a long event description scrolls beside them. */}
            {checkoutTicketDetails && (
              <section className="rounded-big border border-main-light-grey/70 bg-main-white p-5 lg:sticky lg:top-6">
                <div className="flex items-baseline justify-between gap-4 border-b border-main-light-grey pb-3">
                  <h2 className="text-base font-bold text-main-black">
                    Your order
                  </h2>
                  <span className="text-xs font-semibold uppercase tracking-wider text-sec-black/60">
                    Price ({event.currency})
                  </span>
                </div>

                <div className="flex flex-col gap-2.5 py-4">
                  {/* Tiers the buyer did not pick are filtered out. They used to be listed
                      as "EARLY BIRD (0) — NGN 0", which is noise on a receipt: it invites a
                      double-take about whether something was added by mistake. */}
                  {checkoutTicketDetails
                    .filter((t) => t.quantity > 0)
                    .map((ticket, i) => (
                      <div className="flex justify-between gap-4" key={i}>
                        <p className="text-sm text-main-black">
                          {ticket.name}
                          <span className="text-sec-black/60">
                            {" "}
                            &times; {ticket.quantity}
                          </span>
                        </p>
                        <p className="shrink-0 text-sm font-semibold tabular-nums text-main-black">
                          {event.currency} {formatNumber(ticket.price)}
                        </p>
                      </div>
                    ))}
                </div>

                <div className="flex items-baseline justify-between gap-4 border-t border-main-light-grey pt-4">
                  <p className="text-base font-bold text-main-black">Total</p>
                  {/* Currency is shown alongside the figure: a bare number is ambiguous the
                      moment the platform supports more than one, and the buyer is about to
                      be charged in whichever the organiser chose. */}
                  <p className="text-xl font-bold tabular-nums text-main-black">
                    {event.currency} {formatNumber(total)}
                  </p>
                </div>

                <p className="mt-2 text-xs text-sec-black/60">
                  This is the amount you will be charged. No booking fee is added.
                </p>

                <div className="mt-5">
                  <PaystackHook />
                </div>
              </section>
            )}
          </div>
        </div>
      </div>
    );
}
