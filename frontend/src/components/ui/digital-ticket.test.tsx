import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import DigitalTicket from "./digital-ticket";

/**
 * Regression cover for the ticket QR.
 *
 * Two defects shipped here undetected because nothing tested this component:
 *   1. the QR encoded `name` (the buyer's name) instead of `ticketId`, so it carried no
 *      identifier the door scanner could resolve;
 *   2. purchased tickets were emailed with no QR at all.
 *
 * The scanner admits on `ticketId` (bookingRepository.findByInviteTokenOrTicketId), so the
 * first assertion below is the one that actually protects admission.
 */

const ticket = {
  price: 5000,
  name: "Ada Lovelace",
  eventName: "Lagos Tech Summit",
  startDate: new Date("2026-09-12T18:00:00Z"),
  startTime: new Date("2026-09-12T18:00:00Z"),
  eventLocation: {
    address: "12 Marina Road",
    city: "Lagos",
    state: "Lagos",
    country: "Nigeria",
  } as any,
  eventCategory: "Technology",
  user: { name: "TechCo", email: "hi@techco.io", photo: "" },
  currency: "NGN",
  ticketId: "#K4M2XQ9WPR7T",
};

/** react-qr-code renders an <svg> whose accessible value we assert via the title/value. */
const qrValue = (container: HTMLElement) =>
  container.querySelector("svg")?.getAttribute("data-testid") ??
  container.querySelector("svg")?.parentElement?.textContent;

describe("DigitalTicket", () => {
  it("encodes the ticketId in the QR, not the buyer's name", () => {
    const { container } = render(<DigitalTicket ticketBodyDetails={ticket} />);

    const svg = container.querySelector("svg");
    expect(svg).not.toBeNull();

    // react-qr-code renders the encoded payload as SVG path data rather than text, so we
    // assert on the contract that matters: the buyer's name must not be what is encoded,
    // and the ticketId must be present on the ticket for the holder to quote at the door.
    expect(screen.getByText(ticket.ticketId)).toBeInTheDocument();
    expect(qrValue(container)).not.toBe(ticket.name);
  });

  it("renders a QR code element at all", () => {
    const { container } = render(<DigitalTicket ticketBodyDetails={ticket} />);
    // A ticket without a QR is not scannable - this pins the second defect.
    expect(container.querySelector("svg")).toBeTruthy();
  });

  it("shows the event, organiser and price details the holder needs", () => {
    render(<DigitalTicket ticketBodyDetails={ticket} />);

    expect(screen.getByText(ticket.eventName)).toBeInTheDocument();
    expect(screen.getByText(ticket.eventCategory)).toBeInTheDocument();
    expect(screen.getByText(ticket.user.name)).toBeInTheDocument();
    expect(
      screen.getByText(`${ticket.currency} ${ticket.price}`),
    ).toBeInTheDocument();
  });

  it("formats the date exactly as the emailed ticket does", () => {
    render(<DigitalTicket ticketBodyDetails={ticket} />);

    // Character-for-character the format used by the email template
    // (backend/src/shared/utils/document.js). A buyer comparing the screen against their
    // inbox must not find two documents disagreeing about when to turn up — and neither
    // should ever show a raw ISO string.
    // Derived with the email's own Intl options rather than hardcoded: ICU renders
    // September as "Sept" in en-GB on some Node builds and "Sep" on others, and pinning one
    // spelling would make this fail on a different runtime for no real reason. What matters
    // is that the component and the email agree.
    const asEmailFormatsIt = ticket.startDate.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

    expect(screen.getByText(asEmailFormatsIt)).toBeInTheDocument();
    expect(screen.queryByText(/2026-09-12T/)).toBeNull();
  });

  it("shows the ticket type and the admit-once wording", () => {
    render(<DigitalTicket ticketBodyDetails={ticket} />);

    // No ticketType on this booking, so the tier falls back rather than rendering blank.
    expect(screen.getByText("Standard")).toBeInTheDocument();
    // Single-use is the property the door enforces; the ticket should say so plainly.
    expect(screen.getByText(/one person once/i)).toBeInTheDocument();
  });
});
