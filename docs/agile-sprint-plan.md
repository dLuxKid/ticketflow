# TicketFlow — Agile Delivery Plan (Azure Boards)

**Document version:** 1.1 · **Prepared:** 5 August 2026 · **Revised:** 6 August 2026 · **Tool:** Azure DevOps — Azure Boards (Scrum process)

> **Purpose.** Supplies the Task 1.1 evidence: the agile approach, the Scrum roles adopted, the specific techniques used for **requirements, planning and tracking**, and the per-member contribution breakdown that every band of the marking criteria requires.
>
> **How to use this honestly.** The sprint structure below is derived from what the repository actually shows was delivered — the phased commit history maps cleanly onto seven increments. The **names in §4 and §8 must be filled in to reflect who genuinely did what.** A board that contradicts your team's real working pattern is worse than a thin one: markers can compare it against the repository, and an inconsistency reads as fabrication rather than evidence.
>
> **One risk to address now.** The Git history is authored almost entirely by a single account. If work was in fact shared, add `Co-authored-by:` trailers going forward, and treat Azure Boards as the primary contribution record — with each work item's *Assigned To*, state changes and comments carrying the attribution the commits do not. If the work genuinely was concentrated, say so plainly in the report and account for what the other members contributed instead (requirements, testing, documentation, research); an accurate uneven split is defensible, a fabricated even one is not.

---

## 1. Board configuration

| Setting | Value | Rationale |
|---|---|---|
| Process template | **Scrum** | Gives Epic → Feature → Product Backlog Item → Task with Story Points, matching the framework the Outstanding band asks you to apply |
| Iterations | `TicketFlow\Sprint 1…7` | Two-week sprints, compressed to one week for Sprints 6–7 |
| Area paths | `TicketFlow\Backend`, `\Frontend`, `\Data & ML`, `\QA`, `\DevOps` | Lets you filter contribution by discipline — the fastest way to evidence who owned what |
| Board columns | New → Approved → Committed → In Progress → In Review → Done | "In Review" makes peer review visible on the board rather than implied |
| Definition of Ready | Story has acceptance criteria, is estimated, and has no unresolved dependency | Prevents unrefined items entering a sprint |
| Definition of Done | Merged to `dev`, tests pass in CI, documentation updated, peer-reviewed | Cite this verbatim in the report — it ties QA to the workflow |

**Suggested dashboard widgets** (these are what you screenshot): Sprint Burndown, Velocity, Cumulative Flow Diagram, Sprint Capacity, and a query tile "Work items by Assigned To".

---

## 2. Scrum roles

Rotate the Scrum Master role each sprint if your team prefers — note it either way, because "specific agile roles for leadership within the team" is explicitly assessed.

| Role | Responsibility |
|---|---|
| **Product Owner** | Owns and orders the backlog, writes acceptance criteria, accepts or rejects completed stories, represents the market research |
| **Scrum Master** | Facilitates ceremonies, maintains the board, removes blockers, tracks velocity and burndown, guards the Definition of Done |
| **Development team** (all five) | Estimate, commit, build and test. Every member contributes to design, implementation *and* testing — required by the brief's additional note 2 |

---

## 3. Sprint calendar

**Adjust these dates to your actual module dates before submitting.** The pattern — a run of two-week sprints closing shortly before the deadline, compressed at the end under scope pressure — is what matters.

| Sprint | Dates | Goal |
|---|---|---|
| 1 | 25 May – 7 Jun 2026 | Walking skeleton: auth, event CRUD, data model |
| 2 | 8 – 21 Jun 2026 | Ticket sales that cannot oversell or mischarge |
| 3 | 22 Jun – 5 Jul 2026 | Admission that cannot double-admit |
| 4 | 6 – 19 Jul 2026 | Invite-only guest management and live arrivals |
| 5 | 20 Jul – 2 Aug 2026 | Analytics and intelligence features |
| 6 | 3 – 9 Aug 2026 | Compliance, quality, safety, release and demo |
| 7 | 10 – 16 Aug 2026 | Attendee engagement, AI concierge, administration and quality engineering |

Sprints 6 and 7 are **one week each** rather than two — the deadline did not move to accommodate the added scope. Compressing the cadence rather than pretending the work fit is the accurate account, and the retrospective should record what that cost.

---

## 4. Team and ownership

Fill in the names. Each member owns a discipline **and** contributes to design, implementation and testing across sprints.

| ID | Name | Primary role | Area path | Principal deliverables |
|---|---|---|---|---|
| M1 | *[name]* | Scrum Master · DevOps | `DevOps` | GitHub Actions CI, Docker Compose, replica-set provisioning, release process |
| M2 | *[name]* | Product Owner · UX | `Frontend` | Market research, backlog, design system, accessibility, usability testing |
| M3 | *[name]* | Backend / domain lead | `Backend` | Data model, transactions, admission service, payments integration |
| M4 | *[name]* | Frontend lead | `Frontend` | App Router structure, checkout, dashboard, scanner UI |
| M5 | *[name]* | QA · Data & ML lead | `QA`, `Data & ML` | Test strategy, anomaly detection, NL queries, no-show model, evaluation harnesses |

---

## 5. Product backlog — Epics and Features

| Epic | Features |
|---|---|
| **E1 Accounts & access** | Registration and authentication · Role-based access control · Profile management |
| **E2 Event management** | Event creation and editing · Discovery and search · Access modes (public / invite-only / hybrid) |
| **E3 Ticket sales** | Seat reservation · Payment integration · Ticket issuance and delivery |
| **E4 Admission** | QR scanning · Atomic check-in · Usher assignment · Audit logging · Capacity safety |
| **E5 Guest management** | Guest list import · Invite issuance · GDPR erasure |
| **E6 Live operations** | Arrivals dashboard · Real-time streaming · Anomaly detection |
| **E7 Intelligence** | Natural-language guest queries · No-show prediction |
| **E8 Quality & compliance** | Automated testing · CI/CD · Coverage measurement · Load testing · Accessibility · Usability evaluation · Documentation |
| **E9 Attendee networking** | Meet and Greet directory · Event Chat (Public) · Direct messages · Guest access by one-time code |
| **E10 AI concierge** | Chatbot with tool calling · Event Q&A · Weather and dress-code advice |

---

## 6. Sprint breakdown

Story points use a Fibonacci scale (1, 2, 3, 5, 8, 13). Points shown are indicative — **re-estimate as a team using planning poker** and record your own numbers, since the rubric rewards the technique being genuinely applied.

### Sprint 1 — Walking skeleton *(34 pts)*

| ID | User story | Pts | Owner | Epic |
|---|---|---|---|---|
| S1.1 | As a visitor, I can register and log in so that I can access my account | 5 | M3 | E1 |
| S1.2 | As a user, I can reset a forgotten password so that I am not locked out | 3 | M3 | E1 |
| S1.3 | As an organiser, I can create an event with images so that it can be discovered | 8 | M3 | E2 |
| S1.4 | As a visitor, I can browse and open events so that I can decide what to attend | 5 | M4 | E2 |
| S1.5 | As the team, we have a layered backend architecture so that logic stays testable | 8 | M3 | E8 |
| S1.6 | As the team, we have a repository and branching strategy so that work integrates safely | 5 | M1 | E8 |

**Review demo:** register → create an event → see it listed.

### Sprint 2 — Ticket sales that cannot oversell *(42 pts)*

| ID | User story | Pts | Owner | Epic |
|---|---|---|---|---|
| S2.1 | As a buyer, I can purchase a ticket so that I can attend | 8 | M4 | E3 |
| S2.2 | As the business, inventory is reserved atomically so that we never oversell | 13 | M3 | E3 |
| S2.3 | As the business, payment is confirmed server-side so that a client cannot fake success | 8 | M3 | E3 |
| S2.4 | As a buyer, my seat is held before I pay so that I am never charged without a ticket | 8 | M3 | E3 |
| S2.5 | As a buyer, I receive a QR ticket by email so that I can get in | 5 | M4 | E3 |

**Key technique to cite:** S2.2 was proven with a concurrency test rather than asserted (`inventory.reservation.test.js`).

### Sprint 3 — Admission that cannot double-admit *(39 pts)*

| ID | User story | Pts | Owner | Epic |
|---|---|---|---|---|
| S3.1 | As door staff, I can scan a QR so that I can admit a guest quickly | 8 | M4 | E4 |
| S3.2 | As the business, a ticket admits exactly once so that it cannot be reused | 13 | M3 | E4 |
| S3.3 | As an organiser, I can assign ushers so that only my staff can admit | 5 | M3 | E4 |
| S3.4 | As an organiser, every scan is logged so that entry is auditable | 5 | M5 | E4 |
| S3.5 | As door staff, I can admit manually so that a broken screen does not stop the queue | 3 | M4 | E4 |
| S3.6 | As the team, admission logic is unit-tested without a database so that rules stay verifiable | 5 | M5 | E8 |

### Sprint 4 — Guest management and live operations *(45 pts)*

| ID | User story | Pts | Owner | Epic |
|---|---|---|---|---|
| S4.1 | As an organiser, I can run an invite-only event so that entry is by guest list | 8 | M3 | E2 |
| S4.2 | As an organiser, I can import a guest list from CSV/Excel so that setup is fast | 8 | M4 | E5 |
| S4.3 | As a guest, I receive a single-use QR invite so that I can be admitted | 5 | M3 | E5 |
| S4.4 | As an organiser, I see arrivals live so that I can manage the door | 13 | M4 | E6 |
| S4.5 | As an organiser, I can add one guest at a time so that small changes are not painful | 3 | M4 | E5 |
| S4.6 | As an organiser, I can erase a guest's data on request so that we meet GDPR obligations | 8 | M5 | E5 |

### Sprint 5 — Intelligence *(37 pts)*

| ID | User story | Pts | Owner | Epic |
|---|---|---|---|---|
| S5.1 | As an organiser, suspicious scan patterns are flagged so that fraud is visible | 13 | M5 | E6 |
| S5.2 | As an organiser, I can ask questions in plain English so that I need no training | 13 | M5 | E7 |
| S5.3 | As an organiser, I see expected no-shows so that I can plan capacity | 8 | M5 | E7 |
| S5.4 | As the team, each model is evaluated with metrics so that claims are evidenced | 3 | M5 | E8 |

**Key technique to cite:** each of the three used a *different* evaluation method — precision/recall, intent accuracy, and an offline model report.

### Sprint 6 — Compliance, quality, safety and release *(48 pts)*

| ID | User story | Pts | Owner | Epic |
|---|---|---|---|---|
| S6.1 | As the business, expired data is anonymised automatically so that retention is compliant | 8 | M5 | E8 |
| S6.2 | As a user with a disability, the interface meets WCAG 2.2 AA so that I can use it | 8 | M2 | E8 |
| S6.3 | As the team, CI runs tests on every change so that regressions are caught | 5 | M1 | E8 |
| S6.4 | As the team, the stack runs from one command so that it is reproducible | 5 | M1 | E8 |
| S6.5 | As door staff, I am stopped at venue capacity so that we do not breach fire safety | 8 | M3 | E4 |
| S6.6 | As the team, ticket IDs are server-issued so that a buyer cannot choose their own code | 5 | M3 | E4 |
| S6.7 | As the team, usability is tested with real users so that design claims are evidenced | 5 | M2 | E8 |
| S6.8 | As the team, component tests cover the frontend so that rendering logic is verified | 4 | M4 | E8 |

### Sprint 7 — Engagement, concierge and administration *(84 pts)*

The largest sprint by points, and worth explaining rather than hiding: it absorbed a **scope expansion accepted mid-project** (attendee networking and the AI concierge were not in the original backlog) alongside a **security defect found during review** that could not wait. A sprint carrying 84 points against a ~40-point velocity is a planning failure by the numbers; presenting it honestly, with the reason, is better evidence of agile understanding than smoothing it across earlier sprints would be. Note in the retrospective what this cost.

| ID | User story | Pts | Owner | Epic |
|---|---|---|---|---|
| S7.1 | As an attendee, I can meet other attendees so that events feel social | 8 | M3 | E9 |
| S7.2 | As an attendee, I can chat with everyone at the event so that I can join the conversation | 5 | M4 | E9 |
| S7.3 | As an attendee, I can message someone privately so that I can follow up one to one | 5 | M4 | E9 |
| S7.4 | As a guest without an account, I can join the Meet and Greet so that I am not excluded | 8 | M3 | E9 |
| S7.5 | As a visitor, I can ask questions in plain English so that I can find the right event | 13 | M5 | E10 |
| S7.6 | As an attendee, I am told what to wear and expect so that I arrive prepared | 8 | M5 | E10 |
| S7.7 | As an organiser, I can describe my venue fully so that attendees know what to expect | 5 | M4 | E2 |
| S7.8 | As the platform, administrators cannot be self-registered so that access cannot be escalated | 5 | M3 | E1 |
| S7.9 | As the root administrator, I control who becomes an administrator so that privilege is not shared freely | 8 | M3 | E1 |
| S7.10 | As an administrator, I can remove events and users so that the platform can be moderated | 8 | M3 | E1 |
| S7.11 | As the team, we know how much code is tested so that quality claims are evidenced | 3 | M5 | E8 |
| S7.12 | As the team, we know the system holds under load so that performance is measured, not assumed | 5 | M1 | E8 |
| S7.13 | As the team, the backend is linted in CI so that defects are caught before merge | 3 | M1 | E8 |

**Review demo:** guest receives an access code by email → joins Event Chat (Public) → asks the concierge what to wear → admin archives a test event.

**Two items to draw attention to in the report.** S7.8 was not a feature but a **vulnerability fix**: signup accepted an arbitrary `role`, so any visitor could register as an administrator. Finding it during review, fixing it, and verifying the fix against a running server is exactly the security-awareness evidence the rubric asks for. S7.13 paid for itself immediately — the first CI lint run caught a route bound to a controller export that did not exist, which would have crashed the server on boot.

---

## 7. Techniques for requirements, planning and tracking

Name these explicitly in the report — the marking criteria assess them by category.

### Requirements
- **User stories** in role–goal–benefit form, every one with acceptance criteria
- **INVEST** applied at refinement to keep stories independent and testable
- **MoSCoW** prioritisation — Must (E1–E4), Should (E5–E6), Could (E7), Won't-this-time (offline PWA scanner, waitlist, facial check-in — recorded in `innovation-ideas.md` as an explicitly deferred scope decision)
- **Backlog refinement** each sprint, mid-sprint
- **Definition of Ready** gate before commitment

### Planning
- **Sprint planning** opening each sprint, producing a sprint goal
- **Planning poker** for story-point estimation, re-estimating when the team disagreed by more than two cards
- **Capacity planning** against each member's realistic availability alongside other modules
- **Velocity** used to size the following sprint's commitment

### Tracking
- **Daily stand-up** (asynchronous where timetables clashed — say so, it is a legitimate adaptation)
- **Sprint burndown** and **cumulative flow** on the Azure Boards dashboard
- **Board states** with WIP limits on In Progress
- **Sprint review** demonstrating working software each sprint
- **Retrospective** producing at least one concrete action carried into the next sprint
- **Pull requests** linked to work items, so a commit traces to a story

---

## 8. Per-member contribution breakdown

Complete this from your board once the work items carry real assignments. Export via **Boards → Queries → "Work items by Assigned To"** and screenshot it alongside this table.

| Member | Role | Design contribution | Implementation contribution | Testing contribution | Stories | Points |
|---|---|---|---|---|---|---|
| M1 *[name]* | Scrum Master · DevOps | CI/CD pipeline design, container topology, branching strategy | GitHub Actions workflow, Docker Compose, replica-set provisioning, load-test harness | CI test orchestration, sequential-run flakiness investigation, backend lint gate | S1.6, S6.3, S6.4, S7.12, S7.13 | 23 |
| M2 *[name]* | Product Owner · UX | Market research, backlog and acceptance criteria, design system, accessibility audit | Theme tokens, navigation, accessibility remediation | Usability study (ISO 9241-11, SUS), WCAG 2.2 AA audit | S6.2, S6.7 | 13 |
| M3 *[name]* | Backend lead | Data model and ERD, state machines, transaction boundaries, security model, role/privilege model | Auth, events, reservation and payment flow, atomic admission, capacity guardrail, Meet and Greet, guest OTP access, administration | Integration tests for concurrency and authorisation, role-decision unit tests | S1.1–S1.3, S1.5, S2.2–S2.4, S3.2, S3.3, S4.1, S4.3, S6.5, S6.6, S7.1, S7.4, S7.8–S7.10 | 134 |
| M4 *[name]* | Frontend lead | Interaction design, component architecture, screen flows | Checkout, scanner, live dashboard, guest manager, chat UI, extended event form | Component tests (Vitest/RTL), Playwright E2E | S1.4, S2.1, S2.5, S3.1, S3.5, S4.2, S4.4, S4.5, S6.8, S7.2, S7.3, S7.7 | 72 |
| M5 *[name]* | QA · Data & ML | Test strategy, quality model mapping, ML and AI feature design | Anomaly rules, NL query parser, no-show model, retention sweep, AI concierge, weather advice | Unit-test suite, evaluation harnesses, GDPR sweep tests, coverage measurement | S3.4, S3.6, S4.6, S5.1–S5.4, S6.1, S7.5, S7.6, S7.11 | 87 |
| | | | | | **Total** | **329** |

> **The distribution above is deliberately uneven, and that is the point of showing it.** M3 carries roughly 41% of the points because the backend concentrates the genuinely hard work (transactions, concurrency, payment integrity, the privilege model), while M1 and M2 carry far fewer *story* points because CI configuration, accessibility auditing and usability research are high-value work that story points measure badly. Say this in the report rather than flattening the numbers — recognising that velocity is a planning tool and not a productivity ranking is itself an evaluative observation, and it protects members whose contribution does not show up as points.
>
> Note also that the totals **grew by a third in Sprint 7** (245 → 329) without the team growing. That is what accepting a mid-project scope expansion actually costs, and the honest reading is that it was absorbed by the members already carrying the most, which is a delivery risk rather than a success. A retrospective that names this is stronger evidence than a burndown that hides it.

**If the split is uneven, present it as it is and explain why** — differing prior experience, timetable clashes, a member joining late. An honest account with evidence scores better than a suspiciously even one, and the individual reflection in Task 3 explicitly asks you to evaluate your own contribution critically.

---

## 9. Evidence to capture for the report

| Screenshot | Where in Azure Boards | Evidences |
|---|---|---|
| Product backlog with Epics/Features/Stories | Boards → Backlogs | Requirements technique |
| Sprint board mid-sprint, cards in several columns | Boards → Sprints → Taskboard | Tracking technique |
| Sprint burndown | Sprints → Analytics | Tracking, and honest reporting of a sprint that did not burn down cleanly |
| Velocity across all six sprints | Analytics → Velocity | Planning maturity over time |
| Cumulative flow diagram | Analytics → CFD | Bottleneck identification |
| Work items grouped by Assigned To | Queries | **Per-member contribution — required by every band** |
| One story with acceptance criteria and linked PR | Any work item | Traceability from requirement to code |
| A retrospective board | Wiki or Retrospectives extension | Continuous improvement |

**Evaluate, don't just show.** The Outstanding band requires "an evaluation of their strengths and weaknesses with recommendations". Candidates grounded in this project: two-week sprints were long for a 12-week module and delayed feedback; the backend/frontend split concentrated risk in one member; testing infrastructure arriving in Sprint 6 meant earlier sprints lacked a safety net; and the Definition of Done was not enforced by CI until Sprint 6.

---

## 10. Importing into Azure Boards

`agile-backlog-import.csv` (alongside this file) contains every story above.

1. **Boards → Work Items → Import Work Items**, upload the CSV.
2. Create the six iterations first (**Project Settings → Project configuration → Iterations**) or the Iteration Path column will not resolve.
3. Replace the placeholder `Assigned To` values with your real Azure DevOps user identities — the import matches on account, not display name.
4. CSV import creates work items but **does not build the Epic → Feature → Story hierarchy**. After importing, create the Epics and Features manually and drag stories onto them in the backlog view, or add a `Parent` column with the real parent IDs in a second pass once those IDs exist.
5. Verify field names against your Azure DevOps version before a large import — process templates differ, and Scrum uses *Product Backlog Item* where Agile uses *User Story*.

---

*Prepared 5 August 2026. Sprint dates and member names are placeholders to be aligned with your team's actual delivery record before submission.*
