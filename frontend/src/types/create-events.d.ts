type eventData = {
  id?: string;
  eventName: string;
  startDate: Date | null;
  startTime: Date | null;
  endDate: Date | null;
  endTime: Date | null;
  timezone: string;
  eventDescription: string;
  eventLocation: locationData;
  eventCategory: string;
  socialMediaLinks: socialMediaURLs;
  ticketDetails: ticketType[];
  salesStartDate: Date | null;
  salesEndDate: Date | null;
  salesStartTime: Date | null;
  salesEndTime: Date | null;
  coverImage: string;
  otherImages: string[];
  currency: string;
  accessMode: "public" | "invite_only" | "hybrid";
  networkingEnabled: boolean;
  venueName: string;
  dressCode: string;
  parkingInfo: string;
  accessibilityInfo: string;
  ageRestriction: string;
};

type ticketType = {
  ticketName: string;
  ticketQuantity: string;
  ticketPrice: string;
  minimumBuyingLimit: string;
  maximumBuyingLimit: string;
};

type locationData = {
  address: string;
  city: string;
  postalCode: string;
  state: string;
  country: string;
};

type AdditionalImagesName =
  | "additionalImg1"
  | "additionalImg2"
  | "additionalImg3"
  | "additionalImg4";

type reactSelectOptions = { value: string; label: string };

type createEventStatusType = "1" | "2" | "3" | "4";

type CountryOptions = {
  label: string;
  value: string;
  id: string;
  currency: string;
};

type socialMediaURLs = {
  twitter: string;
  instagram: string;
  youtube: string;
  facebook: string;
  others: string;
};
