/**
 * Cross-navigation tabs shared by the organiser surfaces, so an organiser can
 * jump between an event's Guest list, Live dashboard, Scanner and Door staff without going
 * back to My Events. `current` marks the active tab.
 *
 * **Guest list is conditional.** Only invite_only and hybrid events have one - a public
 * event admits people purely by ticket, and the API refuses guest-list management for it
 * with a 400. The tab used to be shown for every event, so an organiser on a public event's
 * dashboard was offered a link to a page that could only fail. `hasGuestList` comes from the
 * event workspace lookup, which computes it server-side from the same rule the API enforces.
 *
 * Defaults to `false`: a caller that cannot determine the access mode shows no guest tab.
 * Hiding a tool that might have worked is a smaller failure than offering one that cannot.
 */
export const eventTabs = (
  eventId: string,
  current: "guests" | "dashboard" | "scan" | "team",
  hasGuestList = false,
) => [
  ...(hasGuestList
    ? [
        {
          label: "Guest list",
          href: `/guest-list/${eventId}`,
          active: current === "guests",
        },
      ]
    : []),
  { label: "Live dashboard", href: `/dashboard/${eventId}`, active: current === "dashboard" },
  { label: "Scan tickets", href: `/scan/${eventId}`, active: current === "scan" },
  { label: "Door staff", href: `/event-team/${eventId}`, active: current === "team" },
];
