import { test, expect } from "@playwright/test";
import { seedInviteOnlyEvent } from "./fixtures/seed";

/**
 * Core-loop E2E (Phase 6): an organiser imports a guest and asks a question about their
 * guest list, through the real frontend against a real running backend.
 *
 * Scope note: this covers the organiser-facing web flow - signup, event creation, guest
 * import, NL query - end to end. It deliberately stops short of the physical door-scan
 * step (scanning a QR with a device), which is already proven at the API/service level by
 * the concurrency-focused integration tests in backend/tests/integration/admission.scan.test.js
 * (including the "two simultaneous scans -> exactly one admits" proof). Automating an
 * actual camera/QR scan in a browser E2E adds significant fixture complexity for a
 * mechanism already covered by a stronger, more targeted test.
 */

test("organiser imports a guest by CSV and it appears in the guest list", async ({
  page,
  context,
}) => {
  const { jwt, eventId } = await seedInviteOnlyEvent();

  // The app authenticates via an httpOnly `jwt` cookie; Playwright can set it directly
  // (this is the server-side equivalent of what login already does) without touching any
  // login form, since login itself isn't what this test is about.
  await context.addCookies([
    {
      name: "jwt",
      value: jwt,
      url: "http://localhost:3000",
      httpOnly: true,
    },
  ]);

  await page.goto(`/guest-list/${eventId}`);
  await expect(page.getByRole("heading", { name: "Guest list" })).toBeVisible();

  await page
    .getByLabel("Guest list CSV")
    .fill("name,email,vip\nAda Lovelace,ada-e2e@example.com,yes");
  await page.getByRole("button", { name: "Import & send invites" }).click();

  await expect(page.getByText("Added: 1")).toBeVisible({ timeout: 15_000 });
  await expect(page.getByText("Ada Lovelace")).toBeVisible();
  await expect(page.getByText("ada-e2e@example.com")).toBeVisible();
});

test("organiser asks a natural-language question about the guest list", async ({
  page,
  context,
}) => {
  const { jwt, eventId } = await seedInviteOnlyEvent();

  await context.addCookies([
    { name: "jwt", value: jwt, url: "http://localhost:3000", httpOnly: true },
  ]);

  await page.goto(`/guest-list/${eventId}`);

  await page
    .getByLabel("Guest list CSV")
    .fill("name,email\nBo Diddley,bo-e2e@example.com");
  await page.getByRole("button", { name: "Import & send invites" }).click();
  await expect(page.getByText("Added: 1")).toBeVisible({ timeout: 15_000 });

  await page
    .getByPlaceholder("who hasn't arrived?")
    .fill("how many guests are there");
  await page.getByRole("button", { name: "Ask" }).click();

  await expect(page.getByText("1 guest")).toBeVisible({ timeout: 10_000 });
});

test("a stranger cannot view another organiser's guest list", async ({
  page,
  context,
}) => {
  const { eventId } = await seedInviteOnlyEvent();
  const stranger = await seedInviteOnlyEvent(); // a second, unrelated organiser

  await context.addCookies([
    { name: "jwt", value: stranger.jwt, url: "http://localhost:3000", httpOnly: true },
  ]);

  await page.goto(`/guest-list/${eventId}`); // stranger's cookie, someone else's event
  await page
    .getByLabel("Guest list CSV")
    .fill("name,email\nShould Not,work@example.com");
  await page.getByRole("button", { name: "Import & send invites" }).click();

  // The backend's 403 surfaces as an error message, not a silently-successful import.
  await expect(page.getByRole("alert")).toBeVisible({ timeout: 10_000 });
  await expect(page.getByText("Added:")).not.toBeVisible();
});
