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
  calculateFinalPrice,
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

    const totalPrice = allTickets.reduce(
      (total, ticket) =>
        total + parseFloat(ticket.price) * ticket.buyers.length,
      0
    );
    setTotal(calculateFinalPrice(totalPrice));
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
      <div className="relative px-[5%] py-[2.5%]">
        <span
          className="absolute left-[5%] top-0"
          onClick={() =>
            router.push(
              `/explore-events/${slugify(event.eventName)}?openModal=true`
            )
          }
        >
          <GoBack />
        </span>
        <div className="flex items-center justify-center w-full mb-6">
          <h1 className="sub-title-text">Checkout</h1>
        </div>
        <div className="flex items-start justify-between flex-col md:flex-row gap-4 md:gap-6">
          <div className="flex-1 w-full">
            <div className="h-80 w-full rounded-[1.25rem]">
              <Image
                src={event.coverImage as string}
                alt="Event image"
                width={500}
                height={320}
                className="w-full h-full object-fill object-center rounded-big"
              />
            </div>
          </div>
          <div className=" flex-1 flex flex-col gap-4 w-full">
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
                      new Date(event.endDate)
                    )}
                  </p>
                  <p className="text-sm font-medium text-[#1f1f1f]/80">
                    {formatTimeRange(
                      new Date(event.startTime),
                      new Date(event.endTime)
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
              <div className="flex-start">
                <p className="text-black/50 text-base font-normal">
                  {event.eventDescription}
                </p>
              </div>
            </div>
            {checkoutTicketDetails && (
              <div className="flex flex-col gap-2">
                <div className="flex-between gap-4">
                  <p className="text-lg md:text-xl font-semibold">
                    Ticket Type
                  </p>
                  <p className="text-lg md:text-xl font-semibold">
                    Price ({event.currency})
                  </p>
                </div>
                <div className="flex flex-col">
                  {checkoutTicketDetails.map((ticket, i) => (
                    <div className="flex-between gap-4" key={i}>
                      <p className="text-black text-sm font-medium">
                        {ticket.name.toUpperCase()} ({ticket.quantity})
                      </p>
                      <p className="text-black text-sm font-medium">
                        {ticket.price}
                      </p>
                    </div>
                  ))}
                </div>
                <hr className="w-full h-0.5 bg-black my-3" />
                <div className="flex-between gap-4">
                  <p className="text-black text-base font-medium">Total</p>
                  <p className="text-black text-base font-medium">{total}</p>
                </div>
              </div>
            )}
            <PaystackHook />
          </div>
        </div>
      </div>
    );
}
