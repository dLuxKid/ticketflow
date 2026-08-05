import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import AddIcon from "@/assets/svg/add-icon";
import CloseIcon from "@/assets/svg/close-svg";

import Select, { SingleValue } from "react-select";

import InfoIcon from "@/assets/svg/info-icon";
import Button from "./ui/submit-btn";
import { BuyTicketSelectStyle } from "@/styles/react-select.styles";

type Props = {
  closeModal: () => void;
  event: EventDetails;
};

type OptionType = {
  label: string;
  value: number;
};

const isTicketQuantityChosen = (arr: TicketForm[]) => {
  let totalQuantity = 0;
  for (const key of arr) {
    totalQuantity += key.buyers.length;
  }

  return Boolean(totalQuantity);
};

const createOptions = (length: number, ticketQuantity?: number) => {
  if (ticketQuantity === 0) {
    return Array.from({ length: 1 }, (_, i) => ({
      label: i.toString(),
      value: i,
    }));
  }
  const maxOptions = Math.min(Math.max(ticketQuantity || 0, 1), length);
  return Array.from({ length: maxOptions + 1 }, (_, i) => ({
    label: i.toString(),
    value: i,
  }));
};

export default function BuyTicketModal({ closeModal, event }: Props) {
  const router = useRouter();

  const [allTickets, setAllTickets] = useState<TicketForm[]>([]);

  const [customer, setCustomer] = useState<{
    name: string;
    email: string;
  }>({ name: "", email: "" });

  useEffect(() => {
    const checkoutDetails = JSON.parse(
      sessionStorage.getItem("checkoutDetails") as string
    );

    if (
      checkoutDetails &&
      checkoutDetails.eventDetails.eventName === event.eventName
    ) {
      setAllTickets(checkoutDetails.tickets);
      setCustomer(checkoutDetails.customer);
    } else {
      const tickets: TicketForm[] = [];
      event.ticketDetails.forEach((ticket) => {
        tickets.push({
          name: ticket.ticketName,
          price: ticket.ticketPrice,
          quantity: 0,
          buyers: [],
        });
      });

      setAllTickets(tickets);
    }
  }, []);

  const handleQuantityChange = (ticket: OptionType, i: number) => {
    const updatedTickets = [...allTickets];
    const currentTicket = { ...updatedTickets[i] };
    currentTicket.quantity = ticket.value;
    const newBuyers: BuyerInfo[] = [];
    Array.from({ length: ticket.value }).forEach((_, i) => {
      newBuyers.push({
        name: currentTicket.buyers[i]?.name || customer.name,
        email: currentTicket.buyers[i]?.email || customer.email,
      });
    });
    currentTicket.buyers = newBuyers;
    updatedTickets[i] = currentTicket;

    setAllTickets(updatedTickets);
  };

  const handleSetBuyerDetails = (
    { name, value }: { name: "name" | "email"; value: string },
    ticketIdx: number,
    buyerIdx: number
  ) => {
    const updatedTickets = [...allTickets];
    const currentTicket = { ...updatedTickets[ticketIdx] };
    const currentBuyers = [...currentTicket.buyers];
    const currentBuyer = currentBuyers[buyerIdx];
    currentBuyer[name] = value;
    currentBuyers[buyerIdx] = currentBuyer;
    currentTicket.buyers = currentBuyers;
    updatedTickets[ticketIdx] = currentTicket;
    setAllTickets(updatedTickets);
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isTicketQuantityChosen(allTickets)) return;

    const checkoutDetails = {
      eventDetails: event,
      tickets: allTickets,
      customer,
    };

    sessionStorage.setItem("checkoutDetails", JSON.stringify(checkoutDetails));

    router.push("/checkout");
  };

  return (
    <div className="w-screen h-screen fixed inset-x-0 inset-y-0 flex items-center justify-center">
      <div className="fixed inset-x-0 inset-y-0 bg-black/70 z-40" />
      <div className="z-50 bg-main-white rounded-[1.25rem] px-6 py-16 w-full overflow-y-scroll max-h-[90vh] max-w-2xl relative">
        <span
          className={"cursor-pointer absolute right-3 top-4"}
          onClick={closeModal}
        >
          <CloseIcon />
        </span>
        <div className="w-full flex items-center justify-center mb-8">
          <h3 className="sub-title-text text-main-black">Buy Ticket</h3>
        </div>
        {/* <div className="w-full flex items-center justify-center mt-4 mb-16">
          <p className="text-sm md:text-base font-medium text-black/50">
            The ticket grants you access to the event including exciting activities and games            
          </p>
        </div> */}

        <form className="flex items-stretch flex-col gap-6" onSubmit={onSubmit}>
          <div className="w-full grid grid-cols-1 mobile:grid-cols-2 gap-4 md:gap-6">
            <label>
              <p className="text-sm font-semibold text-main-black mb-1 capitalize">
                Full Name
              </p>
              <input
                required
                title="name"
                type="text"
                name="name"
                className="bg-sec-grey border-2 border-main-light-grey rounded-md h-12 w-full px-4 text-main-black"
                value={customer.name}
                onChange={(e) =>
                  setCustomer((prev) => ({ ...prev, name: e.target.value }))
                }
              />
            </label>
            <label>
              <p className="text-sm font-semibold text-main-black mb-1 capitalize">
                Email Address
              </p>
              <input
                required
                title="email"
                type="text"
                name="email"
                className="bg-sec-grey border-2 border-main-light-grey rounded-md h-12 w-full px-4 text-main-black"
                value={customer.email}
                onChange={(e) =>
                  setCustomer((prev) => ({ ...prev, email: e.target.value }))
                }
              />
            </label>
          </div>
          <p className="text-sm text-black font-medium flex items-center -mt-4 mb-4 gap-2">
            <span>
              <InfoIcon />
            </span>
            The payment reciept would be attached to these details
          </p>

          {event.ticketDetails.map((ticket, ticketIdx) => (
            <div key={ticketIdx} className="flex items-stretch flex-col gap-4">
              {Number(ticket.ticketQuantity) === 0 && (
                <p className="text-sm text-main-error-red font-medium flex items-center -mb-4 gap-2 uppercase">
                  <InfoIcon fill={"#EF1616"} />
                  {ticket.ticketName} is sold out
                </p>
              )}
              <div className="w-full grid grid-cols-1 mobile:grid-cols-3 gap-4 md:gap-6">
                <label className="flex flex-1 flex-shrink-0 relative">
                  <input
                    required
                    readOnly
                    title="ticket name"
                    type="text"
                    name="ticketName"
                    className="bg-sec-grey border-2 border-main-light-grey rounded-md h-12 w-full px-4 text-main-black"
                    defaultValue={ticket.ticketName}
                  />
                </label>
                <label className="flex flex-1 flex-shrink-0 relative">
                  <input
                    required
                    readOnly
                    title="ticket price"
                    type="tel"
                    name="ticketPrice"
                    className="bg-sec-grey border-2 border-main-light-grey rounded-md h-12 w-full pl-16 pr-4 text-main-black"
                    defaultValue={ticket.ticketPrice}
                  />
                  <span className="left-0 top-0 bottom-0 w-14 absolute bg-main-purple rounded-l-md flex-center text-main-white body-text">
                    {event.currency}
                  </span>
                </label>
                <label>
                  <Select
                    styles={BuyTicketSelectStyle}
                    value={
                      createOptions(
                        Number(ticket.maximumBuyingLimit),
                        Number(ticket.ticketQuantity)
                      ).find(
                        (option) =>
                          allTickets[ticketIdx]?.quantity !== undefined &&
                          option.value === allTickets[ticketIdx].quantity
                      ) || createOptions(0, 1)[0]
                    }
                    classNamePrefix="select"
                    options={createOptions(
                      Number(ticket.maximumBuyingLimit),
                      Number(ticket.ticketQuantity)
                    )}
                    onChange={(ticket: SingleValue<OptionType>) => {
                      if (ticket) handleQuantityChange(ticket, ticketIdx);
                    }}
                    isSearchable={true}
                    name="ticketType"
                    placeholder="Quantity"
                  />
                </label>
              </div>
              {allTickets[ticketIdx]?.quantity ? (
                <div className="flex items-stretch flex-col gap-4">
                  {Array.from({ length: allTickets[ticketIdx].quantity }).map(
                    (_, buyerIdx) => (
                      <div
                        className="w-full grid grid-cols-1 mobile:grid-cols-2 gap-4 md:gap-6"
                        key={buyerIdx}
                      >
                        <label>
                          <p className="text-sm font-semibold text-main-black mb-1">
                            Attendee {buyerIdx + 1}&apos;s Full Name
                          </p>
                          <input
                            required
                            title="name"
                            type="text"
                            name="name"
                            className="bg-sec-grey border-2 border-main-light-grey rounded-md h-12 w-full px-4 text-main-black"
                            value={
                              allTickets[ticketIdx].buyers[buyerIdx].name || ""
                            }
                            onChange={(e) =>
                              handleSetBuyerDetails(
                                { name: "name", value: e.target.value },
                                ticketIdx,
                                buyerIdx
                              )
                            }
                            onBlur={(e) => {
                              if (!e.target.value)
                                handleSetBuyerDetails(
                                  { name: "name", value: customer.name },
                                  ticketIdx,
                                  buyerIdx
                                );
                            }}
                          />
                        </label>
                        <label>
                          <p className="text-sm font-semibold text-main-black mb-1">
                            Attendee {buyerIdx + 1}&apos;s Email
                          </p>
                          <input
                            required
                            title="email"
                            type="text"
                            name="email"
                            className="bg-sec-grey border-2 border-main-light-grey rounded-md h-12 w-full px-4 text-main-black"
                            value={
                              allTickets[ticketIdx].buyers[buyerIdx].email || ""
                            }
                            onBlur={(e) => {
                              if (!e.target.value)
                                handleSetBuyerDetails(
                                  { name: "email", value: customer.email },
                                  ticketIdx,
                                  buyerIdx
                                );
                            }}
                            onChange={(e) =>
                              handleSetBuyerDetails(
                                { name: "email", value: e.target.value },
                                ticketIdx,
                                buyerIdx
                              )
                            }
                          />
                        </label>
                      </div>
                    )
                  )}
                </div>
              ) : null}
            </div>
          ))}

          <div className="w-full mx-auto max-w-md mt-8">
            <Button
              title="go to check out"
              disabled={
                !isTicketQuantityChosen(allTickets) ||
                !customer.email ||
                !customer.name
              }
            >
              Check Out
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
