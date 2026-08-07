import Image from "next/image";
import Link from "next/link";

/**
 * Site footer.
 *
 * Colour changed from pure `#000` to the brand's deep slate (`main-black`, #2e3244) with a
 * faint indigo wash. Pure black was the only true black left on the site and read as a hard
 * cut-off beneath the soft cotton palette; the slate closes the page instead of severing it.
 */

const columns = [
  {
    title: "Service",
    links: [
      { label: "Home", href: "/" },
      { label: "Explore events", href: "/explore-events" },
      { label: "About us", href: "/about-us" },
      { label: "FAQs", href: "/#faq" },
      { label: "Contact us", href: "/contact-us" },
    ],
  },
  {
    title: "Organisers",
    links: [
      { label: "Create an event", href: "/create-event" },
      { label: "My events", href: "/my-events" },
      { label: "My tickets", href: "/my-profile/tickets" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Terms and conditions", href: "/terms-and-conditions" },
      { label: "Privacy", href: "/data-and-privacy" },
      { label: "Refund policy", href: "/refund-policy" },
    ],
  },
];

export default function Footer() {
  return (
    <footer className="relative w-full overflow-hidden bg-main-black text-main-white">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(45rem_22rem_at_10%_-30%,rgba(108,92,231,0.28),transparent),radial-gradient(35rem_20rem_at_95%_0%,rgba(96,165,250,0.12),transparent)]"
      />

      <div className="relative mx-auto max-w-screen-2xl px-[5%] py-14 md:py-16">
        <div className="grid gap-10 md:grid-cols-[minmax(0,1.3fr)_repeat(3,minmax(0,1fr))] md:gap-8">
          <div className="flex flex-col gap-4">
            <Link href="/" className="w-fit">
              <Image
                src="/ticketflow-logo.jpg"
                alt="TicketFlow"
                width={150}
                height={50}
                className="h-10 w-auto rounded-md ring-1 ring-main-white/15"
              />
            </Link>
            <p className="max-w-xs text-sm leading-relaxed text-main-white/60">
              Event ticketing and guest management - from the first ticket sold
              to the last guest through the door.
            </p>
            {/* Routes to the contact form rather than exposing mailboxes. Two `mailto:`
                chips previously sat here: they published the team's personal addresses to
                scrapers, made the reader choose between two identical-looking options with
                nothing to distinguish them, and depended on the visitor having a mail client
                configured at all. One destination, and the form captures a subject with it. */}
            <Link
              href="/contact-us"
              className="inline-flex w-fit items-center gap-2 rounded-full border border-main-white/15 bg-main-white/[0.06] px-4 py-2.5 text-sm font-semibold text-main-white/90 transition-colors hover:border-main-white/30 hover:bg-main-white/10 hover:text-main-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-main-white/30"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
                className="h-4 w-4"
              >
                <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
              </svg>
              Send us a message
            </Link>
          </div>

          {columns.map((column) => (
            <nav key={column.title} aria-label={column.title}>
              <h2 className="mb-4 text-sm font-bold uppercase tracking-wider text-main-white">
                {column.title}
              </h2>
              <ul className="flex flex-col gap-3">
                {column.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      // Underline on hover as well as the colour lift: colour alone is not a
                      // sufficient affordance, and the muted white sits close to the surface.
                      className="text-sm text-main-white/60 underline-offset-4 transition-colors hover:text-main-white hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-main-white/30"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-3 border-t border-main-white/10 pt-6 sm:flex-row">
          <p className="text-sm text-main-white/50">
            © {new Date().getFullYear()} TicketFlow. All rights reserved.
          </p>
          <p className="text-sm text-main-white/40">
            Built for events of every size.
          </p>
        </div>
      </div>
    </footer>
  );
}
