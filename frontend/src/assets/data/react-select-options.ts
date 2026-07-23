export const timzezones: reactSelectOptions[] = [
  { value: "WAT", label: "WAT (West Africa Time)" },
  { value: "CAT", label: "CAT (Central Africa Time)" },
  { value: "EAT", label: "EAT (East Africa Time)" },
  { value: "GMT", label: "GMT (Greenwich Mean Time)" },
  { value: "UTC", label: "UTC (Coordinated Universal Time)" },
  { value: "EST", label: "EST (Eastern Standard Time)" },
  { value: "PST", label: "PST (Pacific Standard Time)" },
  { value: "CST", label: "CST (Central Standard Time)" },
  { value: "CET", label: "CET (Central European Time)" },
  { value: "EET", label: "EET (Eastern European Time)" },
  { value: "WET", label: "WET (Western European Time)" },
];

export const hardcodedCountries = [
  { label: "United Kingdom", value: "United Kingdom", id: "GB", currency: "GBP" },
  { label: "United States", value: "United States", id: "US", currency: "USD" },
  { label: "Nigeria", value: "Nigeria", id: "NG", currency: "NGN" },
  { label: "Germany", value: "Germany", id: "DE", currency: "EUR" },
  { label: "France", value: "France", id: "FR", currency: "EUR" },
];

export const hardcodedStates: Record<string, reactSelectOptions[]> = {
  "United Kingdom": [
    { label: "London", value: "London" },
    { label: "Manchester", value: "Manchester" },
    { label: "Birmingham", value: "Birmingham" },
  ],
  "United States": [
    { label: "New York", value: "New York" },
    { label: "California", value: "California" },
    { label: "Texas", value: "Texas" },
  ],
  "Nigeria": [
    { label: "Lagos", value: "Lagos" },
    { label: "Abuja", value: "Abuja" },
    { label: "Rivers", value: "Rivers" },
  ],
  "Germany": [
    { label: "Berlin", value: "Berlin" },
    { label: "Bavaria", value: "Bavaria" },
    { label: "Hesse", value: "Hesse" },
  ],
  "France": [
    { label: "Île-de-France", value: "Île-de-France" },
    { label: "Provence-Alpes-Côte d'Azur", value: "Provence-Alpes-Côte d'Azur" },
  ],
};

export const categories: reactSelectOptions[] = [
  {
    value: "business",
    label: "Business Events: Conference, seminar, workshop, trade show.",
  },
  {
    value: "social",
    label: "Social Events: wedding, reunion, birthday, anniversary.",
  },
  {
    value: "education",
    label:
      "Educational Events: Webinar, lecture, training session, educational workshop.",
  },
  {
    value: "entertainment",
    label:
      "Entertainment Events: Concert, festival, movie screening, theater production.",
  },
  {
    value: "sports",
    label: "Sports Events: Tournament, match, race, fitness event.",
  },
  {
    value: "community",
    label:
      "Community Events: Fundraiser, charity event, voulenteer activity, community gathering.",
  },
  {
    value: "virtual",
    label:
      "Virtual Events: Online conference, webinar, virtual meetup, virtual trade show.",
  },
];

export const exploreEventCategories: reactSelectOptions[] = [
  {
    value: "business",
    label: "Business Events",
  },
  {
    value: "social",
    label: "Social Events",
  },
  {
    value: "education",
    label: "Educational Events",
  },
  {
    value: "entertainment",
    label: "Entertainment Events",
  },
  {
    value: "sports",
    label: "Sports Events",
  },
  {
    value: "community",
    label: "Community Events",
  },
  {
    value: "virtual",
    label: "Virtual Events",
  },
];

export const genderOptions: reactSelectOptions[] = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
  { value: "other", label: "Other" },
  { value: "prefer-not-to-say", label: "Prefer not to say" },
];
