import { categoriesStyles, timezoneStyles } from "@/styles/react-select.styles";
import { subDays } from "date-fns";
import ReactDatePicker from "react-datepicker";
import Select, { SingleValue } from "react-select";

import {
  categories,
  timzezones,
  supportedCurrencies,
} from "@/assets/data/react-select-options";

import Button from "@/components/ui/submit-btn";

import FacebookWhite from "@/assets/svg/fb-white";
import GlobeIcon from "@/assets/svg/globe";
import GlobeWhite from "@/assets/svg/globe-white";
import IGWhite from "@/assets/svg/ig-white";
import XWhite from "@/assets/svg/x-white";
import YoutubeWhite from "@/assets/svg/yt-white";

type Props = {
  eventData: eventData;
  setEventData: React.Dispatch<React.SetStateAction<eventData>>;
  nextStep: () => void;
  countryOptions: CountryOptions[];
  stateOptions: { label: string; value: string }[];
};

export function EventDetails({
  eventData,
  setEventData,
  nextStep,
  countryOptions,
  stateOptions,
}: Props) {
  const handleSocialMediaLink = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    const newSocialMediaLinks = { ...eventData.socialMediaLinks };
    if (
      name === "others" ||
      name === "facebook" ||
      name === "twitter" ||
      name === "instagram" ||
      name === "facebook"
    )
      newSocialMediaLinks[name] = value;

    setEventData((prev) => ({
      ...prev,
      socialMediaLinks: newSocialMediaLinks,
    }));
  };

  const minDate = new Date();
  const excludeDates = [
    new Date(),
    ...Array.from({ length: minDate.getDate() }).map((_, i) =>
      subDays(minDate, i),
    ),
  ];

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setEventData((prev) => ({ ...prev, [name]: value }));
  };

  const handleEventLocation = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    const newEventLocation = { ...eventData.eventLocation };
    if (name === "address" || name === "city" || name === "postalCode")
      newEventLocation[name] = value;

    setEventData((prev) => ({
      ...prev,
      eventLocation: newEventLocation,
    }));
  };

  const isAllInputFilled = () => {
    return (
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
      eventData.eventDescription
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isAllInputFilled()) nextStep();
  };

  const ACCESS_MODES: {
    value: eventData["accessMode"];
    label: string;
    description: string;
  }[] = [
    {
      value: "public",
      label: "Public",
      description: "Anyone can find and buy a ticket.",
    },
    {
      value: "invite_only",
      label: "Invite-only",
      description:
        "No public tickets - you build the guest list and send invites.",
    },
    {
      value: "hybrid",
      label: "Hybrid",
      description:
        "Sell public tickets and invite specific guests to the same event.",
    },
  ];

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full flex items-stretch justify-center flex-col gap-4 md:gap-6"
    >
      <div className="w-full">
        <p className="text-sm font-semibold text-main-black mb-1 capitalize">
          Who can attend?
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {ACCESS_MODES.map((mode) => (
            <label
              key={mode.value}
              className={`cursor-pointer rounded-md border p-4 transition-colors ${
                eventData.accessMode === mode.value
                  ? "border-main-purple bg-main-purple/5"
                  : "border-main-light-grey bg-sec-grey"
              }`}
            >
              <input
                type="radio"
                name="accessMode"
                value={mode.value}
                checked={eventData.accessMode === mode.value}
                onChange={() =>
                  setEventData((prev) => ({ ...prev, accessMode: mode.value }))
                }
                className="sr-only"
              />
              <span className="block text-sm font-semibold text-main-black">
                {mode.label}
              </span>
              <span className="mt-1 block text-xs text-main-black/70">
                {mode.description}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Practical details attendees ask about before travelling. All optional: an organiser
          who fills none of them ends up with exactly the event they had before these existed.
          The chatbot reads these directly, so anything stated here is what it answers with -
          which is why they are plain free text rather than fixed options that would not suit
          every kind of event. */}
      <div className="w-full">
        <p className="text-sm font-semibold text-main-black mb-1">
          Attendee information{" "}
          <span className="font-normal text-main-black/50">(optional)</span>
        </p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {(
            [
              {
                key: "venueName",
                label: "Venue name",
                placeholder: "The Roundhouse, Main Hall",
              },
              {
                key: "dressCode",
                label: "Dress code",
                placeholder: "Smart casual - no sportswear",
              },
              {
                key: "parkingInfo",
                label: "Parking",
                placeholder: "Underground car park, £8 flat rate",
              },
              {
                key: "accessibilityInfo",
                label: "Accessibility",
                placeholder: "Step-free access, accessible toilets",
              },
              {
                key: "ageRestriction",
                label: "Age restriction",
                placeholder: "18+ - photo ID required",
              },
            ] as const
          ).map((field) => (
            <label key={field.key} className="flex flex-col gap-1">
              <span className="text-xs font-semibold text-main-black/80">
                {field.label}
              </span>
              <input
                type="text"
                name={field.key}
                value={eventData[field.key]}
                placeholder={field.placeholder}
                onChange={(e) =>
                  setEventData((prev) => ({
                    ...prev,
                    [field.key]: e.target.value,
                  }))
                }
                className="rounded-md border border-main-light-grey bg-sec-grey px-3 py-2.5 text-sm text-main-black transition-colors focus:border-main-purple/50 focus:outline-none"
              />
            </label>
          ))}
        </div>
      </div>

      {/* Guest networking opt-out. A real checkbox rather than a styled div so it is
          keyboard-operable and announced with its checked state; the label wraps the input
          so the whole card is a hit target. */}
      <div className="w-full">
        <p className="text-sm font-semibold text-main-black mb-1 capitalize">
          Guest networking
        </p>
        <label
          className={`flex cursor-pointer items-start gap-3 rounded-md border p-4 transition-colors ${
            eventData.networkingEnabled
              ? "border-main-purple bg-main-purple/5"
              : "border-main-light-grey bg-sec-grey"
          }`}
        >
          <input
            type="checkbox"
            name="networkingEnabled"
            checked={eventData.networkingEnabled}
            onChange={(e) =>
              setEventData((prev) => ({
                ...prev,
                networkingEnabled: e.target.checked,
              }))
            }
            className="mt-0.5 size-4 shrink-0 accent-main-purple"
          />
          <span>
            <span className="block text-sm font-semibold text-main-black">
              Let attendees network with each other
            </span>
            <span className="mt-1 block text-xs text-main-black/70">
              Opens a group chat and attendee directory while the event is live,
              and emails everyone the link. Turn this off for private events
              where guests shouldn&apos;t see or message each other.
            </span>
          </span>
        </label>
      </div>

      <div className="w-full">
        <p className="text-sm font-semibold text-main-black mb-1 capitalize">
          Event Start
        </p>
        <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-6">
          <label className="bg-sec-grey rounded-md h-12 w-full px-4 text-main-black flex items-center border border-main-purple">
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
              className="bg-transparent text-main-black placeholder:text-main-black/40"
              minDate={minDate}
              excludeDates={excludeDates}
            />
          </label>
          <label className="bg-sec-grey rounded-md h-12 w-full px-4 text-main-black flex items-center border border-main-purple">
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
              className="bg-transparent text-main-black placeholder:text-main-black/40"
            />
          </label>
        </div>
      </div>

      <div>
        <p className="text-sm font-semibold text-main-black mb-1 capitalize ">
          Event End
        </p>
        <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-6">
          <label className="bg-sec-grey rounded-md h-12 w-full px-4 text-main-black flex items-center border border-main-purple">
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
              className="bg-transparent text-main-black placeholder:text-main-black/40"
              minDate={eventData.startDate || minDate}
              excludeDates={
                eventData.startDate
                  ? excludeDates.slice(0, eventData.startDate.getDate())
                  : excludeDates
              }
            />
          </label>
          <label className="bg-sec-grey rounded-md h-12 w-full px-4 text-main-black flex items-center border border-main-purple">
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
              className="bg-transparent text-main-black placeholder:text-main-black/40"
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
            styles={timezoneStyles}
            value={timzezones.find(
              (option) => option.value === eventData.timezone || null,
            )}
            classNamePrefix="select"
            options={timzezones}
            onChange={(timezone: SingleValue<reactSelectOptions>) =>
              setEventData((prev) => ({
                ...prev,
                timezone: timezone?.value as string,
              }))
            }
            isSearchable={true}
            name="timezone"
            placeholder="Timezone"
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
            className="h-40 w-full bg-sec-grey rounded-md text-main-black px-4 py-2 border border-main-purple"
            value={eventData.eventDescription}
            onChange={handleChange}
            placeholder="Describe your event"
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
              styles={categoriesStyles}
              value={
                countryOptions?.find(
                  (option) => option.value === eventData.eventLocation.country,
                ) || null
              }
              classNamePrefix="select"
              options={countryOptions}
              onChange={(country: SingleValue<CountryOptions>) => {
                const newEventLocation = { ...eventData.eventLocation };
                if (country) {
                  newEventLocation.country = country.value;
                  newEventLocation.state = "";

                  setEventData((prev) => ({
                    ...prev,
                    currency: country.currency,
                    eventLocation: newEventLocation,
                  }));
                }
              }}
              isSearchable={true}
              name="country"
              placeholder="Country"
            />
          </label>
          <label>
            <Select
              styles={categoriesStyles}
              value={
                stateOptions?.find(
                  (option) => option.value === eventData.eventLocation.state,
                ) || null
              }
              classNamePrefix="select"
              options={stateOptions}
              onChange={(state: SingleValue<reactSelectOptions>) => {
                const newEventLocation = { ...eventData.eventLocation };
                newEventLocation.state = state?.value as string;

                setEventData((prev) => ({
                  ...prev,
                  eventLocation: newEventLocation,
                }));
              }}
              isSearchable={true}
              name="state"
              placeholder="State/County"
            />
          </label>
          <input
            name="city"
            type="text"
            placeholder="City"
            className="rounded-md bg-sec-grey h-12 w-full px-4 text-main-black placeholder:text-main-black/40 border border-main-purple"
            value={eventData.eventLocation.city}
            onChange={handleEventLocation}
          />
          <input
            name="postalCode"
            type="tel"
            placeholder="Postal Code"
            className="rounded-md bg-sec-grey h-12 w-full px-4 text-main-black placeholder:text-main-black/40 border border-main-purple"
            value={eventData.eventLocation.postalCode}
            onChange={handleEventLocation}
          />
        </div>

        {/* Currency is chosen explicitly rather than inferred from the country. It used to be
            derived from the country alone, which forced GBP for a UK event and EUR for a
            German one — neither of which the payment provider can settle, so those events
            could never sell a ticket. Selecting the country still *suggests* a currency, but
            the organiser decides. */}
        <div className="mt-4 max-w-sm">
          <p className="text-sm font-semibold text-main-black mb-1">
            Ticket currency
          </p>
          <Select
            styles={categoriesStyles}
            value={
              supportedCurrencies.find(
                (option) => option.value === eventData.currency,
              ) || null
            }
            classNamePrefix="select"
            options={supportedCurrencies}
            onChange={(currency: SingleValue<reactSelectOptions>) => {
              setEventData((prev) => ({
                ...prev,
                currency: currency?.value as string,
              }));
            }}
            isSearchable={true}
            name="currency"
            placeholder="Select currency"
          />
          <p className="text-xs text-main-black/60 mt-1">
            All ticket prices for this event are charged in this currency. Only
            currencies the payment provider can settle are listed.
          </p>
        </div>
        <label className="bg-sec-grey rounded-md h-12 w-full px-4 text-main-black flex items-center border border-main-purple mt-4">
          <input
            name="address"
            type="text"
            placeholder="Fill in venue address"
            className="bg-transparent text-main-black placeholder:text-main-black/40 w-full"
            value={eventData.eventLocation.address}
            onChange={handleEventLocation}
          />
        </label>
      </div>

      <div>
        <p className="text-sm font-semibold text-main-black mb-1 capitalize">
          Category
        </p>
        <label>
          <Select
            styles={categoriesStyles}
            value={
              categories.find(
                (option) => option.value === eventData.eventCategory,
              ) || null
            }
            classNamePrefix="select"
            options={categories}
            onChange={(category: SingleValue<reactSelectOptions>) =>
              setEventData((prev) => ({
                ...prev,
                eventCategory: category?.value as string,
              }))
            }
            isSearchable={true}
            name="eventCategory"
            placeholder="Select Category"
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
              placeholder="Twitter URL"
              type="text"
              className="rounded-md bg-sec-grey pl-16 h-12 w-full px-4 text-main-black border border-main-purple placeholder:text-main-black/40"
              value={eventData.socialMediaLinks.twitter}
              onChange={handleSocialMediaLink}
            />
            <span className="left-0 top-0 bottom-0 w-14 absolute bg-main-purple rounded-l-md flex-center text-main-white body-text">
              <XWhite />
            </span>
          </label>
          <label className="flex flex-1 flex-shrink-0 relative w-full">
            <input
              name="instagram"
              type="text"
              placeholder="Instagram URL"
              className="rounded-md bg-sec-grey pl-16 h-12 w-full px-4 text-main-black border border-main-purple placeholder:text-main-black/40"
              value={eventData.socialMediaLinks.instagram}
              onChange={handleSocialMediaLink}
            />
            <span className="left-0 top-0 bottom-0 w-14 absolute bg-main-purple rounded-l-md flex-center text-main-white body-text">
              <IGWhite />
            </span>
          </label>
          <label className="flex flex-1 flex-shrink-0 relative w-full">
            <input
              name="youtube"
              type="text"
              placeholder="Youtube URL"
              className="rounded-md bg-sec-grey pl-16 h-12 w-full px-4 text-main-black border border-main-purple placeholder:text-main-black/40"
              value={eventData.socialMediaLinks.youtube}
              onChange={handleSocialMediaLink}
            />
            <span className="left-0 top-0 bottom-0 w-14 absolute bg-main-purple rounded-l-md flex-center text-main-white body-text">
              <YoutubeWhite />
            </span>
          </label>
          <label className="flex flex-1 flex-shrink-0 relative w-full">
            <input
              name="facebook"
              type="text"
              placeholder="Facebook URL"
              className="rounded-md bg-sec-grey pl-16 h-12 w-full px-4 text-main-black border border-main-purple placeholder:text-main-black/40"
              value={eventData.socialMediaLinks.facebook}
              onChange={handleSocialMediaLink}
            />
            <span className="left-0 top-0 bottom-0 w-14 absolute bg-main-purple rounded-l-md flex-center text-main-white body-text">
              <FacebookWhite />
            </span>
          </label>
          <label className="flex flex-1 flex-shrink-0 relative w-full">
            <input
              name="others"
              type="text"
              placeholder="Website URL"
              className="rounded-md bg-sec-grey pl-16 h-12 w-full px-4 text-main-black border border-main-purple placeholder:text-main-black/40"
              value={eventData.socialMediaLinks.others}
              onChange={handleSocialMediaLink}
            />
            <span className="left-0 top-0 bottom-0 w-14 absolute bg-main-purple rounded-l-md flex-center text-main-white body-text">
              <GlobeWhite />
            </span>
          </label>
        </div>
      </div>

      <div className="w-full max-w-md mt-4 self-center">
        <Button disabled={!isAllInputFilled()} onClick={handleSubmit}>
          Continue
        </Button>
      </div>
    </form>
  );
}
