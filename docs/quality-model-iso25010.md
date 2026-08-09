# TicketFlow - Product Quality Evaluation (ISO/IEC 25010)

**Document version:** 1.4 · **Verified against:** branch `dev`, 9 August 2026

> **Changes since 1.3.** §1 records revenue *scoping* (an organiser's net and the platform's fee are separate questions, and the platform's revenue is the fee alone). §3 Compatibility gains the currency constraint - events could previously be created in currencies the payment provider cannot settle, so their tickets could never be sold. §6 records a fourth class of defect: figures shown to users that no system actually charged.

> **Changes since 1.2.** §9 Safety is downgraded and re-argued: venue-capacity enforcement existed in code but was **silently disabled** by a projection that never loaded the capacity fields, so no real scan was ever limited. It is now genuinely enforced and covered by integration tests. §1 gains revenue reporting.

> **Changes since 1.1.** §6 Security records a third fixed defect - buyer-controlled ticket pricing - and §1 gains the revenue model: a 3% platform fee via Paystack split payments, with organiser payouts settled directly by the provider.

> **Changes since 1.0.** Test coverage is now measured and quoted in §7 (backend 72.66% lines, frontend 2.16%), with the absence of a failing threshold defended as a decision. §9 Safety is rewritten: venue-capacity enforcement at the door now exists, so the characteristic moves from Weak to Moderate and the remaining gap is occupancy *reporting* rather than enforcement. §6 Security gains the fixed signup privilege-escalation defect.

> **Purpose.** Evaluates TicketFlow against the ISO/IEC 25010 software product quality model, the international standard within the SQuaRE (Systems and software Quality Requirements and Evaluation) series. It supplies the "quality assurance and testing methods **according to international standards**" evidence required by Learning Outcome 3, and the strengths/weaknesses/recommendations depth the Outstanding band expects.
>
> **Companion document.** Usability is assessed separately and empirically against **ISO 9241-11** in [`usability-test-plan.md`](usability-test-plan.md); §4 here summarises and cross-references rather than duplicating it.

## A note on which edition to cite

ISO/IEC 25010 was revised in 2023, superseding the 2011 edition. The characteristic set changed - the 2023 model has nine characteristics, renaming *Usability* to *Interaction Capability* and *Portability* to *Flexibility*, and adding *Safety*. This document is organised on the 2023 model with the 2011 names given alongside.

| 2023 characteristic | 2011 equivalent |
|---|---|
| Functional Suitability | Functional Suitability |
| Performance Efficiency | Performance Efficiency |
| Compatibility | Compatibility |
| **Interaction Capability** | Usability |
| Reliability | Reliability |
| Security | Security |
| Maintainability | Maintainability |
| **Flexibility** | Portability |
| **Safety** | *(new in 2023)* |

**Before submission:** cite whichever edition your module reading list and CU library copy use, and align the terminology in your report to it. If your materials use the 2011 model, drop §9 (Safety) and rename §4 and §8 to *Usability* and *Portability*.

---

## Summary assessment

| # | Characteristic | Evidence strength | Principal gap |
|---|---|---|---|
| 1 | Functional Suitability | **Strong** | No formal requirements-to-test traceability matrix |
| 2 | Performance Efficiency | Moderate | Read paths now measured; write paths and a latency budget still outstanding |
| 3 | Compatibility | Moderate | No API versioning policy beyond the `/v1` prefix; currency now constrained to what the provider settles |
| 4 | Interaction Capability | **Weak → improving** | Accessibility audit covers 2 components; usability testing not yet run |
| 5 | Reliability | **Strong** | No uptime/error monitoring in production |
| 6 | Security | **Strong** | No dependency-vulnerability scanning in CI |
| 7 | Maintainability | **Strong** | Coverage now measured (backend 72.66% lines); frontend unit coverage is 2.16% |
| 8 | Flexibility | Moderate | Images published to GHCR, but no deployment target runs them |
| 9 | Safety | Moderate | Capacity enforced at the door with an auditable override; no evacuation/occupancy reporting |

The pattern is worth stating plainly in the report: quality attributes that are **structurally designed in** (security, reliability, maintainability) are strong, while those requiring **measurement or user contact** (performance, interaction capability) are the weakest. That is a characteristic profile of a developer-led project without a dedicated QA or UX role, and naming it is itself an evaluative observation.

---

## 1. Functional Suitability

*The degree to which the product provides functions that meet stated and implied needs.*

| Sub-characteristic | Evidence |
|---|---|
| Functional completeness | Three distinct event models (`public`, `invite_only`, `hybrid`) served by one schema; full sell→admit loop plus guest management, live dashboard and three analytics features. Feature-to-source index: `technical-documentation.md` §5.1 |
| Functional correctness | **187 unit tests across 23 files** (no database) plus **17 integration suites** against a real replica set. Correctness under concurrency proved rather than asserted: `admission.scan.test.js` (two simultaneous scans admit once), `inventory.reservation.test.js` (concurrent buyers cannot oversell) |
| Functional appropriateness | `accessMode` unification means an organiser running a hybrid event uses one workflow, not two products. The single-guest form (`f113cf2`) was added specifically because CSV-only import did not fit how small events actually work |

**Strength.** Correctness evidence targets the paths where correctness is genuinely hard - money and admission - rather than distributing shallow tests evenly.

**Weakness.** There is no explicit traceability from requirements (use cases) to the tests that discharge them, so completeness is argued rather than demonstrated.

**Recommendation.** Add a one-page traceability matrix mapping each use case in `use-case-diagram.md` to the test file that covers it. Cheap to produce and directly answers "test cases" in the marking criteria.

---

## 2. Performance Efficiency

*Performance relative to the resources used under stated conditions.*

| Sub-characteristic | Evidence |
|---|---|
| Time behaviour | Live dashboard uses **Server-Sent Events**, not polling - updates are pushed on admission rather than discovered on an interval. Query paths are indexed: `{inviteToken}`, `{ticketId}` (partial unique), `{reference}`, `{transactionStatus, reservationExpiresAt}`, `{event, piiErasedAt}`, `{event, createdAt:-1}` - each matching a specific access pattern rather than added speculatively |
| Resource utilisation | Real-time fan-out uses an in-process `EventEmitter` rather than Redis or a broker, appropriate at door-staff scale; QR codes are inlined as data URLs, removing an asset-host round trip per ticket |
| Capacity | Inventory reservation uses a guarded atomic `$inc`, so throughput is bounded by MongoDB's document-level contention rather than an application lock |

**Now measured.** `npm run load:test` (`scripts/load-test.sh`, autocannon) exercises the public
read paths. Measured at **20 concurrent connections for 15s**, against an API backed by a
**remote MongoDB Atlas cluster** - the network round-trip to that cluster dominates these
figures, so a co-located database would be materially faster:

| Endpoint | req/sec | p50 | p97.5 | p99 | errors |
|---|---|---|---|---|---|
| `GET /api/v1/events` (list) | 88.4 | 172 ms | 510 ms | 1009 ms | 0 |
| `GET /api/v1/events/:slug` (detail) | 51.3 | 345 ms | 542 ms | 567 ms | 0 |

No errors, non-2xx responses or timeouts in 2,096 requests, so the service is stable under
that load - but the detail endpoint is roughly half the throughput of the list at double the
p50, which is worth profiling before scaling.

**Weakness - a hard rate-limit ceiling.** The API allowed **100 requests per IP per hour**,
hardcoded. That is low for this product: one visitor browsing events, opening several detail
pages and completing a checkout can consume a large share of it in a single sitting, and
everyone behind shared NAT - a venue's wifi, a corporate network, a mobile carrier - shares
one budget. It also made load testing impossible, since every run flatlined at 429. It is now
configurable via `RATE_LIMIT_MAX` / `RATE_LIMIT_WINDOW_MS`, defaulting to the previous values
so no deployment changes behaviour without opting in.

**Remaining gap.** Write paths (`POST /bookings/create`, `POST /bookings/scan`) are
deliberately not load tested: they mutate real data, and a run leaving thousands of phantom
bookings behind would be worse than no measurement. Their *correctness* under concurrency is
already proven by the integration suite; their *throughput* is not. Measuring them needs a
disposable database, which is the natural next step.

**Recommendation.** Re-run against a co-located database to separate application cost from
network cost, set a latency budget (a p95 target) from the result, and extend to the write
paths once a throwaway database is available.

---

## 3. Compatibility

| Sub-characteristic | Evidence |
|---|---|
| Co-existence | Four containers share one host without interference (`docker-compose.yml`); backend and frontend deploy independently |
| Interoperability | REST/JSON over `/api/v1`; Paystack webhooks; Cloudinary; SMTP via Nodemailer; guest import accepts both CSV and Excel `.xlsx`; QR codes follow the standard encoding so any reader works |

**Now constrained: currency.** `Event.currency` is restricted by enum to the six currencies Paystack can settle (NGN, GHS, ZAR, KES, USD, XOF). It was previously a free string derived from the event's country, so a UK event was given GBP and a German one EUR — neither settleable. Those events were created, listed and browsed normally, and then failed at the payment gateway *after* the buyer committed. Compatibility with an external provider is not only a matter of protocol: accepting data the provider will later reject is an interoperability defect that surfaces at the worst possible moment.

**Weakness.** The `/v1` prefix exists but no versioning or deprecation policy sits behind it; a breaking change would have no defined migration path for clients.

**Recommendation.** State a versioning policy in the README even if `/v2` never ships - the absence of a policy, not the absence of a version, is the defect.

---

## 4. Interaction Capability *(2011: Usability)*

| Sub-characteristic | Evidence |
|---|---|
| Learnability | Single-guest form added alongside bulk import after CSV-only proved unintuitive - a documented response to a usability problem |
| Operability | Responsive navigation with distinct desktop/mobile/side variants; category carousel exposes scroll affordances conditionally |
| User error protection | Destructive GDPR erasure requires explicit confirmation; seats are reserved **before** payment so a buyer cannot be charged without a ticket; confirmation is idempotent so a double-submit cannot double-charge |
| Accessibility | WCAG 2.2 AA fixes against named success criteria (1.3.1, 1.4.3, 2.4.7, 3.3.2, 4.1.2, 4.1.3) - `docs/accessibility.md` |
| User-interface aesthetics | "Soft cotton" palette with a stated contrast constraint (≥ 4.8:1 for button text, exceeding the 4.5:1 AA minimum) |

**Weakness - two, both material.** First, the accessibility audit honestly covers only two components; checkout, event creation and the public pages are unaudited, and no screen-reader session or full-site automated scan has been run. Second, **no usability testing with real users has taken place**, so every usability claim above is a designer's judgement rather than a measured outcome.

**Recommendation.** Execute [`usability-test-plan.md`](usability-test-plan.md) - five participants, three scenarios, ISO 9241-11 effectiveness/efficiency/satisfaction measures plus SUS. Run axe DevTools or Lighthouse across every route and extend the accessibility findings table. These are the two highest-value quality actions remaining on the project.

---

## 5. Reliability

| Sub-characteristic | Evidence |
|---|---|
| Maturity | Concurrency-sensitive paths covered by tests that issue genuinely simultaneous operations against a real replica set, not mocks |
| Fault tolerance | A failed ticket email is logged but does not undo a confirmed payment (`confirmReservation`); a failed invite email leaves the guest and booking intact for resend |
| Recoverability | Abandoned checkouts are swept and their seats returned (`releaseExpiredReservations`); releases are guarded so concurrent release and webhook retry cannot double-credit inventory; confirmation is idempotent under Paystack's retry behaviour |
| Availability | Docker healthcheck gates replica-set initialisation on startup |

**Strength.** Failure modes are handled with an explicit stance on *which* failure must not propagate - email delivery is allowed to fail without invalidating payment, and that decision is documented in the code rather than implicit.

**Weakness.** No production error tracking or uptime monitoring; `console.error` is the entire observability story. Availability is designed for but not observed.

**Recommendation.** Add structured logging and an error-reporting sink (Sentry's free tier is sufficient) before the demo. Also bind `releaseExpiredReservations` to a scheduler - it is tested and correct but currently nothing invokes it, so recoverability is implemented yet inactive.

---

## 6. Security

| Sub-characteristic | Evidence |
|---|---|
| Confidentiality | Passwords bcrypt-hashed at cost 14 and `select: false`; `inviteToken` also `select: false`; JWT held in an HTTP-only cookie, unreadable to script |
| Integrity | Paystack webhooks verified by HMAC-SHA512 over the **raw** body, so client-reported payment status is never trusted; `reference`, `ticketId` and `event` are all stamped server-side after the client payload is spread, so a caller cannot choose its own admission code or attach to another charge; unique indexes on `ticketId` and `inviteToken` make duplicate credentials unrepresentable |
| Non-repudiation & accountability | `AuditLog` is append-only, one row per scan attempt - success *or* rejection - recording actor, outcome, reason and device |
| Authenticity | JWT with `passwordChangedAt` invalidation, so tokens issued before a password change are refused |
| Authorisation *(privilege acquisition)* | `SIGNUP_ROLES` restricts self-registration to `user`/`creator`; `admin` is only ever granted, by a root admin or the seed script. `canChangeRole` / `canDeleteUser` refuse self-changes, non-root admins touching `admin`, and demoting or deleting the root admin |
| *(Hardening)* | `helmet`, `express-mongo-sanitize`, `express-xss-sanitizer`, `hpp` with an explicit whitelist, rate limiting (100 req/hour/IP by default, now configurable, with a tighter limiter on the AI chat endpoint), credentialed CORS locked to a single origin |

**Strength.** Authorisation is defence-in-depth: a coarse role gate at the route, plus fine-grained ownership decisions in the service layer (`authorizeScan`, `canViewDashboard`, `canChangeRole`), each independently unit-tested. An usher is scoped to assigned events only - least privilege, not merely authentication.

**Defect found and fixed - worth citing explicitly.** `POST /users/signup` spread the request body into the new user document, so `role` was attacker-controlled: **any visitor could register as `admin`** and obtain full access to every event, user and guest list. This is OWASP A01 (Broken Access Control) by mass assignment. It is now filtered through a frozen whitelist, and the fix was confirmed by attempting the escalation against a running server. Recording a found-and-fixed vulnerability of this severity, with the verification step, is stronger evidence of security awareness than a clean report would be.

A second, subtler instance is worth noting alongside it: the guard preventing demotion of the root admin initially could not fire at all, because `isRootAdmin` is `select: false` and the repository method loading the target user did not request it. The guard read `undefined` and silently permitted the action. **A security control that depends on a field the query never loads is not a control** - it is a comment.

**A third, found while answering a question about revenue reporting.** `GET /bookings/event/:eventId` - the organiser's sales view - enforced authentication but no ownership, so any account could read any event's booker list: every attendee's name and email, the event's gross sales, and `ticketId`, the door-admission credential. It now reuses the same `getEventForViewer` rule as the dashboard and guest list, with seven regression tests that were verified to fail against the pre-fix code.

**A fourth, found while implementing the platform fee.** Ticket price was taken from the request and never checked against the event's tiers; the Paystack amount was computed in the browser; and payment confirmation verified only that a charge *succeeded*, never its value. A modified client could pay ₦1 for a ₦50,000 ticket and receive a valid, scannable ticket, with nothing in the audit trail looking unusual. Price and currency are now stamped from the event, the whole checkout configuration is built server-side, and the charged amount is verified against the stored bookings before tickets are issued.

**A fifth, of a different kind — a figure shown to a user that nothing actually charged.** The checkout page inflated every total by a legacy "5% + 100" markup, displaying 5,380 for a 5,000 ticket while the server charged 5,000. Not an access-control failure but a **truthfulness** one, and arguably worse for a payment product: every other defect here required someone to go looking, whereas this one was on screen for every buyer. It also survived the introduction of a *different* fee model, so the page was briefly asserting two contradictory pricing rules at once. Removed; the buyer pays the advertised price.

**The pattern across all four access-control defects is the evaluative point**, and is worth stating as such rather than listing the defects: each was a place where a rule that exists correctly elsewhere in the system was *absent* rather than *wrong* - and in the fourth case the rule was even documented in this repository ("server-issued identifiers", §4.1 of the technical documentation) while `price` quietly sat outside it. Duplicated authorisation fails silently at whichever endpoint someone forgot, and no amount of care at the other endpoints detects it. That is an argument for centralising the decision - which the architecture already supports and which these fixes now use - over trusting per-endpoint diligence.

**Weakness.** No automated dependency-vulnerability scanning; `npm audit` is not in CI. Given ~40 direct frontend dependencies this is a realistic exposure. The client-side route guard decodes but does not verify the JWT signature - correct as a UX layer, but it must be documented as such so no one later mistakes it for a control.

**Recommendation.** Add `npm audit --audit-level=high` as a CI step, and Dependabot for updates. Both are configuration-only.

---

## 7. Maintainability

| Sub-characteristic | Evidence |
|---|---|
| Modularity | Strict Controller → Service → Repository → Model layering; no controller imports a repository, no service imports a Mongoose model (`design-models.md` §4) |
| Reusability | `authorizeScan` is reused verbatim by both the QR scanner and the manual check-in path, so the two cannot drift apart in who they permit |
| Analysability | `AuditLog` reconstructs door history; centralised `AppError` and error handler; ESLint 9 + Prettier enforced in CI |
| Modifiability | The repository layer is the only Mongoose caller, so the persistence library could be replaced without touching business logic |
| Testability | Services take no `req`/`res` and return plain data, which is precisely why authorisation logic is unit-testable with neither HTTP nor a database - 154 backend unit tests run with no database at all |
| Test coverage *(measured)* | Backend **72.66% lines / 85.28% branches / 38.15% functions**; frontend **2.16% lines**. Emitted as lcov by `npm run test:coverage` in both packages, archived by CI and published to Codecov under per-package flags (opt-in on a repository secret) |

**Strength.** Testability is a *consequence* of the modularity decision rather than an afterthought - the clearest demonstration in the codebase that architecture choices were made for reasons. The measured figures corroborate it: the layers designed as pure functions are the layers with high branch coverage.

**Weakness.** Frontend unit coverage is **2.16%** - only two components have Vitest specs, with the rest of the UI covered by Playwright end-to-end runs that contribute nothing to a V8 unit-coverage report. Backend function coverage (38.15%) is similarly depressed because controllers, repositories and adapters are reached only by the integration suite, which is excluded from the coverage run. `Booking.status` also declares two unreachable values (`scanned`, `rejected`) - a maintenance trap for the next developer.

**Deliberate omission worth defending.** Neither package declares a **failing coverage threshold**. A minimum set before the baseline is known either sits low enough to assert nothing or breaks the build on day one; in both cases it measures the threshold rather than the code. Publishing the number first and setting a floor under it once it is trusted is the defensible order, and CI marks the coverage step `continue-on-error` to make that stance explicit rather than accidental.

**Recommendation.** Merge integration-run coverage into the same lcov report so the published figure reflects the suite that actually exercises the outer layers, extend Vitest to checkout validation and `usePaystack` state handling, then set thresholds just under the resulting numbers. Either implement or remove the unreachable enum values.

---

## 8. Flexibility *(2011: Portability)*

| Sub-characteristic | Evidence |
|---|---|
| Adaptability | All environment-specific configuration is externalised (`config.env`, `DEV_FRONTEND_URL`, Paystack/Cloudinary/SMTP credentials); no hard-coded hosts in server code |
| Installability | `docker compose up --build` provisions the full stack including replica-set initialisation |
| Replaceability | Repository abstraction isolates the database; the payment integration is hand-rolled against the HTTP API rather than an SDK, so the provider is swappable |

**Weakness.** No deployment *target* is configured. CI now builds both container images and publishes them to GHCR on a green `main` build, so a versioned artefact exists for every release - but nothing pulls and runs them, so the system is packaged rather than deployed. A second, narrower constraint: `NEXT_PUBLIC_BASE_URL` is inlined by `next build`, so the published frontend image is environment-specific and cannot be repointed at run time.

**Recommendation.** Add a deploy job that pulls the published SHA tag onto a host (Render/Railway for the API, Vercel for the frontend), so the demo runs against a hosted instance as the assignment brief requires. Either build one frontend image per environment, or move the API base URL to a runtime-fetched config endpoint so a single image serves every target.

---

## 9. Safety *(2023 model only)*

*Freedom from risk of harm to people, business, property or the environment.*

| Sub-characteristic | Evidence |
|---|---|
| Operational constraint | `Event.venueCapacity` is enforced at the door by `admissionService.capacityDecision`, evaluated **inside** the admission transaction so two scanners at capacity − 1 cannot both admit |
| Hazard warning | The live dashboard exposes `remaining`, `atCapacity` and `capacitySource`, so an organiser sees capacity approaching rather than learning about it from a queue outside |
| Fail-safe | Reservation expiry returns seats rather than stranding inventory - a commercial rather than physical safety property |
| Accountability | Exceeding capacity requires a deliberate per-scan `overrideCapacity: true` after a 409 - not a sticky mode - and is recorded on the audit row as `reason: 'capacity_override'` |

**Found and fixed - and the reason this section was previously overstated.** The limit was implemented, unit-tested and visible in the UI, but the scan query populated the event with `select: 'user'`, so `venueCapacity` and `totalQuantity` arrived `undefined`. The service computed a limit of `0`, which `capacityDecision` correctly reads as *no limit configured* - so the guardrail took the permissive branch on **every real scan** and never once stopped anyone. Nothing failed; the control simply did not run. It is now enforced, and pinned by integration tests that exercise the real query rather than the decision function in isolation.

The lesson generalises past this feature, and is the strongest maintainability point in this document: **a unit test of a decision function cannot detect that the function is being fed the wrong data.** Three separate controls in this codebase were disabled by exactly that mechanism (`isRootAdmin`, `payout.subaccountCode`, and the capacity fields). Where a control depends on a `select: false` or narrowly-projected field, the test that proves it works has to go through the query.

**Strength.** This is the clearest example in the system of a **stop-and-confirm rather than a hard block**, and the reasoning is defensible in both directions: refusing outright would strand a paying guest at the door with no recourse, while admitting silently would defeat the safety purpose entirely. Requiring an explicit, logged decision keeps a named human accountable for the trade-off - which is what fire-safety regulation actually assumes exists. A field left blank means *unlimited* rather than *zero*, so an organiser who never entered a capacity is not accidentally locked out of their own door.

**Weakness.** Capacity is enforced but not *reported on*: there is no occupancy history or evacuation-support view, so the system can prove who was admitted but cannot readily answer "how many people are inside right now" after the fact. Nothing decrements on exit, since the system has no concept of leaving.

**Recommendation.** Add an occupancy timeline to the dashboard and an exit-scan mode, so the admitted count reflects people present rather than people who arrived. That is the difference between an attendance record and a safety instrument.

---

## Applying this in the report

1. **Do not reproduce the whole table.** Select three characteristics - a strength (Security or Maintainability), a measured weakness (Performance Efficiency), and one you then *acted on* (Safety or Interaction Capability) - and discuss each with evidence.
2. **The gaps are worth more than the strengths.** The Outstanding band asks for "strengths and weaknesses… plus recommendations of the areas for improvements". Every section above ends in a recommendation; that structure is deliberate - reuse it.
3. **Cite the standard properly** in CU APA style, using the edition your module materials use.

---

*Assessed against branch `dev` on 5 August 2026. Ratings are the development team's own reasoned self-assessment, not a certified evaluation, and should be presented as such.*
