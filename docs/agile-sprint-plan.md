# TicketFlow - Agile Delivery Plan (Azure Boards)

**Document version:** 2.1 · **Prepared:** 5 August 2026 · **Revised:** 10 August 2026 · **Delivery window:** 20 July to 15 August 2026 · **Tool:** Azure DevOps, Azure Boards (Scrum process)

> **Purpose.** Supplies the Task 1.1 evidence: the agile approach, the Scrum roles adopted, the specific techniques used for **requirements, planning and tracking**, and the per-member contribution breakdown that every band of the marking criteria requires.
>
> **Changes in 2.1.** The board now carries the full four-level hierarchy: 13 Epics, 33 Features, 73 Backlog Items, 198 Tasks, every level parented. §5 lists the real Epic work item IDs, and §10 records how the upper levels were built and the three configuration traps that make a correctly imported board look empty.
>
> **Changes in 2.0.** The delivery record was consolidated from seven planned increments to the **four sprints the team actually ran**, starting 20 July rather than 13 July. Members are named. QA leadership moved to M2 alongside the Product Owner and UX remit. The Scrum Master role now **rotates each sprint**. Every figure in §3, §6 and §8 is computed from `azure-devops-backlog.csv` rather than estimated, so the board and this document cannot disagree.
>
> **How to use this honestly.** The sprint structure below is derived from what the repository actually shows was delivered. A board that contradicts your team's real working pattern is worse than a thin one: markers can compare it against the repository, and an inconsistency reads as fabrication rather than evidence.
>
> **One risk to address now.** The Git history is authored almost entirely by a single account. If work was in fact shared, add `Co-authored-by:` trailers going forward, and treat Azure Boards as the primary contribution record - with each work item's *Assigned To*, state changes and comments carrying the attribution the commits do not. If the work genuinely was concentrated, say so plainly in the report and account for what the other members contributed instead (requirements, testing, documentation, research); an accurate uneven split is defensible, a fabricated even one is not.

---

## 1. Board configuration

| Setting | Value | Rationale |
|---|---|---|
| Process template | **Scrum** | Gives Epic → Feature → Product Backlog Item → Task with Story Points, matching the framework the Outstanding band asks you to apply |
| Iterations | `Sprint 1` to `Sprint 4`, under the project root | Three 7-day sprints and a closing 6-day sprint, 20 Jul to 15 Aug 2026. Iteration **start and end dates are mandatory**: Azure Boards renders no burndown and no velocity chart without them. `azure-devops-setup.sh` sets them (see §10) |
| Area paths | `Backend`, `Frontend`, `Data and ML`, `QA`, `DevOps`, under the project root | Lets you filter contribution by discipline, the fastest way to evidence who owned what. **`Data and ML`, never `Data & ML`**: Azure DevOps rejects an ampersand in a node name (§10). Created by `azure-devops-setup.sh`, which also subscribes the team to each one, since an area path exists at project level but stays invisible on the board until it does |
| Board columns | New → Approved → Committed → In Progress → In Review → Done | "In Review" makes peer review visible on the board rather than implied |
| Definition of Ready | Story has acceptance criteria, is estimated, and has no unresolved dependency | Prevents unrefined items entering a sprint |
| Definition of Done | Merged to `dev`, tests pass in CI, documentation updated, peer-reviewed | Cite this verbatim in the report - it ties QA to the workflow |

**Suggested dashboard widgets** (these are what you screenshot): Sprint Burndown, Velocity, Cumulative Flow Diagram, Sprint Capacity, and a query tile "Work items by Assigned To".

---

## 2. Scrum roles

The Scrum Master role **rotates every sprint**, so four of the five members each chair a full set of ceremonies and the fifth owns the retrospectives throughout. This is recorded on the board: each sprint carries a `E13-Process` backlog item naming that sprint's chair, so the rotation is evidence rather than a claim.

| Sprint | Scrum Master | Handover to |
|---|---|---|
| 1 | **M1** Ijeoma | M2 |
| 2 | **M2** Abiola | M3 |
| 3 | **M3** Ederhi | M4 |
| 4 | **M4** Adetunji | M5 |
| all four | **M5** Akoki runs every retrospective and holds the Definition of Done | |

Rotating it costs continuity, and that is a real trade-off worth naming in the retrospective: a chair learning the burndown mid-project is slower than one who has run it for a month. It was accepted because "specific agile roles for leadership within the team" is explicitly assessed, and one person holding the role for 27 days gives four members nothing to reflect on.

| Role | Responsibility |
|---|---|
| **Product Owner** | Owns and orders the backlog, writes acceptance criteria, accepts or rejects completed stories, represents the market research |
| **Scrum Master** | Facilitates ceremonies, maintains the board, removes blockers, tracks velocity and burndown, guards the Definition of Done |
| **Development team** (all five) | Estimate, commit, build and test. Every member contributes to design, implementation *and* testing - required by the brief's additional note 2 |

---

## 3. Sprint calendar

**Delivery window: Monday 20 July to Saturday 15 August 2026** (27 calendar days), against a
submission deadline of **17 August 2026**, leaving two days of deliberate slack for the
write-up.

Four increments in 27 days means a **7-day sprint**, not the fortnightly cadence Scrum
assumes. Sprints run **continuously, weekends included**, rather than Monday to Friday with a
break: 27 days does not contain four working weeks. That is an honest consequence of an
intensive summer delivery, and it is worth stating plainly rather than drawing a tidier
calendar than the one the team actually worked.

| Sprint | Dates | Days | Goal | Items | Effort |
|---|---|---|---|---|---|
| 1 | **Mon 20 Jul** to **Sun 26 Jul 2026** | 7 | Foundation: accounts, roles, profiles, CI and containers | 12 | 41 |
| 2 | **Mon 27 Jul** to **Sun 02 Aug 2026** | 7 | Event creation and management | 18 | 62 |
| 3 | **Mon 03 Aug** to **Sun 09 Aug 2026** | 7 | Discovery, concierge, guest management, door operations, attendee engagement | 23 | 132 |
| 4 | **Mon 10 Aug** to **Sat 15 Aug 2026** | 6 | Purchase and ticketing, live operations, revenue, release | 20 | 130 |

**73 backlog items and 198 tasks, 365 points in total.** Counts and effort are read directly
from `azure-devops-backlog.csv`, not estimated here, so the board and this table cannot drift
apart.

### Ceremony schedule

Times are indicative. Fix them to your own availability, but keep the *shape*: planning at
the start, review and retrospective back to back at the end, refinement roughly mid-sprint.

| Sprint | Planning (45 min) | Stand-up (15 min) | Refinement (30 min) | Review (30 min) | Retro (30 min) |
|---|---|---|---|---|---|
| 1 | Mon 20 Jul 09:00 | daily 09:30 | Thu 23 Jul 16:00 | Sun 26 Jul 15:00 | Sun 26 Jul 16:00 |
| 2 | Mon 27 Jul 09:00 | daily 09:30 | Thu 30 Jul 16:00 | Sun 02 Aug 15:00 | Sun 02 Aug 16:00 |
| 3 | Mon 03 Aug 09:00 | daily 09:30 | Thu 06 Aug 16:00 | Sun 09 Aug 15:00 | Sun 09 Aug 16:00 |
| 4 | Mon 10 Aug 09:00 | daily 09:30 | Wed 12 Aug 16:00 | Sat 15 Aug 15:00 | Sat 15 Aug 16:00 |

Roughly 2 hours of ceremonies per sprint plus 1¾ hours of stand-ups, about 3¾ hours per
person per sprint. Sprint 4 is six days and holds its review on the final day of the window,
which doubles as the release decision: there is no sprint after it to carry anything into, so
incomplete work is dispositioned as a documented limitation rather than moved.

**Two numbers to confront in the retrospective.** 365 points across 27 days is roughly
**13.5 points per day** for five people. Either the estimates were generous, or the team
worked well beyond the hours a 20-credit module assumes, and most likely both. Say which in
the report; an unexamined velocity that high invites the question anyway. Sprints 3 and 4
also carry **72% of the total effort** between them, so the burndown shows a gentle start and
a steep finish. That is a real planning weakness, not a presentational one, and naming it is
stronger evidence than a chart that hides it.

---

## 4. Team and ownership

Each member owns a discipline **and** contributes to design, implementation and testing
across every sprint. Ownership on the board is expressed twice: `Assigned To` names the
person accountable for an item, and a `Pair-<account>` tag names a second member who works it
with them, always drawn from outside that discipline. That pairing is what makes "every
member contributes to design, implementation *and* testing" true on the board rather than
only in this paragraph.

| ID | Name | Account | Primary role | Area path | Principal deliverables |
|---|---|---|---|---|---|
| M1 | Ijeoma | `ijeomac@uni.coventry.ac.uk` | Scrum Master (Sprint 1) · DevOps | `DevOps` | GitHub Actions CI, Docker Compose, replica-set provisioning, release process |
| M2 | Abiola | `abiolao5@uni.coventry.ac.uk` | Scrum Master (Sprint 2) · Product Owner · UX · **QA lead** | `QA`, `Frontend` | Market research, backlog and acceptance criteria, design system, accessibility, usability testing, test strategy and the quality gate |
| M3 | Ederhi | `ederhio@uni.coventry.ac.uk` | Scrum Master (Sprint 3) · Backend and domain lead | `Backend` | Data model, transactions, admission service, payments integration, privilege model |
| M4 | Adetunji | `adetunjim@uni.coventry.ac.uk` | Scrum Master (Sprint 4) · Frontend lead | `Frontend` | App Router structure, checkout, dashboard, scanner UI, guest manager |
| M5 | Akoki | `akokic@uni.coventry.ac.uk` | Retrospective facilitator · Data and ML lead | `Data and ML` | Anomaly detection, natural-language queries, no-show model, AI concierge, evaluation harnesses |

**QA leadership sits with M2, not M5.** M2 already owns acceptance criteria as Product Owner
and the accessibility and usability evaluation as UX, and test strategy is the same
discipline: deciding what "correct" means before it is built. M5 retains Data and ML, which
is modelling work rather than quality assurance. The practical consequence is that M2 holds
the Definition of Done gate on work M2 did not write, which is the right way round.

---

## 5. Product backlog: Epics, Features and Backlog Items

The backlog is a four-level hierarchy on the board, exactly as described here: **13
Epics**, **33 Features**, **73 Product Backlog Items** and **198 Tasks**. Every level is
parented, so Boards, Backlogs renders the whole tree rather than a flat list. The Epic IDs
below are the live work item IDs, so any row in this table can be opened directly.

| Epic | ID | Features | Items |
|---|---|---|---|
| **E1 Accounts and access** | `#885` | Registration and authentication · Role-based access control · Profile management | 8 |
| **E2 Event management** | `#881` | Event creation and authoring · Event configuration and access modes · Event lifecycle management | 14 |
| **E3 Ticket sales** | `#874` | Ticket configuration · Checkout and payment · Ticket issuance and inventory integrity | 10 |
| **E4 Admission** | `#877` | QR scanning and atomic check-in · Capacity safety and door staff | 5 |
| **E5 Guest management** | `#875` | Guest list import · Invite issuance · GDPR erasure | 5 |
| **E6 Live operations** | `#880` | Arrivals dashboard and real-time streaming | 1 |
| **E7 Intelligence** | `#884` | Natural-language guest queries · Anomaly detection · No-show prediction | 3 |
| **E8 Quality and compliance** | `#883` | CI/CD and containerisation · Security and access-control assurance · Documentation, coverage and demonstration | 6 |
| **E9 Attendee networking** | `#879` | Meet and Greet directory and chat · Guest access by one-time code · Networking notifications | 4 |
| **E10 AI concierge** | `#882` | Chatbot with tool calling · Weather and dress-code advice | 2 |
| **E11 Discovery** | `#878` | Categories, filters and sorting · Search, trending and upcoming · Event detail page | 6 |
| **E12 Revenue** | `#876` | Platform fee and payouts · Revenue reporting | 4 |
| **E13 Process and facilitation** | `#873` | Sprint facilitation · Retrospectives and Definition of Done | 5 |
| | | **33 features** | **73** |

Two things this table is deliberately honest about.

**Feature sizes are uneven**, from one backlog item (Invite issuance, Anomaly detection,
Event detail page) to seven (Event creation and authoring). Splitting the small ones further
to make the table look tidy would invent structure the work did not have.

**E13 Process is facilitation, not product.** Filter it out before reading velocity, or the
chart credits the team with delivering its own ceremonies. It is on the board because the
rotating Scrum Master role in §2 needs to be evidenced somewhere, not because it shipped
anything to a user.

---

## 6. Sprint breakdown

Story points use a Fibonacci scale (1, 2, 3, 5, 8, 13). The authoritative list of all 73
backlog items and 198 tasks is `azure-devops-backlog.csv`; this section summarises what each
sprint set out to achieve and what its review demonstrated. **Re-estimate as a team using
planning poker** and record your own numbers, since the rubric rewards the technique being
genuinely applied rather than inherited.

### Sprint 1 - Foundation, accounts and access control *(12 items, 41 pts)*

Registration, login and password reset; the four-role model with root-admin seeding from the
CLI; profile management and self-service account deletion; administration views over users.
Alongside it, the delivery infrastructure: GitHub Actions running lint, tests and typecheck,
MongoDB provisioned as a single-node replica set so transactions work, and both packages
containerised.

**Review demo:** register, log in, edit a profile, then attempt to sign up as an
administrator and be refused.

**Key technique to cite:** the signup role whitelist. Accepting an arbitrary `role` in the
request body was a genuine privilege-escalation vulnerability, found by inspection and closed
before any feature depended on it.

### Sprint 2 - Event creation and management *(18 items, 62 pts)*

The full event model and its authoring surface: title and description, the date window and
its derived live state, cover image upload, social links, the sales window, ticket tiers with
quantity and per-order limits, explicit ticket currency, access mode, venue detail, venue
capacity, structured location, editing, and archival.

**Review demo:** create an event with two ticket tiers and a cover image, edit its price, then
archive it and show that its bookings survive.

**Key technique to cite:** access mode as a first-class field rather than a flag. `public`,
`invite_only` and `hybrid` each change what the rest of the system permits, and modelling that
once at the event prevented three later features from inventing their own rules.

### Sprint 3 - Discovery, engagement and event operations *(23 items, 132 pts)*

The largest sprint. Discovery (categories, filters, sorting, search, trending and upcoming);
the AI concierge with tool calling, provider fallback and weather advice; Meet and Greet
including guest access by emailed one-time code; guest list import with single-use QR invites,
natural-language guest queries and GDPR erasure; and door operations, meaning camera scanning,
atomic admission, the capacity guardrail, manual check-in and usher assignment.

**Review demo:** import a guest list from CSV, receive the invite by email, scan it at the
door, scan it a second time and be refused, then ask the concierge what to wear.

**Key technique to cite:** atomic admission. Admission is a conditional update inside a
transaction, so two simultaneous scans of one ticket admit exactly once. It is verified by a
concurrency test rather than asserted.

### Sprint 4 - Purchase, ticketing, live operations and release *(20 items, 130 pts)*

The money path end to end: event detail, order review, Paystack checkout, webhook-verified
confirmation, the digital ticket and its QR, guest checkout, inventory held during checkout
and released on lapse, server-authoritative pricing, the platform fee via split settlement and
organiser payout onboarding. Then live operations (arrivals dashboard over SSE, anomaly
detection, no-show prediction), revenue reporting for organisers and admins, and release:
documentation, diagrams, coverage and the demonstration video.

**Review demo:** buy a ticket as a guest with no account, watch the arrivals dashboard update
as it is scanned, then show the organiser's daily earnings and the platform's fee income side
by side.

**Two items to draw attention to in the report.** Server-authoritative pricing was not a
feature but a **defect fix**: the amount charged was taken from the client, so a buyer could
name their own price for any ticket. The sales and booker list was a second **broken access
control** defect: authenticated but not authorised, so any account could read any event's
attendee names, emails and revenue. Both were found during review, fixed, and pinned with
regression tests that fail against the pre-fix code. That is precisely the security-awareness
evidence the rubric asks for.

---

## 7. Techniques for requirements, planning and tracking

Name these explicitly in the report - the marking criteria assess them by category.

### Requirements
- **User stories** in role–goal–benefit form, every one with acceptance criteria
- **INVEST** applied at refinement to keep stories independent and testable
- **MoSCoW** prioritisation - Must (E1–E4), Should (E5–E6), Could (E7), Won't-this-time (offline PWA scanner, waitlist, facial check-in, deferred as an explicit scope decision and recorded in the sprint review minutes)
- **Backlog refinement** each sprint, mid-sprint
- **Definition of Ready** gate before commitment

### Planning
- **Sprint planning** opening each sprint, producing a sprint goal
- **Planning poker** for story-point estimation, re-estimating when the team disagreed by more than two cards
- **Capacity planning** against each member's realistic availability alongside other modules
- **Velocity** used to size the following sprint's commitment

### Tracking
- **Daily stand-up** (asynchronous where timetables clashed - say so, it is a legitimate adaptation)
- **Sprint burndown** and **cumulative flow** on the Azure Boards dashboard
- **Board states** with WIP limits on In Progress
- **Sprint review** demonstrating working software each sprint
- **Retrospective** producing at least one concrete action carried into the next sprint
- **Pull requests** linked to work items, so a commit traces to a story

---

## 8. Per-member contribution breakdown

Every figure below is counted from `azure-devops-backlog.csv`. Reproduce it from the board
itself via **Boards → Queries → "Work items by Assigned To"** and screenshot that alongside
this table; the two should agree exactly.

| Member | Role | Epics | Features | Stories | Effort | Tasks | Paired on | Total |
|---|---|---|---|---|---|---|---|---|
| M1 Ijeoma | Scrum Master (S1) · DevOps | 3 | 2 | 5 | 18 | 13 | 74 | **97** |
| M2 Abiola | Scrum Master (S2) · PO · UX · QA lead | 3 | 2 | 2 | 10 | 16 | 68 | **91** |
| M3 Ederhi | Scrum Master (S3) · Backend lead | 2 | 13 | 37 | 183 | 89 | 28 | **169** |
| M4 Adetunji | Scrum Master (S4) · Frontend lead | 3 | 10 | 23 | 109 | 67 | 45 | **148** |
| M5 Akoki | Retrospectives · Data and ML lead | 2 | 6 | 6 | 45 | 13 | 56 | **83** |
| | | **13** | **33** | **73** | **365** | **198** | | **317 items** |

**Ownership is assigned on two different principles, and the split is the point.**

*Epics* answer for scope, acceptance and reporting on a theme, not for writing the code, so
they are spread deliberately evenly: 3, 3, 2, 3, 2. Every member answers for a part of the
product at that level. *Features* and everything below follow delivery reality, so they are
not spread at all: they sit with whoever owned the backlog items underneath them.

**Read the two halves of this table against each other, because they say different things.**

By *effort*, the split is stark: M3 carries **50% of the points** and M1 and M2 together carry
under 8%. By *total involvement*, the same five people sit between 83 and 169 items, a ratio
of about two to one rather than eighteen to one. At *epic* level the split is even. All three
are true of the same board, and the distance between them is the finding.

Story points measure the size of a build task. They measure CI configuration, accessibility
auditing, acceptance criteria and usability research badly, and they do not measure
facilitation at all. M3 leads 37 stories because the backend concentrates the genuinely hard
work: transactions, concurrency, payment integrity and the privilege model. M2 leads 2 because
the Product Owner, UX and QA remit produces judgement and gates rather than merge commits, and
because QA work is distributed as *tasks* underneath other people's stories rather than as
stories of its own. That is exactly why M2 holds three epics, including Quality and
compliance: a marker asking "what did the Product Owner own?" gets an answer at the level
where the answer is honest.

Say this in the report rather than flattening the numbers. Recognising that velocity is a
planning tool and not a productivity ranking is itself an evaluative observation, and it
protects members whose contribution does not show up as points. Flattening it would also be
detectable: the repository would contradict it.

**The pairing column is what makes the brief's requirement true.** Every item carries a
`Pair-<account>` tag naming a second member from outside that discipline, so M2 works 68
coding items and M1 works 74 despite leading few. If the team did not genuinely pair this way,
delete the tags rather than keep an unearned claim.

**If the split is uneven, present it as it is and explain why**, whether that is differing
prior experience, timetable clashes, or a member joining late. An honest account with evidence
scores better than a suspiciously even one, and the individual reflection in Task 3 explicitly
asks you to evaluate your own contribution critically.

---

## 9. Evidence to capture for the report

| Screenshot | Where in Azure Boards | Evidences |
|---|---|---|
| Product backlog showing the Epic, Feature, Backlog item, Task tree | Boards → Backlogs, with Epics and Features enabled | Requirements technique, and that the hierarchy in §5 is real rather than described |
| Sprint board mid-sprint, cards in several columns | Boards → Sprints → Taskboard | Tracking technique |
| Sprint burndown | Sprints → Analytics | Tracking, and honest reporting of a sprint that did not burn down cleanly |
| Velocity across all four sprints | Analytics → Velocity | Planning maturity over time, and the Sprint 3 and 4 loading named in §3 |
| Cumulative flow diagram | Analytics → CFD | Bottleneck identification |
| Work items grouped by Assigned To | Queries | **Per-member contribution - required by every band** |
| One story with acceptance criteria and linked PR | Any work item | Traceability from requirement to code |
| A retrospective board | Wiki or Retrospectives extension | Continuous improvement |

**Evaluate, don't just show.** The Outstanding band requires "an evaluation of their strengths and weaknesses with recommendations". Candidates grounded in this project: 7-day sprints gave fast feedback but left no room to absorb a slipped story, so scope moved rather than dates; Sprints 3 and 4 carried 72% of the effort, which is a planning failure visible in the burndown; the backend/frontend split concentrated delivery risk in one member; and rotating the Scrum Master every sprint cost continuity in exchange for four members gaining the experience.

---

## 10. Importing into Azure Boards

Two files sit alongside this one. **Run the setup script first**: the import validates Area
Path and Iteration Path against paths that already exist and will not create them, so every
row fails without it.

| File | Purpose |
|---|---|
| `azure-devops-setup.sh` | Creates the five area paths and the four sprints **with their dates**, and subscribes the team to each |
| `azure-devops-backlog.csv` | 73 backlog items and 198 tasks, with owners, pairs, effort and epic tags |

### Step 1: create the areas and iterations

From the repository root, with the Azure CLI installed and signed in:

```bash
az extension add --name azure-devops
az devops login
./docs/azure-devops-setup.sh https://dev.azure.com/YOUR-ORG TicketFlow "TicketFlow Team"
```

The three arguments are your organisation URL, the project name and the team name. All are
optional and default to `TicketFlow`. The script is idempotent, so a second run skips whatever
already exists, and it needs **Project Administrator** rights.

Sprint dates cannot travel in a CSV at all, which is why they are set here. Without them
Azure Boards renders no burndown and no velocity chart, and those are the two screenshots §9
depends on.

### Step 2: add every member to the project

`Assigned To` is resolved against project membership. An address that is not a member with a
licence assigned **fails that row**. Add all five under **Project Settings → Teams** before
importing.

### Step 3: import the backlog

**Boards → Work Items → Import Work Items**, then upload `azure-devops-backlog.csv`.

Errors are shown inline in a grid and can be corrected before saving. What the import does
*not* do:

- **It never deletes.** Rows with a blank `ID` create new items; rows carrying an existing ID
  update that item in place. Existing work items not named in the file are untouched, so
  importing over a populated board leaves duplicates. Delete the old items first if you want a
  clean slate.
- **It does not build the Epic and Feature levels.** Parent and child links between backlog
  items and their tasks *are* created, through the `Title 1` and `Title 2` columns. Nothing
  above that is. A `Parent` column does **not** work either: CSV import only links items
  within the same file, so an existing work item cannot be re-parented that way.

### Step 4: build the upper hierarchy

The 13 Epics and 33 Features in §5 were created **through the CLI**, not the importer, for the
reason just given. Each backlog item was then moved from its Epic onto the right Feature,
which takes two calls rather than one: a work item holds only one parent, so the old link is
removed before the new one is added.

```bash
az boards work-item create --type Epic --title "E1 Accounts and access" --area "$PROJECT"
az boards work-item relation add --id <feature> --relation-type parent --target-id <epic>
az boards work-item relation remove --id <item> --relation-type parent --target-id <epic> --yes
az boards work-item relation add --id <item> --relation-type parent --target-id <feature>
```

### Step 5: switch the backlog levels on

Epics and Features exist as work items the moment they are created, but the backlog will not
display them until the team subscribes to those levels: **Project Settings → Team
configuration → Backlogs**, tick **Epics** and **Features**. Until then Boards, Backlogs shows
only backlog items and the hierarchy looks absent even though it is there.

The same trap applies to areas, and it is the one most likely to make the board look empty.
A team subscribed to the project root **with sub-areas excluded** shows none of the work,
because every item lives in `\Backend`, `\Frontend`, `\QA`, `\DevOps` or `\Data and ML`.
Note also that `az boards area team update` only edits a path already on the team's list; use
`az boards area team add` for one that is not.

**One naming rule that costs an entire import.** Azure DevOps rejects an ampersand in a
classification node name with `TF50316`, so the area is `Data and ML`, **not** `Data & ML`.
When that area does not exist, every work item referencing it fails with *"The area or
iteration provided could not be found"*, and each of their child tasks fails after it with
`TF401232`, naming a negative work item ID: the temporary ID the importer gave the parent that
never saved.

### Field names differ by process template

This project uses **Scrum**, so the CSV carries `Product Backlog Item` and `Task`, states of
`New` and `To Do`, and an `Effort` column. On the **Agile** template those would be
`User Story`, `New` and `Active`, and `Story Points`. Importing the wrong set fails with
*"Invalid work item type"*, which is worth knowing before a 271-row import.

---

*Prepared 5 August 2026, revised 10 August 2026. Sprint dates, member names and all counts are aligned with `azure-devops-backlog.csv`. Re-estimate the story points as a team before submission: the numbers here are proportionate to implementation complexity, not a record of what the team estimated at the time.*
