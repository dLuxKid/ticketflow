# TicketFlow (with EntryPoint guest-management)

Event ticketing + invite-only guest management: paid tickets, invite-only/hybrid events,
single-use QR invites, an atomic door scanner, a live arrivals dashboard, and AI features
(scan anomaly detection, natural-language guest queries, no-show prediction).

Monorepo: **`backend/`** (Node/Express + MongoDB/Mongoose) and **`frontend/`** (Next.js 15).

---

## Getting it running (fresh clone)

### 1. Prerequisites

- **Node.js 20+** (22 recommended).
- **A MongoDB replica set.** MongoDB **Atlas** (free tier) is the easy path and is a replica
  set by default. This matters: the atomic ticket-purchase and door-check-in use
  transactions, which **throw on a standalone `mongod`** — a plain local Mongo will break
  those flows. Use Atlas, or a local single-node replica set (`mongod --replSet rs0` +
  `rs.initiate()`), or the provided Docker Compose (see below).
- Git.

> **On Windows?** Run everything **inside WSL** on the Linux filesystem
> (`~/Projects/ticketflow`), not from a Windows path like `\\wsl.localhost\...`. Editing/
> installing across that boundary corrupts `node_modules` and breaks file-watching.

### 2. Get the code

```bash
git clone <repo-url> ticketflow
cd ticketflow
git checkout dev
```

### 3. Secrets (the important step)

Secret files are **git-ignored** — they are NOT in the repo. Get them from the team, or
create them:

**`backend/config.env`** — ask a teammate for the shared values, or fill your own:

```
NODE_ENV=development
PORT=4000

# MongoDB connection string. MUST be a replica set (Atlas mongodb+srv works out of the box).
DB=mongodb+srv://<user>:<password>@<cluster>.mongodb.net/ticketflow

JWT_SECRET=<any long random string>
JWT_EXPIRES_IN=90d
JWT_COOKIE_EXPIRES_IN=90

# Image upload (required for creating events — cover images go to Cloudinary):
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

# Email delivery for tickets/invites (Gmail app password). Optional for local dev —
# invite emails fail gracefully, but purchase-ticket emails won't send without it:
GMAIL_HOST=smtp.gmail.com
GMAIL_SERVICE=gmail
GMAIL_PORT=587
GMAIL_EMAIL=
GMAIL_PASSWORD=
EMAIL_FROM=

DEV_FRONTEND_URL=http://localhost:3000

# Only needed to test Paystack payment webhooks:
PAYSTACK_SECRET_KEY=
```

**`frontend/.env.local`** — optional. `NEXT_PUBLIC_BASE_URL` defaults to
`http://localhost:4000`, so you only need this file to point at a different backend:

```
NEXT_PUBLIC_BASE_URL=http://localhost:4000
# Optional (contact form): NEXT_PUBLIC_EMAILJS_PUBLIC_KEY / _SERVICE_ID / _TEMPLATE_ID
```

### 4. Run the backend

```bash
cd backend
npm install
npm run dev          # http://localhost:4000  — should print "DB connection successful"
```

### 5. Run the frontend (in a second terminal)

```bash
cd frontend
npm install
npm run dev          # http://localhost:3000
```

Open http://localhost:3000. Sign up (choose a creator account), create an **Invite-only** or
**Hybrid** event, and the Guest list / Live dashboard / Scan / Door staff links appear on the
event card in **My Events**.

---

## One-time database migrations

Only needed if you are pointing at a database that **already had events/bookings before this
merge** (e.g. the shared dev DB). On a brand-new/empty database they are no-ops and can be
skipped.

```bash
cd backend
npm run migrate:numeric-tickets     # string→number ticket fields
npm run migrate:phase1-backfill     # accessMode / booking status / source defaults
```

---

## Running the tests (optional)

```bash
cd backend
# Unit tests need no database:
node --test "tests/unit/**/*.test.js"

# Full suite (incl. integration) needs a replica-set Mongo — point MONGO_TEST_URI at a
# THROWAWAY test DB, and run sequentially (free-tier Atlas is flaky under parallel load):
MONGO_TEST_URI="mongodb+srv://.../ticketflow_test" node --test --test-concurrency=1 "tests/**/*.test.js"
```

Frontend E2E (Playwright) and the Docker Compose stack are documented in
`frontend/e2e/README.md` and `docs/docker.md`.

---

## Docker alternative (no local Node/Mongo setup)

```bash
cp backend/.env.docker.example backend/.env.docker   # fill in real values
docker compose up --build                            # frontend :3000, backend :4000, mongo replica set
```

See `docs/docker.md` for details.

---

## Docs

- `docs/phase-0-changes-and-tests.md` — change log & test plan
- `docs/accessibility.md` — WCAG pass (scope + findings)
- `docs/innovation-ideas.md` — feature ideas for the assessment
- `IMPLEMENTATION_PROMPT.md` — the full merge design & schema reference
