import { newTicketInfo } from "@/assets/data/create-event-data";
import { categories, timzezones } from "@/assets/data/react-select-options";
import FacebookWhite from "@/assets/svg/fb-white";
import GlobeIcon from "@/assets/svg/globe";
import GlobeWhite from "@/assets/svg/globe-white";
import IGWhite from "@/assets/svg/ig-white";
import XWhite from "@/assets/svg/x-white";
import YoutubeWhite from "@/assets/svg/yt-white";
import Loader from "@/components/ui/loader";
import Button from "@/components/ui/submit-btn";
import {
  ReviewCategoriesStyles,
  ReviewTimezoneStyles,
} from "@/styles/react-select.styles";
import { createEvent } from "@/utils/actions";
import Image from "next/image";
import { useState } from "react";
import ReactDatePicker from "react-datepicker";
import { FaPlus } from "react-icons/fa";
import Select from "react-select";
import { toast } from "sonner";

type Props = {
  eventData: eventData;
  setEventData: React.Dispatch<React.SetStateAction<eventData>>;
  reset: () => void;
  countryOptions: CountryOptions[];
  stateOptions: { label: string; value: string }[];
  setCreateEventStep: React.Dispatch<
    React.SetStateAction<createEventStatusType>
  >;
  setAboutEventPage: React.Dispatch<React.SetStateAction<"1" | "2">>;
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

export default function ReviewEvent({
  eventData,
  setEventData,
  reset,
  countryOptions,
  stateOptions,
  setCreateEventStep,
  setAboutEventPage,
}: Props) {
  const [loading, setLoading] = useState<boolean>(false);

  const [ticketInfo] = useState<ticketType[]>(
    !!eventData.ticketDetails.length
      ? eventData.ticketDetails
      : [newTicketInfo],
  );

  const isSocialsAvailable = () => {
    return (
      eventData.socialMediaLinks.facebook ||
      eventData.socialMediaLinks.instagram ||
      eventData.socialMediaLinks.others ||
      eventData.socialMediaLinks.twitter ||
      eventData.socialMediaLinks.youtube
    );
  };

  const isAllInputFilled = () => {
    const base =
      eventData.eventName &&
      eventData.startDate &&
      eventData.startTime &&
      eventData.endDate &&
      eventData.endTime &&
      eventData.timezone &&
      eventData.eventLocation.address &&
      eventData.eventLocation.city &&
      eventData.eventLocation.country &&
      eventData.eventLocation.state &&
      eventData.eventCategory &&
      eventData.eventDescription &&
      isSocialsAvailable();

    // Invite-only events carry no ticket tiers (the backend rejects tiers on one
    // outright), so ticket/sales fields simply don't apply - mirrors ticket-details.tsx.
    if (eventData.accessMode === "invite_only") return base;

    return (
      base &&
      eventData.ticketDetails.length &&
      isTicketInfoFilled(eventData.ticketDetails) &&
      eventData.salesStartDate &&
      eventData.salesEndDate &&
      eventData.salesEndTime &&
      eventData.salesStartTime
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAllInputFilled()) return;

    setLoading(true);

    const body: eventData = {
      eventName: eventData.eventName,
      startDate: eventData.startDate,
      startTime: eventData.startTime,
      endDate: eventData.endDate,
      endTime: eventData.endTime,
      timezone: eventData.timezone,
      socialMediaLinks: eventData.socialMediaLinks,
      eventDescription: eventData.eventDescription,
      eventLocation: eventData.eventLocation,
      eventCategory: eventData.eventCategory,
      ticketDetails: eventData.ticketDetails,
      salesEndDate: eventData.salesEndDate,
      salesStartDate: eventData.salesStartDate,
      salesEndTime: eventData.salesEndTime,
      salesStartTime: eventData.salesStartTime,
      coverImage: eventData.coverImage,
      currency: eventData.currency,
      otherImages: eventData.otherImages,
      accessMode: eventData.accessMode,
      networkingEnabled: eventData.networkingEnabled,
      venueName: eventData.venueName,
      dressCode: eventData.dressCode,
      parkingInfo: eventData.parkingInfo,
      accessibilityInfo: eventData.accessibilityInfo,
      ageRestriction: eventData.ageRestriction,
    };

    try {
      const res = await createEvent(body);

      if (res.status === "success") {
        toast.success(res.message);
        reset();
      }
    } catch (error: any) {
      toast.error(
        error.response
          ? error.response.data.message
          : "Error creating your event",
      );
    }
    setLoading(false);
  };

  return (
    <div className="flex-center flex-col w-full max-w-screen-md gap-4 md:gap-6">
      <h3 className="text-main-black sub-title-text capitalize">
        Review Event
      </h3>
      <form
        onSubmit={handleSubmit}
        className="w-full flex items-stretch justify-center flex-col gap-4 md:gap-6"
      >
        <div
          className="w-full flex items-stretch justify-center flex-col gap-4 md:gap-6"
          onClick={() => {
            setCreateEventStep("2");
            setAboutEventPage("1");
          }}
        >
          <h3 className="text-main-purple sub-title-text capitalize mt-4">
            Event Details
          </h3>
          <div className="w-full">
            <p className="text-sm font-semibold text-main-black mb-1 capitalize">
              Event Start
            </p>
            <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-6">
              <label className="bg-main-grey-bg rounded-md h-12 w-full px-4 text-main-black flex items-center border-none">
                <ReactDatePicker
                  selected={eventData.startDate}
                  placeholderText="Date"
                  name="startDate"
                  onChange={(date) => {
                    if (date)
                      setEventData((prev) => ({
                        ...prev,
                        startDate: date,
                        endDate: null,
                      }));
                  }}
                  className="bg-transparent text-main-black"
                  readOnly
                />
              </label>
              <label className="bg-main-grey-bg rounded-md h-12 w-full px-4 text-main-black flex items-center border-none">
                <ReactDatePicker
                  selected={eventData.startTime}
                  placeholderText="Time"
                  name="startTime"
                  onChange={(date) => {
                    if (date) {
                      setEventData((prev) => ({
                        ...prev,
                        startTime: date,
                      }));
                    }
                  }}
                  showTimeSelect
                  showTimeSelectOnly
                  timeIntervals={15}
                  timeCaption="Time"
                  dateFormat="h:mm aa"
                  className="bg-transparent text-main-black"
                  readOnly
                />
              </label>
            </div>
          </div>

          <div>
            <p className="text-sm font-semibold text-main-black mb-1 capitalize ">
              Event End
            </p>
            <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-6">
              <label className="bg-main-grey-bg rounded-md h-12 w-full px-4 text-main-black flex items-center border-none">
                <ReactDatePicker
                  selected={eventData.endDate}
                  placeholderText="Date"
                  name="endDate"
                  onChange={(date) => {
                    if (date)
                      setEventData((prev) => ({
                        ...prev,
                        endDate: date,
                      }));
                  }}
                  className="bg-transparent text-main-black"
                  readOnly
                />
              </label>
              <label className="bg-main-grey-bg rounded-md h-12 w-full px-4 text-main-black flex items-center border-none">
                <ReactDatePicker
                  selected={eventData.endTime}
                  placeholderText="Time"
                  name="endTime"
                  onChange={(date) => {
                    if (date)
                      setEventData((prev) => ({
                        ...prev,
                        endTime: date,
                      }));
                  }}
                  showTimeSelect
                  showTimeSelectOnly
                  timeIntervals={15}
                  timeCaption="Time"
                  dateFormat="h:mm aa"
                  className="bg-transparent text-main-black"
                  readOnly
                />
              </label>
            </div>
          </div>

          <div>
            <p className="text-sm font-semibold text-main-black mb-1 capitalize">
              Timezone
            </p>
            <label className="relative flex flex-1 flex-shrink-0">
              <Select
                styles={ReviewTimezoneStyles}
                value={timzezones.find(
                  (option) => option.value === eventData.timezone || null,
                )}
                isDisabled
              />
              <span className="absolute left-3 bottom-[12px] text-main-white">
                <GlobeIcon />
              </span>
            </label>
          </div>

          <div>
            <label>
              <p className="text-sm font-semibold text-main-black mb-1 capitalize">
                Event Description
              </p>
              <textarea
                title="description"
                name="eventDescription"
                value={eventData.eventDescription}
                className="h-40 w-full bg-main-grey-bg rounded-md text-main-black p-4 border-none"
                readOnly
              />
            </label>
          </div>

          <div>
            <p className="text-sm font-semibold text-main-black mb-1 capitalize">
              Location
            </p>
            <div className="w-full grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
              <label>
                <Select
                  styles={ReviewCategoriesStyles}
                  value={
                    countryOptions?.find(
                      (option) =>
                        option.value === eventData.eventLocation.country,
                    ) || null
                  }
                  isDisabled
                />
              </label>
              <label>
                <Select
                  styles={ReviewCategoriesStyles}
                  value={
                    stateOptions?.find(
                      (option) =>
                        option.value === eventData.eventLocation.state,
                    ) || null
                  }
                  isDisabled
                />
              </label>
              <input
                name="city"
                type="text"
                placeholder="City"
                className="rounded-md bg-main-grey-bg h-12 w-full px-4 text-main-black placeholder:text-main-black/40 border-none"
                value={eventData.eventLocation.city}
                readOnly
              />
              <input
                name="postalCode"
                type="tel"
                placeholder="Postal Code"
                className="rounded-md bg-main-grey-bg h-12 w-full px-4 text-main-black placeholder:text-main-black/40 border-none"
                value={eventData.eventLocation.postalCode}
                readOnly
              />
            </div>
            <label className="bg-main-grey-bg rounded-md h-12 w-full px-4 text-main-black flex items-center border-none mt-4">
              <input
                name="address"
                type="text"
                placeholder="Fill in address"
                className="bg-transparent text-main-black placeholder:text-main-black/40"
                value={eventData.eventLocation.address}
                readOnly
              />
            </label>
          </div>

          <div>
            <p className="text-sm font-semibold text-main-black mb-1 capitalize">
              Category
            </p>
            <label>
              <Select
                styles={ReviewCategoriesStyles}
                value={
                  categories.find(
                    (option) => option.value === eventData.eventCategory,
                  ) || null
                }
                isDisabled
              />
            </label>
          </div>

          <div>
            <p className="text-sm font-semibold text-main-black mb-2 capitalize">
              Social media handles
            </p>

            <div className="flex-center flex-col w-full gap-4">
              <label className="flex flex-1 flex-shrink-0 relative w-full">
                <input
                  name="twitter"
                  readOnly
                  type="text"
                  className="rounded-md bg-main-grey-bg pl-16 h-12 w-full px-4 text-main-black placeholder:text-main-black/40"
                  value={eventData.socialMediaLinks.twitter}
                />
                <span className="left-0 top-0 bottom-0 w-14 absolute bg-main-purple rounded-l-md flex-center text-main-white body-text">
                  <XWhite />
                </span>
              </label>
              <label className="flex flex-1 flex-shrink-0 relative w-full">
                <input
                  name="instagram"
                  type="text"
                  readOnly
                  className="rounded-md bg-main-grey-bg pl-16 h-12 w-full px-4 text-main-black placeholder:text-main-black/40"
                  value={eventData.socialMediaLinks.instagram}
                />
                <span className="left-0 top-0 bottom-0 w-14 absolute bg-main-purple rounded-l-md flex-center text-main-white body-text">
                  <IGWhite />
                </span>
              </label>
              <label className="flex flex-1 flex-shrink-0 relative w-full">
                <input
                  name="youtube"
                  type="text"
                  readOnly
                  className="rounded-md bg-main-grey-bg pl-16 h-12 w-full px-4 text-main-black placeholder:text-main-black/40"
                  value={eventData.socialMediaLinks.youtube}
                />
                <span className="left-0 top-0 bottom-0 w-14 absolute bg-main-purple rounded-l-md flex-center text-main-white body-text">
                  <YoutubeWhite />
                </span>
              </label>
              <label className="flex flex-1 flex-shrink-0 relative w-full">
                <input
                  name="facebook"
                  type="text"
                  readOnly
                  className="rounded-md bg-main-grey-bg pl-16 h-12 w-full px-4 text-main-black placeholder:text-main-black/40"
                  value={eventData.socialMediaLinks.facebook}
                />
                <span className="left-0 top-0 bottom-0 w-14 absolute bg-main-purple rounded-l-md flex-center text-main-white body-text">
                  <FacebookWhite />
                </span>
              </label>
              <label className="flex flex-1 flex-shrink-0 relative w-full">
                <input
                  name="others"
                  type="text"
                  readOnly
                  className="rounded-md bg-main-grey-bg pl-16 h-12 w-full px-4 text-main-black placeholder:text-main-black/40"
                  value={eventData.socialMediaLinks.others}
                />
                <span className="left-0 top-0 bottom-0 w-14 absolute bg-main-purple rounded-l-md flex-center text-main-white body-text">
                  <GlobeWhite />
                </span>
              </label>
            </div>
          </div>
        </div>

        <div
          className="w-full flex items-stretch justify-center flex-col gap-4 md:gap-6"
          onClick={() => {
            setCreateEventStep("2");
            setAboutEventPage("2");
          }}
        >
          <h3 className="text-main-purple sub-title-text capitalize mt-4">
            Add Tickets
          </h3>

          <div className="flex gap-4 items-stretch justify-center flex-col">
            {ticketInfo.map((ticket, i) => (
              <div className="flex flex-col gap-4 md:gap-6" key={i}>
                <div>
                  <div className="w-full mb-1">
                    <p className="text-sm font-semibold text-main-black capitalize">
                      TICKET NAME
                    </p>
                  </div>
                  <label>
                    <input
                      title="ticket name"
                      type="text"
                      name="ticketName"
                      className="bg-main-grey-bg border-none rounded-md h-12 w-full px-4 text-main-black"
                      value={ticket.ticketName}
                      readOnly
                    />
                  </label>
                </div>
                <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <label>
                    <p className="text-sm font-semibold text-main-black mb-1 capitalize">
                      quantity
                    </p>
                    <input
                      title="ticket quantity"
                      type="text"
                      name="ticketQuantity"
                      className="bg-main-grey-bg border-none rounded-md h-12 w-full px-4 text-main-black"
                      value={ticket.ticketQuantity}
                      readOnly
                    />
                  </label>
                  <div>
                    <p className="text-sm font-semibold text-main-black mb-1 capitalize">
                      price
                    </p>
                    <label className="flex flex-1 flex-shrink-0 relative">
                      <input
                        title="ticket price"
                        type="tel"
                        name="ticketPrice"
                        className="bg-main-grey-bg border-none rounded-md h-12 w-full pl-16 pr-4 text-main-black"
                        value={ticket.ticketPrice}
                        readOnly
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
                      className="bg-main-grey-bg border-none rounded-md h-12 w-full px-4 text-main-black"
                      value={ticket.minimumBuyingLimit}
                      readOnly
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
                      className="bg-main-grey-bg border-none rounded-md h-12 w-full px-4 text-main-black"
                      value={ticket.maximumBuyingLimit}
                      readOnly
                    />
                  </label>
                </div>
              </div>
            ))}
          </div>

          <hr className="h-0.5 rounded-sm w-full bg-main-grey-bg" />

          <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <p className="text-sm font-semibold text-main-black mb-1 capitalize flex items-center gap-1">
                Ticket sale start date
              </p>

              <label className="bg-main-grey-bg rounded-md h-12 w-full px-4 text-main-black flex items-center">
                <ReactDatePicker
                  selected={eventData.salesStartDate}
                  placeholderText="Date"
                  name="salesStartDate"
                  onChange={(date) => {
                    if (date)
                      setEventData((prev) => ({
                        ...prev,
                        salesStartDate: date,
                      }));
                  }}
                  className="bg-transparent text-main-black"
                  readOnly
                />
              </label>
            </div>
            <div>
              <p className="text-sm font-semibold text-main-black mb-1 capitalize flex items-center gap-1">
                Ticket sale start time
              </p>
              <label className="bg-main-grey-bg rounded-md h-12 w-full px-4 text-main-black flex items-center">
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
                  className="bg-transparent text-main-black"
                  readOnly
                />
              </label>
            </div>
          </div>

          <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <p className="text-sm font-semibold text-main-black mb-1 capitalize flex items-center gap-1">
                Ticket sale end date
              </p>

              <label className="bg-main-grey-bg rounded-md h-12 w-full px-4 text-main-black flex items-center">
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
                  className="bg-transparent text-main-black"
                  readOnly
                />
              </label>
            </div>
            <div>
              <p className="text-sm font-semibold text-main-black mb-1 capitalize flex items-center gap-1">
                Ticket sale end time
              </p>
              <label className="bg-main-grey-bg rounded-md h-12 w-full px-4 text-main-black flex items-center">
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
        </div>

        <div
          className="w-full flex items-stretch justify-center flex-col gap-4 md:gap-6"
          onClick={() => setCreateEventStep("3")}
        >
          <h3 className="text-main-purple sub-title-text capitalize mt-4">
            Image Upload
          </h3>
          <label
            htmlFor="coverImg"
            className="h-60 md:h-96 full flex-center transition-all duration-300 active:scale-95 active:opacity-25 cursor-pointer rounded-big overflow-hidden"
          >
            {eventData.coverImage ? (
              <Image
                src={eventData.coverImage as string}
                alt="cover image"
                width={100}
                height={100}
                className="w-full h-full object-center"
              />
            ) : (
              <div className="flex-center flex-col gap-2 w-full h-full bg-main-grey-bg border border-dashed-none rounded-big overflow-hidden">
                <span className="text-3xl text-main-purple font-normal">
                  <FaPlus />
                </span>
                <p className="text-base font-medium text-main-black capitalize">
                  Add Cover Photos
                </p>
              </div>
            )}
            <input
              type="file"
              id="coverImg"
              name="coverImg"
              accept="image/*"
              className="hidden"
              readOnly
            />
          </label>

          <div>
            <p className="text-base font-medium text-main-black mb-1">
              Additional Images
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <label
                  key={i}
                  htmlFor={i.toString()}
                  className="h-24 w-full rounded-sm flex-center transition-all duration-300 active:scale-95 active:opacity-25 cursor-pointer overflow-hidden"
                >
                  {eventData.otherImages[i] ? (
                    <Image
                      src={eventData.otherImages[i] as string}
                      alt="additional Image"
                      className="w-full h-full"
                      width={100}
                      height={100}
                    />
                  ) : (
                    <div className="flex-center flex-col gap-2 w-full h-full bg-main-grey-bg border border-dashed-none rounded-big overflow-hidden">
                      <span className="text-xl text-main-purple font-normal">
                        <FaPlus />
                      </span>
                    </div>
                  )}
                  <input
                    title="additional image"
                    type="file"
                    id={i.toString()}
                    name={i.toString()}
                    accept="image/*"
                    className="hidden"
                    readOnly
                  />
                </label>
              ))}
            </div>
          </div>
        </div>

        <div className="max-w-md w-full mt-4 self-center">
          <Button disabled={loading}>
            {loading ? <Loader /> : "Create Event"}
          </Button>
        </div>
      </form>
    </div>
  );
}
