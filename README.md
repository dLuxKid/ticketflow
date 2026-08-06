# TicketFlow (with EntryPoint guest-management)

[![CI](https://github.com/dLuxKid/ticketflow/actions/workflows/ci.yml/badge.svg?branch=dev)](https://github.com/dLuxKid/ticketflow/actions/workflows/ci.yml)

Event ticketing + invite-only guest management: paid tickets, invite-only/hybrid events,
single-use QR invites, an atomic door scanner, a live arrivals dashboard, a Meet-and-Greet
attendee network, and AI features (an LLM concierge chatbot, scan anomaly detection,
natural-language guest queries, no-show prediction).

Monorepo: **`backend/`** (Node/Express + MongoDB/Mongoose) and **`frontend/`** (Next.js 15).

---

## Getting it running (fresh clone)

### 1. Prerequisites

- **Node.js 20+** (22 recommended; CI runs 22).
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

# Email delivery for tickets, invites and networking OTP codes (Gmail app password).
# Optional for local dev — invite emails fail gracefully, but purchase-ticket emails and
# guest networking access codes won't send without it:
GMAIL_HOST=smtp.gmail.com
GMAIL_SERVICE=gmail
GMAIL_PORT=587
GMAIL_EMAIL=
GMAIL_PASSWORD=
EMAIL_FROM=

DEV_FRONTEND_URL=http://localhost:3000

# Only needed to test Paystack payment webhooks:
PAYSTACK_SECRET_KEY=

# AI concierge chatbot. OpenAI is tried first, Gemini is the fallback; with neither key set
# the chatbot degrades to a canned reply rather than erroring:
OPENAI_API_KEY=
GEMINI_API_KEY=

# Rate limiting (defaults: 100 requests per 1h per IP across /api). Raise it for load
# testing — the default flatlines a load run at HTTP 429 within seconds:
RATE_LIMIT_MAX=100
RATE_LIMIT_WINDOW_MS=3600000
```

Weather/dress-code advice uses **Open-Meteo**, which needs no API key.

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

### 6. Create the first admin (optional)

Signup only ever grants `user` or `creator` — the role field in a signup request is ignored,
so an admin cannot be self-registered. Promote an existing account from the CLI:

```bash
cd backend
npm run seed:admin -- --email you@example.com --name "Your Name"
```

The account must already exist (sign up first). `--force` re-points root admin at a different
account if one is already seeded.

That account becomes the **root admin**: it can promote and demote other admins, and cannot
itself be demoted or deleted through the API.

---

## Roles

| Role      | Can do                                                                                          |
| --------- | ----------------------------------------------------------------------------------------------- |
| `user`    | Buy tickets, view own tickets, join Meet and Greet for events they hold a booking for            |
| `creator` | Everything a user can, plus create/edit events, guest lists, door staff, live dashboard, scanner |
| `usher`   | Scan and admit for the specific events they are assigned to (and nothing else)                   |
| `admin`   | See and manage all events and all users; change roles; archive events; deactivate users          |

---

## One-time database migrations

Only needed if you are pointing at a database that **already had events/bookings before this
merge** (e.g. the shared dev DB). On a brand-new/empty database they are no-ops and can be
skipped.

```bash
cd backend
npm run migrate:numeric-tickets     # string→number ticket fields
npm run migrate:phase1-backfill     # accessMode / booking status / source defaults
npm run migrate:ticket-ids          # server-side scannable ticketIds for old bookings
```

---

## Running the tests

```bash
cd backend
npm run test:unit    # 154 unit tests, no database required

# Full suite (incl. integration) needs a replica-set Mongo — point MONGO_TEST_URI at a
# THROWAWAY test DB, and run sequentially (free-tier Atlas is flaky under parallel load):
MONGO_TEST_URI="mongodb+srv://.../ticketflow_test" node --test --test-concurrency=1 "tests/**/*.test.js"
```

```bash
cd frontend
npm run test         # Vitest + React Testing Library component tests
npm run test:e2e     # Playwright end-to-end journeys (needs the stack running)
```

### Coverage

Coverage is **measured but not gated** — there is deliberately no failing threshold. A
minimum set before the baseline is known either sits so low it asserts nothing or breaks the
build on day one; the number is published first, and a floor can be set under it once it is
trusted.

```bash
cd backend
npm run test:coverage        # human-readable table
npm run test:coverage:lcov   # writes coverage/lcov.info
```

```bash
cd frontend
npm run test:coverage        # text + lcov + json-summary in coverage/
```

Current baseline (unit tests only):

| Suite    | Lines  | Branches | Functions |
| -------- | ------ | -------- | --------- |
| Backend  | 73.04% | 84.83%   | 35.39%    |
| Frontend | 2.22%  | 16.00%   | 7.31%     |

The backend number is the meaningful one: the domain logic that decides money, admission and
authorisation lives there and is covered by pure-function unit tests. The frontend figure is
low because Vitest currently covers two components — the bulk of the UI is exercised by
Playwright end-to-end instead, and E2E runs are not counted in this figure.

### Load testing

```bash
cd backend
RATE_LIMIT_MAX=100000 npm run dev   # in one terminal — the default limit would 429 the run
npm run load:test                   # in another
```

Measured on the development machine: **88.4 req/s** on the event list and **51.3 req/s** on
event detail, with no errors. See `docs/quality-model-iso25010.md` §2 for the full figures
and how they map to the performance-efficiency characteristic.

---

## Quality gate (CI)

`.github/workflows/ci.yml` runs on every push and PR to **`main` and `dev`**:

- **Backend** — `npm ci` → **lint** → start a single-node MongoDB replica set → full test
  suite (unit + integration, sequential) → coverage (non-blocking) → upload `lcov.info`.
- **Frontend** — `npm ci` → **typecheck** (`tsc --noEmit`) → **lint** → Vitest with coverage
  → upload `lcov.info`.

Lint, typecheck and tests are blocking; coverage is measurement only.

---

## Docker alternative (no local Node/Mongo setup)

```bash
cp backend/.env.docker.example backend/.env.docker   # fill in real values
docker compose up --build                            # frontend :3000, backend :4000, mongo replica set
```

See `docs/docker.md` for details.

---

## Docs

| Document                                                       | What it covers                                                     |
| -------------------------------------------------------------- | ------------------------------------------------------------------ |
| [`docs/technical-documentation.md`](docs/technical-documentation.md) | Full system reference: features, architecture, API, data model, security |
| [`docs/design-models.md`](docs/design-models.md)                | State machines, sequence, package and class diagrams                |
| [`docs/architecture-diagram.md`](docs/architecture-diagram.md)  | Layered / deployment architecture                                   |
| [`docs/use-case-diagram.md`](docs/use-case-diagram.md)          | Actors and use cases                                                |
| [`docs/data-flow-diagram.md`](docs/data-flow-diagram.md)        | DFD levels 0–1                                                      |
| [`docs/quality-model-iso25010.md`](docs/quality-model-iso25010.md) | ISO/IEC 25010 evidence map                                       |
| [`docs/usability-test-plan.md`](docs/usability-test-plan.md)    | Usability test protocol and tasks                                   |
| [`docs/agile-sprint-plan.md`](docs/agile-sprint-plan.md)        | Sprints, backlog and per-member contribution                        |
| [`docs/accessibility.md`](docs/accessibility.md)                | WCAG pass (scope + findings)                                        |
| [`docs/docker.md`](docs/docker.md)                              | Container stack                                                     |
| [`docs/phase-0-changes-and-tests.md`](docs/phase-0-changes-and-tests.md) | Change log & test plan                                     |
| [`docs/innovation-ideas.md`](docs/innovation-ideas.md)          | Feature ideas for the assessment                                    |
| `IMPLEMENTATION_PROMPT.md`                                      | The full merge design & schema reference                            |
