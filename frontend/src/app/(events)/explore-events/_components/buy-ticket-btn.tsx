"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";

import BuyTicketModal from "@/components/buy-ticket-modal";
import Button from "@/components/ui/cta-btn";

export default function BuyTicketBtn({ event }: { event: EventDetails }) {
  const searchParams = useSearchParams();
  const [buyTicketModal, setBuyTicketModal] = useState<boolean>(
    searchParams.get("openModal") ? true : false
  );

  const closeModal = () => setBuyTicketModal(false);
  const openModal = () => setBuyTicketModal(true);

  if (buyTicketModal)
    return <BuyTicketModal closeModal={closeModal} event={event} />;

  const currentDateTime = new Date();
  const salesStartDate = new Date(event.salesStartDate);
  const salesStartTime = new Date(event.salesStartTime);
  const salesEndDate = new Date(event.salesEndDate);
  const salesEndTime = new Date(event.salesEndTime);

  const combinedSalesStart = new Date(salesStartDate);
  combinedSalesStart.setHours(salesStartTime.getHours());
  combinedSalesStart.setMinutes(salesStartTime.getMinutes());
  const combinedSalesEnd = new Date(salesEndDate);
  combinedSalesEnd.setHours(salesEndTime.getHours());
  combinedSalesEnd.setMinutes(salesEndTime.getMinutes());

  if (combinedSalesStart > currentDateTime)
    return <Button disabled>Coming soon</Button>;

  if (combinedSalesEnd < currentDateTime)
    return <Button disabled>Sales ended</Button>;

  if (event.totalQuantity <= 1)
    return (
      <button
        type="button"
        className="bg-main-white cursor-not-allowed hover:ring-main-error-red hover:ring-1  text-main-error-red border-main-error-red border px-6 py-2 md:px-9 md:py-3 text-base rounded-big font-medium"
      >
        Sold out
      </button>
    );

  return (
    <div>
      <Button onClick={openModal} title="buy ticket">
        Buy Ticket
      </Button>
    </div>
  );
}
