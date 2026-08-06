type AllEventData = {
  _id: string;
  eventName: string;
  startDate: Date;
  startTime: Date;
  eventLocation: locationData;
  slug: string;
  coverImage: string;
  totalQuantity: number;
  timezone: string;
  salesStartDate: Date;
  salesEndDate: Date;
  salesStartTime: Date;
  salesEndTime: Date;
  numberOfAttendees: number;
};

type EventDetails = {
  _id: string;
  eventName: string;
  startDate: Date;
  startTime: Date;
  endDate: Date;
  endTime: Date;
  timezone: string;
  eventDescription: string;
  eventLocation: locationData;
  eventCategory: string;
  venueName?: string;
  dressCode?: string;
  parkingInfo?: string;
  accessibilityInfo?: string;
  ageRestriction?: string;
  socialMediaLinks: socialMediaURLs;
  ticketDetails: TicketDetail[];
  totalQuantity: number;
  refundPolicy: string;
  salesStartDate: Date;
  salesEndDate: Date;
  salesStartTime: Date;
  salesEndTime: Date;
  coverImage: string;
  user: { name: string; email: string; photo: string };
  currency: string;
  numberOfAttendees: number;
};

type TicketDetail = {
  ticketName: string;
  ticketPrice: string;
  ticketQuantity: string;
  maximumBuyingLimit: string;
};
