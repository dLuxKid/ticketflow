# Implementation brief: merge EntryPoint guest-management into TicketFlow

## Objective

TicketFlow is a working event-ticketing MVP. Merge in the "EntryPoint" proposal —
invite-only guest management with signed single-use QR invites, atomic door check-in,
role-based door staff, a live arrivals dashboard, an audit log, and three AI features —
so a single event can be public-ticketed, invite-only, or both at once. Ship it with the
tests, CI, and migration evidence that make each change defensible.

This is Coventry 7003SCN coursework as well as a real build: graded on code quality, test
coverage, and *documented* design decisions — not just working features. Where a choice is
made below, the reasoning is part of the deliverable; preserve it in commit messages and
code comments.

## Stack (already in the repo)

- `backend/` — Express 4 + Mongoose/MongoDB, ESM, layered
  `presentation/routes → presentation/controllers → services → repositories → models`.
  JWT auth via httpOnly cookie or bearer. No sockets, no queue, no tests yet.
- `frontend/` — Next.js 15 App Router + TypeScript + TanStack Query. Paystack for payment.

## Operating rules

1. **Read before you edit.** Line numbers below are hints from a prior read and may have
   drifted — re-open each file and locate the symbol by name before changing it. Never
   patch against a line number alone.
2. **One phase per branch, tests green before the next.** Each phase ends with its tests
   passing and a commit whose message states the design decision it embodies. Do not start
   Phase N+1 with Phase N red.
3. **Every flaw fix and feature lands with a test that fails before the change and passes
   after** — this is the graded evidence, not incidental. Name them so the mapping is
   obvious (e.g. `oversell.concurrency.test.js`).
4. **Follow the existing layer boundaries.** Business logic goes in `services`, DB access
   in `repositories`, HTTP concerns in `controllers`. Don't put DB queries in controllers
   or business rules in routes, even where the current code is thin.
5. **Prefer the documented default over asking.** These instructions resolve the known
   ambiguities on purpose. Only stop for a decision that genuinely isn't covered here and
   changes the data model or an external contract.

Files to read first: `backend/src/services/bookingService.js`,
`backend/src/presentation/controllers/authController.js`,
`backend/src/presentation/routes/eventRoutes.js`, `.../bookingRoutes.js`,
`backend/src/models/{event,booking,user}Model.js`, `backend/app.js`, `backend/server.js`.

## Core design decision: `accessMode`, not two event types

Do **not** fork the domain into "PaidEvent" / "InviteEvent" models. Add one field to
`Event`: `accessMode: "public" | "invite_only" | "hybrid"` (default `"public"`).

- `public` — unchanged: ticket tiers required, checkout open, appears in public discovery.
- `invite_only` — no ticket tiers; checkout returns 403; excluded from public
  discovery/search; guests arrive only via the organiser's guest list.
- `hybrid` — ticket tiers **and** a guest list both active (a conference selling public
  tickets while comping speakers/press).

The admission entity is **one** collection with a `source: "purchase" | "invite"` field,
not two collections kept in sync. A guest-list entry becomes an admission document once
its invite is issued. `source` affects reporting only — never how admission is granted.

*Why:* a hard paid/invite split has nowhere to put the hybrid case, which is common; a
single event with one access mode and two intake channels does. State this in the design
write-up.

---

## Phase 0 — fix the load-bearing flaws first

The new features sit on these mechanisms, so fix them before building anything.
Schema field changes for 0.4 are specified precisely in **Appendix A**.

| # | Fix | Where | Done when |
|---|-----|-------|-----------|
| 0.1 | **Atomic inventory decrement.** Replace the read→decrement→save in `createBooking` with a single `findOneAndUpdate` inside a Mongo session, conditioned on `"ticketDetails.$.ticketQuantity": { $gte: qty }` + `$inc`. No read-then-write gap; can't go negative. | `bookingService.js` (`createBooking`, ~L20-56) | Concurrency test: two simultaneous buys of the last unit → exactly one succeeds, quantity never negative. |
| 0.2 | **Wire up the RBAC that already exists.** `restrictTo` is defined but imported by nothing. Add `restrictTo('creator','admin')` + an ownership check (`event.user.equals(req.user.id)`, admin bypass) to event-update and check-in. | `authController.js` (~L165-174), `eventRoutes.js`, `bookingRoutes.js`, `eventService.updateEvent` | Test: non-owner gets 403 editing/checking-in another user's event. |
| 0.3 | **Verify payment server-side.** Add/harden a Paystack webhook that verifies signature + calls verify-transaction before setting `transactionStatus` confirmed. Never trust client-supplied status. | booking routes/service | Test: booking is not confirmed on a forged/unverified client status. |
| 0.4 | **Fix numeric typing.** `ticketPrice`/`ticketQuantity`/buying limits are `String`; migrate to `Number` (Appendix A) and delete the `* 1`/`parseInt` coercions. | `eventModel.js`, `bookingService.js:42`, `eventModel.js:164` | Existing purchase flow still passes with numeric types. |

> **MongoDB gotcha:** multi-document transactions require a **replica set**, not a
> standalone `mongod`. Configure the dev/CI/Docker Mongo as a single-node replica set
> (`--replSet rs0` + `rs.initiate()`) now, or 0.1's transaction will throw at runtime.

## Phase 1 — domain model

All field-level schema changes (Event, Booking, User) and the two new models
(`guestModel.js`, `auditLogModel.js`) are specified exactly in **Appendix A** — implement
them there, don't re-derive. In summary:

- `Booking`: add `source`, `status` (state machine replacing the stored `isCheckedIn`
  boolean, which becomes a virtual), `inviteToken` (signed, single-use, `select:false`).
- `User`: add `usher` to the role enum + `assignedEvents`. An usher can scan/check-in only
  for assigned events; cannot edit events, refund, or see other events.
- `Event`: add `accessMode`.
- New `Guest` and `AuditLog` collections.

**Done when:** the backfill migration (Appendix A) has run against existing data and every
legacy document has `accessMode`, `source`, and `status` set.

## Phase 2 — atomic check-in, one path for every guest type

Single endpoint (`POST /bookings/:id/check-in`) that:
- Takes the scanned `inviteToken`, looks up the admission document.
- **Inside a transaction**, conditionally moves `status` `issued`/`delivered → admitted`
  only if not already `admitted`/`revoked` — same atomic pattern as 0.1.
- On success: write `AuditLog(outcome: admitted)`, emit the WebSocket event (Phase 3).
- On failure (already admitted / revoked / wrong event): reject with a specific reason and
  **still** write `AuditLog(outcome: rejected, reason)` — rejections are the training/eval
  signal for anomaly detection.
- Gated by 0.2 RBAC: only an usher assigned to this event (or admin) may call it.

**Done when:** a test fires two simultaneous scans of one token and exactly one admits;
both a success and a rejection produce audit rows.

## Phase 3 — live dashboard

- Socket.IO gateway in `backend/app.js`, emitting `guest:admitted` / `guest:rejected`
  into a **per-event room** so organisers see only their own event.
- Frontend route `frontend/src/app/(events)/dashboard/[eventId]` subscribing to it: live
  arrivals-vs-capacity, recent-scans feed, and the anomaly flags from Phase 5.

**Done when:** a check-in in one browser updates the dashboard in another without refresh,
and an organiser cannot subscribe to another event's room.

## Phase 4 — guest-list management (organiser-facing)

- CSV import endpoint + UI, reusing the multi-step wizard pattern in
  `frontend/src/app/(events)/create-event`, to bulk-add guests to `invite_only`/`hybrid`
  events.
- On add: generate the signed `inviteToken`, create the `source:"invite"` Booking, send
  the QR by email reusing `generateQrCode.js` / `generatePdf.js` — same delivery as a
  purchased ticket, minus checkout.
- Enforce `accessMode` at the API boundary: checkout 403s for `invite_only`; public
  listing/search excludes `invite_only`; `hybrid` appears in both.

**Done when:** an `invite_only` event is un-buyable and invisible in public search, and an
imported guest receives a scannable QR that admits exactly once.

## Phase 5 — AI features (last, on top of solid data)

1. **Scan anomaly detection** — rule-based/lightweight classifier over `AuditLog`:
   repeated rejects of one token, one token from distinct device/IP fingerprints in a
   short window, abnormally rapid sequential scans. Ship with a labelled set (100+
   synthetic cases) and report precision/recall/F1 + confusion matrix.
2. **Natural-language guest queries** — hosted LLM turns "who from the VIP list hasn't
   arrived" into a structured query over the guest/admission collections. Eval with
   exact-match accuracy on a held-out question/result set. (A *second, different* metric
   from #1 on purpose — shows methodological range.)
3. **No-show prediction** — logistic regression / gradient boosting (scikit-learn, no
   training infra) over RSVP timing + history; surface as a confidence band on the Phase 3
   dashboard.

**Done when:** each model has a committed eval script and reported numbers, not just a
running endpoint.

## Phase 6 — compliance, quality, infra (run *throughout*, not at the end)

- **GDPR:** scheduled job deleting guest PII after a configurable post-event retention
  window + a manual erasure endpoint.
- **Accessibility:** WCAG 2.2 AA on guest-facing pages (invite confirmation, status pages).
- **Tests:** Jest unit + integration for every phase (esp. the two concurrency proofs);
  Playwright E2E over create-event → invite → admit.
- **CI:** GitHub Actions running the suite on every PR (Mongo as single-node replica set —
  see the Phase 0 gotcha).
- **Docker Compose:** one command brings up backend + Mongo (replica-set) + Redis (if you
  add a queue for email/AI jobs) for local dev and the demo recording.

## Global constraints

- Preserve the existing public-ticket purchase UI/flow; touch it only for 0.1 and
  `accessMode` gating.
- One admission collection, not a parallel `Guest`↔`Booking` sync.
- No custom ML training infra — hosted APIs + off-the-shelf models fit the 4-week scope.
- If time is cut, **Phase 6 (tests/CI/Docker) is not the thing to drop** — it's explicitly
  marked (LO3).

## Order of work

Phase 0 → 1 → 2 → 3 → 4 → 5, with Phase 6 running in parallel from the start.

---

## Appendix A — exact schema changes and migrations

Field-by-field diff against the real files in `backend/src/models/`, plus the backfill for
existing documents. This is Phase 0/1 work.

### `eventModel.js`

`ticketSchema` — fix string-typed numerics (0.4):
```js
ticketPrice:         { type: Number, required: true, min: 0 },   // was String
ticketQuantity:      { type: Number, required: true, min: 0 },   // was String
minimumBuyingLimit:  { type: Number, default: 1, min: 1 },       // was String
maximumBuyingLimit:  { type: Number, default: 1, min: 1 },       // was String
```
Then delete the `* 1` coercion in `bookingService.js:42` and `ticket.ticketQuantity * 1 || 0`
in `eventModel.js:164`.

`eventSchema` — add:
```js
accessMode: {
  type: String,
  enum: ['public', 'invite_only', 'hybrid'],
  default: 'public',
},
```
Enforce "no ticket tiers on `invite_only`" in `eventService` at create/update time, **not**
with a schema-level conditional-required (Mongoose conditional-required across sibling
paths is brittle).

### `bookingModel.js` — state machine replaces the boolean

```js
source: {
  type: String,
  enum: ['purchase', 'invite'],
  required: true,
  default: 'purchase',          // safe default for the backfill
},
status: {
  type: String,
  enum: ['issued', 'delivered', 'scanned', 'admitted', 'rejected', 'revoked'],
  default: 'issued',
},
inviteToken: {
  type: String,
  select: false,                // never returned by default queries
},
```
Unique+sparse index (sparse because purchase bookings may lack a token):
```js
bookingSchema.index({ inviteToken: 1 }, { unique: true, sparse: true });
```
Keep `isCheckedIn` working via a **virtual** so no read site breaks (`toJSON`/`toObject`
already set `virtuals: true`):
```js
bookingSchema.virtual('isCheckedIn').get(function () {
  return this.status === 'admitted';
});
```
Remove the stored `isCheckedIn: Boolean` field only **after** the backfill below has read
it and every consumer is confirmed on the virtual.

### `userModel.js`

```js
role: {
  type: String,
  enum: ['user', 'creator', 'admin', 'usher'],   // + usher
  default: 'user',
  select: false,
},
assignedEvents: {
  type: [{ type: mongoose.Schema.ObjectId, ref: 'Event' }],
  default: undefined,   // only meaningful for role: 'usher'
},
```

### New — `guestModel.js`

Separate collection (a list can run to hundreds; needs its own indexed lookups):
```js
const guestSchema = new mongoose.Schema({
  event:    { type: mongoose.Schema.ObjectId, ref: 'Event', required: true },
  name:     { type: String, required: true },
  email:    { type: String, required: true, lowercase: true },
  vip:      { type: Boolean, default: false },
  plusOnes: { type: Number, default: 0, min: 0 },
  booking:  { type: mongoose.Schema.ObjectId, ref: 'Booking' }, // set once invite issued
}, { timestamps: true });

guestSchema.index({ event: 1, email: 1 }, { unique: true }); // no duplicate invites per event
```
On invite issuance: create the `Booking` (`source:'invite'`, `status:'issued'`, generated
`inviteToken`) and point `Guest.booking` at it.

### New — `auditLogModel.js`

```js
const auditLogSchema = new mongoose.Schema({
  event:   { type: mongoose.Schema.ObjectId, ref: 'Event', required: true },
  booking: { type: mongoose.Schema.ObjectId, ref: 'Booking' },
  actor:   { type: mongoose.Schema.ObjectId, ref: 'User', required: true }, // who scanned
  outcome: { type: String, enum: ['admitted', 'rejected'], required: true },
  reason:  { type: String }, // on reject: 'already_admitted' | 'revoked' | 'wrong_event'
}, { timestamps: true });

auditLogSchema.index({ event: 1, createdAt: -1 }); // dashboard + analytics query pattern
```

### Backfill existing documents

`.lean()` reads skip Mongoose defaults and return `undefined` for the new fields on
pre-migration rows. Don't rely on defaults — run this once, in a maintenance window,
before deploying code that reads `status`/`accessMode`. Keep it in `scripts/` under version
control as managed-migration evidence (LO3).

```js
// scripts/migrate-phase0-1.js
await Event.updateMany(
  { accessMode: { $exists: false } },
  { $set: { accessMode: 'public' } },
);

await Booking.updateMany(
  { source: { $exists: false } },
  { $set: { source: 'purchase' } },
);

// derive status from the old boolean before that field is removed
const legacy = await Booking.collection.find({ status: { $exists: false } }).toArray();
for (const b of legacy) {
  await Booking.collection.updateOne(
    { _id: b._id },
    { $set: { status: b.isCheckedIn ? 'admitted' : 'issued' } },
  );
}
```
