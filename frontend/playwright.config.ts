import { defineConfig } from "@playwright/test";

/**
 * E2E config (Phase 6).
 *
 * Assumes the backend API is already running and reachable at API_BASE_URL (default
 * http://localhost:4000), pointed at a disposable test database - these tests create real
 * accounts and events through the real HTTP API (including a real Cloudinary upload and a
 * real invite-token generation), so never point this at a production backend.
 *
 * Starts the Next.js dev server itself for the frontend half.
 */
export default defineConfig({
  testDir: "./e2e",
  timeout: 30_000,
  fullyParallel: false, // each test seeds its own event via the real API - keep it simple
  reporter: "list",
  use: {
    baseURL: process.env.E2E_BASE_URL ?? "http://localhost:3000",
    trace: "retain-on-failure",
  },
  webServer: {
    command: "npm run dev",
    url: process.env.E2E_BASE_URL ?? "http://localhost:3000",
    reuseExistingServer: true,
    timeout: 60_000,
  },
});
