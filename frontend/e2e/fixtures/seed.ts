/**
 * E2E seeding helpers (Phase 6).
 *
 * Seeds through the REAL backend HTTP API - real signup, real event creation (including a
 * real Cloudinary upload for the required cover image) - rather than writing to MongoDB
 * directly. This keeps the E2E suite honest about exercising the actual API contract, at
 * the cost of leaving real (harmless, clearly-named) rows in whatever database the backend
 * under test is pointed at. Never point E2E_API_BASE_URL at a production backend.
 */

const API_BASE_URL = process.env.E2E_API_BASE_URL ?? "http://localhost:4000";

// A 1x1 transparent PNG, inlined so event creation doesn't depend on a fixture file.
const PLACEHOLDER_COVER_IMAGE =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=";

export type SeededOrganiser = {
  jwt: string;
  eventId: string;
};

/**
 * Signs up a fresh creator account and creates an invite_only event for it. Returns the
 * JWT (to set as the browser's auth cookie) and the created event's id.
 */
export const seedInviteOnlyEvent = async (): Promise<SeededOrganiser> => {
  const unique = Date.now();
  const email = `e2e-organiser-${unique}@example.com`;

  const signupRes = await fetch(`${API_BASE_URL}/api/v1/users/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: "E2E Organiser",
      email,
      password: "e2e-test-password-123",
      passwordConfirm: "e2e-test-password-123",
      role: "creator",
    }),
  });
  if (!signupRes.ok) {
    throw new Error(`E2E seed: signup failed (${signupRes.status}): ${await signupRes.text()}`);
  }
  const { token } = await signupRes.json();

  const now = new Date();
  const later = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  const eventRes = await fetch(`${API_BASE_URL}/api/v1/events/create`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      eventName: `E2E Test Event ${unique}`,
      startDate: later,
      startTime: later,
      endDate: later,
      endTime: later,
      eventDescription: "Seeded by Playwright E2E - safe to delete.",
      eventLocation: {
        address: "1 Test Street",
        city: "Testville",
        state: "Test State",
        country: "Testland",
      },
      eventCategory: "Test",
      salesStartDate: now,
      salesEndDate: later,
      salesStartTime: now,
      salesEndTime: later,
      coverImage: PLACEHOLDER_COVER_IMAGE,
      accessMode: "invite_only",
      ticketDetails: [],
    }),
  });
  if (!eventRes.ok) {
    throw new Error(`E2E seed: event creation failed (${eventRes.status}): ${await eventRes.text()}`);
  }
  const { data } = await eventRes.json();

  return { jwt: token, eventId: data.event._id };
};
