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

/**
 * Currencies the payment provider can actually settle.
 *
 * Mirrors `SUPPORTED_CURRENCIES` in the backend's `pricingService`, which is the authority —
 * the Event schema rejects anything outside it. Keep the two in step: widening one alone
 * only moves the failure from the form to the payment gateway.
 */
export const supportedCurrencies = [
  { label: "NGN — Nigerian naira", value: "NGN" },
  { label: "GHS — Ghanaian cedi", value: "GHS" },
  { label: "ZAR — South African rand", value: "ZAR" },
  { label: "KES — Kenyan shilling", value: "KES" },
  { label: "USD — US dollar", value: "USD" },
  { label: "XOF — West African CFA franc", value: "XOF" },
];

/**
 * `currency` here is only a **suggested default** for the country, not a constraint — the
 * organiser picks the currency explicitly and may charge in any supported one regardless of
 * where the event is held. A UK event charging in USD is perfectly reasonable, and was
 * previously impossible: the country mapping forced GBP, which Paystack cannot settle, so
 * those events silently could not sell a single ticket.
 */
export const hardcodedCountries = [
  { label: "United Kingdom", value: "United Kingdom", id: "GB", currency: "USD" },
  { label: "United States", value: "United States", id: "US", currency: "USD" },
  { label: "Nigeria", value: "Nigeria", id: "NG", currency: "NGN" },
  { label: "Ghana", value: "Ghana", id: "GH", currency: "GHS" },
  { label: "Kenya", value: "Kenya", id: "KE", currency: "KES" },
  { label: "South Africa", value: "South Africa", id: "ZA", currency: "ZAR" },
  { label: "Germany", value: "Germany", id: "DE", currency: "USD" },
  { label: "France", value: "France", id: "FR", currency: "USD" },
];

export const hardcodedStates: Record<string, reactSelectOptions[]> = {
  // UK entries are counties/administrative areas rather than cities - the field is labelled
  // "State/County" because "state" has no meaning here. The existing city-named values are
  // kept so events already stored against them still resolve.
  "United Kingdom": [
    { label: "West Midlands", value: "West Midlands" },
    { label: "Greater London", value: "Greater London" },
    { label: "Greater Manchester", value: "Greater Manchester" },
    { label: "Merseyside", value: "Merseyside" },
    { label: "West Yorkshire", value: "West Yorkshire" },
    { label: "South Yorkshire", value: "South Yorkshire" },
    { label: "Tyne and Wear", value: "Tyne and Wear" },
    { label: "London", value: "London" },
    { label: "Manchester", value: "Manchester" },
    { label: "Birmingham", value: "Birmingham" },
  ],
  Ghana: [
    { label: "Greater Accra", value: "Greater Accra" },
    { label: "Ashanti", value: "Ashanti" },
    { label: "Western", value: "Western" },
  ],
  Kenya: [
    { label: "Nairobi", value: "Nairobi" },
    { label: "Mombasa", value: "Mombasa" },
    { label: "Kisumu", value: "Kisumu" },
  ],
  "South Africa": [
    { label: "Gauteng", value: "Gauteng" },
    { label: "Western Cape", value: "Western Cape" },
    { label: "KwaZulu-Natal", value: "KwaZulu-Natal" },
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
