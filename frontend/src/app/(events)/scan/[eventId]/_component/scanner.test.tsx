import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const scanTicket = vi.fn();
vi.mock("@/utils/actions", () => ({ scanTicket: (...a: any[]) => scanTicket(...a) }));
vi.mock("@/components/ui/page-header", () => ({ default: () => null }));
vi.mock("@/utils/event-tabs", () => ({ eventTabs: () => [] }));

import Scanner from "./scanner";

/**
 * The capacity override is a safety control: it lets door staff exceed the venue's safe
 * occupancy, so it must be deliberate, attributable, and impossible to trigger by accident.
 * These tests pin that behaviour - that the prompt appears only for `at_capacity`, that
 * nothing is admitted until a human confirms, and that declining admits no one.
 *
 * jsdom provides no BarcodeDetector, so the component renders in manual-entry mode, which
 * is the path being exercised here.
 */

const enterCode = async (code: string) => {
  const user = userEvent.setup();
  await user.type(screen.getByLabelText(/ticket code/i), code);
  await user.click(screen.getByRole("button", { name: /^admit$/i }));
  return user;
};

describe("Scanner - capacity override", () => {
  beforeEach(() => scanTicket.mockReset());

  it("offers an override when the venue is at capacity", async () => {
    scanTicket.mockResolvedValue({
      status: "fail",
      code: "at_capacity",
      message: "The venue has reached its safe capacity.",
    });

    render(<Scanner eventId="e1" />);
    await enterCode("#K4M2XQ9WPR7T");

    expect(await screen.findByRole("alertdialog")).toBeInTheDocument();
    expect(screen.getByText(/venue at capacity/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /override and admit/i }),
    ).toBeInTheDocument();
  });

  it("admits no one until the override is confirmed", async () => {
    scanTicket.mockResolvedValue({ status: "fail", code: "at_capacity", message: "full" });

    render(<Scanner eventId="e1" />);
    await enterCode("#K4M2XQ9WPR7T");
    await screen.findByRole("alertdialog");

    // One call only - the refusal. Nothing was admitted by showing the prompt.
    expect(scanTicket).toHaveBeenCalledTimes(1);
    expect(scanTicket).toHaveBeenCalledWith("#K4M2XQ9WPR7T", undefined, false);
    expect(screen.queryByText(/✓ Admitted/)).not.toBeInTheDocument();
  });

  it("re-sends the same code with the override flag once confirmed", async () => {
    scanTicket
      .mockResolvedValueOnce({ status: "fail", code: "at_capacity", message: "full" })
      .mockResolvedValueOnce({
        status: "success",
        data: { booking: { name: "Ada Lovelace", ticketType: "VIP" } },
      });

    render(<Scanner eventId="e1" />);
    const user = await enterCode("#K4M2XQ9WPR7T");

    await user.click(
      await screen.findByRole("button", { name: /override and admit/i }),
    );

    await waitFor(() =>
      expect(scanTicket).toHaveBeenLastCalledWith("#K4M2XQ9WPR7T", undefined, true),
    );
    expect(await screen.findByText(/admitted over capacity/i)).toBeInTheDocument();
    expect(screen.getByText(/recorded as a capacity override/i)).toBeInTheDocument();
  });

  it("admits nobody when the supervisor declines", async () => {
    scanTicket.mockResolvedValue({ status: "fail", code: "at_capacity", message: "full" });

    render(<Scanner eventId="e1" />);
    const user = await enterCode("#K4M2XQ9WPR7T");
    await user.click(await screen.findByRole("button", { name: /do not admit/i }));

    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
    expect(scanTicket).toHaveBeenCalledTimes(1);
  });

  it("does not offer an override for refusals where it would be meaningless", async () => {
    // An already-admitted ticket is not a capacity problem; overriding it makes no sense.
    scanTicket.mockResolvedValue({
      status: "fail",
      message: "This ticket has already been admitted",
    });

    render(<Scanner eventId="e1" />);
    await enterCode("#K4M2XQ9WPR7T");

    expect(await screen.findByText(/already been admitted/i)).toBeInTheDocument();
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
  });
});
