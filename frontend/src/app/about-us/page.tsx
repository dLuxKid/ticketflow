import Image from "next/image";

import CommunicateWithUs from "@/assets/images/Chat.png";
import EventsGraphic from "@/assets/images/Events.png";
import LocationGraphic from "@/assets/images/Location.png";
import OfejiroImage from "@/assets/images/Ofejiro.jpeg";

import Container from "@/components/container";
import SignupSection from "@/components/signup-section";

/**
 * About page.
 *
 * Team avatars are generated locally from initials rather than fetched from ui-avatars.com.
 * The remote version made an external request per member on every load and had the
 * pre-rebrand electric purple baked into the URL, so the five circles rendered noticeably
 * more saturated than the rest of the page.
 */

const team = [
  { name: "Marvellous Adetunji", role: "Frontend Developer" },
  { name: "Olasubomi Abiola", role: "UI/UX Designer" },
  { name: "Opeyemi Akoki", role: "DevOps Engineer" },
  { name: "Ofejiro Ederhi", role: "Backend Developer", image: OfejiroImage, },
  { name: "Desmond Ijeoma", role: "Project Manager" },
];

const features = [
  {
    step: "01",
    title: "Discovering events",
    body: "Through event discovery, we are at the forefront of events - keeping you up to speed with the latest happenings and offering more personalised options to choose from.",
    image: LocationGraphic,
    alt: "",
  },
  {
    step: "02",
    title: "Creating events",
    body: "Our platform empowers organisers with event management tools, marketing solutions and data analytics to create and promote events that enhance the attendee experience.",
    image: CommunicateWithUs,
    alt: "",
  },
  {
    step: "03",
    title: "Buying tickets",
    body: "We have always had both attendees and organisers at heart. Attendees can buy tickets to the events they want, while organisers create, promote and sell in one place.",
    image: EventsGraphic,
    alt: "",
  },
];

const values = [
  {
    title: "Accessible",
    body: "Built to WCAG 2.2 AA so events are open to everyone.",
    path: "M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM8 12h8M12 8v8",
  },
  {
    title: "Trustworthy",
    body: "Every ticket admits once. Every scan is recorded.",
    path: "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10zM9 12l2 2 4-4",
  },
  {
    title: "Personal",
    body: "Recommendations and invites shaped around real guests.",
    path: "M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z",
  },
];

/** Local initial avatar - no network request, and it uses the live brand token. */
const initials = (name: string) =>
  name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

export default function AboutUs() {
  return (
    <main>
      {/* Alternating bands separate the sections. The two surface tokens are close by design
          (#f5f6fb against #fff), so a hairline border does the actual separating - without
          it the change in fill reads as a rendering artefact rather than a deliberate edge.
          Bands are full-bleed; the inner Container keeps content within the page measure. */}

      {/* Hero - tinted */}
      <div className="relative overflow-hidden border-b border-main-light-grey/60">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(60rem_30rem_at_15%_-10%,rgba(108,92,231,0.14),transparent),radial-gradient(45rem_25rem_at_95%_10%,rgba(108,92,231,0.08),transparent)]"
        />
        <Container>
          <div className="relative flex flex-col-reverse items-center gap-10 px-[5%] py-16 md:flex-row md:gap-14 md:py-24">
            <div className="flex flex-1 flex-col items-center gap-5 text-center md:items-start md:text-left">
              <span className="inline-flex items-center gap-2 rounded-full border border-main-purple/20 bg-main-purple/[0.06] px-3.5 py-1.5 text-xs font-semibold uppercase tracking-wider text-main-purple">
                About TicketFlow
              </span>
              <h1 className="max-w-2xl text-3xl font-bold leading-[1.15] tracking-tight text-main-black sm:text-4xl lg:text-5xl">
                Event experiences that are{" "}
                <span className="text-main-purple">accessible</span>, personal
                and memorable.
              </h1>
              <p className="max-w-xl text-base leading-relaxed text-sec-black/75">
                TicketFlow is an event ticketing and discovery platform built to
                transform the event space. We connect attendees with a wide
                range of events, and give organisers the tools to run them -
                from the first ticket sold to the last guest through the door.
              </p>
            </div>

            <div className="flex w-full flex-1 justify-center">
              <Image
                src={EventsGraphic}
                alt=""
                priority
                className="w-full max-w-md drop-shadow-[0_28px_50px_-24px_rgba(108,92,231,0.55)]"
              />
            </div>
          </div>
        </Container>
      </div>

      {/* Values - white */}
      <div className="border-b border-main-light-grey/60 bg-main-white px-[5%] py-14 md:py-16">
        <Container>
          <div className="grid gap-4 sm:grid-cols-3">
            {values.map((value) => (
              <div
                key={value.title}
                className="rounded-2xl border border-main-light-grey/70 bg-main-white p-5 transition-all duration-300 hover:-translate-y-1 hover:border-main-purple/30 hover:shadow-[0_20px_40px_-24px_rgba(46,50,68,0.4)]"
              >
                <span className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-main-purple/10 text-main-purple">
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
                    <path d={value.path} />
                  </svg>
                </span>
                <h3 className="text-base font-bold text-main-black">
                  {value.title}
                </h3>
                <p className="mt-1 text-sm leading-relaxed text-sec-black/70">
                  {value.body}
                </p>
              </div>
            ))}
          </div>
        </Container>
      </div>

      {/* Core features - page surface */}
      <div className="px-[5%] py-16 md:py-20">
        <Container>
          <div className="mb-12 flex flex-col items-center gap-3 text-center md:mb-16">
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-main-purple">
              What we do
            </span>
            <h2 className="text-2xl font-bold tracking-tight text-main-black sm:text-3xl">
              Our core features
            </h2>
          </div>

          <div className="flex flex-col gap-14 md:gap-20">
            {features.map((feature, i) => (
              <div
                key={feature.step}
                className={`flex flex-col items-center gap-8 md:gap-14 ${i % 2 === 1 ? "md:flex-row-reverse" : "md:flex-row"
                  }`}
              >
                <div className="flex flex-1 flex-col items-center gap-3 text-center md:items-start md:text-left">
                  <span className="text-sm font-bold tabular-nums text-main-purple/50">
                    {feature.step}
                  </span>
                  <h3 className="text-xl font-bold tracking-tight text-main-black sm:text-2xl">
                    {feature.title}
                  </h3>
                  <p className="max-w-lg text-base leading-relaxed text-sec-black/75">
                    {feature.body}
                  </p>
                </div>

                <div className="flex w-full flex-1 justify-center">
                  <Image
                    src={feature.image}
                    alt={feature.alt}
                    className="w-full max-w-sm drop-shadow-[0_24px_44px_-26px_rgba(46,50,68,0.55)]"
                  />
                </div>
              </div>
            ))}
          </div>
        </Container>
      </div>

      {/* Team - white */}
      <div className="border-y border-main-light-grey/60 bg-main-white px-[5%] py-16 md:py-20">
        <Container>
          <div className="mb-10 flex flex-col items-center gap-3 text-center md:mb-14">
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-main-purple">
              The people
            </span>
            <h2 className="text-2xl font-bold tracking-tight text-main-black sm:text-3xl">
              Our team
            </h2>
          </div>

          {/* Five columns at xl so the fifth member is not orphaned onto its own row. */}
          <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-5 md:gap-8">
            {team.map((member) => (
              <div
                key={member.name}
                className="group flex flex-col items-center gap-3 text-center"
              >
                {member.image ? (
                  <Image
                    src={member.image}
                    alt={member.name}
                    className="h-24 w-24 rounded-full object-cover shadow-lg ring-4 ring-main-white transition-transform duration-300 group-hover:-translate-y-1 sm:h-28 sm:w-28"
                  />
                ) : (
                  <span
                    aria-hidden="true"
                    className="flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-main-purple to-[#8b7bf0] text-2xl font-bold text-main-white shadow-lg shadow-main-purple/25 ring-4 ring-main-white transition-transform duration-300 group-hover:-translate-y-1 sm:h-28 sm:w-28 sm:text-3xl"
                  >
                    {initials(member.name)}
                  </span>
                )}
                <div>
                  <h3 className="text-sm font-bold text-main-black sm:text-base">
                    {member.name}
                  </h3>
                  <p className="mt-0.5 text-xs text-sec-black/65 sm:text-sm">
                    {member.role}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Container>
      </div>

      {/* Call to action - page surface */}
      <div className="px-[5%] py-16 md:py-20">
        <Container>
          <SignupSection />
        </Container>
      </div>
    </main>
  );
}
