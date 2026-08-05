# TicketFlow — Data Flow Diagram (DFD)

> **Diagram set:** [Architecture](architecture-diagram.md) · [Use cases](use-case-diagram.md) · [Data flow](data-flow-diagram.md)

Levelled, Gane–Sarson style. External entities are stadium-shaped, processes are circles,
data stores are cylinders. Process numbers are stable across levels and are referenced from
the other two documents.

| Process | Implemented by |
|---|---|
| 1.0 Manage identity & access | `authService`, `userService` |
| 2.0 Publish & manage events | `eventService` |
| 3.0 Sell tickets & take payment | `bookingService`, `paymentService` |
| 4.0 Manage guest list & invites | `guestService`, `usherService` |
| 5.0 Admit at the door | `admissionService` |
| 6.0 Report live arrivals | `dashboardService`, `admissionBus` |
| 7.0 Analyse | `anomalyReportService`, `anomalyService`, `noShowService`, `nlGuestQueryService` |
| 8.0 Retain & erase PII | `retentionService` |

---

## Level 0 — Context diagram

```mermaid
graph LR
    ATT(["Attendee /<br/>Visitor"])
    ORG(["Organiser"])
    USH(["Door staff"])
    ADM(["Admin"])
    PAY(["Paystack"])
    MAIL(["Email service<br/>Gmail SMTP"])
    CLD(["Cloudinary"])
    SCH(["Retention scheduler"])

    SYS(("0<br/>TicketFlow<br/>system"))

    ATT -->|"credentials, ticket selection,<br/>buyer name & email"| SYS
    SYS -->|"event listings, PDF ticket + QR,<br/>booking record"| ATT

    ORG -->|"event details, cover image,<br/>guest CSV, NL question"| SYS
    SYS -->|"guest list, live arrivals,<br/>anomaly flags, no-show scores"| ORG

    USH -->|"scanned code, deviceId, ip"| SYS
    SYS -->|"admit / reject verdict"| USH

    ADM -->|"user administration requests"| SYS
    SYS -->|"user records, any event's dashboard"| ADM

    SYS -->|"checkout amount + reference"| PAY
    PAY -.->|"HMAC-signed webhook"| SYS

    SYS -->|"ticket, invite and reset emails"| MAIL
    SYS -->|"cover image"| CLD
    CLD -->|"hosted image URL"| SYS

    SCH -->|"sweep trigger + retention window"| SYS
    SYS -->|"erasure counts"| SCH
```

---

## Level 1 — Processes and data stores

```mermaid
graph TB
    ATT(["Attendee /<br/>Visitor"])
    ORG(["Organiser"])
    USH(["Door staff"])
    ADM(["Admin"])
    PAY(["Paystack"])
    MAIL(["Email service"])
    CLD(["Cloudinary"])
    SCH(["Retention scheduler"])

    P1(("1.0<br/>Manage identity<br/>& access"))
    P2(("2.0<br/>Publish &<br/>manage events"))
    P3(("3.0<br/>Sell tickets<br/>& take payment"))
    P4(("4.0<br/>Manage guest list<br/>& invites"))
    P5(("5.0<br/>Admit at<br/>the door"))
    P6(("6.0<br/>Report live<br/>arrivals"))
    P7(("7.0<br/>Analyse"))
    P8(("8.0<br/>Retain &<br/>erase PII"))

    D1[("D1 users")]
    D2[("D2 events")]
    D3[("D3 bookings")]
    D4[("D4 guests")]
    D5[("D5 auditlogs")]
    D6[("D6 no-show model<br/>ml/no_show/model.json")]

    %% 1.0
    ATT -->|"signup / login credentials"| P1
    ORG --> P1
    USH --> P1
    ADM -->|"user admin request"| P1
    P1 -->|"bcrypt hash, role, reset token"| D1
    D1 -->|"user record, role, assignedEvents"| P1
    P1 -->|"JWT httpOnly cookie"| ATT
    P1 -->|"password-reset link"| MAIL
    P1 -->|"authenticated principal"| P2
    P1 -->|"authenticated principal"| P4
    P1 -->|"authenticated principal"| P5
    P1 -->|"authenticated principal"| P6

    %% 2.0
    ORG -->|"event details, ticket tiers,<br/>accessMode, cover image"| P2
    P2 -->|"image bytes"| CLD
    CLD -->|"image URL"| P2
    P2 -->|"event document"| D2
    D2 -->|"active + trending events"| P2
    P2 -->|"listings, event page"| ATT
    P2 -->|"my events"| ORG

    %% 3.0
    ATT -->|"tier + quantity, buyer name & email"| P3
    D2 -->|"accessMode gate, tier price,<br/>remaining ticketQuantity"| P3
    P3 -->|"pending bookings + expiry hold,<br/>server-issued reference & ticketId"| D3
    P3 -->|"guarded $inc: hold the seats<br/>BEFORE checkout"| D2
    P3 -->|"reference to pay against"| ATT
    P3 -->|"checkout amount + reference"| PAY
    PAY -.->|"signed webhook"| P3
    ATT -.->|"post-checkout callback<br/>(reference only)"| P3
    P3 -->|"verify the charge"| PAY
    P3 -->|"confirm: pending → success<br/>(guarded, idempotent)"| D3
    P3 -->|"PDF ticket + QR, once confirmed"| MAIL
    P3 -->|"release: failed / expired<br/>seats returned to the tier"| D2
    D3 -->|"my tickets, expired holds"| P3

    %% 4.0
    ORG -->|"guest CSV: name, email, vip, plusOnes"| P4
    D2 -->|"ownership + accessMode"| P4
    P4 -->|"guest records"| D4
    P4 -->|"invite booking, source: invite,<br/>single-use inviteToken"| D3
    P4 -->|"guest.booking link"| D4
    D4 -->|"guest list, duplicate check"| P4
    P4 -->|"invite email with QR"| MAIL
    P4 -->|"added / skipped / failed"| ORG
    ORG -->|"assign / unassign usher"| P4
    P4 -->|"assignedEvents"| D1

    %% 5.0
    USH -->|"code, deviceId, ip"| P5
    D1 -->|"role + assignedEvents"| P5
    D3 -->|"booking by inviteToken or ticketId"| P5
    P5 -->|"status → admitted, guarded"| D3
    P5 -->|"outcome, reason, actor,<br/>deviceId, ip"| D5
    P5 -->|"admitted / rejected"| USH
    P5 -.->|"admissionBus event"| P6

    %% 6.0
    D3 -->|"counts by status"| P6
    D5 -->|"recent decisions"| P6
    D2 -->|"viewer authorisation"| P6
    P6 -->|"snapshot + SSE stream"| ORG
    P6 -->|"any event's dashboard"| ADM

    %% 7.0
    D5 -->|"latest 1000 rows, grouped by booking"| P7
    D3 -->|"pending bookings, source"| P7
    D4 -->|"vip, plusOnes, lead time"| P7
    D6 -->|"mean, std, coef, intercept"| P7
    ORG -->|"natural-language question"| P7
    P7 -->|"flags, probabilities, answers"| P6
    P6 -->|"anomaly + no-show panels"| ORG

    %% 8.0
    SCH -->|"scheduled sweep"| P8
    ORG -->|"erase this guest now"| P8
    D2 -->|"events ended before cutoff"| P8
    D4 -->|"guests where erasedAt is null"| P8
    D3 -->|"bookings where piiErasedAt is null"| P8
    P8 -->|"name/email overwritten, erasedAt set"| D4
    P8 -->|"name/email/ticketUser overwritten,<br/>piiErasedAt set"| D3
    P8 -->|"erasure counts"| SCH
```

---

## Level 2 — Process 5.0, Admit at the door

```mermaid
graph TB
    USH(["Door-staff device"])

    P51(("5.1<br/>Authenticate &<br/>authorise scanner"))
    P52(("5.2<br/>Resolve code<br/>to booking"))
    P53(("5.3<br/>Claim admission<br/>atomically"))
    P54(("5.4<br/>Record audit<br/>entry"))
    P55(("5.5<br/>Publish arrival<br/>event"))

    D1[("D1 users")]
    D3[("D3 bookings")]
    D5[("D5 auditlogs")]

    USH -->|"JWT, code, deviceId, ip"| P51
    D1 -->|"role ∈ {usher, creator, admin},<br/>assignedEvents"| P51
    P51 -->|"403 wrong_event → auditable"| P54
    P51 -->|"authorised request"| P52

    P52 -->|"findByScanCode:<br/>inviteToken OR ticketId"| D3
    D3 -->|"booking + populated event owner"| P52
    P52 -->|"404 unknown code"| USH
    P52 -->|"candidate booking"| P53

    P53 -->|"admitById in transaction:<br/>match status ∈ {issued, delivered, scanned}<br/>→ set admitted"| D3
    D3 -->|"document returned = claim won,<br/>null = already resolved"| P53
    P53 -->|"outcome admitted<br/>(same transaction)"| P54
    P53 -->|"re-read status → reason<br/>(already_admitted, revoked, …)"| P54
    P53 -->|"200 admitted / 409 rejected"| USH

    P54 -->|"event, booking, actor, outcome,<br/>reason, deviceId, ip, createdAt"| D5
    P54 --> P55
    P55 -.->|"ADMISSION_ADMITTED /<br/>ADMISSION_REJECTED via admissionBus"| P6X(("6.0 Report<br/>live arrivals"))
    D5 -->|"scan history"| P7X(("7.0 Analyse"))
```

**Why 5.3 is the whole design.** The single-use guarantee is a conditional single-document
update, not a read-then-write: concurrent scans of one code both reach MongoDB, exactly one
matches the status guard, and the loser is recorded in D5 as a rejection with an accurate
reason. The audit write for a successful admission shares the admission transaction, so an
admitted booking cannot exist without its audit row. Both facts depend on a replica set —
`withTransaction` throws on a standalone `mongod`.

---

## Data store reference

| Store | Collection | Key elements | Written by | Read by |
|---|---|---|---|---|
| D1 | `users` | name, email, password hash, role, `assignedEvents`, reset token | 1.0, 4.0 | 1.0, 4.0, 5.0 |
| D2 | `events` | eventName, slug, start/endDate, location, `ticketDetails[]`, `accessMode`, creator, coverImage, numberOfAttendees | 2.0, 3.0 | 2.0, 3.0, 4.0, 6.0, 8.0 |
| D3 | `bookings` | event, user, name, email, price, ticketId, `inviteToken` (select:false), `source`, `status`, `transactionStatus`, reference, `piiErasedAt` | 3.0, 4.0, 5.0, 8.0 | 3.0, 5.0, 6.0, 7.0, 8.0 |
| D4 | `guests` | event, name, email, vip, plusOnes, booking, `erasedAt` | 4.0, 8.0 | 4.0, 7.0, 8.0 |
| D5 | `auditlogs` | event, booking, actor, outcome, reason, deviceId, ip, createdAt | 5.0 | 6.0, 7.0 |
| D6 | `ml/no_show/model.json` | mean, std, coef, intercept | offline (`ml/no_show/train.py`) | 7.0 |

## Notes on flows carrying personal data

- **D3 and D4 are the PII stores.** Every booking carries a name and email regardless of
  `source`, which is why `piiErasedAt` lives on Booking rather than being reached only
  through Guest — a purchase booking has no Guest record at all.
- **Erasure anonymises in place.** 8.0 overwrites `name` to `'Erased Guest'` and `email` to a
  per-document-unique `erased-<id>@erased.invalid`, then stamps the flag. `vip`, `plusOnes`,
  `price`, `ticketType`, `source` and `status` survive, so arrival statistics in 6.0 and the
  no-show features in 7.0 remain usable after erasure.
- **The unique placeholder is required, not cosmetic.** `guests` has a unique `(event, email)`
  index; erasing several guests on one event to a shared address would collide.
- **The sweep is idempotent.** `findUnerasedByEvents` filters on `erasedAt: null` /
  `piiErasedAt: null`, and both collections carry a compound index on `(event, <flag>)` for
  exactly that query, so it is safe to run on a repeating schedule.
- **D5 retains device fingerprints and IPs and is never swept.** It references bookings by
  id, so erasure never has to rewrite audit history — but note this means IP and deviceId
  outlive the erasure of the names they were collected alongside.
- **Both erasure entry points converge on `eraseGuest`.** The manual path adds a
  `canViewDashboard` check, the same owner/admin rule as 6.0.
- **Passwords never leave 1.0.** Only the bcrypt hash enters D1, and the JWT returned to the
  actor carries no credential material.
