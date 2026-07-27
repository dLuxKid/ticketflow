/**
 * Cross-navigation tabs shared by the EntryPoint organiser surfaces, so an organiser can
 * jump between an event's Guest list, Live dashboard, Scanner and Door staff without going
 * back to My Events. `current` marks the active tab.
 */
export const eventTabs = (
  eventId: string,
  current: "guests" | "dashboard" | "scan" | "team",
) => [
  { label: "Guest list", href: `/guest-list/${eventId}`, active: current === "guests" },
  { label: "Live dashboard", href: `/dashboard/${eventId}`, active: current === "dashboard" },
  { label: "Scan tickets", href: `/scan/${eventId}`, active: current === "scan" },
  { label: "Door staff", href: `/event-team/${eventId}`, active: current === "team" },
];
