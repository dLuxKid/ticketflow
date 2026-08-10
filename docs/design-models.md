# TicketFlow - Design Models

**Document version:** 1.1 · **Verified against:** branch `dev`, 6 August 2026

> **Added in 1.1.** §6 - event lifecycle and archival state machine (derived `isLive`, soft-delete transition). §7 - sequence diagram for guest access to Meet and Greet by emailed one-time code.

> Companion to [`technical-documentation.md`](technical-documentation.md), which carries the architecture overview and entity-relationship model. This document adds the **behavioural and structural** models - state machines, interaction sequences and package structure - so the design evidence spans several modelling techniques rather than one family.
>
> Every model here was derived by reading the implementation, not from an idealised design. Where the code and a textbook model would differ, the code is shown and the discrepancy is called out.

## Modelling techniques used across the documentation set

| Technique | Category | Document |
|---|---|---|
| Use-case diagram | Functional / requirements | `use-case-diagram.md` |
| Data-flow diagram | Functional / process | `data-flow-diagram.md` |
| Architecture / deployment diagram | Structural | `architecture-diagram.md`, `technical-documentation.md` §3 |
| Entity-relationship diagram | Data | `technical-documentation.md` §4 |
| **State machine diagram** | **Behavioural** | **§1 and §6 below** |
| **Sequence diagram** | **Behavioural / interaction** | **§2–3 and §7 below** |
| **Package & class diagram** | **Structural** | **§4–5 below** |

---

## 1. Booking state machines

A booking carries **two independent status axes**. Collapsing them into one field would make legitimate states unrepresentable - a ticket can be paid but not yet admitted, and a free-event ticket is admitted having never been charged.

### 1.1 Admission lifecycle - `Booking.status`

```mermaid
stateDiagram-v2
    [*] --> issued: reserveBooking() / issueInvite()

    issued --> delivered: invite email sent<br/>(guestService.issueInvite)
    issued --> admitted: admitById() guarded update
    delivered --> admitted: admitById() guarded update

    issued --> revoked: releaseByReference()<br/>charge failed or hold expired
    delivered --> revoked: releaseByReference()

    admitted --> issued: checkInAttendee(false)<br/>manual undo

    admitted --> [*]
    revoked --> [*]

    note right of admitted
        Guarded: admitById only matches
        status in {issued, delivered, scanned}.
        A second concurrent scan matches
        nothing and is rejected - this is
        the single-use guarantee.
    end note
```

<!-- Rendered image. Regenerate with: node docs/diagrams/render.mjs -->
![design-models diagram 1](diagrams/mermaid/design-models-1.png)

*[Full-resolution SVG](diagrams/mermaid/design-models-1.svg)*


**Guard condition.** The transition to `admitted` is a conditional atomic update (`bookingRepository.admitById`) that matches only `status ∈ {issued, delivered, scanned}`. Two concurrent scans therefore produce exactly one match; the loser re-reads the booking, maps the current status to a rejection reason via `rejectionReasonForStatus`, writes a rejection audit row and returns HTTP 409. This is the behaviour proved by `tests/integration/admission.scan.test.js`.

**Rejections are not a booking state.** A refused scan is recorded on `AuditLog` (`outcome: 'rejected'`), never on the booking. The booking keeps whatever status it already held, which is what allows a guest rejected once - say, arriving at the wrong event - to be admitted later at the right one.

> **Finding: two enum values are unreachable.** `Booking.status` declares `scanned` and `rejected`, but no code path assigns either. `scanned` is accepted by the admittable guard (so a booking in that state *could* be admitted) but nothing ever writes it, and `rejected` is superseded by the audit-log design described above. Recorded in `technical-documentation.md` §12 as a cleanup item - either implement a scanned-but-not-yet-admitted step or remove the values, since a declared-but-unreachable state is a maintenance trap.

### 1.2 Payment lifecycle - `Booking.transactionStatus`

```mermaid
stateDiagram-v2
    [*] --> pending: reserveBooking()<br/>seats held, 15-min TTL

    pending --> success: confirmByReference()<br/>charge verified with Paystack
    pending --> failed: releaseReservation('failed')<br/>charge failed or abandoned
    pending --> expired: releaseReservation('expired')<br/>hold lapsed, swept

    success --> [*]
    failed --> [*]
    expired --> [*]

    note left of pending
        reservationExpiresAt is set here
        and $unset on every exit, so the
        expiry sweep can never re-select
        a resolved reservation.
    end note
```

<!-- Rendered image. Regenerate with: node docs/diagrams/render.mjs -->
![design-models diagram 2](diagrams/mermaid/design-models-2.png)

*[Full-resolution SVG](diagrams/mermaid/design-models-2.svg)*


Both exits from `pending` are **guarded on `pending` itself** (`updateMany({ reference, transactionStatus: 'pending' }, …)`). Whichever caller obtains `modifiedCount > 0` owns the follow-up side effect - sending tickets, or returning seats to inventory. This is what makes the flow safe against Paystack's webhook retries racing the client's confirm call, and against the expiry sweep racing a late confirmation. Covered by `tests/integration/reservation.lifecycle.test.js`.

### 1.3 Combined state validity

| `transactionStatus` | `status` | Meaning | Reachable |
|---|---|---|---|
| `pending` | `issued` | Seats held, awaiting payment | ✓ |
| `success` | `issued` / `delivered` | Paid, ticket issued, not yet arrived | ✓ |
| `success` | `admitted` | Paid and at the venue | ✓ |
| `failed` / `expired` | `revoked` | Abandoned checkout, seats returned | ✓ |
| `pending` | `admitted` | Admitted without paying | ✗ - free events are confirmed inline before tickets exist |

---

## 2. Sequence - atomic door admission

The critical path of the system: it must admit exactly once under concurrency, and must never log an admission that did not happen.

```mermaid
sequenceDiagram
    autonumber
    actor U as Door staff
    participant APP as TicketFlow
    participant DB as Database
    participant D as Organiser dashboard

    U->>APP: Scan a ticket or invite QR
    APP->>DB: Find the booking behind that code
    APP->>APP: May this person work this event?

    alt Not permitted
        APP->>DB: Record the refused attempt
        APP-->>U: Refused
    end

    rect rgb(238, 242, 255)
        note over APP,DB: One transaction: the admission and its audit entry<br/>either both commit, or neither does
        APP->>DB: Admit, but only if the ticket is still unused
        alt Ticket was unused
            DB-->>APP: Admitted
        else Ticket already used
            DB-->>APP: Nothing changed
        end
    end

    alt Admitted
        APP->>D: Arrival appears live
        APP-->>U: Admitted
    else Not admittable
        APP->>DB: Record the refusal and why
        APP-->>U: Already admitted, or revoked
    end
```

<!-- Rendered image. Regenerate with: node docs/diagrams/render.mjs -->
![design-models diagram 3](diagrams/mermaid/design-models-3.png)

*[Full-resolution SVG](diagrams/mermaid/design-models-3.svg)*


**Why the audit write is inside the transaction.** If the admission committed but the audit row failed, the log would under-report admissions; if the reverse, it would show admissions that never happened. Since the log is the input to both the live dashboard and anomaly detection, either inconsistency corrupts downstream features. Binding them in one transaction is why MongoDB must run as a replica set.

**Why the reason is re-read rather than inferred.** When the guard matches nothing, the service does not assume "already admitted" - it re-reads the booking and maps the actual current status, so a revoked ticket is reported as revoked rather than mislabelled.

---

## 3. Sequence - guest invite issuance

```mermaid
sequenceDiagram
    autonumber
    actor O as Organiser
    participant APP as TicketFlow
    participant DB as Database
    participant M as Email
    actor G as Guest

    O->>APP: Upload a guest list (CSV or Excel)
    APP->>APP: Check the event actually has a guest list
    APP->>APP: Read the rows, skipping any that are invalid

    loop for each valid guest
        APP->>DB: Add the guest and issue one single-use invite
        APP->>M: Send the invite with its QR code
        M->>G: Invite arrives
        alt Sent
            APP->>DB: Mark the invite delivered
        else Send failed
            note over APP,DB: The guest is saved before the email is attempted,<br/>so a mail outage cannot lose the list.
        end
    end

    APP-->>O: Summary: how many added, how many skipped, and why
```

<!-- Rendered image. Regenerate with: node docs/diagrams/render.mjs -->
![design-models diagram 4](diagrams/mermaid/design-models-4.png)

*[Full-resolution SVG](diagrams/mermaid/design-models-4.svg)*


**Deliberate design points.** The guest and its booking are persisted *before* the email is attempted, so a mail outage cannot lose the guest list. The unique compound index on `{event, email}` makes re-importing the same file idempotent at the guest level rather than issuing duplicate invites.

**Known weakness shown honestly.** The `catch` around delivery is empty - a misconfigured mailer produces no log line and no user-visible signal, only guests silently stuck at `issued`. This is limitation 4 in `technical-documentation.md` §12.

---

## 4. Package diagram - layered dependencies

```mermaid
flowchart TD
    subgraph presentation["Presentation layer"]
        R["routes/<br/>userRoutes · eventRoutes · bookingRoutes"]
        C["controllers/<br/>10 modules - HTTP only, no business rules"]
    end

    subgraph domain["Domain layer"]
        S["services/<br/>14 modules - framework-agnostic, no req/res"]
        SH["shared/<br/>errors · events · utils · middleware"]
    end

    subgraph data["Data-access layer"]
        RE["repositories/<br/>5 modules - the only Mongoose callers"]
        M["models/<br/>5 Mongoose schemas"]
    end

    EXT[("MongoDB")]

    R --> C
    C --> S
    S --> RE
    S --> SH
    RE --> M
    M --> EXT

    C -. "must not" .-> RE
    S -. "must not" .-> M

    classDef forbidden stroke-dasharray: 4 4,stroke:#b91c1c,color:#b91c1c
    class C,S forbidden
```

<!-- Rendered image. Regenerate with: node docs/diagrams/render.mjs -->
![design-models diagram 5](diagrams/mermaid/design-models-5.png)

*[Full-resolution SVG](diagrams/mermaid/design-models-5.svg)*


**The rule this encodes.** Each layer may call only the one beneath it. No controller imports a repository; no service imports a Mongoose model. The two dashed edges are the violations the structure exists to prevent.

**Why it matters beyond tidiness.** Because services take no `req`/`res` and touch no Mongoose types, the authorisation rules are ordinary pure functions - which is exactly why `admissionService.authorizeScan` and `dashboardService.canViewDashboard` can be unit-tested with no HTTP layer and no database (`tests/unit/admission.authz.test.js`, `tests/unit/dashboard.authz.test.js`). The layering is what buys the test strategy.

---

## 5. Class diagram - admission subsystem

The subsystem carrying the single-use guarantee, modelled structurally.

```mermaid
classDiagram
    class AdmissionController {
        +scan(req, res, next)
    }

    class AdmissionService {
        +checkInByScan(code, actor, context) Result
        +authorizeScan(actor, event) Decision
        +rejectionReasonForStatus(status) string
        -recordRejection(...) void
    }

    class BookingRepository {
        +findByInviteTokenOrTicketId(code) Booking
        +admitById(bookingId, session) Booking
        +findById(id) Booking
        +confirmByReference(ref, fields) UpdateResult
        +releaseByReference(ref, status) UpdateResult
    }

    class AuditLogRepository {
        +record(entry, session) AuditLog
    }

    class AdmissionEvents {
        +emitAdmitted(payload) void
        +subscribe(eventId, handler) void
    }

    class Booking {
        +ObjectId event
        +string status
        +string transactionStatus
        +string ticketId
        +string inviteToken
        +isCheckedIn() bool
    }

    class AuditLog {
        +ObjectId event
        +ObjectId booking
        +ObjectId actor
        +string outcome
        +string reason
        +bool manual
    }

    AdmissionController --> AdmissionService
    AdmissionService --> BookingRepository
    AdmissionService --> AuditLogRepository
    AdmissionService --> AdmissionEvents
    BookingRepository --> Booking
    AuditLogRepository --> AuditLog
    Booking "1" --> "0..*" AuditLog : scan attempts
```

<!-- Rendered image. Regenerate with: node docs/diagrams/render.mjs -->
![design-models diagram 6](diagrams/mermaid/design-models-6.png)

*[Full-resolution SVG](diagrams/mermaid/design-models-6.svg)*


`authorizeScan` and `rejectionReasonForStatus` are exported separately from `checkInByScan` specifically so the decision logic can be exercised without a database - the structural choice that makes the authorisation matrix in §7.2 of the technical documentation directly testable.

---

## 6. State machine - event lifecycle and archival

An event's visible state is **derived, not stored**: `isLive` is computed from `startDate`, `endDate` and the current time. Only archival is a persisted transition.

```mermaid
stateDiagram-v2
    [*] --> upcoming : created
    upcoming --> live : startDate reached
    live --> past : end of endDate
    upcoming --> archived : admin DELETE
    live --> archived : admin DELETE
    past --> archived : admin DELETE
    archived --> upcoming : isActive restored
    archived --> [*]

    note right of live
        isLive is computed, never written.
        The window runs to the END OF DAY
        of endDate - a single-day event
        (startDate == endDate) previously
        produced a zero-length window and
        was never live.
    end note

    note right of archived
        isActive: false + deletedAt.
        A pre(/^find/) hook hides it from
        every query. NOTHING is deleted:
        bookings (including paid ones),
        guests, chat messages and audit
        rows all survive, so the state is
        fully reversible.
        Ushers ARE unassigned - a scan
        scope on a hidden event is
        meaningless.
    end note
```

<!-- Rendered image. Regenerate with: node docs/diagrams/render.mjs -->
![design-models diagram 7](diagrams/mermaid/design-models-7.png)

*[Full-resolution SVG](diagrams/mermaid/design-models-7.svg)*


The derived-versus-stored distinction is the design point. A stored `status` field would need a scheduler to advance it and would be wrong between ticks; computing it means the answer is correct by construction. The cost is that the computation exists in two places - server and client - and must agree, which is exactly how the zero-length-window defect stayed invisible until a single-day event was created.

---

## 7. Sequence - guest access to Meet and Greet by one-time code

The problem this solves: most attendees have **no account**. A guest checkout or an emailed invite captures only a name and an email, so gating the attendee network on login would exclude the majority of the people it exists to connect. Authorisation is instead *proof of control over the email address on a booking*.

```mermaid
sequenceDiagram
    actor G as Guest with no account
    participant APP as TicketFlow
    participant M as Email

    G->>APP: Ask to join the Meet and Greet
    APP->>APP: Look for a valid booking on that email address

    alt Booking found
        APP->>APP: Make a 6-digit code, store only its hash
        APP->>M: Email the code
    else No booking
        APP->>APP: Do nothing at all
    end

    APP-->>G: The same response either way
    Note over APP,G: The reply must not reveal whether an address holds a<br/>ticket, or the endpoint becomes a way to enumerate attendees.

    G->>APP: Enter the code
    APP->>APP: Check it against the stored hash, and that it has not expired or been used

    alt Correct
        APP-->>G: Signed in, joins the event chat
    else Wrong or expired
        APP-->>G: The same generic failure for both
    end
```

<!-- Rendered image. Regenerate with: node docs/diagrams/render.mjs -->
![design-models diagram 8](diagrams/mermaid/design-models-8.png)

*[Full-resolution SVG](diagrams/mermaid/design-models-8.svg)*


Four decisions in this flow are worth defending in the report:

1. **Identical responses on request.** Differentiating "code sent" from "no such ticket" would turn the endpoint into a way to test whether any given person is attending - a privacy leak, not merely an information leak.
2. **Only the hash is stored,** with a 10-minute TTL, mirroring the password-reset design already in the codebase rather than inventing a second convention.
3. **`timingSafeEqual`, not `===`.** Over a 6-digit space, a timing side-channel is a realistic rather than theoretical concern.
4. **Verification mints an *ordinary* session.** From that point the guest travels exactly the same authorisation paths as a registered attendee. The alternative - a parallel "guest permission" model - would be a second implementation of the same rules, free to drift out of agreement with the first.

---

*Derived from branch `dev` on 6 August 2026. Diagrams render natively in GitHub, VS Code and the published artifact; export as PNG/SVG via the Mermaid Live Editor for pasting into the Word submission.*
