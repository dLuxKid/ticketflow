# TicketFlow — Feature List and Testing Guide

**Document version:** 1.0 · **Verified against:** branch `dev`, 7 August 2026

> **Purpose.** Every feature the application actually has, and step-by-step instructions to
> exercise each one by hand. Written to be used two ways: as a demo script (Task 1.2 asks for
> a 10-minute video), and as a manual test pass before submission.
>
> **Accuracy note.** Every feature below was confirmed present in the source. Where something
> is partially implemented or has a known limitation, that is stated in the row rather than
> omitted — a feature list that overstates the product is worse than a short one.

---

## 0. Before you start

### 0.1 Prerequisites

| Requirement | Why |
|---|---|
| Backend running on `:4000`, frontend on `:3000` | See `README.md` |
| MongoDB **replica set** (Atlas is fine) | Purchases and door check-in use transactions |
| `PAYSTACK_PUBLIC_KEY` **and** `PAYSTACK_SECRET_KEY` in `backend/config.env` | Paid tickets and payout onboarding both need them |
| Gmail app-password vars | Ticket emails, invites, and Meet-and-Greet access codes |
| `OPENAI_API_KEY` or `GEMINI_API_KEY` | The AI concierge (degrades to a canned reply without one) |

### 0.2 Accounts to create first

Set these up once; most tests below reuse them.

1. **Organiser** — sign up choosing a *creator* account.
2. **Attendee** — sign up as a normal user.
3. **Admin** — sign up normally, then from `backend/`:
   ```bash
   npm run seed:admin -- --email you@example.com --name "Your Name"
   ```
4. **Door staff** — sign up as a normal user; they become an usher when assigned to an event.

### 0.3 The one setup step people miss

**Connect a payout account for your organiser** (Profile → Payouts) before creating a paid
event. Paid events refuse to sell tickets until their organiser can be paid. Free events are
unaffected. In Paystack test mode, account number `0000000000` with any bank generally
resolves.

---

## 1. Accounts, roles and access

| # | Feature | Where |
|---|---|---|
| 1.1 | Sign up, log in, log out | `/signup`, `/login` |
| 1.2 | Password reset by email | `/forgot-password` |
| 1.3 | Profile update incl. photo | Profile → Settings |
| 1.4 | Soft-delete own account | Profile → Settings |
| 1.5 | Four roles: user, creator, usher, admin | — |
| 1.6 | Root admin — the only account that can grant/revoke `admin` | CLI seeded |

### How to test

**1.1 — Signup role cannot be escalated (security).** Sign up normally and confirm it works.
Then, from a terminal, try to register as an administrator:

```bash
curl -s -X POST http://localhost:4000/api/v1/users/signup -H "Content-Type: application/json" -d '{"name":"Mallory","email":"mallory@example.com","password":"password123","passwordConfirm":"password123","role":"admin"}' | head -c 400
```

**Expected:** the account is created with `"role": "user"` — the requested `admin` is
discarded. This was a real vulnerability (OWASP A01) and is worth demonstrating.

**1.6 — Role management guards.** As the root admin, go to Admin → Users:
- Promote a user to `creator` → succeeds.
- Try to change **your own** role → refused.
- Log in as a *second* admin and try to promote someone to `admin` → refused (only root may).
- Try to demote the root admin → refused.

---

## 2. Events

| # | Feature | Notes |
|---|---|---|
| 2.1 | Create event with cover image | Cloudinary upload |
| 2.2 | Three access modes: public, invite-only, hybrid | One schema, not three products |
| 2.3 | Multiple ticket tiers with quantity and limits | — |
| 2.4 | Rich venue detail: venue name, dress code, parking, accessibility, age restriction | Feeds the chatbot |
| 2.5 | Venue capacity (safe occupancy) | Enforced at the door — §5.3 |
| 2.6 | Meet and Greet on/off per event | — |
| 2.7 | Edit event | Owner or admin |
| 2.8 | Discovery: browse, search, filter, trending, upcoming | `/explore-events` |
| 2.9 | Live/upcoming/past status | Derived, runs to end of final day |

### How to test

**2.1–2.4** Create an event. Location asks for **Country → State/County → City → Postal
code**; for the UK the State/County list includes **West Midlands**. Fill the venue details
— you will use them in §7.

**2.9 — single-day events are live.** Create an event with the **same start and end date**,
set to today. It must show as **Live**, not Upcoming. (An earlier version computed a
zero-length window and such events were never live.)

---

## 3. Ticketing and payment

| # | Feature | Notes |
|---|---|---|
| 3.1 | Reserve → pay → confirm checkout | Seats held before payment |
| 3.2 | Guest checkout (no account) | — |
| 3.3 | Server-issued unique ticket IDs | Crockford base32 |
| 3.4 | QR ticket emailed on payment | Inline `cid:` image |
| 3.5 | **Server-authoritative pricing** | Client cannot choose a price |
| 3.6 | **3% platform fee via Paystack split** | §4 |
| 3.7 | Reservation expiry returns seats | 15-minute hold, swept every 5 min |
| 3.8 | Free events skip payment | Confirmed inline |
| 3.9 | My Tickets, with a downloadable QR ticket | Profile → Tickets |

### How to test

**3.1 + 3.4 — the happy path.** Buy a ticket with Paystack test card
`4084 0840 8408 4081`, any future expiry, CVV `408`. Expect: payment succeeds, the ticket
email arrives with a **visible QR image** (not a blank square), and the ticket appears under
Profile → Tickets.

**3.5 — price cannot be tampered with (security).** With an event whose tier costs, say,
₦25,000, call the reservation endpoint claiming it costs 1:

```bash
curl -s -X POST http://localhost:4000/api/v1/bookings/create -H "Content-Type: application/json" -d '{"event":"<EVENT_ID>","ticketBuyers":[{"name":"Mallory","email":"m@example.com","ticketType":"<TIER NAME>","price":1,"currency":"USD","ticketUser":"Guest"}]}' | head -c 500
```

**Expected:** the returned booking carries the **event's** price and currency, and
`checkout.amount` is the real amount in kobo — the submitted `price: 1` and `currency: "USD"`
are discarded.

**3.7 — abandoned checkout returns the seat.** Start a purchase, close the Paystack popup,
then check the event's remaining tickets. The seat is held (count drops) and returns within
15 minutes, or immediately if you run `npm run reservations:release`.

---

## 4. Money: platform fee and payouts

| # | Feature | Notes |
|---|---|---|
| 4.1 | Organiser payout onboarding (bank → account → name confirmation) | Profile → Payouts |
| 4.2 | Paystack subaccount created per organiser | Only last 4 digits stored |
| 4.3 | 3% fee, split at the point of payment | Configurable `PLATFORM_FEE_PERCENT` |
| 4.4 | Paid events blocked until payouts are connected | Deliberate |
| 4.5 | Revenue report: gross, fee, net — per event and total | Profile → Revenue |
| 4.6 | Admin sees platform-wide revenue and fee income | Same page, wider scope |

### How to test

**4.1** Profile → Payouts. The bank dropdown must be **populated**. Enter an account number
and press *Verify account* — the resolved account **name** appears and you must confirm it
before it saves. Only the last four digits are shown afterwards.

**4.4** Before connecting payouts, try to buy a ticket for that organiser's paid event.
**Expected:** a clear refusal naming the event, not a silent charge.

**4.5 / 4.6** Profile → **Revenue**.
- As the organiser: only *their* events, with Gross / Fee / Net columns.
- As an admin: **every** event, plus an Organiser column and the platform's fee income.
- Confirm an *unpaid* (abandoned) reservation does **not** appear in the totals.

> **Known limitation (state it in the report):** the split is *instructed* at checkout and
> settled by Paystack; TicketFlow does not yet read settlement back, so these figures are
> what was charged, not confirmed bank settlement. "Net" is also before Paystack's own
> processing charge, which the organiser bears.

---

## 5. Door admission

| # | Feature | Notes |
|---|---|---|
| 5.1 | QR scan-and-admit, atomic single use | Camera or manual entry |
| 5.2 | Door staff assignment, scoped to events | Role alone grants nothing |
| 5.3 | Venue capacity stop-and-confirm with override | Fire-safety |
| 5.4 | Append-only audit log of every scan | Success *and* rejection |
| 5.5 | Manual check-in fallback | Flagged `manual: true` |
| 5.6 | Case-insensitive manual code entry | — |

### How to test

**5.1 — single use.** Scan a valid ticket → admitted. Scan the **same** ticket again →
*"This ticket has already been admitted"*.

**5.6 — typing the code.** On the scanner page, type the ticket code in **lower case**, and
again with surrounding spaces. Both must admit. For a legacy ticket displayed as `#6F557BD`,
typing it **without** the `#` must also work. (Previously any of these reported "invalid
ticket", which at a door is indistinguishable from accusing a guest of forgery.)

**5.2 — usher scoping.** Assign a user as door staff for Event A only. As that user:
- Scan a ticket for Event A → admitted.
- Scan a ticket for Event B → refused, and the attempt is written to Event B's audit log.

**5.3 — capacity.** Set an event's **venue capacity to 1**. Admit one guest, then scan a
second. **Expected:** refusal with a supervisor-override prompt; confirming the override
admits and records `capacity_override` on the audit row. Then re-scan the *first* (already
admitted) guest — you must get *"already admitted"*, **not** "venue full".

> **Was broken, now fixed:** the scan query did not load the capacity fields, so this limit
> silently never fired on any real scan.

---

## 6. Guest management (invite-only / hybrid)

| # | Feature | Notes |
|---|---|---|
| 6.1 | Import a guest list from CSV/XLSX | Plus a single-guest form |
| 6.2 | Single-use QR invites emailed per guest | — |
| 6.3 | Guest list view with arrival status | — |
| 6.4 | Natural-language guest queries | **Regex parser, not an LLM** |
| 6.5 | Purchase refused on invite-only events | — |
| 6.6 | GDPR erase a single guest, plus a retention sweep | `npm run gdpr:sweep` |

### How to test

**6.4** On the guest list, ask *"who hasn't arrived"* and *"how many VIPs have arrived"*.
Both must answer from your real guest list. Try nonsense (*"what's the weather"*) → it should
decline with a hint rather than guess.

**6.5** Try to buy a ticket for an invite-only event → refused with 403.

---

## 7. AI concierge chatbot

| # | Feature | Notes |
|---|---|---|
| 7.1 | Event search in plain English | Real LLM (OpenAI → Gemini fallback) |
| 7.2 | Answers about a **named** event from local data | — |
| 7.3 | Weather + dress-code + attendance advice | Open-Meteo, no API key |
| 7.4 | FAQ / general site help | — |
| 7.5 | Graceful degradation with no API key | Canned reply, never an error |

### How to test

Open the chat launcher (bottom right, animated).

- *"Find me music events in Birmingham"* → returns real events from your database.
- *"Tell me about &lt;your event name&gt;"* → answers using the venue details you entered in §2.4.
- *"What should I wear to &lt;your event name&gt;?"* → gives dress-code advice using the **real
  forecast** for the venue, and states that it is not a crime/neighbourhood-safety assessment.
- Ask about an event **more than 16 days away** → it must say the forecast horizon is exceeded
  rather than inventing weather.

> **Precision for the report:** this is the *only* feature that calls an external model.
> Anomaly detection is rule thresholds, no-show prediction is a local trained model, and the
> guest query (§6.4) is a regex parser.

---

## 8. Live operations and insight

| # | Feature | Notes |
|---|---|---|
| 8.1 | Live arrivals dashboard over SSE | Pushed, not polled |
| 8.2 | Sold / admitted / remaining / at-capacity | — |
| 8.3 | Scan anomaly detection | Rule-based |
| 8.4 | No-show prediction | Logistic regression, synthetic training data |

### How to test

**8.1** Open the event dashboard on one device and scan a ticket on another. The arrival
appears **without refreshing**.

**8.4** With unadmitted guests, the dashboard shows *"~N of the M remaining guests may not
show up"*. Treat as indicative — the model's own recall is 0.16, and the UI says so.

---

## 9. Meet and Greet (attendee networking)

| # | Feature | Notes |
|---|---|---|
| 9.1 | Attendee directory with explicit opt-in | Per event |
| 9.2 | Event Chat (Public) | Live over SSE |
| 9.3 | Direct messages between attendees | — |
| 9.4 | **Guest access by emailed one-time code** | No account needed |
| 9.5 | Enabled/disabled per event | — |
| 9.6 | "Event is live" notification email | — |

### How to test

**9.4 — the interesting one.** Buy a ticket as a **guest** (no account). Go to the event's
Meet and Greet, enter that email, and receive a **6-digit code**. Enter it → you are in.

Then test the privacy property: request a code for an email that holds **no** booking. The
response must look **identical** to the success case — otherwise the endpoint would let
anyone test who is attending. Also confirm a code stops working after ~10 minutes.

---

## 10. Administration

| # | Feature | Notes |
|---|---|---|
| 10.1 | See all events and all users | — |
| 10.2 | Change roles (root admin only) | §1.6 |
| 10.3 | Deactivate a user (soft) | — |
| 10.4 | Archive an event (soft, reversible) | Nothing is destroyed |
| 10.5 | Platform-wide revenue | §4.6 |

### How to test

**10.4** Archive an event that has bookings. It disappears from listings, but confirm the
bookings, guests, chat and audit rows still exist in the database — this is an archive, not a
delete. Then scan one of its tickets: you must get *"its event has been archived"*, **not**
"invalid ticket".

---

## 11. Quality engineering

| Command | What it does |
|---|---|
| `cd backend && npm run test:unit` | Unit tests, no database |
| `cd backend && MONGO_TEST_URI=... npm test` | Full suite incl. integration |
| `cd backend && npm run test:coverage` | Coverage table |
| `cd backend && npm run load:test` | Throughput measurement |
| `cd frontend && npm run test` | Component tests |
| `cd frontend && npm run test:e2e` | Playwright journeys |

Current: **261 backend tests**, 9 frontend component tests, all passing.

---

## 12. Suggested 10-minute demo order

1. Browse → **buy a ticket** with a test card → QR email arrives *(§3)*
2. **Revenue page** — gross, 3% fee, net *(§4.5)*
3. Organiser **dashboard** open; **scan** the ticket on a phone → live arrival appears *(§8.1, §5.1)*
4. Scan again → already admitted; **capacity** refusal + override *(§5.3)*
5. **Guest joins Meet and Greet** with an emailed code *(§9.4)*
6. **Chatbot**: "what should I wear to X?" → real forecast *(§7.3)*
7. **Admin**: all events, platform revenue, archive an event *(§10)*
8. Close on the **security fixes**: signup escalation and price tampering, both refused *(§1.1, §3.5)*
