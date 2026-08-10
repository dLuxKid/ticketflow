# TicketFlow, Report Figure Index

**Purpose.** One place holding every diagram the report needs, in the order the assessment
brief asks for them, with the caption and description text ready to paste under each.

**How to use it.** Work top to bottom. Each entry gives the section it belongs to, the figure
caption in the sample report's format (`Figure N <Title>` followed by a `Description:`
paragraph), and the file to drop in. Figure numbers restart from 1 here; renumber once the
narrative screenshots are interleaved, since those take numbers too.

**Structure follows** `Assessment Brief.pdf` (Task 1.1 and Task 1.2, weighted 15% each) and
the section numbering of `sample report.pdf`.

> **Two things to fix before submission.**
>
> 1. **Nothing here evidences Task 1.2's Testing requirement as a screenshot.** The test
>    suites exist and pass, but the brief asks for *"test cases and results in screen shots"*.
>    Section 1.2.3 below lists exactly which runs to capture. That is a capture job, not a
>    writing job, and it cannot be done from the repository alone.
> 2. **Figures 1 to 6 do not exist yet either.** They are Azure Boards screenshots, and the
>    board now holds the data to produce them. Section 1.1 says which views to open.

---

## Task 1.1: Agile approach, leadership, risks and ethics *(15%)*

The brief requires the agile project to be **"supported by the evidence of using agile
software"**. That means screenshots of Azure Boards, not descriptions of it. All six are
available from the board as it now stands: 13 Epics, 33 Features, 73 Backlog Items and 198
Tasks across four sprints, every item assigned.

| # | Figure | Where to capture it | What it evidences |
|---|---|---|---|
| 1 | Product backlog, Epic to Feature to Backlog Item to Task | Boards → Backlogs, with Epics and Features enabled | Requirements technique, and that the hierarchy is real rather than described |
| 2 | Sprint board mid-sprint with cards in several columns | Boards → Sprints → Taskboard | Tracking technique |
| 3 | Sprint burndown | Sprints → Analytics | Honest reporting, including a sprint that did not burn down cleanly |
| 4 | Velocity across all four sprints | Analytics → Velocity | Planning maturity, and the Sprint 3 and 4 loading named in the plan |
| 5 | Work items grouped by Assigned To | Boards → Queries | **Per-member contribution, required by every marking band** |
| 6 | One backlog item with its acceptance criteria and linked commit | Any work item | Traceability from requirement to code |

**Supporting document:** [`docs/agile-sprint-plan.md`](../agile-sprint-plan.md) carries the
sprint calendar, ceremony schedule, Scrum Master rotation and the per-member contribution
table. The narrative for this section should be drawn from it rather than rewritten.

**On contribution, say the uneven part out loud.** The board shows 3, 3, 2, 3, 2 epics per
member but 169 against 83 items overall, and effort points at 50% for one member. The sample
report scored well partly by naming its own delivery problems, and the plan's §8 already
frames why story points measure facilitation, acceptance criteria and accessibility work
badly. A suspiciously even split invites the comparison against the repository that would
expose it.

---

## Task 1.2.1: Design *(part of 15%)*

> *"Design (giving evidence of models and diagrams related to data and functionality in
> screen shots)"*

Ordered from the outside in: what the system is for, what it holds, how it is built, then how
the critical paths behave. This is the same progression the sample report uses.

### Figure 7: Use Case Diagram

![Use case diagram](../diagrams/use-case.png)

**Description:** The functional scope of TicketFlow across six actors and nine subsystems.
Stick figures are actors, with people on the left and external systems on the right. Solid
lines are actor associations, coloured per actor so a bundle can be traced across the page;
dashed arrows are `«include»` and `«extend»` dependencies. The four highest-traffic actors
carry colour and the two with almost no associations stay neutral, because a palette of six
distinct hues cannot be told apart reliably where any two lines may sit adjacent. The `GUEST
LIST` band is annotated *invite-only and hybrid events only*, recording a precondition on the
event rather than a permission on the actor.

**Source:** `docs/diagrams/use-case.png` · editable: `lucid/TicketFlow_Use Case Diagram.drawio`

### Figure 8: Data Model (Entity Relationship Diagram)

![Data model](../diagrams/mermaid/technical-documentation-2.png)

**Description:** Six collections and ten relationships. Crow's-foot cardinality; `FK` marks a
reference and `UK` a unique index. Field notes carry the rules that matter: `select:false` on
credentials and on the Paystack subaccount code, `unique per event` on a guest email, and
`server-authoritative` on booking price. The `USER.payout` sub-document holds only a masked
account name and the last four digits, because storing full account numbers would create a
payment-data liability the system has no capability to act on.

**Source:** `docs/diagrams/mermaid/technical-documentation-2.png` · editable:
`lucid/TicketFlow_Data Model Diagram.drawio`

### Figure 9: System Architecture Diagram

![System architecture](../diagrams/architecture.png)

**Description:** Seven layers from client to external services. Each box names the actual
files or symbols it stands for, so every claim is checkable against the source tree. Solid
arrows are synchronous calls; purple dashed arrows are the asynchronous and inbound paths,
namely the Paystack webhook, the in-process event emitters and the server-sent-events push.
The AI boundary is deliberately visible: only the concierge leaves the process for inference,
while anomaly detection, no-show prediction and natural-language guest queries run locally,
so guest data never reaches a third party.

**Source:** `docs/diagrams/architecture.png` · editable:
`lucid/TicketFlow_System Architecture.drawio`

### Figure 10: Data Flow Diagram, Level 0 (Context)

![Data flow level 0](../diagrams/mermaid/data-flow-diagram-1.png)

**Description:** The system as a single process against its external entities, showing what
crosses each boundary in both directions. Establishes the trust boundary that the security
argument in Task 1.1 depends on.

**Source:** `docs/diagrams/mermaid/data-flow-diagram-1.png` · editable:
`lucid/TicketFlow_Data Flow Level 0.drawio`

### Figure 11: Data Flow Diagram, Level 1

![Data flow level 1](../diagrams/mermaid/data-flow-diagram-2.png)

**Description:** The eight numbered processes and the six data stores they read and write.
Process numbers map onto the service modules in Figure 9, so the two diagrams describe the
same system at different altitudes.

### Figure 12: Package Diagram, Layered Dependencies

![Package diagram](../diagrams/mermaid/design-models-5.png)

**Description:** The dependency rule, enforced rather than aspirational. Controllers never
reach models directly and services never touch `req`/`res`. Authorisation lives in the
service layer, so the same ownership rule holds no matter which route reaches it.

### Figure 13: Class Diagram, Admission Subsystem

![Class diagram](../diagrams/mermaid/design-models-6.png)

**Description:** The classes behind door check-in, the one path where correctness is
non-negotiable. Shows the decision function separated from the persistence call, which is
what makes the authorisation rule unit-testable without a database.

### Figure 14: Booking State Machine

![Booking state machine](../diagrams/mermaid/design-models-1.png)

**Description:** Admission modelled as a six-state machine on `Booking.status` rather than a
boolean. `isCheckedIn` is a derived value, so there is exactly one source of truth. The guard
on the transition into `admitted` is what makes a second scan of the same ticket fail rather
than silently succeed.

**Source:** editable: `lucid/TicketFlow_Booking State Machine.drawio`

### Figure 15: Sequence: Door Scan and Admission

![Door scan sequence](../diagrams/mermaid/design-models-3.png)

**Description:** The integrity-critical path. The claim on the ticket and its audit entry
commit as a single transaction, so two simultaneous scans of one ticket admit exactly once
and both attempts are recorded. Verified by a concurrency test rather than asserted.

**Source:** editable: `lucid/TicketFlow_Sequence - Door Scan and Admission.drawio`

### Figure 16: Sequence: Ticket Purchase and Payment

![Purchase sequence](../diagrams/mermaid/architecture-diagram-2.png)

**Description:** Inventory is held before payment and released if payment never completes, so
an abandoned checkout costs nothing. The amount is computed on the server from the event's own
tiers and never read from the browser, closing a defect that previously allowed a buyer to
name their own price. The charge is confirmed only against a signature-verified webhook.

**Source:** editable: `lucid/TicketFlow_Sequence - Ticket Purchase.drawio`

### Figure 17: Sequence: Guest List Import and Invite Issuance

![Guest import sequence](../diagrams/mermaid/design-models-4.png)

**Description:** Each guest is persisted before the invite email is attempted, so a mail
outage cannot lose the list. Invalid rows are reported as skipped rather than failing the
whole import.

**Source:** editable: `lucid/TicketFlow_Sequence - Guest List Import.drawio`

### Figure 18: Sequence: Meet and Greet Access by One-Time Code

![Guest access sequence](../diagrams/mermaid/design-models-8.png)

**Description:** Guests without accounts join by proving control of the booking email. The
response is deliberately identical whether or not the address holds a ticket, because a
distinguishable response would turn the endpoint into an attendee-enumeration oracle. Worth
citing directly in the ethics and privacy discussion of Task 1.1.

**Source:** editable: `lucid/TicketFlow_Sequence - Meet and Greet Guest Access.drawio`

---

## Task 1.2.2: Implementation *(part of 15%)*

> *"Implementation (giving evidence of source code examples with annotations to explain the
> code in screen shots)"*

These are **screenshots of code**, not diagrams, so they are listed as a capture plan rather
than embedded. Pick the extracts where the code shows judgement, not the ones that are merely
long. Each needs a short annotation saying what problem it solves.

| # | Extract | File | Why this one |
|---|---|---|---|
| 19 | Atomic admission | `backend/src/repositories/bookingRepository.js` | A conditional update inside a transaction. The guard is the whole design. |
| 20 | Server-authoritative pricing | `backend/src/services/pricingService.js` | Closes a real defect: the amount was previously taken from the client. |
| 21 | Platform fee and split settlement | `backend/src/services/pricingService.js` | Fee computed in minor units and rounded down, so rounding never favours the platform by accident. |
| 22 | Signup role whitelist | `backend/src/services/authService.js` | A privilege-escalation hole found by inspection and closed. Strong security-awareness evidence. |
| 23 | Scan authorisation | `backend/src/services/admissionService.js` | A pure decision function, unit-testable without a database. |
| 24 | Single definition of a guest list | `backend/src/models/eventModel.js` | `hasGuestList` used by both the API and the UI, so the two cannot disagree. |
| 25 | AI concierge tool-calling loop | `backend/src/services/chatbot/chatbotService.js` | The model picks a tool; the service executes it against real data. The model never invents an event. |

**Annotate, do not narrate.** The sample report pairs each screenshot with two or three
sentences naming the technique. Match that density.

---

## Task 1.2.3: Testing *(part of 15%)*

> *"Testing (giving test cases and results in screen shots) for usability according to
> international quality standards"*

**This is the weakest area of the current evidence and the easiest to fix.** The tests exist
and pass; what is missing is the captures.

| # | Capture | Command or source | Evidences |
|---|---|---|---|
| 26 | Backend suite passing | `cd backend && npm test` | 195 unit tests, including concurrency and authorisation |
| 27 | Frontend suite passing | `cd frontend && npm test` | Component tests |
| 28 | Coverage report | `cd backend && npm run test:coverage` | Measured quality, not claimed |
| 29 | CI run, all jobs green | GitHub Actions, a run on `dev` | Definition of Done enforced by automation |
| 30 | Concurrency test proving one ticket admits once | `backend/tests/integration/` | The claim made in Figure 15, demonstrated |
| 31 | Usability study results | [`docs/usability-test-plan.md`](../usability-test-plan.md) | **ISO 9241-11 and SUS. This is what the brief means by "international quality standards".** |
| 32 | Accessibility audit | [`docs/accessibility.md`](../accessibility.md) | WCAG 2.2 AA |
| 33 | Quality model mapping | [`docs/quality-model-iso25010.md`](../quality-model-iso25010.md) | ISO/IEC 25010 |

**Read the wording of the brief carefully.** It says testing *"for usability according to
international quality standards"*. Unit tests alone do not answer it. Figures 31 to 33 are the
ones that do, and all three documents already exist.

---

## Task 1.2: Demo video *(part of 15%)*

> *"a 10-minute demo video for the best working software features with live data"*

The brief requires that **at the start of the video** the team lists each member's
contribution and each individual's critical appraisal of entrepreneurial characteristics and
leadership style. That is a scripted opening, not an afterthought.

Suggested run of features, which follows the strongest paths in the design section:

1. Create an event with tiers and a currency, then publish it
2. Buy a ticket as a guest with no account, paying with a Paystack test card
3. Open the emailed ticket and its QR
4. Import a guest list from CSV and receive the invite
5. Scan at the door, then **scan the same ticket again and be refused**
6. Watch the live arrivals dashboard update as it happens
7. Ask the AI concierge what to wear to the event
8. Show organiser revenue against platform fee income

Step 5 is the one to linger on. It demonstrates a correctness property rather than a feature.

**Step-by-step scripts:** [`docs/feature-testing-guide.md`](../feature-testing-guide.md)
covers all 79 features with exact steps and expected results.

---

## Source and regeneration

| Asset | Location |
|---|---|
| Rendered PNG and SVG for every diagram | `docs/diagrams/` and `docs/diagrams/mermaid/` |
| Editable originals for Lucidchart or draw.io | `docs/diagrams/lucid/*.drawio` |
| Graphviz sources for the two hand-laid diagrams | `docs/diagrams/src/*.dot` |
| Regenerate the rendered images | `node docs/diagrams/render.mjs` |
| Regenerate the editable files | `python3 docs/diagrams/lucid/build.py` |

Every diagram exists as an image as well as source, because a fenced mermaid block shows as
raw text in a Word or PDF export, which is how this work is submitted.
