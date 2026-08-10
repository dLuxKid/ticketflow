# TicketFlow

[![CI](https://github.com/dLuxKid/ticketflow/actions/workflows/ci.yml/badge.svg?branch=dev)](https://github.com/dLuxKid/ticketflow/actions/workflows/ci.yml)
[![codecov](https://codecov.io/gh/dLuxKid/ticketflow/branch/dev/graph/badge.svg)](https://codecov.io/gh/dLuxKid/ticketflow)

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
  transactions, which **throw on a standalone `mongod`** - a plain local Mongo will break
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

Secret files are **git-ignored** - they are NOT in the repo. Get them from the team, or
create them:

**`backend/config.env`** - ask a teammate for the shared values, or fill your own:

```
NODE_ENV=development
PORT=4000

# MongoDB connection string. MUST be a replica set (Atlas mongodb+srv works out of the box).
DB=mongodb+srv://<user>:<password>@<cluster>.mongodb.net/ticketflow

JWT_SECRET=<any long random string>
JWT_EXPIRES_IN=90d
JWT_COOKIE_EXPIRES_IN=90

# Image upload (required for creating events - cover images go to Cloudinary):
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

# Email delivery for tickets, invites and networking OTP codes (Gmail app password).
# Optional for local dev - invite emails fail gracefully, but purchase-ticket emails and
# guest networking access codes won't send without it:
GMAIL_HOST=smtp.gmail.com
GMAIL_SERVICE=gmail
GMAIL_PORT=587
GMAIL_EMAIL=
GMAIL_PASSWORD=
EMAIL_FROM=

DEV_FRONTEND_URL=http://localhost:3000

# Payments. BOTH keys are now required to sell paid tickets: the secret key verifies
# charges and creates organiser payout subaccounts, and the public key is sent to the
# browser by the server (it is no longer hard-coded in the frontend bundle).
PAYSTACK_SECRET_KEY=
PAYSTACK_PUBLIC_KEY=

# Platform fee taken from each paid ticket, as a percentage. Default 3.
PLATFORM_FEE_PERCENT=3

# Currency used for events that do not specify one. Must be one Paystack can settle:
# NGN, GHS, ZAR, KES, USD or XOF. Default NGN.
DEFAULT_CURRENCY=NGN

# AI concierge chatbot. OpenAI is tried first, Gemini is the fallback; with neither key set
# the chatbot degrades to a canned reply rather than erroring:
OPENAI_API_KEY=
GEMINI_API_KEY=

# Rate limiting (defaults: 100 requests per 1h per IP across /api). Raise it for load
# testing - the default flatlines a load run at HTTP 429 within seconds:
RATE_LIMIT_MAX=100
RATE_LIMIT_WINDOW_MS=3600000
```

Weather/dress-code advice uses **Open-Meteo**, which needs no API key.

**`frontend/.env.local`** - optional. `NEXT_PUBLIC_BASE_URL` defaults to
`http://localhost:4000`, so you only need this file to point at a different backend:

```
NEXT_PUBLIC_BASE_URL=http://localhost:4000
# Optional (contact form): NEXT_PUBLIC_EMAILJS_PUBLIC_KEY / _SERVICE_ID / _TEMPLATE_ID
```

### 4. Run the backend

```bash
cd backend
npm install
npm run dev          # http://localhost:4000  - should print "DB connection successful"
```

### 5. Run the frontend (in a second terminal)

```bash
cd frontend
npm install
npm run dev          # http://localhost:3000
```

Open http://localhost:3000. Sign up (choose a creator account) and create an event. The
Live dashboard / Scan / Door staff links appear on its card in **My Events**.

**Guest list appears only on Invite-only and Hybrid events.** A public event has no guest
list - everyone attending it holds a ticket - so the link is not offered and the API refuses
guest-list calls for one. Create an Invite-only or Hybrid event to see it.

### 6. Create the first admin (optional)

Signup only ever grants `user` or `creator` - the role field in a signup request is ignored,
so an admin cannot be self-registered. Promote an existing account from the CLI:

```bash
cd backend
npm run seed:admin -- --email you@example.com --name "Your Name"
```

The account must already exist (sign up first). `--force` re-points root admin at a different
account if one is already seeded.

That account becomes the **root admin**: it can promote and demote other admins, and cannot
itself be demoted or deleted through the API.

### 7. Seed demo data (optional)

Fills an empty database with a browsable catalogue - useful for a demo recording, and
required before a usability-testing session, where every participant must meet the same app
(see [`docs/usability-test-plan.md`](docs/usability-test-plan.md) §5).

```bash
cd backend
npm run seed:usability
```

It creates three accounts - all with the password `usability-test-1234` - and twelve events,
each chosen to put a different state on screen:

| Account                    | Role    | Use it for                                  |
| -------------------------- | ------- | ------------------------------------------- |
| `organiser@usability.test` | creator | guest lists, live dashboard, event admin    |
| `usher@usability.test`     | usher   | door scanning (assigned to the live events) |
| `attendee@usability.test`  | user    | already holds paid tickets                  |

The catalogue covers upcoming, **live right now**, past and sold-out events; public,
invite-only and hybrid access; free and paid tiers; Lagos (NGN) and Coventry/Birmingham
(USD). Two events are live as you run it, so the arrivals dashboard, door scanning and Meet
and Greet are all reachable - and one of them already has paid bookings with two guests
admitted, so the dashboard shows real numbers rather than zeros. The command prints a
session card with the logins and the invite codes to scan.

Re-run it between participants to restore an identical starting state:

```bash
npm run seed:usability -- --reset
```

Everything it creates is tagged with the `@usability.test` email domain, and `--reset`
deletes only what matches that - but it is still a destructive command, so **never point it
at a production database**. A plain re-run refuses rather than duplicating data.

> **Paying for a seeded event:** the UK events are priced in **USD**, not GBP — Paystack
> cannot settle GBP at all, so the Event schema refuses it and a GBP event could never sell a
> ticket. The UK event intended to be bought is **free**, so it confirms without opening
> Paystack. Point a "buy a ticket" task at *Coventry Student Welcome Fair*, or at a naira event.

---

## How the money works

TicketFlow takes a **3% platform fee** on each paid ticket, using Paystack **split payments**.
The buyer pays the advertised ticket price; Paystack settles the organiser's share directly
into the organiser's own subaccount and the platform's fee into the main account, in the same
transaction. **TicketFlow never holds an organiser's money.**

- The organiser also bears Paystack's own processing fee (`bearer: "subaccount"`), so the
  platform's margin is exactly 3% and does not shrink as gateway pricing changes.
- The fee is **rounded down**, never up.
- Ticket prices are **server-authoritative**: the price and currency written to a booking come
  from the event's own ticket tiers, and the amount actually charged is verified against them
  before tickets are issued. The client chooses *what* to buy, never what it costs.

### Currencies

Ticket prices are charged in a currency the payment provider can actually settle:
**NGN, GHS, ZAR, KES, USD, XOF**. The organiser picks it explicitly when creating or editing
an event, and the Event schema refuses anything else.

This is a provider constraint, not a preference. Currency used to be derived from the event's
country — UK → GBP, Germany/France → EUR — and Paystack settles neither, so those events
could never sell a ticket: the charge is rejected at the gateway *after* the buyer commits.
Choosing the country now only *suggests* a default.

### What the buyer is charged

The advertised ticket price, and nothing else. There is **no booking fee added at checkout** —
the 3% comes out of the organiser's settlement.

Until recently the checkout page ran the total through a legacy "5% + 100" markup, displaying
₦5,380 for a ₦5,000 ticket while Paystack charged the true ₦5,000. The page was quoting a
price nobody was charging; that markup is gone.

### Revenue reporting

**Profile → Revenue.** Organisers see gross, the platform fee deducted, and their net, with a
daily earnings trend. Admins get a **My events / Platform** switch:

- *My events* — what they are owed for events they organise themselves.
- *Platform* — **TicketFlow's own income, which is the 3% fee alone.** Gross belongs to
  organisers and net is paid away to them, so reporting either as platform revenue would
  overstate it by more than an order of magnitude.

The scope is enforced server-side: a non-admin requesting the platform view gets a 403.

### Organisers must connect a payout account

A paid event **cannot sell tickets until its organiser has connected a bank account** - checkout
refuses with a clear message. This is deliberate: the alternative is charging buyers and
settling the whole amount into the platform account, invisible to everyone. Free events are
unaffected.

Organisers connect an account at **Profile → Payouts**: pick a bank, enter the account number,
confirm the name it resolves to, done. TicketFlow stores only the last four digits and an
opaque Paystack reference - never the full account number.

### Testing payments

Paystack **test mode only accepts test cards** - a real card number is declined against a
`pk_test_` key, so nothing can be charged by accident. The standard success card, which
completes immediately with no PIN or OTP step:

| Field | Value |
| ----- | ----- |
| Card number | `4084 0840 8408 4081` |
| Expiry | any future date (e.g. `12/30`) |
| CVV | `408` |
| PIN / OTP | any (e.g. `0000` / `123456`) if prompted |

Paystack also publishes cards that simulate declines, insufficient funds and the full
PIN + OTP flow - useful for checking that a failed payment releases the held seats. The
current list is at
[paystack.com/docs/payments/test-payments](https://paystack.com/docs/payments/test-payments).

For **payout onboarding** in test mode, account number `0000000000` with any bank generally
resolves; a real account number may not resolve under a test key.

> **Both keys must come from the same Paystack account and the same mode.** A `sk_test_` key
> can only verify `pk_test_` transactions. If they are mismatched, every payment will be
> charged in the popup and then refused at confirmation with *"Payment could not be
> verified"* - which is the most likely cause of that error.

> **Upgrading an existing deployment:** every organiser with paid events needs to complete
> payout onboarding, and `PAYSTACK_PUBLIC_KEY` must be set, or their events will stop selling.

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
npm run test:unit    # unit tests, no database required

# Full suite (incl. integration) needs a replica-set Mongo - point MONGO_TEST_URI at a
# THROWAWAY test DB, and run sequentially (free-tier Atlas is flaky under parallel load):
MONGO_TEST_URI="mongodb+srv://.../ticketflow_test" node --test --test-concurrency=1 "tests/**/*.test.js"
```

```bash
cd frontend
npm run test         # Vitest + React Testing Library component tests
npm run test:e2e     # Playwright end-to-end journeys (needs the stack running)
```

### Coverage

Coverage is **measured but not gated** - there is deliberately no failing threshold. A
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
| Backend  | 72.66% | 85.28%   | 38.15%    |
| Frontend | 2.16%  | 16.56%   | 7.75%     |

The backend number is the meaningful one: the domain logic that decides money, admission and
authorisation lives there and is covered by pure-function unit tests. The frontend figure is
low because Vitest currently covers two components - the bulk of the UI is exercised by
Playwright end-to-end instead, and E2E runs are not counted in this figure.

**The badge is a combined figure.** CI reports both `lcov.info` files to
[Codecov](https://codecov.io/gh/dLuxKid/ticketflow) under separate flags (`backend` and
`frontend`), so the badge blends the two and will read well below the backend's ~73%. The
per-suite table above is the honest breakdown; read the badge as "coverage exists and is
tracked", not as a quality score.

**Codecov publishing is opt-in.** Both upload steps are skipped unless a `CODECOV_TOKEN`
repository secret is set:

1. Sign in at [codecov.io](https://codecov.io) with GitHub and add the repository.
2. Copy the upload token it gives you.
3. GitHub → **Settings → Secrets and variables → Actions → New repository secret**, named
   `CODECOV_TOKEN`.

Without it the steps are cleanly skipped rather than failing, and `lcov.info` is still
uploaded as a build artifact either way — only the publication is optional. Both steps are
`continue-on-error` with `fail_ci_if_error: false`, so a Codecov outage can never fail a
build.

> Adding the repo on Codecov and creating the secret both need **admin** rights on the
> repository. If you only have contributor access, the owner has to do those steps — the CI
> wiring is already in place and starts working the moment the secret exists.

### Load testing

```bash
cd backend
RATE_LIMIT_MAX=100000 npm run dev   # in one terminal - the default limit would 429 the run
npm run load:test                   # in another
```

Measured on the development machine: **88.4 req/s** on the event list and **51.3 req/s** on
event detail, with no errors. See `docs/quality-model-iso25010.md` §2 for the full figures
and how they map to the performance-efficiency characteristic.

---

## Quality gate (CI)

`.github/workflows/ci.yml` runs on every push and PR to **`main` and `dev`**:

- **Backend** - `npm ci` → **lint** → start a single-node MongoDB replica set → full test
  suite (unit + integration, sequential) → coverage (non-blocking) → upload `lcov.info`.
- **Frontend** - `npm ci` → **typecheck** (`tsc --noEmit`) → **lint** → Vitest with coverage
  → upload `lcov.info`.

Lint, typecheck and tests are blocking; coverage and its publication are measurement only.

### Container images (CD)

A fourth job, **Publish container images**, runs on pushes to `main` only and only after both
test jobs pass. It builds `backend/Dockerfile` and `frontend/Dockerfile` and pushes them to
the GitHub Container Registry:

```
ghcr.io/<owner>/ticketflow-backend:latest   (and :sha-<commit>)
ghcr.io/<owner>/ticketflow-frontend:latest  (and :sha-<commit>)
```

This **packages** the app; it does not deploy it. Nothing pulls and runs these images
automatically - there is no hosting target configured - so "published to a registry" is the
accurate claim, not "running in production".

Three things worth knowing:

- **It never runs on a pull request.** A PR can contain unreviewed code, and giving it a
  token with `packages: write` would let it publish images under this repository's name.
- **Pin the SHA tag, not `latest`.** `latest` is ambiguous the moment two builds exist.
- **The frontend image is environment-specific.** `NEXT_PUBLIC_BASE_URL` is inlined into the
  bundle by `next build`, so the API URL is baked into the image and cannot be changed at run
  time. Set a `NEXT_PUBLIC_BASE_URL` repository variable to your target API URL before
  relying on the image, or it will call `http://localhost:4000`. The backend image has no
  such constraint - it reads all configuration from the environment at start-up.

No extra secret is needed: the job requests `packages: write` and uses the built-in
`GITHUB_TOKEN`.

---

## Command reference

Every command below runs from `backend/` unless the table says otherwise. Anything touching
the database reads `DB` from `backend/config.env`, so check which database that points at
before running a destructive one.

### Running the app

| Command                    | Where      | What it does                                 |
| -------------------------- | ---------- | -------------------------------------------- |
| `npm run dev`              | `backend`  | API on :4000 with reload                     |
| `npm start`                | `backend`  | API without reload (production entry point)  |
| `npm run dev`              | `frontend` | Next.js on :3000                             |
| `npm run build` / `start`  | `frontend` | Production build, then serve it              |
| `docker compose up --build`| repo root  | Whole stack + a Mongo replica set            |

### Seeding

| Command                                        | What it does                                            |
| ---------------------------------------------- | ------------------------------------------------------- |
| `npm run seed:admin -- --email you@example.com` | Promotes (or creates) the root admin - see step 6        |
| `npm run seed:usability`                        | Twelve demo events + three accounts - see step 7         |
| `npm run seed:usability -- --reset`             | Wipes the seeded data and recreates it identically       |

### Scheduled jobs

These are the recurring operations. Nothing schedules them for you except the reservation
sweep, which the API runs in-process every five minutes; point cron, a GitHub Actions
schedule, or any external scheduler at the rest.

| Command                        | What it does                                                                                      |
| ------------------------------ | ------------------------------------------------------------------------------------------------- |
| `npm run notify:event-live`    | **Triggers networking.** Emails every attendee of every currently-live event their Meet-and-Greet link |
| `npm run reservations:release` | Returns seats held by checkouts that were abandoned or never paid                                   |
| `npm run gdpr:sweep`           | Anonymises guest/buyer PII for events past the retention window                                     |

> `notify:event-live` **re-sends on every run** - there is no "already notified" gate (see
> `networkingNotificationService.js` for why). Run it once when you want the emails to go
> out; a short cron interval will mail your attendees repeatedly.

### Tests and quality

| Command                       | Where      | What it does                                             |
| ----------------------------- | ---------- | -------------------------------------------------------- |
| `npm run test:unit`           | `backend`  | Unit tests, no database needed                           |
| `npm test`                    | `backend`  | Full suite - needs `MONGO_TEST_URI` on a replica set      |
| `npm run test:coverage`       | both       | Coverage report                                          |
| `npm test`                    | `frontend` | Vitest component tests                                   |
| `npm run test:e2e`            | `frontend` | Playwright journeys (needs the stack running)            |
| `npm run lint` / `lint:fix`   | both       | ESLint                                                   |
| `npm run format`              | `backend`  | Prettier                                                 |
| `npm run load:test`           | `backend`  | Load run - raise `RATE_LIMIT_MAX` first, or it 429s       |

### Model and feature evaluations

These print the measured figures quoted in the report. The first two are deterministic and
need nothing but Node; the chatbot one needs a real LLM key and self-skips without one.

| Command                        | What it reports                                            |
| ------------------------------ | ---------------------------------------------------------- |
| `node scripts/eval-anomaly.js` | Scan-anomaly precision / recall / F1 + confusion matrix     |
| `node scripts/eval-nlquery.js` | Natural-language guest-query exact-match accuracy           |
| `npm run eval:chatbot`         | Chatbot tool-selection accuracy (needs `OPENAI_API_KEY`)    |

### Migrations

One-time, and no-ops on a fresh database - see [One-time database migrations](#one-time-database-migrations).

---

## Docker alternative (no local Node/Mongo setup)

```bash
cp backend/.env.docker.example backend/.env.docker   # fill in real values
docker compose up --build                            # frontend :3000, backend :4000, mongo replica set
```


---

## Docs

| Document                                                       | What it covers                                                     |
| -------------------------------------------------------------- | ------------------------------------------------------------------ |
| [`docs/feature-testing-guide.md`](docs/feature-testing-guide.md) | **Every feature and how to test it by hand** - also the demo script |
| [`docs/technical-documentation.md`](docs/technical-documentation.md) | Full system reference: features, architecture, API, data model, security |
| [`docs/design-models.md`](docs/design-models.md)                | State machines, sequence, package and class diagrams                |
| [`docs/architecture-diagram.md`](docs/architecture-diagram.md)  | Layered / deployment architecture                                   |
| [`docs/use-case-diagram.md`](docs/use-case-diagram.md)          | Actors and use cases                                                |
| [`docs/data-flow-diagram.md`](docs/data-flow-diagram.md)        | DFD levels 0–1                                                      |
| [`docs/diagrams/`](docs/diagrams/README.md)                     | **Rendered PNG/SVG of every diagram**, plus the Graphviz sources     |
| [`docs/quality-model-iso25010.md`](docs/quality-model-iso25010.md) | ISO/IEC 25010 evidence map                                       |
| [`docs/usability-test-plan.md`](docs/usability-test-plan.md)    | Usability test protocol and tasks                                   |
| [`docs/market-analysis.md`](docs/market-analysis.md)            | Competitor comparison, pricing position and barriers                |
| [`docs/agile-sprint-plan.md`](docs/agile-sprint-plan.md)        | Sprints, backlog and per-member contribution                        |
| [`docs/accessibility.md`](docs/accessibility.md)                | WCAG pass (scope + findings)                                        |
