# TicketFlow — Product Quality Evaluation (ISO/IEC 25010)

**Document version:** 1.0 · **Verified against:** branch `dev`, 5 August 2026

> **Purpose.** Evaluates TicketFlow against the ISO/IEC 25010 software product quality model, the international standard within the SQuaRE (Systems and software Quality Requirements and Evaluation) series. It supplies the "quality assurance and testing methods **according to international standards**" evidence required by Learning Outcome 3, and the strengths/weaknesses/recommendations depth the Outstanding band expects.
>
> **Companion document.** Usability is assessed separately and empirically against **ISO 9241-11** in [`usability-test-plan.md`](usability-test-plan.md); §4 here summarises and cross-references rather than duplicating it.

## A note on which edition to cite

ISO/IEC 25010 was revised in 2023, superseding the 2011 edition. The characteristic set changed — the 2023 model has nine characteristics, renaming *Usability* to *Interaction Capability* and *Portability* to *Flexibility*, and adding *Safety*. This document is organised on the 2023 model with the 2011 names given alongside.

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
| 2 | Performance Efficiency | **Weak** | Design is sound but **nothing is measured** — no load or latency testing |
| 3 | Compatibility | Moderate | No API versioning policy beyond the `/v1` prefix |
| 4 | Interaction Capability | **Weak → improving** | Accessibility audit covers 2 components; usability testing not yet run |
| 5 | Reliability | **Strong** | No uptime/error monitoring in production |
| 6 | Security | **Strong** | No dependency-vulnerability scanning in CI |
| 7 | Maintainability | **Strong** | Frontend has no unit tests; some dead enum values |
| 8 | Flexibility | Moderate | No deployment target configured |
| 9 | Safety | **Weak** | No venue-capacity enforcement at the door |

The pattern is worth stating plainly in the report: quality attributes that are **structurally designed in** (security, reliability, maintainability) are strong, while those requiring **measurement or user contact** (performance, interaction capability) are the weakest. That is a characteristic profile of a developer-led project without a dedicated QA or UX role, and naming it is itself an evaluative observation.

---

## 1. Functional Suitability

*The degree to which the product provides functions that meet stated and implied needs.*

| Sub-characteristic | Evidence |
|---|---|
| Functional completeness | Three distinct event models (`public`, `invite_only`, `hybrid`) served by one schema; full sell→admit loop plus guest management, live dashboard and three analytics features. Feature-to-source index: `technical-documentation.md` §5.1 |
| Functional correctness | 68 unit assertions + 9 integration suites. Correctness under concurrency proved rather than asserted: `admission.scan.test.js` (two simultaneous scans admit once), `inventory.reservation.test.js` (concurrent buyers cannot oversell) |
| Functional appropriateness | `accessMode` unification means an organiser running a hybrid event uses one workflow, not two products. The single-guest form (`f113cf2`) was added specifically because CSV-only import did not fit how small events actually work |

**Strength.** Correctness evidence targets the paths where correctness is genuinely hard — money and admission — rather than distributing shallow tests evenly.

**Weakness.** There is no explicit traceability from requirements (use cases) to the tests that discharge them, so completeness is argued rather than demonstrated.

**Recommendation.** Add a one-page traceability matrix mapping each use case in `use-case-diagram.md` to the test file that covers it. Cheap to produce and directly answers "test cases" in the marking criteria.

---

## 2. Performance Efficiency

*Performance relative to the resources used under stated conditions.*

| Sub-characteristic | Evidence |
|---|---|
| Time behaviour | Live dashboard uses **Server-Sent Events**, not polling — updates are pushed on admission rather than discovered on an interval. Query paths are indexed: `{inviteToken}`, `{ticketId}` (partial unique), `{reference}`, `{transactionStatus, reservationExpiresAt}`, `{event, piiErasedAt}`, `{event, createdAt:-1}` — each matching a specific access pattern rather than added speculatively |
| Resource utilisation | Real-time fan-out uses an in-process `EventEmitter` rather than Redis or a broker, appropriate at door-staff scale; QR codes are inlined as data URLs, removing an asset-host round trip per ticket |
| Capacity | Inventory reservation uses a guarded atomic `$inc`, so throughput is bounded by MongoDB's document-level contention rather than an application lock |

**Weakness — the most significant evidence gap in this document.** None of the above is *measured*. There is no load test, no latency budget, no throughput figure. The design reasoning is sound but unverified, and an unmeasured performance claim is an assumption.

**Recommendation.** A single `autocannon` or `k6` run against `POST /bookings/create` and `POST /bookings/scan`, reporting p50/p95 latency and requests/second at a stated concurrency, would convert this from assertion to evidence in well under an hour. Include the SSE connection count the dashboard sustains.

---

## 3. Compatibility

| Sub-characteristic | Evidence |
|---|---|
| Co-existence | Four containers share one host without interference (`docker-compose.yml`); backend and frontend deploy independently |
| Interoperability | REST/JSON over `/api/v1`; Paystack webhooks; Cloudinary; SMTP via Nodemailer; guest import accepts both CSV and Excel `.xlsx`; QR codes follow the standard encoding so any reader works |

**Weakness.** The `/v1` prefix exists but no versioning or deprecation policy sits behind it; a breaking change would have no defined migration path for clients.

**Recommendation.** State a versioning policy in the README even if `/v2` never ships — the absence of a policy, not the absence of a version, is the defect.

---

## 4. Interaction Capability *(2011: Usability)*

| Sub-characteristic | Evidence |
|---|---|
| Learnability | Single-guest form added alongside bulk import after CSV-only proved unintuitive — a documented response to a usability problem |
| Operability | Responsive navigation with distinct desktop/mobile/side variants; category carousel exposes scroll affordances conditionally |
| User error protection | Destructive GDPR erasure requires explicit confirmation; seats are reserved **before** payment so a buyer cannot be charged without a ticket; confirmation is idempotent so a double-submit cannot double-charge |
| Accessibility | WCAG 2.2 AA fixes against named success criteria (1.3.1, 1.4.3, 2.4.7, 3.3.2, 4.1.2, 4.1.3) — `docs/accessibility.md` |
| User-interface aesthetics | "Soft cotton" palette with a stated contrast constraint (≥ 4.8:1 for button text, exceeding the 4.5:1 AA minimum) |

**Weakness — two, both material.** First, the accessibility audit honestly covers only two components; checkout, event creation and the public pages are unaudited, and no screen-reader session or full-site automated scan has been run. Second, **no usability testing with real users has taken place**, so every usability claim above is a designer's judgement rather than a measured outcome.

**Recommendation.** Execute [`usability-test-plan.md`](usability-test-plan.md) — five participants, three scenarios, ISO 9241-11 effectiveness/efficiency/satisfaction measures plus SUS. Run axe DevTools or Lighthouse across every route and extend the accessibility findings table. These are the two highest-value quality actions remaining on the project.

---

## 5. Reliability

| Sub-characteristic | Evidence |
|---|---|
| Maturity | Concurrency-sensitive paths covered by tests that issue genuinely simultaneous operations against a real replica set, not mocks |
| Fault tolerance | A failed ticket email is logged but does not undo a confirmed payment (`confirmReservation`); a failed invite email leaves the guest and booking intact for resend |
| Recoverability | Abandoned checkouts are swept and their seats returned (`releaseExpiredReservations`); releases are guarded so concurrent release and webhook retry cannot double-credit inventory; confirmation is idempotent under Paystack's retry behaviour |
| Availability | Docker healthcheck gates replica-set initialisation on startup |

**Strength.** Failure modes are handled with an explicit stance on *which* failure must not propagate — email delivery is allowed to fail without invalidating payment, and that decision is documented in the code rather than implicit.

**Weakness.** No production error tracking or uptime monitoring; `console.error` is the entire observability story. Availability is designed for but not observed.

**Recommendation.** Add structured logging and an error-reporting sink (Sentry's free tier is sufficient) before the demo. Also bind `releaseExpiredReservations` to a scheduler — it is tested and correct but currently nothing invokes it, so recoverability is implemented yet inactive.

---

## 6. Security

| Sub-characteristic | Evidence |
|---|---|
| Confidentiality | Passwords bcrypt-hashed at cost 14 and `select: false`; `inviteToken` also `select: false`; JWT held in an HTTP-only cookie, unreadable to script |
| Integrity | Paystack webhooks verified by HMAC-SHA512 over the **raw** body, so client-reported payment status is never trusted; `reference`, `ticketId` and `event` are all stamped server-side after the client payload is spread, so a caller cannot choose its own admission code or attach to another charge; unique indexes on `ticketId` and `inviteToken` make duplicate credentials unrepresentable |
| Non-repudiation & accountability | `AuditLog` is append-only, one row per scan attempt — success *or* rejection — recording actor, outcome, reason and device |
| Authenticity | JWT with `passwordChangedAt` invalidation, so tokens issued before a password change are refused |
| *(Hardening)* | `helmet`, `express-mongo-sanitize`, `express-xss-sanitizer`, `hpp` with an explicit whitelist, rate limiting at 100 req/hour/IP, credentialed CORS locked to a single origin |

**Strength.** Authorisation is defence-in-depth: a coarse role gate at the route, plus fine-grained ownership decisions in the service layer (`authorizeScan`, `canViewDashboard`), each independently unit-tested. An usher is scoped to assigned events only — least privilege, not merely authentication.

**Weakness.** No automated dependency-vulnerability scanning; `npm audit` is not in CI. Given ~40 direct frontend dependencies this is a realistic exposure. The client-side route guard decodes but does not verify the JWT signature — correct as a UX layer, but it must be documented as such so no one later mistakes it for a control.

**Recommendation.** Add `npm audit --audit-level=high` as a CI step, and Dependabot for updates. Both are configuration-only.

---

## 7. Maintainability

| Sub-characteristic | Evidence |
|---|---|
| Modularity | Strict Controller → Service → Repository → Model layering; no controller imports a repository, no service imports a Mongoose model (`design-models.md` §4) |
| Reusability | `authorizeScan` is reused verbatim by both the QR scanner and the manual check-in path, so the two cannot drift apart in who they permit |
| Analysability | `AuditLog` reconstructs door history; centralised `AppError` and error handler; ESLint 9 + Prettier enforced in CI |
| Modifiability | The repository layer is the only Mongoose caller, so the persistence library could be replaced without touching business logic |
| Testability | Services take no `req`/`res` and return plain data, which is precisely why authorisation logic is unit-testable with neither HTTP nor a database |

**Strength.** Testability is a *consequence* of the modularity decision rather than an afterthought — the clearest demonstration in the codebase that architecture choices were made for reasons.

**Weakness.** The frontend has no unit or component tests at all (Playwright E2E only), so React logic is unverified. `Booking.status` declares two unreachable values (`scanned`, `rejected`) — a maintenance trap for the next developer.

**Recommendation.** Add Vitest + React Testing Library for the checkout state logic and form validation. Either implement or remove the unreachable enum values.

---

## 8. Flexibility *(2011: Portability)*

| Sub-characteristic | Evidence |
|---|---|
| Adaptability | All environment-specific configuration is externalised (`config.env`, `DEV_FRONTEND_URL`, Paystack/Cloudinary/SMTP credentials); no hard-coded hosts in server code |
| Installability | `docker compose up --build` provisions the full stack including replica-set initialisation |
| Replaceability | Repository abstraction isolates the database; the payment integration is hand-rolled against the HTTP API rather than an SDK, so the provider is swappable |

**Weakness.** No deployment target is configured — CI validates but never deploys, and the Paystack public key is hard-coded in `usePaystack.tsx` rather than read from an environment variable, which will break a production build.

**Recommendation.** Move the Paystack public key to `NEXT_PUBLIC_PAYSTACK_KEY`. Add a deploy job so the demo can run against a hosted instance with live data, as the assignment brief requires.

---

## 9. Safety *(2023 model only)*

*Freedom from risk of harm to people, business, property or the environment.*

| Sub-characteristic | Evidence |
|---|---|
| Operational constraint | **None currently.** Nothing prevents admitting guests beyond the venue's safe occupancy |
| Hazard warning | Not implemented |
| Fail-safe | Reservation expiry returns seats rather than stranding inventory — a commercial rather than physical safety property |

**Weakness.** A door scanner that admits without limit is a genuine physical-safety concern: venue occupancy limits exist in fire-safety regulation, and a system that silently exceeds them contributes to a hazard. For an assessment explicitly examining social, legal and ethical awareness, this is a substantive gap rather than a missing feature.

**Recommendation.** Enforce capacity at the door: warn the scanner as admissions approach the event's capacity and require explicit override beyond it, with the override recorded in the audit log. This connects the existing live admitted-count, the atomic check-in and a real legal obligation into one defensible design decision — strong material for both the BCS/ethics discussion and the "advanced concepts" criterion.

---

## Applying this in the report

1. **Do not reproduce the whole table.** Select three characteristics — a strength (Security or Maintainability), a measured weakness (Performance Efficiency), and one you then *acted on* (Safety or Interaction Capability) — and discuss each with evidence.
2. **The gaps are worth more than the strengths.** The Outstanding band asks for "strengths and weaknesses… plus recommendations of the areas for improvements". Every section above ends in a recommendation; that structure is deliberate — reuse it.
3. **Cite the standard properly** in CU APA style, using the edition your module materials use.

---

*Assessed against branch `dev` on 5 August 2026. Ratings are the development team's own reasoned self-assessment, not a certified evaluation, and should be presented as such.*
