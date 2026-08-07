import { useEffect, useState } from "react";

import { newTicketInfo } from "@/assets/data/create-event-data";
import AddIcon from "@/assets/svg/add-icon";
import InfoIcon from "@/assets/svg/info-icon";
import Button from "@/components/ui/submit-btn";
import { calculateExcludeDates } from "@/utils/utils";
import Tippy from "@tippyjs/react";
import ReactDatePicker from "react-datepicker";
import { IoMdArrowRoundBack } from "react-icons/io";

type Props = {
  eventData: eventData;
  setEventData: React.Dispatch<React.SetStateAction<eventData>>;
  nextStep: () => void;
  prev: () => void;
};

const isTicketInfoFilled = (ticketInfoArray: ticketType[]): boolean => {
  for (const ticketInfo of ticketInfoArray) {
    for (const value of Object.values(ticketInfo)) {
      if (value === "") {
        return false;
      }
    }
  }
  return true;
};

export function TicketDetails({
  eventData,
  setEventData,
  nextStep,
  prev,
}: Props) {
  const [numberOfTickets, setNumberOfTickets] = useState<number>(
    eventData.ticketDetails.length || 1,
  );
  const [ticketInfo, setTicketInfo] = useState<ticketType[]>(
    !!eventData.ticketDetails.length
      ? eventData.ticketDetails
      : [newTicketInfo],
  );

  const [isSellingNow, setIsSellingNow] = useState<boolean>(false);

  const handleTicketInfo = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
    idx: number,
  ) => {
    const { name, value } = e.target;

    const updatedTicketInfo = [...ticketInfo];
    const currentTicketFieldInFocus = updatedTicketInfo[idx];
    const updatedTicketField = { ...currentTicketFieldInFocus, [name]: value };
    updatedTicketInfo[idx] = updatedTicketField;
    setTicketInfo(updatedTicketInfo);
    setEventData((prev) => ({ ...prev, ticketDetails: updatedTicketInfo }));
  };

  const addTicketInfoInput = () => {
    setNumberOfTickets((prev) => prev + 1);
    setTicketInfo((prev) => [...prev, newTicketInfo]);
  };

  const removeTicketInfo = (i: number) => {
    setNumberOfTickets((prev) => prev - 1);
    const updatedTicketInfo = ticketInfo.filter((_, idx) => idx !== i);

    setTicketInfo(updatedTicketInfo);
    setEventData((prev) => ({ ...prev, ticketDetails: updatedTicketInfo }));
  };

  const startSelling = () => {
    const val = isSellingNow;
    setIsSellingNow((prev) => !prev);
    if (val) {
      setEventData((prev) => ({
        ...prev,
        salesStartDate: null,
        salesStartTime: null,
      }));
    } else {
      setEventData((prev) => ({
        ...prev,
        salesStartDate: new Date(),
        salesStartTime: new Date(),
      }));
    }
  };

  const isInviteOnly = eventData.accessMode === "invite_only";

  const isAllInputFilled = () => {
    // Invite-only events admit guests from a guest list, not a purchase - they carry no
    // ticket tiers at all (the backend rejects tiers on an invite_only event outright),
    // so sales dates and ticket fields simply don't apply here.
    if (isInviteOnly) return true;

    return (
      eventData.ticketDetails.length &&
      isTicketInfoFilled(eventData.ticketDetails) &&
      eventData.salesStartDate &&
      eventData.salesEndDate &&
      eventData.salesEndTime &&
      eventData.salesStartTime
    );
  };

  useEffect(() => {
    setIsSellingNow(
      new Date(eventData.salesStartDate as Date).getDate() ===
        new Date().getDate() &&
        new Date(eventData.salesStartTime as Date).getTime() ===
          new Date().getTime(),
    );
  }, []);

  // Defensive: if the organiser goes back and switches to invite-only after already
  // filling in ticket tiers, clear them - an invite_only event must carry none.
  useEffect(() => {
    if (isInviteOnly && eventData.ticketDetails.length > 0) {
      setTicketInfo([]);
      setEventData((prev) => ({ ...prev, ticketDetails: [] }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isInviteOnly]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (isAllInputFilled()) {
      nextStep();
    }
  };

  return (
    <>
      <span
        className="absolute top-0 left-0 cursor-pointer hover:scale-110 duration-200 transition-all ease-in-out"
        onClick={prev}
      >
        <IoMdArrowRoundBack />
      </span>
      <form
        onSubmit={handleSubmit}
        className="w-full flex items-stretch justify-center flex-col gap-4 md:gap-6"
      >
        {isInviteOnly && (
          <div className="w-full rounded-md border border-main-purple bg-main-purple/5 p-6">
            <h4 className="sub-title-text mb-2">No tickets needed</h4>
            <p className="body-text text-main-black/80">
              This is an invite-only event - there&apos;s nothing to sell here.
              Once the event is created, build your guest list and send invites
              from the event&apos;s Guest List page.
            </p>
          </div>
        )}

        <div className={`w-full relative ${isInviteOnly ? "hidden" : ""}`}>
          <div className="flex-between mb-4">
            <h4 className="sub-title-text">ADD TICKET</h4>
            <span onClick={addTicketInfoInput} className="cursor-pointer">
              <AddIcon />
            </span>
          </div>

          <div className="flex gap-5 items-stretch justify-center flex-col">
            {ticketInfo.map((ticket, i) => (
              <div
                className="flex flex-col gap-4 md:gap-6 rounded-big border border-main-light-grey bg-main-white p-4 sm:p-6 relative"
                key={i}
              >
                <div className="flex-between border-b border-main-light-grey/60 pb-3">
                  <span className="inline-flex items-center gap-2 text-sm font-semibold text-main-purple">
                    <span className="flex-center h-6 w-6 rounded-full bg-main-purple/10 text-xs">
                      {i + 1}
                    </span>
                    Ticket {i + 1}
                  </span>
                  {numberOfTickets > 1 && (
                    <button
                      type="button"
                      onClick={() => removeTicketInfo(i)}
                      className="text-xs font-medium text-main-error-red"
                    >
                      Remove
                    </button>
                  )}
                </div>
                <div>
                  <div className="w-full flex items-center justify-between gap-4 mb-1">
                    <p className="text-sm font-semibold text-main-black capitalize">
                      Ticket Name
                    </p>
                  </div>
                  <label>
                    <input
                      required
                      title="ticket name"
                      type="text"
                      name="ticketName"
                      className="bg-sec-grey border border-main-purple rounded-md h-12 w-full px-4 text-main-black"
                      value={ticket.ticketName}
                      onChange={(e) => handleTicketInfo(e, i)}
                    />
                  </label>
                </div>
                <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <label>
                    <p className="text-sm font-semibold text-main-black mb-1 capitalize">
                      quantity
                    </p>
                    <input
                      required
                      title="ticket quantity"
                      type="text"
                      name="ticketQuantity"
                      className="bg-sec-grey border border-main-purple rounded-md h-12 w-full px-4 text-main-black"
                      value={ticket.ticketQuantity}
                      onChange={(e) => handleTicketInfo(e, i)}
                    />
                  </label>
                  <div>
                    <p className="text-sm font-semibold text-main-black mb-1 capitalize">
                      price
                    </p>
                    <label className="flex flex-1 flex-shrink-0 relative">
                      <input
                        required
                        title="ticket price"
                        type="tel"
                        name="ticketPrice"
                        className="bg-sec-grey border border-main-purple rounded-md h-12 w-full pl-16 pr-4 text-main-black"
                        value={ticket.ticketPrice}
                        onChange={(e) => handleTicketInfo(e, i)}
                      />
                      <span className="left-0 top-0 bottom-0 w-14 absolute bg-main-purple rounded-l-md flex-center text-main-white body-text">
                        {eventData.currency}
                      </span>
                    </label>
                  </div>
                </div>
                <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <label>
                    <p className="text-sm font-semibold text-main-black mb-1 capitalize">
                      minimum buying limit
                    </p>
                    <input
                      title="minimum buying limit"
                      type="text"
                      name="minimumBuyingLimit"
                      readOnly
                      className="bg-sec-grey border border-main-purple rounded-md h-12 w-full px-4 text-main-black"
                      value={"1"}
                    />
                  </label>
                  <label>
                    <p className="text-sm font-semibold text-main-black mb-1 capitalize">
                      maximum buying limit
                    </p>
                    <input
                      title="maximum buying limit"
                      type="text"
                      name="maximumBuyingLimit"
                      className="bg-sec-grey border border-main-purple rounded-md h-12 w-full px-4 text-main-black"
                      value={ticket.maximumBuyingLimit}
                      onChange={(e) => handleTicketInfo(e, i)}
                    />
                  </label>
                </div>
              </div>
            ))}
          </div>
        </div>

        <hr
          className={`h-0.5 rounded-sm w-full bg-sec-grey ${isInviteOnly ? "hidden" : ""}`}
        />

        <div className={isInviteOnly ? "hidden" : ""}>
          <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <p className="text-sm font-semibold text-main-black mb-1 capitalize flex items-center gap-1">
                Ticket sale start date
                <Tippy
                  content="Sales Start Date is the date your  tickets become available for purchase."
                  placement="right"
                  className="!bg-main-white border border-main-purple !text-main-black"
                  arrow={false}
                  animation="fade"
                >
                  <button>
                    <InfoIcon />
                  </button>
                </Tippy>
              </p>

              <label className="bg-sec-grey rounded-md h-12 w-full px-4 text-main-black flex items-center border border-main-purple">
                <ReactDatePicker
                  selected={eventData.salesStartDate}
                  placeholderText="Date"
                  name="salesStartDate"
                  onChange={(date) => {
                    if (date)
                      setEventData((prev) => ({
                        ...prev,
                        salesStartDate: date,
                        salesStartTime: null,
                        salesEndDate: null,
                        salesEndTime: null,
                      }));
                  }}
                  className="bg-transparent text-main-black placeholder:text-main-black/40"
                  minDate={new Date()}
                  excludeDates={calculateExcludeDates(
                    new Date(),
                    eventData.startDate as Date,
                  )}
                />
              </label>
            </div>
            <div>
              <p className="text-sm font-semibold text-main-black mb-1 capitalize flex items-center gap-1">
                Ticket sale start time
                <Tippy
                  content="Sales Start Time is the time your tickets become available for purchase."
                  placement="right"
                  className="!bg-main-white border border-main-purple !text-main-black"
                  arrow={false}
                  animation="fade"
                >
                  <button>
                    <InfoIcon />
                  </button>
                </Tippy>
              </p>
              <label className="bg-sec-grey rounded-md h-12 w-full px-4 text-main-black flex items-center border border-main-purple">
                <ReactDatePicker
                  selected={eventData.salesStartTime}
                  placeholderText="Time"
                  name="salesStartTime"
                  onChange={(date) => {
                    if (date) {
                      setEventData((prev) => ({
                        ...prev,
                        salesStartTime: date,
                      }));
                    }
                  }}
                  showTimeSelect
                  showTimeSelectOnly
                  timeIntervals={15}
                  timeCaption="Time"
                  dateFormat="h:mm aa"
                  className="bg-transparent text-main-black placeholder:text-main-black/40"
                />
              </label>
            </div>
          </div>
          <div className="flex mt-2 gap-2">
            <label
              htmlFor="startnow"
              className="cursor-pointer flex items-center gap-1"
            >
              <input
                title="start selling now"
                id="startnow"
                type="checkbox"
                className="cursor-pointer hidden peer"
                defaultChecked={isSellingNow}
                onChange={startSelling}
              />
              <span className="bg-transparent peer-checked:bg-main-purple border border-main-purple h-5 w-5 rounded-sm" />
              NOW
            </label>
          </div>
        </div>

        <div
          className={`w-full grid grid-cols-1 sm:grid-cols-2 gap-6 ${isInviteOnly ? "hidden" : ""}`}
        >
          <div>
            <p className="text-sm font-semibold text-main-black mb-1 capitalize flex items-center gap-1">
              Ticket sale end date
              <Tippy
                content="Sales End Date is the date your tickets become unavailable for purchase."
                placement="right"
                className="!bg-main-white border border-main-purple !text-main-black"
                arrow={false}
                animation="fade"
              >
                <button>
                  <InfoIcon />
                </button>
              </Tippy>
            </p>

            <label className="bg-sec-grey rounded-md h-12 w-full px-4 text-main-black flex items-center border border-main-purple">
              <ReactDatePicker
                selected={eventData.salesEndDate}
                placeholderText="Date"
                name="salesEndDate"
                onChange={(date) => {
                  if (date)
                    setEventData((prev) => ({
                      ...prev,
                      salesEndDate: date,
                    }));
                }}
                className="bg-transparent text-main-black placeholder:text-main-black/40"
                minDate={eventData.salesEndDate || new Date()}
                excludeDates={calculateExcludeDates(
                  eventData.startDate as Date,
                  eventData.endDate as Date,
                )}
              />
            </label>
          </div>
          <div>
            <p className="text-sm font-semibold text-main-black mb-1 capitalize flex items-center gap-1">
              Ticket sale end time
              <Tippy
                content="Sales End Time is the time your tickets become unavailable for purchase."
                placement="right"
                className="!bg-main-white border border-main-purple !text-main-black"
                arrow={false}
                animation="fade"
              >
                <button>
                  <InfoIcon />
                </button>
              </Tippy>
            </p>
            <label className="bg-sec-grey rounded-md h-12 w-full px-4 text-main-black flex items-center border border-main-purple">
              <ReactDatePicker
                selected={eventData.salesEndTime}
                placeholderText="Time"
                name="salesEndTime"
                onChange={(date) => {
                  if (date) {
                    setEventData((prev) => ({
                      ...prev,
                      salesEndTime: date,
                    }));
                  }
                }}
                showTimeSelect
                showTimeSelectOnly
                timeIntervals={15}
                timeCaption="Time"
                dateFormat="h:mm aa"
                className="bg-transparent text-main-black placeholder:text-main-black/40"
              />
            </label>
          </div>
        </div>

        <div className="max-w-md w-full mt-4 self-center">
          <Button disabled={!isAllInputFilled()} onClick={handleSubmit}>
            Continue
          </Button>
        </div>
      </form>
    </>
  );
}
