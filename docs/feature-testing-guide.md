# TicketFlow — Feature List and Testing Guide

**Document version:** 2.2 · **Verified against:** branch `dev`, 10 August 2026

> **Purpose.** Every feature the application actually has, and step-by-step instructions to
> exercise each one by hand. Written to be used two ways: as a demo script (Task 1.2 asks for
> a 10-minute video), and as a manual test pass before submission.
>
> **Changes in 2.0.** Version 1.0 listed the features but only gave test steps for about a
> third of them — the interesting ones — leaving guest import, the natural-language guest
> query, no-show prediction, anomaly detection, weather advice and much else as table rows
> with nothing to do. **Every numbered feature below now has an explicit step.**
>
> **Accuracy note.** Every feature was confirmed present in the source, and every threshold,
> metric and column name quoted here was read out of the code rather than recalled. Where a
> feature is partially implemented or has a known limitation, that is stated rather than
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

### 0.4 Test data you will need

Save this as `guests.csv` for §6.1:

```
name,email,vip,plusOnes
Ada Lovelace,ada@example.com,yes,1
Alan Turing,alan@example.com,no,0
Grace Hopper,grace@example.com,vip,2
,broken@example.com,no,0
```

The last row is deliberately invalid (no name) — it should be **reported as skipped, not
crash the import**.

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

**1.1** Sign up, log out, log back in. The session survives a page refresh (JWT is in an
HTTP-only cookie, so it is not readable by scripts).

**1.2** At `/forgot-password`, enter your address → a reset link arrives by email. Follow it,
set a new password, and confirm **the old password no longer works**. Tokens expire after 10
minutes; wait it out on a second attempt to see the expiry path.

**1.3** Profile → Settings → change your name and upload a photo. The new photo appears in the
navbar avatar immediately (it is uploaded to Cloudinary, so the URL changes).

**1.4** Profile → Settings → delete account. You are logged out, and logging back in fails.
This is a **soft** delete (`isActive: false`) — the row survives so that bookings and audit
history stay intact.

**1.5** Confirm the roles are distinct by attempting a cross-role action: as a plain **user**,
open another organiser's dashboard URL directly → refused. See §10 for the admin view.

**1.6** Attempt to sign up with `role: "admin"` in the request body (browser devtools →
Network → edit and replay the signup request, or `curl`). The account is created as a plain
**user** — the role is whitelisted server-side. This was a real vulnerability; see
`technical-documentation.md` §7.4.1.

---

## 2. Events

| # | Feature | Where |
|---|---|---|
| 2.1 | Create an event with a cover image | `/create-event` |
| 2.2 | Three access modes: public, invite-only, hybrid | Step 1 |
| 2.3 | Multiple ticket tiers with quantity and limits | Step 2 |
| 2.4 | Rich venue detail: venue name, dress code, parking, accessibility, age limit | Step 1 |
| 2.5 | Venue capacity (safe occupancy) | Step 1 |
| 2.6 | Meet and Greet on/off per event | Step 1 |
| 2.7 | Edit event | `/edit-event/:id` |
| 2.8 | Discovery: browse, search, filter, trending, upcoming | `/explore-events` |
| 2.9 | Location fields: Country → **State/County** → City → Postcode | Step 1 |
| 2.10 | **Ticket currency**, chosen explicitly | Step 1 |

### How to test

**2.1** Create an event with a cover image. It appears in **My Events** and on
`/explore-events`.

**2.2** Create one of each access mode. Then confirm the behavioural difference:
**invite-only** events are hidden from public discovery and refuse purchase (§6.5);
**hybrid** events allow both a guest list and ticket sales; **public** allows only purchase.

**2.3** Add two tiers (e.g. General ₦5,000 and VIP ₦25,000) with different quantities. On the
event page both appear with correct prices. Try to buy more than a tier's remaining quantity
→ refused with *"Not enough … tickets remaining"*.

**2.4** Fill in venue name, dress code, parking, accessibility and age restriction. These
appear on the event detail page **and** are what the chatbot answers from in §7.2 and §7.3 —
so enter something distinctive you will recognise.

**2.5** Set **Venue capacity** to `2`. This is the number the door enforces in §5.6 — it is
deliberately separate from ticket quantity, because organisers oversell against no-shows.

**2.6** Toggle Meet and Greet **off** on one event and **on** on another. The off event has no
Meet and Greet entry point for attendees (§9.5).

**2.7** Edit an event and change the name and price. The event page reflects it. Note that
changing a tier price does **not** alter tickets already sold — their price was stamped at
purchase.

**2.8** On `/explore-events`: search by name, filter by category, and check the **Trending**
and **Upcoming** carousels on the home page return real events.

**2.10 — currency.** The **Ticket currency** dropdown offers only currencies the payment
provider can settle: **NGN, GHS, ZAR, KES, USD, XOF**. Picking a country *suggests* one but
does not lock it — a UK event charging in USD is valid and, in fact, necessary: **GBP and EUR
are absent because Paystack cannot settle them**. Confirm the field is also on the edit form,
and that changing an event's country afterwards does **not** silently change its currency.

**2.9** Choose **United Kingdom** → the *State/County* dropdown offers **West Midlands** among
other counties. The field is labelled *State/County*, not *State*, because "state" is
meaningless for a UK address. City remains a free-text field.

---

## 3. Ticketing and payment

| # | Feature | Where |
|---|---|---|
| 3.1 | Buy a ticket (Paystack) | Event page → Buy |
| 3.2 | Guest checkout (no account) | Same |
| 3.3 | Server-issued unique ticket IDs | — |
| 3.4 | QR ticket emailed on payment | Inbox |
| 3.5 | **Seats held before payment**, released if abandoned | — |
| 3.6 | **3% platform fee via Paystack split** | — |
| 3.7 | **Server-authoritative pricing** | — |
| 3.8 | Free events skip payment entirely | — |
| 3.9 | My Tickets, with a downloadable QR ticket | Profile → Tickets |
| 3.10 | **Checkout total equals the ticket price** — no booking fee added | Checkout |

Test card: **`4084 0840 8408 4081`**, any future expiry, CVV **`408`**.

### How to test

**3.1** Buy a ticket with the test card. You land on a success screen and the booking appears
in Profile → Tickets.

**3.2** Log out entirely and buy again, entering only a name and email. The purchase completes
with no account — this is why §9.4 (guest access by emailed code) exists.

**3.3** Look at the ticket ID on the ticket. It is 12 characters, uppercase, and contains no
ambiguous glyphs (no `I`, `L`, `O`, `U`). Buy twice and confirm the two differ. The client
cannot choose it — it is generated server-side because it is the code the door admits on.

**3.4** Check the buyer's inbox: the email contains a **scannable QR image**, not a broken
image box. The QR encodes the *ticket ID*, not the buyer's name — scan it with any phone QR
reader and you should see the same code printed on the ticket.

**3.5** Start a checkout and **close the Paystack popup without paying**. The seats are held,
not lost: the tier's remaining count drops immediately, and the hold is swept back after 15
minutes (`npm run reservations:release` forces it immediately).

**3.6** After a successful payment, open your **Paystack dashboard → Transactions** and open
the charge. It shows the split: the organiser's subaccount share, and your `transaction_charge`
(3% of the ticket price, in kobo). This is the single most important thing to verify by hand,
because it is the one step only Paystack can confirm.

**3.7 — the security test.** In devtools → Network, replay the `POST /bookings/create` request
with `"price": 1` on a ₦25,000 ticket. The booking is still stored at **₦25,000** and Paystack
is asked for ₦25,000. Previously this succeeded and issued a valid ticket; see
`technical-documentation.md` §7.4.3.

**3.8** Create an event with a ₦0 tier and register. No Paystack popup appears at all — the
booking is confirmed inline and the ticket emails immediately.

**3.9** Profile → Tickets → open a ticket. The QR renders on screen and can be downloaded as
an image for printing.

**3.10 — the total must be the truth.** Put a ₦5,000 ticket in the basket. The checkout page
must show **₦5,000**, with its currency, and say no booking fee is added. Then confirm the
Paystack popup asks for the same figure. This previously displayed ₦5,380 — a legacy "5% +
₦100" markup — while the server charged ₦5,000, so the page quoted a price nobody was
charging.

---

## 4. Money: platform fee and payouts

| # | Feature | Where |
|---|---|---|
| 4.1 | Payout onboarding: bank → account → name confirmation | Profile → Payouts |
| 4.2 | Paystack subaccount created per organiser | — |
| 4.3 | 3% fee, split at the point of payment | — |
| 4.4 | **Paid events refuse to sell without a payout account** | — |
| 4.5 | Organiser revenue: gross / fee / net per event and in total | Profile → Revenue |
| 4.6 | Admin sees platform-wide revenue and fee income | Profile → Revenue |
| 4.7 | **Platform revenue is the 3% fee alone**, not gross or net | Profile → Revenue |
| 4.8 | **Daily earnings trend** with a table view | Profile → Revenue |

### How to test

**4.1** Profile → Payouts. The **bank dropdown must populate** (278 Nigerian banks come from
Paystack). Enter account number `0000000000`, press **Verify account** → the registered
account name is shown and you must confirm it *before* anything is saved. This two-step
design exists because a mistyped digit would send an event's revenue to a stranger.

**4.2** After confirming, the page shows the connected bank, the **last four digits only**,
and the 3% fee. The full account number is never stored — Paystack holds it.

**4.3** Covered by §3.6 — verify the split in the Paystack dashboard.

**4.4** Create a paid event with an organiser who has **no** payout account and try to buy a
ticket → refused with a clear message naming the event. Free events are unaffected. This is
deliberate: charging anyway would settle the whole amount into the platform account,
invisibly.

**4.5** Profile → **Revenue** as the organiser. Each event shows tickets sold, **gross**,
**platform fee** and **net**, with totals. Confirm that an **unpaid/abandoned** reservation
does *not* appear in the figures — only confirmed payments count.

**4.7 — the number that matters.** On the admin's **Platform** tab, the emphasised figure is
**Platform revenue = the total 3% fees**, not gross sales and not what organisers were paid.
Check the arithmetic yourself on one event: 3% of its gross should equal the fee column, and
gross should equal fee + net. Reporting gross or net here would overstate TicketFlow's income
by more than an order of magnitude.

**4.8 — the trend.** Below the tiles, a daily **column** chart plots *your net* on the My
events tab and *platform fee income* on the Platform tab. Hover any day for its exact figure
and ticket count, and open **View as table** — the chart is never the only route to the
numbers. Days with no sales appear as a gap on a zero baseline rather than being skipped, so
a quiet week does not masquerade as continuous trading.

Columns rather than a line, because each value is everything earned *within* a day — a total
over a bucket, not a reading at an instant. A line would interpolate between days and imply a
figure at 3am that nobody can look up. Two things worth checking deliberately: the y-axis top
sits just above the tallest column rather than at some round number far above it (a peak of
NGN 220 gives an axis to NGN 250, not NGN 400), and the axis always starts at **zero** — a
column means the length of the bar, so a truncated axis would make it lie.

**4.6** Profile → **Revenue** as the **admin**. The heading changes to *Platform revenue*, an
**Organiser** column appears, and every event on the platform is listed — with "Platform fee"
now meaning TicketFlow's own income. Log in as a second organiser and confirm they **cannot**
see the first organiser's takings.

---

## 5. Door admission

| # | Feature | Where |
|---|---|---|
| 5.1 | Camera QR scanning | `/scan/:eventId` |
| 5.2 | Manual code entry (always available) | Same |
| 5.3 | **Atomic single-use admission** | — |
| 5.4 | Append-only audit log of every scan | Dashboard |
| 5.5 | Usher assignment scopes who can scan what | Event team |
| 5.6 | **Venue capacity with supervisor override** | — |
| 5.7 | Tolerant code entry: case-insensitive, `#` optional | — |

### How to test

**5.1** Open the scanner on a phone (Chrome/Android/Edge — it uses the browser's built-in
`BarcodeDetector`). Point it at a ticket QR → admitted, with the guest's name shown.

**5.2** Type the ticket ID into the manual box instead. Same result. Manual entry is always
available because not every browser supports in-browser scanning.

**5.3 — the concurrency guarantee.** Scan the **same ticket twice**. The second attempt is
refused with *"already been admitted"*. It is impossible for both to succeed: admission is a
single conditional database update, so exactly one wins.

**5.4** Open the event dashboard → recent scans. **Every** attempt is listed, successes *and*
rejections, with the reason (`already_admitted`, `wrong_event`, `at_capacity`). Rejections are
recorded too — a status flag would only show the final state.

**5.5** Assign your door-staff account to Event A (Event team → assign). They can now scan for
Event A. Give them a ticket for **Event B** → refused with *"not for an event you are checking
in"*, **and the attempt is logged** as `wrong_event`. Unassign them and their access
disappears.

**5.6** With Venue capacity set to `2` (§2.5), admit two guests, then scan a third → refused
with *"the venue has reached its safe capacity"* and a **supervisor override** prompt. Confirm
the override → admitted, and the audit row carries `capacity_override`, naming who authorised
it. Note this only limits scans that would actually add someone: re-scanning a guest already
inside a full venue correctly says *already admitted*, not *venue full*.

**5.7** Type a valid code in **lowercase**, and with surrounding spaces → still admits. If you
have a legacy `#`-prefixed ID, it resolves with or without the `#`. Previously a correct code
typed in the wrong case was reported as an invalid ticket, which at a door is indistinguishable
from a forgery.

---

## 6. Guest management (invite-only / hybrid)

| # | Feature | Where |
|---|---|---|
| 6.1 | **Import a guest list from CSV/XLSX** | Guest list → Import |
| 6.2 | Add a single guest by hand | Guest list |
| 6.3 | Single-use QR invites emailed per guest | Inbox |
| 6.4 | Guest list view with arrival status, VIP and plus-ones | Guest list |
| 6.5 | **Natural-language guest queries** — *regex parser, not an LLM* | Guest list |
| 6.6 | Purchase refused on invite-only events | — |
| 6.7 | GDPR: erase one guest, plus a scheduled retention sweep | Guest list / CLI |
| 6.8 | **Guest list is offered only where one exists** — hidden for public events | My Events · organiser tabs |

### How to test

**6.1 — guest import.** On an **invite-only** or **hybrid** event, open Guest list → Import and
upload the `guests.csv` from §0.4. (If you cannot find the Guest list link, check the event's
access mode — see §6.8.)

- The header row is **optional** and columns may be in any order; without a header the parser
  assumes `name,email,vip,plusOnes`.
- `vip` accepts `true` / `yes` / `1` / `vip` (case-insensitive); anything else is not VIP.
- `plusOnes` is a number; blank or non-numeric becomes `0`.
- The deliberately broken last row (no name) is reported as **skipped/invalid**, and the other
  three still import. A malformed row must never abort the whole file.
- Re-upload the **same file** → the three are reported as **skipped duplicates**, not
  duplicated. Uniqueness is per `(event, email)`.
- `.xlsx` and `.xls` work too — export the same sheet from Excel and re-upload it.

**6.2** Add one guest using the single-guest form. It was added specifically because CSV-only
import did not match how small events actually work.

**6.3** Each imported guest receives an email containing a **single-use QR invite**. Scan one
at the door (§5.1) → admitted. Scan the *same* invite again → refused. The invite token is
separate from a purchased ticket ID, but both resolve through the same scan endpoint.

**6.4** The guest list shows each guest's name, email, **VIP** flag, **plus-ones** and arrival
status, updating as you admit people.

**6.5 — natural-language guest query.** This is a **regex intent parser**, not a language
model — being precise about that matters for your report. It understands three things:

| It asks | Trigger words | Try |
|---|---|---|
| Count or list? | `how many` / `count` → count; `who` / `which` / `list` / `show` → list | *"how many have arrived"* vs *"who has arrived"* |
| Which status? | `hasn't/haven't arrived`, `has not checked in` → not arrived; `arrived` / `checked in` / `admitted` → arrived | *"who hasn't arrived"* |
| VIPs only? | the word `vip` | *"how many VIPs have arrived"* |

Test all four combinations, then two edge cases that matter:

- *"who **hasn't** arrived"* must **not** be treated as *arrived* — the negative pattern is
  checked first, or every question would invert.
- *"what's the weather"* → it **declines with a hint** rather than guessing. It returns nothing
  when it does not recognise the question, which is the correct behaviour for a parser.

**6.6** Try to buy a ticket for an invite-only event → refused with 403. Those events admit
from the guest list only.

**6.7** Erase a single guest from the guest list → their name becomes *Erased Guest* and their
email a unique placeholder, **but** their VIP status, plus-ones and arrival record survive, so
attendance statistics stay usable. Then run the scheduled sweep:
```bash
cd backend && npm run gdpr:sweep
```
It anonymises guests for events past their retention window and is safe to re-run.

**6.8 — the guest list is only offered where one exists.** Create (or open) a **public**
event and confirm the Guest list link is absent in three places:

1. its card in **My Events** — Live dashboard, Scan and Door staff are there, Guest list is not;
2. the tab strip at the top of its **Live dashboard**, **Scanner** and **Door staff** pages;
3. typing `/guest-list/<eventId>` by hand — you get an explanation that the event has no
   guest list and a link to change its access mode, not a broken page.

Now switch that event to **hybrid** and reload: the link appears everywhere it was missing.

Why it works this way: only invite-only and hybrid events have a guest list, and
`guestService` answers **400** for a public one. Showing a link that can only fail leaves the
organiser unable to tell "not allowed" from "broken". The rule has a single definition —
`hasGuestList(event)` in `backend/src/models/eventModel.js` — used both by the authorisation
check and by the `GET /events/:eventId/workspace` lookup the UI reads, so the two cannot
disagree.

---

## 7. AI concierge chatbot

| # | Feature | Notes |
|---|---|---|
| 7.1 | Event search in plain English | **Real LLM** — OpenAI, Gemini fallback |
| 7.2 | Answers about a **named** event from local data | Reads your event, not the model's memory |
| 7.3 | **Weather + dress-code + attendance advice** | **Open-Meteo**, no API key |
| 7.4 | FAQ / general site help | — |
| 7.5 | Graceful degradation with no API key | Canned reply, never an error |
| 7.6 | Rate limited independently of the rest of the API | 20/hour by default |
| 7.7 | **One question returns everything** — details *and* weather *and* safety | Single tool call |

### How to test

Open the chat launcher (bottom right — it pulses to draw attention and is chat-shaped).

**7.1** *"Find me music events in Birmingham"* → returns **real events from your database**,
not invented ones. Create an event with an unusual name first, then ask for it — that proves
the answer comes from your data.

**7.2** *"Tell me about &lt;your event name&gt;"* → answers using the venue name, dress code,
parking and accessibility you entered in §2.4. Change one of those fields, ask again, and the
answer changes.

**7.3 — Open-Meteo weather advice.** *"What should I wear to &lt;your event name&gt;?"*

- It geocodes the event's location and fetches a **real daily forecast** — no API key is needed
  and none is configured, which is itself worth noting.
- The advice combines the forecast with the organiser's own dress code from §2.4.
- It states explicitly that the safety notes are **not a crime or neighbourhood-safety
  assessment**. Confirm that disclaimer appears.
- **Horizon test:** ask about an event **more than 16 days away**. It must say the date is
  beyond the forecast horizon rather than inventing weather. Create a far-future event to
  force this — it is the most instructive case, because confidently wrong weather is worse
  than none.

**7.4** *"How do I get a refund?"* or *"How do QR tickets work?"* → answered from the built-in
FAQ without touching your event data.

**7.5** Comment out both `OPENAI_API_KEY` and `GEMINI_API_KEY`, restart the backend, and ask
anything → a fixed, polite reply. **Never** a 500. Restore the keys afterwards.

**7.6** Send more than 20 messages in an hour → rate-limited, while the rest of the site keeps
working. The chat endpoint carries its own limiter because model calls cost money.

**7.7 — a complete answer in one reply.** Ask simply *"tell me about &lt;your event&gt;"* —
not about the weather. The reply should still cover the venue and tickets **and** the forecast
for the day **and** the practical safety notes. If the event finishes at 21:00 or later, it
must say so and pass on the advice about arranging a route home in advance.

This needed fixing: the loop runs exactly **one** tool call, so a model that answered by
fetching event details could never then reach the weather tool — the reply came back with
venue and prices and nothing about arriving or leaving. Details now carry the conditions with
them, and fail soft: if Open-Meteo is unreachable you still get the event, with a note.

> **Precision for the report:** this is the **only** feature that calls an external model.
> Anomaly detection (§8.3) is rule thresholds, no-show prediction (§8.4) is a local trained
> model, and the guest query (§6.5) is a regex parser. Claiming "AI throughout" would be an
> overstatement a marker can check.

---

## 8. Live operations and insight

| # | Feature | Notes |
|---|---|---|
| 8.1 | Live arrivals dashboard over SSE | Pushed, not polled |
| 8.2 | Sold / admitted / remaining / at-capacity counters | — |
| 8.3 | **Scan anomaly detection** | Rule-based, tuned thresholds |
| 8.4 | **No-show prediction** | Logistic regression, synthetic training data |

### How to test

**8.1** Open the event dashboard on one device and scan a ticket on another. The arrival
appears **without refreshing** — updates are pushed over Server-Sent Events, not discovered by
polling.

**8.2** Watch the counters as you admit people: **Sold** (tickets bought), **Admitted** (people
through the door), **Remaining**, and an **at-capacity** warning as you approach the limit set
in §2.5. The organiser should see capacity coming rather than learn about it from a queue
outside.

**8.3 — anomaly detection.** Rule-based, with thresholds tuned against labelled fixtures. Three
rules, each of which you can trigger deliberately:

| Flag | Trigger | How to reproduce |
|---|---|---|
| `repeated_rejects` | **≥3** rejections on one ticket | Scan an already-admitted ticket three times |
| `rapid_sequential` | Two scans **<1.2 s** apart | Scan twice as fast as you can |
| `multi_device` | **≥3** distinct device/IP fingerprints within **5 minutes** | Scan the same event from three different devices/browsers |

Then open the dashboard's anomalies panel and confirm the flags appear. Note the 1.2 s
threshold was **tightened from 2 s** because legitimate double-scans from one device were
being flagged — measured precision improved to 0.948. Manual check-ins are deliberately
excluded from detection, since they carry no device fingerprint and would manufacture flags.

**8.4 — no-show prediction.** A logistic regression trained offline in Python; the app loads
only the exported weights, so no Python runtime is needed at runtime.

- With unadmitted guests present, the dashboard shows *"~N of the M remaining guests may not
  show up"*, plus an average risk percentage.
- It scores four features: **how far ahead they booked**, **whether they paid** (the strongest
  signal — paying makes attendance much more likely), **VIP status**, and **group size**.
- To see the numbers move: create one booking far in advance with several plus-ones (higher
  risk) and one recent paid booking (lower risk).
- **Read the disclaimer, and mean it.** The model is trained on *synthetic* data because a new
  platform has no attendance history. Its own recorded metrics: accuracy **0.724**, ROC-AUC
  **0.736**, but recall **0.161** — it catches only ~16% of actual no-shows. It is far better
  at saying "this one will turn up" than at spotting who will not, and the UI says so. Being
  able to explain *that* is stronger evidence than the feature itself.

---

## 9. Meet and Greet (attendee networking)

| # | Feature | Notes |
|---|---|---|
| 9.1 | Attendee directory with explicit opt-in | Per event |
| 9.2 | **Event Chat (Public)** | Live over SSE |
| 9.3 | Direct messages between attendees | — |
| 9.4 | **Guest access by emailed one-time code** | No account needed |
| 9.5 | Enabled/disabled per event | Set at creation |
| 9.6 | "Your event is live" notification email | CLI-triggered |

### How to test

**9.1** As an attendee holding a ticket, open the event's Meet and Greet and **opt in**. You
appear in the directory. Opt out → you disappear. Nobody is listed without choosing to be.

**9.2** Open Event Chat (Public) in two browsers as two different attendees. A message sent in
one appears in the other **without refreshing**. Reload → history persists. The event's name is
shown in the heading so guests know which event's channel they are in.

**9.3** From the directory, open a direct message with another attendee and send a message.
Confirm a **third** attendee cannot see that thread — DMs are visible only to their two
participants.

**9.4 — the interesting one.** Buy a ticket as a **guest** (no account, §3.2). Go to that
event's Meet and Greet, enter the booking email, and receive a **6-digit code**. Enter it →
you are in, with an ordinary session.

Then test the privacy property: request a code for an email that holds **no** booking. The
response must look **identical** to the success case — otherwise the endpoint would let anyone
test who is attending an event. Also confirm a code stops working after ~10 minutes, and that
a used code cannot be replayed.

**9.5** On the event you created with Meet and Greet **off** (§2.6), attendees have no entry
point to it. Inviting people into a space they would then be refused entry to would be worse
than showing nothing.

**9.6** Trigger the notification manually:
```bash
cd backend && npm run notify:event-live
```
Attendees of a currently-live event receive an email linking straight to its Meet and Greet.
Run it twice — it re-sends rather than silently skipping, which is intentional.

---

## 10. Administration

| # | Feature | Where |
|---|---|---|
| 10.1 | See all events and all users | My Events / Admin → Users |
| 10.2 | Change roles — **root admin only** | Admin → Users |
| 10.3 | Deactivate a user (soft) | Admin → Users |
| 10.4 | Archive an event (soft, reversible) | My Events |
| 10.5 | Platform-wide revenue | Profile → Revenue |
| 10.6 | **My events / All events tabs** | My Events |

### How to test

**10.1** As admin, open **My Events** → the heading reads *All events* and lists every event on
the platform, not just your own. Admin → Users lists every account.

**10.2** As the **root admin**, promote a user to `creator`, then to `admin`. Now log in as
that *newly promoted* admin and try to promote someone else → **refused**. Only the root admin
may grant or revoke `admin`. Also confirm you cannot change **your own** role, and that the
root admin cannot be demoted — otherwise the platform could be locked out of its own
administration permanently.

**10.3** Deactivate a user → they can no longer log in and vanish from listings. Their
bookings and audit history survive (soft delete). Confirm an admin cannot delete themselves or
the root admin.

**10.4** Archive an event → it disappears from every listing, **and**:
- its bookings, guests, chat history and audit log all survive (the confirmation dialog says
  how many bookings and how many were paid);
- assigned door staff are unassigned, since a scan scope on a hidden event is meaningless;
- scanning one of its tickets now says *"this ticket is valid, but its event has been
  archived"* — **not** "invalid ticket", which at a door would read as an accusation of fraud.

**10.5** See §4.6.

**10.6 — scoping.** As an admin open **Events** (the profile dropdown says *Events* rather
than *My events* for you, because the page is not limited to yours). It **defaults to your
own** events; switch to **All events** for the whole platform, and watch the heading and
count change with it. Previously an admin only ever got every event, with their own buried
among them and the heading "Events you created" plainly wrong. Then confirm the boundary: as
a non-admin, adding `?scope=all` to the request does **not** widen the list.

---

## 11. Quality engineering

| # | Feature | Command |
|---|---|---|
| 11.1 | 187 backend unit tests, no database needed | `npm run test:unit` |
| 11.2 | 17 integration suites against a real replica set | `MONGO_TEST_URI=… npm test` |
| 11.3 | Frontend component tests | `npm run test` (frontend) |
| 11.4 | Playwright end-to-end | `npm run test:e2e` |
| 11.5 | Coverage, measured but not gated | `npm run test:coverage` |
| 11.6 | Load testing | `npm run load:test` |
| 11.7 | AI/ML evaluation harnesses | `npm run eval:chatbot` etc. |
| 11.8 | CI: lint, typecheck, tests, coverage, container publish | GitHub Actions |

### How to test

**11.1–11.4** Run each command and confirm it passes. Unit tests need no database; integration
tests **skip cleanly** if `MONGO_TEST_URI` is unset rather than failing.

**11.5** `npm run test:coverage` in each package. Backend ≈ **72.66% lines / 85.28% branches**;
frontend ≈ **2.2%**, which is low because the UI is covered by Playwright instead — state that
honestly rather than quoting the badge.

**11.6** Raise the rate limit first, or the run flatlines at HTTP 429:
```bash
RATE_LIMIT_MAX=100000 npm run dev   # terminal 1
npm run load:test                   # terminal 2
```

**11.7** `npm run eval:chatbot`, `eval-anomaly`, `eval-nlquery` print precision/recall figures
over labelled fixtures — these are the measured numbers quoted in §8.3 and §8.4.

**11.8** Push to `dev` → CI runs lint, typecheck, the full suite and coverage. Merge to `main`
→ it additionally builds and publishes both container images to GHCR.

---

## 12. Suggested 10-minute demo order

1. **Create a paid event** with venue detail and a capacity of 2 *(§2.1, 2.4, 2.5)* — 1 min
2. **Ask the chatbot about it**, including what to wear *(§7.2, 7.3)* — 1 min
3. **Buy a ticket**, show the emailed QR *(§3.1, 3.4)* — 1½ min
4. **Show the Paystack split** — organiser share vs 3% fee *(§3.6)* — 1 min
5. **Import a guest list**, show a skipped bad row *(§6.1)* — 1 min
6. **Scan at the door**; scan again → already admitted *(§5.1, 5.3)* — 1½ min
7. **Hit capacity**, override with a reason, show the audit row *(§5.6, 5.4)* — 1 min
8. **Live dashboard** updating as you scan, plus no-show prediction *(§8.1, 8.4)* — 1 min
9. **Ask the guest list a question** in English *(§6.5)* — ½ min
10. **Revenue as organiser, then as admin** *(§4.5, 4.6)* — ½ min

> Say out loud which parts are AI and which are not (§7 note). Examiners reward precision here
> far more than breadth of claims.
