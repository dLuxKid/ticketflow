import { describe, expect, it } from "vitest";

import { eventTabs } from "./event-tabs";

/**
 * The guest-list tab must appear only for events that actually have a guest list. A public
 * event's guest-list endpoint answers 400, so showing the tab for one offered a link that
 * could only fail - and left the organiser unable to tell "not allowed" from "broken".
 */
describe("eventTabs", () => {
  const labels = (hasGuestList?: boolean) =>
    eventTabs("evt1", "dashboard", hasGuestList).map((t) => t.label);

  it("offers the guest list when the event has one", () => {
    expect(labels(true)).toContain("Guest list");
  });

  it("omits the guest list when the event has none", () => {
    expect(labels(false)).not.toContain("Guest list");
  });

  it("omits the guest list when the caller could not determine it", () => {
    // Fail closed: the workspace lookup returns null on any error, and the default must not
    // resurrect the tab.
    expect(labels()).not.toContain("Guest list");
  });

  it("always offers the other three tools", () => {
    for (const hasGuestList of [true, false]) {
      expect(labels(hasGuestList)).toEqual(
        expect.arrayContaining(["Live dashboard", "Scan tickets", "Door staff"]),
      );
    }
  });

  it("marks only the current tab active, whether or not the guest tab is present", () => {
    for (const hasGuestList of [true, false]) {
      const active = eventTabs("evt1", "scan", hasGuestList).filter(
        (t) => t.active,
      );
      expect(active).toHaveLength(1);
      expect(active[0].label).toBe("Scan tickets");
    }
  });

  it("points the guest tab at this event", () => {
    const tab = eventTabs("evt1", "guests", true).find(
      (t) => t.label === "Guest list",
    );
    expect(tab?.href).toBe("/guest-list/evt1");
    expect(tab?.active).toBe(true);
  });
});
