# E2E tests (Playwright)

## Running

```bash
# 1. Start the backend against a disposable test database (never production):
cd ../backend && npm run dev

# 2. Run the E2E suite (starts the frontend dev server itself):
cd ../frontend && npm run test:e2e
```

Override the backend URL if it's not on the default port:

```bash
E2E_API_BASE_URL=http://localhost:4000 E2E_BASE_URL=http://localhost:3000 npm run test:e2e
```

## What's covered

`guest-list.spec.ts` drives the actual browser against a real running backend:

1. Seeds an organiser account and an `invite_only` event through the **real** signup and
   event-creation HTTP API (`e2e/fixtures/seed.ts`) - including a real Cloudinary image
   upload, exactly what the app does.
2. Authenticates the browser by setting the `jwt` cookie directly (the server-side
   equivalent of what login already produces - login itself isn't what this test verifies).
3. Imports a guest by CSV through the real guest-list page and asserts it appears.
4. Asks a natural-language question and asserts the parsed answer renders.
5. Confirms a stranger cannot import guests into another organiser's event (403 surfaces
   as a visible error, not a silent success).

**Deliberately out of scope:** physically scanning a QR code. That mechanism - including
the "two simultaneous scans admit exactly once" concurrency proof - is already covered by
`backend/tests/integration/admission.scan.test.js` at the API/service level, which is a
stronger, more targeted test than simulating a camera scan in a browser would be.

## Known environment limitation (documented, not hidden)

In the sandboxed environment this was authored in (Windows Node operating over a
`\\wsl.localhost` network share), the Playwright package and its Chromium browser binary
were verified to install and download correctly, and the backend server was confirmed to
start and connect to a real database. However, the frontend's own `next` package had a
corrupted install (missing `dist/server/require-hook.js`) from an earlier, unrelated
dependency install on that same shared `node_modules` - a symptom of the broader
Windows/WSL-share npm symlink issues noted throughout this project's implementation
history, not a bug in this test code. A live click-through run could not be completed
there as a result.

This is expected to run cleanly:
- in the GitHub Actions CI workflow (a normal Linux runner, no shared-filesystem symlink
  issues), or
- on any local machine with a normal (non-UNC-path) `npm ci`.

Before relying on a green run here, do a fresh `npm ci` in `frontend/` and confirm
`npm run dev` serves the app on port 3000 first - if that works, this suite should too.
