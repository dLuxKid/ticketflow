type MyEvent = {
  _id: string;
  eventName: string;
  startDate: Date;
  startTime: Date;
  eventLocation: locationData;
  isLive: string;
  coverImage: string;
  endDate: string;
  endTime: Date;
  timezone: string;
  slug: string;
  accessMode?: "public" | "invite_only" | "hybrid";
};

type category = "all" | "upcoming" | "past" | "live";
