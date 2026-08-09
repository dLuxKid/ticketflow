import Image from "next/image";
import QRCode from "react-qr-code";

/**
 * The digital ticket — deliberately a visual match for the emailed one
 * (`backend/src/shared/utils/document.js`).
 *
 * A buyer sees this on screen and then again in their inbox; when the two look like
 * different documents, the email reads as a phishing attempt rather than a receipt. Both are
 * now the same object: purple header band, a labelled details grid, a real perforation, and
 * the QR on a tinted panel beneath it. The shared vocabulary is the "soft cotton" palette
 * (#6c5ce7 / #2e3244 / #f5f6fb / #e4e6f1) that the email hard-codes.
 *
 * The QR encodes `ticketId` and nothing else — it is the code the door scanner admits on.
 * It once encoded the buyer's *name*, which meant no ticket could ever be scanned;
 * `digital-ticket.test.tsx` pins that it never regresses.
 */

interface Props {
  ticketBodyDetails: {
    price: number;
    name: string;
    eventName: string;
    startDate: Date;
    startTime: Date;
    eventLocation: locationData;
    eventCategory: string;
    user: { name: string; email: string; photo: string };
    currency: string;
    ticketId: string;
    ticketType?: string;
  };
}

/** One labelled cell of the details grid. Mirrors the email's label/value pairing. */
function Field({
  label,
  value,
  align = "left",
}: {
  label: string;
  value: React.ReactNode;
  align?: "left" | "right";
}) {
  return (
    <div className={align === "right" ? "text-right" : ""}>
      <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#9aa0b5]">
        {label}
      </p>
      <p className="mt-1 text-sm font-bold leading-snug text-[#2e3244] break-words">
        {value}
      </p>
    </div>
  );
}

export default function DigitalTicket({ ticketBodyDetails }: Props) {
  const {
    eventName,
    eventCategory,
    eventLocation,
    startDate,
    startTime,
    currency,
    price,
    ticketId,
    ticketType,
    user,
    name,
  } = ticketBodyDetails;

  // Formatting is character-for-character the same as the emailed ticket
  // (backend/src/shared/utils/document.js) — "12 Sep 2026" and "8:00 AM". A buyer comparing
  // the screen against their inbox should see one document, not two that disagree on the
  // date they are meant to turn up.
  const date = new Date(startDate).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  const time = new Date(startTime).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

  const location = [
    eventLocation?.address,
    eventLocation?.city,
    eventLocation?.state,
    eventLocation?.country,
  ]
    .filter(Boolean)
    .join(", ");

  return (
    <div className="w-[22rem] max-w-full overflow-hidden rounded-[20px] bg-white shadow-xl shadow-[#2e3244]/10 ring-1 ring-[#e4e6f1]">
      {/* Header band — the strongest shared cue with the email. */}
      <div className="relative overflow-hidden bg-main-purple px-6 pb-5 pt-6 text-center">
        {/* Glitter: a fixed, hand-placed scatter of soft white specks, drawn as a pure-CSS
            layer behind the text.
            - Fixed rather than random, so every ticket and every re-render looks identical —
              a ticket is a document, and a document that shuffles its own decoration each
              time it is opened looks unreliable.
            - `pointer-events-none` and `aria-hidden`, so it never intercepts a tap or gets
              announced; it carries no information.
            - Low opacity and blur, so contrast of the white title on purple is untouched. */}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage: [
              "radial-gradient(circle at 12% 22%, rgba(255,255,255,0.55) 0 1.4px, transparent 1.6px)",
              "radial-gradient(circle at 27% 68%, rgba(255,255,255,0.40) 0 1.1px, transparent 1.3px)",
              "radial-gradient(circle at 41% 14%, rgba(255,255,255,0.30) 0 1.8px, transparent 2px)",
              "radial-gradient(circle at 58% 82%, rgba(255,255,255,0.45) 0 1.2px, transparent 1.4px)",
              "radial-gradient(circle at 73% 30%, rgba(255,255,255,0.50) 0 1.5px, transparent 1.7px)",
              "radial-gradient(circle at 86% 62%, rgba(255,255,255,0.35) 0 1.1px, transparent 1.3px)",
              "radial-gradient(circle at 94% 18%, rgba(255,255,255,0.45) 0 1.3px, transparent 1.5px)",
              "radial-gradient(circle at 19% 90%, rgba(255,255,255,0.28) 0 1.6px, transparent 1.8px)",
              "radial-gradient(circle at 66% 50%, rgba(255,255,255,0.25) 0 1px, transparent 1.2px)",
              // A soft top-left sheen, so the specks read as light catching paper rather
              // than as dust sitting on a flat block of colour.
              "radial-gradient(ellipse at 20% -10%, rgba(255,255,255,0.18), transparent 60%)",
            ].join(","),
          }}
        />

        {/* The category is its own element rather than part of a longer sentence: it is the
            one word a holder scans for when several tickets are open side by side. */}
        {/* `relative` lifts the content above the absolutely-positioned glitter layer, which
            would otherwise paint over the title. */}
        <div className="relative">
          <span className="inline-block rounded-full bg-white/15 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-white">
            {eventCategory || "Event"}
          </span>
          <h1 className="mt-2.5 text-xl font-bold leading-tight text-white text-balance">
            {eventName}
          </h1>
          {location && (
            <p className="mt-2 text-xs leading-relaxed text-white/85">
              {location}
            </p>
          )}
        </div>
      </div>

      {/* Details grid */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-4 px-6 pb-4 pt-5">
        <Field label="Name" value={name || "Guest"} />
        <Field label="Date" value={date} align="right" />
        {/* Unlike the email — which has one narrow column and must choose — there is room
            here for both. The holder wants their tier ("VIP"), and the organiser's name is
            what they look for when deciding whether a ticket is genuine. */}
        <Field label="Ticket type" value={ticketType || "Standard"} />
        <Field label="Time" value={time} align="right" />
        <Field label="Organiser" value={user?.name || "TicketFlow"} />
        <Field
          label="Price"
          value={Number(price) > 0 ? `${currency ?? ""} ${price}` : "Free"}
          align="right"
        />
      </div>

      {/* Perforation. The notches are half-circles in the page background colour bleeding
          over the card edge, which is what sells the "torn stub" look — a dashed line on its
          own just reads as a divider. */}
      <div className="relative py-3" aria-hidden="true">
        {/* No ring on the notches: the parent clips them at the card edge, and a ring would
            be clipped too — leaving a stray vertical line where the circle was cut rather
            than a clean bite out of the paper. */}
        <div className="absolute -left-3.5 top-1/2 h-7 w-7 -translate-y-1/2 rounded-full bg-main-grey-bg" />
        <div className="absolute -right-3.5 top-1/2 h-7 w-7 -translate-y-1/2 rounded-full bg-main-grey-bg" />
        <div className="mx-6 border-t-2 border-dashed border-[#e4e6f1]" />
      </div>

      {/* QR panel */}
      <div className="px-6 pb-6 pt-3">
        <div className="rounded-2xl bg-[#f5f6fb] px-4 py-5 text-center">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#9aa0b5]">
            Scan at entry
          </p>

          <div className="mt-3 flex justify-center">
            <div className="rounded-xl bg-white p-3 ring-1 ring-[#e4e6f1]">
              {/* Encodes the ticket ID only — this is the scannable credential. */}
              <QRCode
                size={168}
                value={ticketId}
                fgColor="#2e3244"
                bgColor="#ffffff"
                viewBox="0 0 168 168"
                style={{ height: 168, width: 168 }}
              />
            </div>
          </div>

          <p className="mt-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#9aa0b5]">
            Ticket ID
          </p>
          {/* Monospaced and letter-spaced because this is the string an usher reads aloud or
              types by hand when a camera will not focus — legibility beats elegance here. */}
          <p className="mt-0.5 font-mono text-base font-bold tracking-[0.08em] text-[#2e3244]">
            {ticketId}
          </p>
        </div>

        <p className="mt-4 text-center text-[11px] leading-relaxed text-[#9aa0b5]">
          Keep this ticket safe. It admits <strong>one person once</strong> — a
          second scan will be refused.
        </p>

        <div className="mt-4 flex items-center justify-center gap-2 border-t border-[#e4e6f1] pt-4">
          <Image
            src="/ticketflow-logo.jpg"
            alt=""
            width={120}
            height={40}
            className="h-6 w-auto rounded"
          />
          <span className="text-[11px] font-semibold text-[#9aa0b5]">
            TicketFlow
          </span>
        </div>
      </div>
    </div>
  );
}
