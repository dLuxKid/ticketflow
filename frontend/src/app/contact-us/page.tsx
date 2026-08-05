import ContactUsForm from "./_component/contact-us";
import Container from "@/components/container";

/**
 * Contact page.
 *
 * The background was a full-bleed pink-and-purple chevron PNG (`/contact-us-bg.png`) left
 * over from the pre-rebrand identity; it fought the cotton palette everywhere else and gave
 * the form no useful context. It is replaced by a soft indigo wash, and the single centred
 * card becomes two columns so the page answers "how else can I reach you?" alongside the
 * form itself.
 */

const CONTACT_EMAIL = "adetunjiboyz@gmail.com";

const channels = [
  {
    title: "Email us",
    body: CONTACT_EMAIL,
    href: `mailto:${CONTACT_EMAIL}`,
    path: "M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2zM22 6l-10 7L2 6",
  },
  {
    title: "Read the FAQs",
    body: "Answers to the most common questions",
    href: "/#faq",
    path: "M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3M12 17h.01M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z",
  },
  {
    title: "Refunds & policies",
    body: "Ticket terms, refunds and privacy",
    href: "/refund-policy",
    path: "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6M16 13H8M16 17H8M10 9H8",
  },
];

export default function ContactUs() {
  return (
    <div className="relative">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(55rem_28rem_at_12%_-10%,rgba(108,92,231,0.16),transparent),radial-gradient(45rem_26rem_at_92%_20%,rgba(96,165,250,0.10),transparent)]"
      />

      <Container>
        <div className="relative grid gap-10 px-[5%] py-14 md:py-20 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1fr)] lg:gap-16">
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-4">
              <span className="inline-flex w-fit items-center rounded-full border border-main-purple/20 bg-main-purple/[0.06] px-3.5 py-1.5 text-xs font-semibold uppercase tracking-wider text-main-purple">
                Contact us
              </span>
              <h1 className="text-3xl font-bold leading-tight tracking-tight text-main-black sm:text-4xl">
                Get in touch with us for more information
              </h1>
              <p className="max-w-md text-base leading-relaxed text-sec-black/75">
                If you need help or have a question, our support team is a click
                away. We aim to reply to every message within two working days.
              </p>
            </div>

            <div className="flex flex-col gap-3">
              {channels.map((channel) => (
                <a
                  key={channel.title}
                  href={channel.href}
                  className="group flex items-start gap-4 rounded-2xl border border-main-light-grey/70 bg-main-white p-4 transition-all duration-300 hover:-translate-y-0.5 hover:border-main-purple/30 hover:shadow-[0_18px_36px_-24px_rgba(46,50,68,0.45)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-main-purple/40"
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-main-purple/10 text-main-purple transition-colors group-hover:bg-main-purple group-hover:text-main-white">
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                      className="h-5 w-5"
                    >
                      <path d={channel.path} />
                    </svg>
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-bold text-main-black">
                      {channel.title}
                    </span>
                    <span className="block truncate text-sm text-sec-black/70">
                      {channel.body}
                    </span>
                  </span>
                </a>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-main-light-grey/70 bg-main-white p-6 shadow-[0_28px_60px_-32px_rgba(46,50,68,0.45)] sm:p-8">
            <ContactUsForm />
          </div>
        </div>
      </Container>
    </div>
  );
}
