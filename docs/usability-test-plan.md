# TicketFlow - Usability Test Plan & Results Pack (ISO 9241-11)

**Document version:** 1.0 · **Prepared:** 5 August 2026 · **Status:** protocol ready to execute

> **What this is.** A complete, executable usability-testing protocol. Sections 1–6 are the plan (write these up as method); sections 7–9 are blank templates you fill in during the sessions; section 10 explains how to analyse and present the results.
>
> **Why it matters for the assessment.** The assignment brief requires "Testing (giving test cases and results in screen shots) **for usability according to international quality standards**". This pack instruments that requirement directly against ISO 9241-11.

---

## 1. Standards basis

| Standard / instrument | Role in this study |
|---|---|
| **ISO 9241-11:2018** - *Ergonomics of human-system interaction: Usability - Definitions and concepts* | Defines usability as the extent to which a system can be used by specified users to achieve specified goals with **effectiveness, efficiency and satisfaction** in a specified context of use. Supplies the three measurement dimensions used throughout |
| **ISO 9241-210:2019** - *Human-centred design for interactive systems* | Frames testing as one iteration of a human-centred design cycle, not a one-off audit |
| **ISO/IEC 25010** - *Product quality model* | Usability / Interaction Capability is one of nine characteristics; this study supplies its empirical evidence (see `quality-model-iso25010.md` §4) |
| **System Usability Scale (SUS)** - Brooke (1996) | Standardised 10-item satisfaction instrument, scored 0–100, with published comparative benchmarks |
| **Single Ease Question (SEQ)** - Sauro & Dumas (2009) | 7-point per-task difficulty rating, capturing satisfaction at task rather than session level |
| **WCAG 2.2 AA** (W3C) | Accessibility conformance, assessed separately in `accessibility.md` |

**Sample size justification.** Five participants per user group is the established convention following Nielsen and Landauer (1993), whose mathematical model of problem discovery shows that approximately 85% of usability problems in an interface are surfaced by the fifth participant, with sharply diminishing returns thereafter. State this justification explicitly in the report - an unjustified small sample reads as a limitation, whereas a justified one reads as method.

---

## 2. Objectives

1. Measure whether representative users can complete the three core TicketFlow journeys unaided.
2. Quantify effectiveness, efficiency and satisfaction per ISO 9241-11.
3. Identify and severity-rate usability defects.
4. Produce a prioritised remediation list, and re-test any fix applied before submission.

---

## 3. Participants

Recruit **5 participants per role** where possible; if the team is small, 5 total covering all three scenarios is acceptable - state which you did.

| Role | Profile | Scenario |
|---|---|---|
| Attendee | Has bought an event ticket online before; no exposure to TicketFlow | 1 |
| Organiser | Has organised an event or managed a guest list (any scale, including informal) | 2 |
| Door staff | No prior system knowledge required - this is the point, door staff are often casual workers briefed in minutes | 3 |

**Exclusion:** anyone who has contributed to TicketFlow's development. A team member testing their own build measures recall, not usability.

---

## 4. Ethics and data protection

Required before any session. This is assessable in its own right under the social, legal and ethical criterion, and it would be incoherent to run an unconsented study on a product whose own GDPR handling you are documenting.

- Obtain **written informed consent** (template, §11) before recording anything.
- State that participation is voluntary and may be stopped at any point without giving a reason.
- Record participants as **P1–P5 only**; store no names, emails or faces alongside results.
- If you screen-record, capture the application window only, and use seeded test data - never a real person's booking.
- Delete raw recordings after the report is submitted; retain only the anonymised results tables.
- Make clear that **the system is being tested, not the participant**. Say this aloud at the start; it measurably reduces participant self-blame and improves think-aloud quality.

---

## 5. Environment and materials

| Item | Detail |
|---|---|
| Build under test | Branch `dev`, commit hash recorded per session |
| Environment | `docker compose up --build`, seeded with at least 3 published events and one invite-only event |
| Device | Desktop browser for Scenarios 1–2; **mobile browser for Scenario 3** - door scanning is a phone task and testing it on a laptop would not reflect the real context of use |
| Payment | Paystack **test** keys only. Never take a real card |
| Timing | Stopwatch or screen-recording timestamps |
| Moderator | One facilitator, one note-taker where possible |

---

## 6. Method

**Think-aloud protocol.** Ask participants to narrate their thinking. Do not answer questions during a task - reflect them back ("What would you expect that to do?"). Intervene only when the participant is fully blocked, and record it as an **assist**, which counts the task as failed for effectiveness purposes.

**Per session (~25 minutes):**
1. Welcome, consent form, explain think-aloud (3 min)
2. Two background questions (2 min)
3. Tasks, timed from first interaction to success/abandon (15 min)
4. SEQ after each task; SUS at the end (5 min)
5. Debrief - most confusing moment, one thing they would change

**Run a pilot with one person first.** It reliably exposes broken seed data or an ambiguous task wording before you spend your real participants on it.

---

## 7. Task scenarios *(templates to complete during sessions)*

Success criteria are defined **before** testing so completion is judged objectively rather than negotiated afterwards.

### Scenario 1 - Attendee: find an event and buy a ticket

> *"You've heard about an event happening soon and want to go. Find it on TicketFlow and buy one ticket for yourself."*

- **Pre-condition:** logged out, on the landing page
- **Success:** confirmation screen reached with a valid ticket displayed
- **Target:** ≥ 80% completion, ≤ 3 minutes
- **Observe specifically:** Is the ticket-quantity/buyer form understood? Is it clear the seat is held before payment? Is the QR recognised as the entry credential?

| Metric | P1 | P2 | P3 | P4 | P5 |
|---|---|---|---|---|---|
| Completed unaided (Y/N) | | | | | |
| Time on task (mm:ss) | | | | | |
| Errors (count) | | | | | |
| Assists (count) | | | | | |
| SEQ (1 very difficult – 7 very easy) | | | | | |

### Scenario 2 - Organiser: set up an invite-only guest list

> *"You're running a private launch for 40 invited guests. Create the event, then add your guest list and send their invitations."*

- **Pre-condition:** logged in as a `creator`, spreadsheet of 5 test guests provided
- **Success:** invite-only event created and at least one guest invited with an invitation issued
- **Target:** ≥ 60% completion, ≤ 6 minutes *(lower bar - this is the most complex journey)*
- **Observe specifically:** Is `accessMode` understood without explanation? Do they find bulk import, or only the single-guest form? Do they realise invitations were sent?

| Metric | P1 | P2 | P3 | P4 | P5 |
|---|---|---|---|---|---|
| Completed unaided (Y/N) | | | | | |
| Time on task (mm:ss) | | | | | |
| Errors (count) | | | | | |
| Assists (count) | | | | | |
| SEQ (1–7) | | | | | |

### Scenario 3 - Door staff: admit a guest, then handle a duplicate

> *"You're on the door. Admit this guest using their QR code. Then a second person presents the same code - deal with it."*

- **Pre-condition:** logged in as an `usher` assigned to the event, on **mobile**; one valid QR provided
- **Success:** first guest admitted; second scan correctly refused **and the participant can explain why** from what the screen told them
- **Target:** 100% completion, ≤ 45 seconds per scan
- **Observe specifically:** Is the refusal message intelligible under time pressure? Would the participant know what to do next with a guest they have just refused?

| Metric | P1 | P2 | P3 | P4 | P5 |
|---|---|---|---|---|---|
| First scan admitted (Y/N) | | | | | |
| Duplicate correctly refused (Y/N) | | | | | |
| Could explain the refusal (Y/N) | | | | | |
| Time per scan (s) | | | | | |
| SEQ (1–7) | | | | | |

---

## 8. System Usability Scale

Administer **once, at the end of the session**, covering the system as a whole. Do not alter the wording - the published benchmarks only hold for the standard items.

*Scale: 1 = Strongly disagree … 5 = Strongly agree*

| # | Statement | P1 | P2 | P3 | P4 | P5 |
|---|---|---|---|---|---|---|
| 1 | I think that I would like to use this system frequently | | | | | |
| 2 | I found the system unnecessarily complex | | | | | |
| 3 | I thought the system was easy to use | | | | | |
| 4 | I think that I would need the support of a technical person to be able to use this system | | | | | |
| 5 | I found the various functions in this system were well integrated | | | | | |
| 6 | I thought there was too much inconsistency in this system | | | | | |
| 7 | I would imagine that most people would learn to use this system very quickly | | | | | |
| 8 | I found the system very cumbersome to use | | | | | |
| 9 | I felt very confident using the system | | | | | |
| 10 | I needed to learn a lot of things before I could get going with this system | | | | | |

### Scoring

1. **Odd-numbered items (1,3,5,7,9):** score = response − 1
2. **Even-numbered items (2,4,6,8,10):** score = 5 − response
3. Sum the ten adjusted scores (range 0–40)
4. **Multiply by 2.5** → SUS score, 0–100

> A SUS score is **not a percentage**. A score of 70 does not mean "70% usable" - it is a position on a 0–100 scale interpreted against the benchmarks below.

### Interpretation

| SUS score | Interpretation |
|---|---|
| **68** | Benchmark average across studies (Sauro & Lewis) - at the 50th percentile |
| < 51 | Poor - significant usability problems, in the bottom ~15% |
| 51–68 | Below average - usable but with real friction |
| 68–80.3 | Good - above average |
| > 80.3 | Excellent - top ~10%, the threshold associated with users recommending the product |

Report the **mean across participants**, and state the range. With n = 5, do not report a standard deviation as though it were precise; note the small sample as a limitation.

---

## 9. Results summary *(complete after all sessions)*

### 9.1 ISO 9241-11 measures

| Dimension | Measure | Result | Target | Met? |
|---|---|---|---|---|
| **Effectiveness** | Overall task completion rate (%) | | ≥ 80% | |
| **Effectiveness** | Mean errors per task | | ≤ 1 | |
| **Efficiency** | Mean time on task - Scenario 1 | | ≤ 3:00 | |
| **Efficiency** | Mean time on task - Scenario 2 | | ≤ 6:00 | |
| **Efficiency** | Mean time per scan - Scenario 3 | | ≤ 45 s | |
| **Satisfaction** | Mean SUS score | | ≥ 68 | |
| **Satisfaction** | Mean SEQ across tasks | | ≥ 5.5 | |

### 9.2 Defect log

Severity: **1** Cosmetic · **2** Minor (irritation, self-recovered) · **3** Major (task significantly delayed or needed an assist) · **4** Critical (task could not be completed)

| ID | Observed problem | Scenario | Participants affected | Severity | WCAG / heuristic | Proposed fix | Fixed? |
|---|---|---|---|---|---|---|---|
| U1 | | | | | | | |
| U2 | | | | | | | |
| U3 | | | | | | | |
| U4 | | | | | | | |
| U5 | | | | | | | |

### 9.3 Actions taken

| Defect | Change made | Commit | Re-tested? | Outcome |
|---|---|---|---|---|
| | | | | |

**This table is where the marks concentrate.** Testing that identifies problems is competent; testing that identifies, fixes and *re-verifies* them demonstrates the human-centred design iteration ISO 9241-210 describes. Fix at least the highest-severity defect and re-test it, even with a single participant.

---

## 10. Presenting the results

**Screenshots to capture for the Word submission:**
1. A completed data-capture table (§7) - this is your "test cases and results"
2. The SUS calculation worked through for one participant, showing the method
3. The results summary (§9.1) with targets met/missed
4. The defect log (§9.2)
5. Before/after screenshots of at least one fixed defect
6. One session photo or anonymised screen-recording still, if consent covers it

**In the report narrative:**
- State the standard and the definition it gives, then your three measures under it
- Justify n = 5 (Nielsen & Landauer)
- Report what **failed** as prominently as what passed - a plan reporting 100% success on every task reads as untested, not as excellent
- Close with the strengths / weaknesses / recommendations structure the Outstanding band asks for
- Reference in CU APA style: ISO, Brooke, Nielsen & Landauer, Sauro & Lewis

**Predicted friction points**, from reviewing the interface - use these to sharpen observation, not to bias it:
- `accessMode` (public / invite-only / hybrid) is domain vocabulary presented without explanation
- The reserve→pay→confirm flow is correct but the 15-minute hold is never surfaced to the buyer
- A refused duplicate scan returns HTTP 409; whether door staff can act on that message is untested
- The QR is now the entry credential, but nothing on the confirmation screen says "show this at the door"

---

## 11. Consent form template

> **Usability study - TicketFlow**
>
> You are invited to take part in a usability study for a student software project at Coventry University. Please read this before agreeing.
>
> **Purpose.** To find out how easy TicketFlow is to use, so it can be improved. **We are testing the software, not you** - any difficulty you experience is useful information about the design.
>
> **What's involved.** About 25 minutes. You will attempt three short tasks while describing your thoughts aloud, then answer a 10-question rating scale.
>
> **Data.** You will be identified only as a participant number (e.g. P3). No name, email or contact detail will be stored with the results. [Screen recording of the application window only will be made and deleted after the assessment is submitted.] Anonymised results will appear in a university coursework report.
>
> **Voluntary.** You may pause, skip a task, or stop entirely at any point without giving a reason, and may ask for your data to be withdrawn up until the report is submitted.
>
> I have read and understood the above and agree to take part.
>
> Participant ID: ………  Signature: ………………………  Date: ………………
>
> Researcher: ………………………  Date: ………………

---

*Protocol prepared 5 August 2026 against branch `dev`. Record the exact commit hash tested in each session so results remain traceable to a build.*
