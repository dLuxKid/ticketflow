"use client";

import { useEffect, useState } from "react";

import GoBack from "@/components/ui/back-btn";
import ProgressBar from "@/components/ui/create-event-progress-bar";
import { EventDetails } from "./_component/event-details/event-details";
import { AboutEvent } from "./_component/event-details/main";
import { TicketDetails } from "./_component/event-details/ticket-details";
import NameEvent from "./_component/name-event";
import ReviewEvent from "./_component/review-event";
import SelectImages from "./_component/select-images";
import Success from "./_component/success";

import { socialMediaURLs } from "@/assets/data/create-event-data";

import { hardcodedCountries, hardcodedStates } from "@/assets/data/react-select-options";

const initialState: eventData = {
  eventName: "",
  startDate: null,
  startTime: null,
  endDate: null,
  endTime: null,
  timezone: "",
  eventDescription: "",
  eventLocation: {
    address: "",
    city: "",
    postalCode: "",
    state: "",
    country: "",
  },
  eventCategory: "",
  socialMediaLinks: socialMediaURLs,
  ticketDetails: [],
  salesStartDate: null,
  salesEndDate: null,
  salesStartTime: null,
  salesEndTime: null,
  coverImage: "",
  otherImages: [],
  currency: "",
  accessMode: "public",
  networkingEnabled: true,
  venueName: "",
  dressCode: "",
  parkingInfo: "",
  accessibilityInfo: "",
  ageRestriction: "",
};

export default function CreateEvent() {
  const [createEventStep, setCreateEventStep] =
    useState<createEventStatusType>("1");
  const [createEventFormData, setCreateEventFormData] =
    useState<eventData>(initialState);
  const [aboutEventPage, setAboutEventPage] = useState<"1" | "2">("1");

  const [success, setSuccess] = useState(false);

  const nextStep = () => {
    if (createEventStep !== "3")
      sessionStorage.setItem("eventData", JSON.stringify(createEventFormData));
    setCreateEventStep(
      (prev) => (Number(prev) + 1).toString() as createEventStatusType
    );
  };
  const prevStep = () => {
    setCreateEventStep(
      (prev) => (Number(prev) - 1).toString() as createEventStatusType
    );
  };
  const reset = () => {
    setSuccess(true);
    sessionStorage.removeItem("eventData");
  };

  const countryOptions = hardcodedCountries;
  const stateOptions = createEventFormData.eventLocation.country
    ? hardcodedStates[createEventFormData.eventLocation.country] || []
    : [];

  useEffect(() => {
    const eventData = sessionStorage.getItem("eventData");
    if (!eventData) return setCreateEventFormData(initialState);
    const eventDataState: eventData = JSON.parse(eventData);
    setCreateEventFormData({
      ...eventDataState,
      endDate: eventDataState.endDate
        ? new Date(eventDataState.endDate as Date)
        : null,
      endTime: eventDataState.endTime
        ? new Date(eventDataState.endTime as Date)
        : null,
      startDate: eventDataState.startDate
        ? new Date(eventDataState.startDate as Date)
        : null,
      startTime: eventDataState.startTime
        ? new Date(eventDataState.startTime as Date)
        : null,
      salesEndDate: eventDataState.salesEndDate
        ? new Date(eventDataState.salesEndDate as Date)
        : null,
      salesStartDate: eventDataState.salesStartDate
        ? new Date(eventDataState.salesStartDate as Date)
        : null,
      salesEndTime: eventDataState.salesEndTime
        ? new Date(eventDataState.salesEndTime as Date)
        : null,
      salesStartTime: eventDataState.salesStartTime
        ? new Date(eventDataState.salesStartTime as Date)
        : null,
    });
  }, []);

  const CreateEventStatus: {
    [key: string]: { step: string; component: React.ReactNode };
  } = {
    "1": {
      step: "Event Name",
      component: (
        <NameEvent
          eventData={createEventFormData}
          setEventData={setCreateEventFormData}
          nextStep={nextStep}
        />
      ),
    },
    "2": {
      step: "Event Details",
      component: (
        <AboutEvent>
          {aboutEventPage === "1" && (
            <EventDetails
              eventData={createEventFormData}
              setEventData={setCreateEventFormData}
              nextStep={() => {
                localStorage.setItem(
                  "eventData",
                  JSON.stringify(createEventFormData)
                );
                setAboutEventPage("2");
              }}
              countryOptions={countryOptions as CountryOptions[]}
              stateOptions={stateOptions as reactSelectOptions[]}
            />
          )}
          {aboutEventPage === "2" && (
            <TicketDetails
              eventData={createEventFormData}
              setEventData={setCreateEventFormData}
              nextStep={nextStep}
              prev={() => setAboutEventPage("1")}
            />
          )}
        </AboutEvent>
      ),
    },
    "3": {
      step: "Image",
      component: (
        <SelectImages
          eventData={createEventFormData}
          setEventData={setCreateEventFormData}
          nextStep={nextStep}
        />
      ),
    },
    "4": {
      step: "Review and Publish",
      component: (
        <ReviewEvent
          eventData={createEventFormData}
          setEventData={setCreateEventFormData}
          reset={reset}
          countryOptions={countryOptions as CountryOptions[]}
          stateOptions={stateOptions as reactSelectOptions[]}
          setCreateEventStep={setCreateEventStep}
          setAboutEventPage={setAboutEventPage}
        />
      ),
    },
  };

  if (success) return <Success event={createEventFormData} />;

  return (
    <>
      {Number(createEventStep) > 1 && <GoBack onClick={prevStep} />}

      <ProgressBar
        CreateEventStatus={CreateEventStatus}
        createEventStep={createEventStep}
      />

      {CreateEventStatus[createEventStep].component}
    </>
  );
}
