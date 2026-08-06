export const nav_items = [
  {
    name: "Events",
    href: "/explore-events",
    // `description` is optional and used only by the desktop dropdown, which has room to
    // explain each destination. The mobile and side navs render `name` alone.
    sublinks: [
      {
        name: "Explore Events",
        href: "/explore-events",
        description: "Find what's happening near you",
      },
      {
        name: "Create Event",
        href: "/create-event",
        description: "Publish an event and sell tickets",
      },
      // "My Events" deliberately lives in the profile menu, not here. It is personal
      // inventory rather than navigation, and rendering it in the public nav showed
      // logged-out visitors a link that middleware immediately bounced to /login.
    ],
  },
  {
    name: "About Us",
    href: "/about-us",
  },
  {
    name: "Contact Us",
    href: "/contact-us",
  },
];
