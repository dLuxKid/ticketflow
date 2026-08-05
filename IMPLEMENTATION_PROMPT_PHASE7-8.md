# Implementation brief: guest networking + AI concierge chatbot (Phase 7 & 8)

## Objective

TicketFlow (see `IMPLEMENTATION_PROMPT.md` for the EntryPoint merge this continues) already
handles ticketing, invites, door check-in, a live dashboard, and three narrow AI features.
Add two guest-facing features on top of that foundation:

7. **Guest networking** — while an event is live, its attendees can see who else opted in,
   message the whole event in a group chat, and DM each other one-to-one. Every attendee
   gets an email the moment the event goes live, containing the link to join.
8. **AI concierge chatbot** — a natural-language assistant, backed by a hosted LLM, that can
   search events, answer questions about a specific event, and answer general
   how-TicketFlow-works questions. OpenAI is the primary provider; Gemini is the fallback
   when OpenAI is unavailable.

Same grading context as the original brief: code quality, test coverage, and *documented*
design decisions all count. Where a choice is made below, state the reasoning in commit
messages, same as Phase 0–6 did.

## Stack facts that change how these features are built

Re-derived from the current code, not assumed — two things the original brief's Phase 3
text implied differently from what actually shipped:

- **No Socket.IO anywhere in the backend.** The live dashboard (Phase 3) uses **Server-Sent
  Events**: an in-process `EventEmitter` bus (`shared/events/admissionEvents.js`) that a
  service publishes to, and a per-event SSE controller (`dashboardController.streamEvent`)
  that subscribes, filters by `eventId`, and writes `event: name\ndata: json\n\n` frames.
  The frontend proxies through a same-origin Next.js route
  (`app/api/events/[eventId]/stream/route.ts`) because `EventSource` can't set an
  `Authorization` header and the JWT lives in an httpOnly cookie. **Reuse this exact
  pattern for networking** — it already solves auth-over-SSE and per-event scoping.
- **No scheduled job runner exists yet.** `gdpr-retention-sweep.js` (Phase 6) is a
  standalone script meant to be cron-triggered externally, but no cron is actually wired —
  `.github/workflows/` only has `ci.yml`. The event-live email needs the same kind of
  script; this brief adds the missing scheduled workflow and points it at both scripts, so
  this is a real gap getting closed, not just a new one being opened the same way.
- **`Event.isLive` (virtual, `eventModel.js`) already defines "live"** by `startDate`/
  `endDate` only — it does not consider `startTime`/`endTime`. Both new features must key
  off the same virtual (day-granularity), not invent a second, finer-grained definition
  that could disagree with what the dashboard already calls "live".
- **`apiFeatures.js` + `eventRepository.findActiveWithFeatures`** already implement the
  filter/sort/paginate logic behind public event search (by category via generic query,
  city via `eventLocation`, name, date). The chatbot's search tool wraps this — it does not
  reimplement search.
- **`frontend/src/assets/data/faqs.ts` already contains the site FAQ copy** shown on the
  frontend. The chatbot's FAQ tool needs this content server-side; see 8.2 for the
  duplication tradeoff (no shared package exists between the two npm projects).
- **`public/Chat.png` / `src/assets/images/Chat.png` already exist in the frontend, unused.**
  Apparently earmarked for a chat affordance that was never built — reuse as the widget's
  launcher icon rather than sourcing a new asset.

## Operating rules (same five as the original brief)

1. Read before you edit — file/line references below are from this session's reads; re-open
   and re-locate by name before patching.
2. One phase (7, then 8) per branch, tests green before the next.
3. Every change lands with a test that fails before and passes after, named so the mapping
   is obvious (e.g. `networking.access-gate.test.js`, `chatbot.fallback.test.js`).
4. Follow existing layer boundaries: `routes → controllers → services → repositories →
   models`. LLM calls and Mongo queries are services/repositories, never controllers.
5. Prefer the documented default below over asking; stop only for a decision that changes
   the data model or an external contract and genuinely isn't covered here.

**Files to read first:** `backend/src/shared/events/admissionEvents.js`,
`backend/src/presentation/controllers/dashboardController.js`,
`backend/src/services/dashboardService.js` (the SSE pattern to clone),
`backend/scripts/gdpr-retention-sweep.js` + `retentionService.js` (the scheduled-script
pattern to clone), `backend/src/services/nlQuery/{intentParser,executeQuery}.js` (the prior,
deliberately-non-LLM NL pattern this supersedes for the chatbot),
`backend/src/shared/utils/apiFeatures.js`, `backend/src/models/{event,booking}Model.js`,
`backend/app.js`.

---

## Phase 7 — Guest networking

### Core design decisions

- **No separate "Room" model.** A group room is implicit — one per event, identified by
  `eventId`, existing for as long as the event does. This mirrors the existing "one
  collection, not a parallel structure kept in sync" rule from the original merge (the
  single `Booking` collection instead of separate purchase/invite collections).
- **One `Message` collection covers both group and DM.** `recipient: null` means a group
  broadcast; a set `recipient` means a DM between `sender` and `recipient`, scoped to that
  `event`. Two collections here would just be the same anti-pattern the original brief
  explicitly rejected for admissions.
- **Opt-in and bio live on `Booking`, not `User`.** Visibility is per-event ("networking at
  *this* conference"), and `Booking` is already the per-event-per-attendee record (it's
  where `source`/`status` live). A field on `User` would leak one event's networking
  preference into every other event the same account attends.
- **Writes are gated on `Event.isLive === 'live'`; reads are not.** Attendees can message
  only while the event is actually live, matching the request literally. History remains
  readable afterward (organisers reviewing engagement, attendees reconnecting) — nothing is
  deleted, consistent with this codebase's GDPR posture of anonymizing PII on a schedule
  rather than hard-deleting on a timer.
- **Eligibility to join = holding a non-revoked/non-rejected booking for that event.**
  Reuses the same admission-status check Phase 2/4 already established; no new "attendee"
  concept.

### 7.1 — Domain model (new `messageModel.js`, `Booking`/`Event` field additions)

```js
// backend/src/models/messageModel.js
const messageSchema = new mongoose.Schema(
  {
    event: { type: mongoose.Schema.ObjectId, ref: 'Event', required: true },
    sender: { type: mongoose.Schema.ObjectId, ref: 'User', required: true },
    // null = group broadcast to the whole event; set = a DM to this user.
    recipient: { type: mongoose.Schema.ObjectId, ref: 'User', default: null },
    body: { type: String, required: true, trim: true, maxlength: 1000 },
  },
  { timestamps: true },
);
// Room/DM history query pattern: one event's group feed, or one event's thread with a peer.
messageSchema.index({ event: 1, recipient: 1, createdAt: 1 });
```

`bookingModel.js` additions:
```js
networkingOptIn: { type: Boolean, default: false }, // must opt in to appear in the directory
networkingBio: { type: String, maxlength: 280 },
```

`eventModel.js` addition:
```js
// Set once the "event is live" email has gone out (Phase 7). Backfill-free: only new/live
// events need it, and the sweep script only ever looks at events at or past startDate.
networkingEmailSentAt: { type: Date },
```

**Done when:** schema loads, `Booking.networkingOptIn` defaults `false` (no directory
appearance without explicit opt-in — privacy-by-default, not privacy-by-exception).

### 7.2 — Real-time transport (clone the Phase 3 SSE pattern exactly)

- `backend/src/shared/events/networkingEvents.js` — new `EventEmitter` bus, `emitMessage`,
  event name `chat:message`. Same shape as `admissionEvents.js`: the service that persists a
  message publishes; it doesn't know about transport.
- `GET /api/v1/events/:eventId/network/stream` — new SSE controller, cloned from
  `dashboardController.streamEvent`: authorize (must be an eligible attendee — see 7.1),
  send an initial snapshot (recent group history + this viewer's open DM threads), then
  forward `chat:message` events filtered to `payload.event === eventId &&
  (payload.recipient === null || payload.recipient === viewerId || payload.sender ===
  viewerId)` — the same per-event, now also per-viewer, filter the dashboard does per-event
  only.
- Frontend same-origin proxy at `app/api/events/[eventId]/network/stream/route.ts`, cloned
  from the existing dashboard stream proxy (cookie → Bearer forwarding), for the same
  `EventSource`-can't-set-headers reason.

### 7.3 — REST endpoints (send = POST, since SSE is receive-only)

Add to `eventRoutes.js` under the existing protected section (pattern: `guests`/`dashboard`
sub-resources already nested under `:eventId`):

| Method & path | Purpose | Gate |
|---|---|---|
| `GET /events/:eventId/network/directory` | Opted-in attendees (name, bio, vip) | eligible attendee, event live or past |
| `PATCH /events/:eventId/network/opt-in` | Set own `networkingOptIn`/`networkingBio` on own booking | eligible attendee |
| `POST /events/:eventId/network/messages` | Post to the group room | eligible attendee, **event must be live** |
| `POST /events/:eventId/network/dms/:userId` | DM another attendee | both must be eligible attendees, **event must be live** |
| `GET /events/:eventId/network/dms/:userId` | DM thread history | either participant |

`networkingService.js` (new): resolves "is this user an eligible attendee of this event" via
`bookingRepository.findByUserAndEvent` (status not in `['revoked','rejected']`) — reuse
before adding a new repository query if a close match already exists; add one if not.

### 7.4 — "Event goes live" email

Mirrors `gdpr-retention-sweep.js` structurally:

```js
// backend/scripts/send-event-live-emails.js
// Idempotent: only events with startDate <= now AND networkingEmailSentAt unset.
// Run: node scripts/send-event-live-emails.js
```
`networkingNotificationService.sweepNewlyLiveEvents()`:
1. `eventRepository.findStartedNotNotified()` (new) — `startDate <= now && accessMode !=
   null && networkingEmailSentAt` not set. Matches `Event.isLive`'s own `startDate`-only
   definition (see stack-facts note above) rather than a new time-of-day check.
2. For each: load all non-revoked/rejected bookings for that event (attendees, purchased
   *and* invited alike — `source` doesn't matter here, admission does).
3. Email each with the networking link (`${FRONTEND_URL}/events/:eventId/network`) via a new
   `views/email/networkingLive.pug` template + `Email` class method (`sendNetworkingLive`),
   same as `email.js`'s existing `sendWelcome`/`sendPasswordReset`.
4. Set `event.networkingEmailSentAt = new Date()` — before moving to the next event, so a
   crash partway through a run doesn't re-email everyone already done.

Package script: `"notify:event-live": "node scripts/send-event-live-emails.js"`.

**New:** `.github/workflows/scheduled-jobs.yml` — a `schedule:` cron workflow running both
`npm run gdpr:sweep` (daily) and `npm run notify:event-live` (every 10–15 min, since "the
moment the event goes live" is time-sensitive in a way GDPR erasure isn't). This is the
cron `gdpr-retention-sweep.js`'s own comment says should exist and currently doesn't —
closing that gap once, for both scripts, is cheaper than adding a second ad hoc one later.

### 7.5 — Frontend

New route group `frontend/src/app/(events)/network/[eventId]/` with sub-tabs (Group /
Directory / DMs) via the existing `eventTabs.ts` + `PageHeader` pattern already used by
`dashboard`/`guest-list`/`scan`. `_component/network-chat.tsx` clones `live-dashboard.tsx`'s
`EventSource` subscription (open the stream, append incoming `chat:message` frames, POST to
send). Gate the whole route client-side on the same "not live yet / no longer eligible"
states the backend already 403s on, so the empty/blocked states are informative rather than
a raw error.

**Done when:** two browsers logged in as different attendees of the same live event see each
other's group messages without refresh; a DM sent by A appears only for A and B's sessions,
never a third attendee's; posting to a not-yet-live or already-ended event's group/DM
endpoints 403s; the live-email script run against a freshly-started event sends exactly once
even if run twice back to back.

### Explicitly out of scope for this phase (flag, don't build)

Moderation (report/block/mute), push notifications, read receipts, typing indicators, voice/
video. None were requested; listing them here is so a reviewer sees they were considered and
deliberately deferred, not missed.

---

## Phase 8 — AI concierge chatbot

### Core design decisions

- **Provider-agnostic client, not two call sites.** One `llmProvider.js` exposes a single
  `complete({system, messages, tools})` shape; OpenAI and Gemini each get an adapter behind
  it. Callers (the chatbot service) never know which provider answered. This is the same
  "swappable half" shape `intentParser.js` used for the *previous* NL feature (guest
  queries), which deliberately skipped a hosted LLM — Phase 8 is where that swap actually
  happens.
- **Plain `fetch` to each provider's REST endpoint, not their SDKs.** Node 20 (this repo's
  minimum, see `package.json` `engines`) has global `fetch`; this codebase already hand-rolls
  its third-party integrations (`paystack.js`'s HMAC check, `generateQrCode.js`) rather than
  pulling in SDKs for single-endpoint usage. Two REST calls don't justify two new
  dependencies.
- **Fallback trigger: OpenAI call throws, times out, or 429s** → immediately retry the same
  request against Gemini once. Not a health-check/circuit-breaker — a single-attempt
  fallback per request is enough for this scope and keeps latency bounded (no doubled
  timeout budget).
- **Function-calling over 3 tools backed by real data, not a prompt that hallucinates
  events.** The model is never the source of truth for event data — it picks a tool, the
  backend executes it against Mongo, and the model only phrases the final answer from real
  results. This is the same discipline the door-scan anomaly detector applies to its
  signals: the model routes, the database answers.
- **FAQ content is duplicated server-side, not imported cross-package.** `frontend/` and
  `backend/` are two separate npm projects with no shared workspace; importing
  `frontend/src/assets/data/faqs.ts` into backend ESM isn't a one-line fix. Duplicating a
  5-entry, low-churn static list into `backend/src/assets/faqs.js` with a comment pointing at
  the frontend original is the honest tradeoff here — note it as a tradeoff, don't pretend
  it's not one.

### 8.1 — Provider abstraction

`backend/src/services/chatbot/llmProvider.js`:
- `callOpenAI({system, messages, tools})` — `POST https://api.openai.com/v1/chat/completions`,
  `Authorization: Bearer ${OPENAI_API_KEY}`, model from `OPENAI_MODEL` (default
  `gpt-4o-mini`), OpenAI-style `tools`/`tool_calls`.
- `callGemini({system, messages, tools})` — Gemini's `generateContent` REST endpoint,
  `GEMINI_API_KEY` as a query param, model from `GEMINI_MODEL` (default
  `gemini-2.0-flash`), translating to/from Gemini's `functionDeclarations`/
  `functionCall` shape.
- `complete(...)` — tries `callOpenAI`; on any thrown error, rejection, or non-2xx, falls
  back to `callGemini`; if both fail, throws a single normalized error the service turns
  into a graceful "concierge is unavailable, try again" reply (never a raw 500 to the
  guest-facing widget).
- Both adapters return a normalized `{ reply: string|null, toolCall: {name, args}|null }` so
  nothing downstream branches on provider.

### 8.2 — Tools (each wraps an existing capability, none reimplement one)

| Tool | Wraps | Returns |
|---|---|---|
| `search_events(category?, city?, name?, startDateFrom?, startDateTo?)` | `eventRepository.findActiveWithFeatures` via a thin `eventService.searchEvents` (translates tool args → the same query-string shape `APIFeatures` already expects) | compact list: name, slug, date, city, price range |
| `get_event_details(slug)` | `eventService.getEventBySlug` | venue, times, ticket tiers + prices, refund policy — never invite-only guest-list internals |
| `answer_faq(topic)` | `backend/src/assets/faqs.js` (duplicated content, see above) | best-matching Q/A pair |

`chatbotService.handleMessage(message, history)`: build the system prompt + tool schema →
`llmProvider.complete` → if a `toolCall` came back, execute it against the real
repository/service → feed the tool result back to the same provider for a final natural-
language answer (one function-calling round trip) → return `{reply, toolUsed}`.

### 8.3 — Endpoint

`POST /api/v1/chat` (new `chatRoutes.js`, mounted in `app.js` at `/api/v1/chat`) —
**unauthenticated** (discovery and FAQ must work for anonymous visitors, unlike every other
route added by the original merge). Body: `{message, history?}` (client-held short
history, capped e.g. last 6 turns — no server-side conversation persistence, see below).

Add a dedicated rate limiter (same `express-rate-limit` pattern as the existing `/api`
limiter in `app.js`, but stricter — LLM calls cost money): `CHAT_RATE_LIMIT_PER_HOUR`
(default 20) per IP, scoped to `/api/v1/chat` only.

**Explicitly not built:** server-side conversation persistence/history across sessions,
token-by-token streaming replies. Both are reasonable follow-ups but weren't asked for, and
adding them now would mean state and infra (a store, a streaming transport) beyond this
scope — note as deferred, matching the "no custom ML training infra" discipline the original
brief applied to Phase 5.

### 8.4 — Frontend

`frontend/src/components/chatbot/chat-widget.tsx` — floating launcher (reuse
`public/Chat.png`), mounted once in `src/app/layout.tsx` (next to where
`providers/index.tsx` already wraps the app) so it's available site-wide, not per-page.
Plain REST call to `/api/v1/chat` through the existing `utils/queries.ts`/`actions.ts`
axios pattern — no new HTTP client.

### 8.5 — Eval (mirrors Phase 5's rigor, a different metric on purpose)

`tests/fixtures/chatbotEvalSet.js` — 20–30 labelled `{message, expectedTool,
expectedArgsShape}` cases spanning all three tools plus a few that should trigger no tool
(pure chit-chat/greeting). `scripts/eval-chatbot.js` reports **tool-selection accuracy**
(did the model pick the right tool) against a stubbed provider — this is deliberately a
different axis from the existing `eval-nlquery.js` (exact-match on structured output) and
`eval-anomaly.js` (precision/recall/F1), same "second, different metric shows methodological
range" reasoning the original brief gave for why Phase 5 has three distinct eval
approaches, not one reused three times.

### 8.6 — Testing without live API keys

Unit tests inject a fake `fetch` (or a stub provider function) so tool-routing and the
OpenAI→Gemini fallback path are deterministically tested offline — no network, no cost, runs
in plain `node --test`. A small number of real integration tests that hit live OpenAI/Gemini
**self-skip unless `OPENAI_API_KEY`/`GEMINI_API_KEY` are set**, same self-skip convention
already used for the `MONGO_TEST_URI`-gated suites — CI does not need paid secrets to pass.

**Done when:** unit tests prove (a) `search_events`/`get_event_details`/`answer_faq` each
route from a matching sample message, (b) an OpenAI failure falls back to Gemini and the
final reply is unaffected, (c) both providers failing returns the graceful fallback message,
never a 500; `eval-chatbot.js` reports tool-selection accuracy on the committed eval set.

---

## Appendix A — env additions

`.env.docker.example` / `config.env`:
```
OPENAI_API_KEY=
OPENAI_MODEL=gpt-4o-mini
GEMINI_API_KEY=
GEMINI_MODEL=gemini-2.0-flash
CHAT_RATE_LIMIT_PER_HOUR=20
```

No new runtime dependencies for either phase (SSE reuses `express`; the LLM client reuses
global `fetch`) — only `.env` keys.

## Order of work

Phase 7 and 8 are independent of each other (different models, different routes) and can be
built in either order or in parallel on separate branches; each is independent of anything
in Phase 0–6 except reading from the models/services those phases already established.
Within each phase, follow the numbered sub-sections in order — 7.1→7.5, 8.1→8.6 — since each
later step assumes the previous one's schema/transport exists.
