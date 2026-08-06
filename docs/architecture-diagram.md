# TicketFlow — Architecture Diagram

> **Diagram set:** [Architecture](architecture-diagram.md) · [Use cases](use-case-diagram.md) · [Data flow](data-flow-diagram.md)
> All three describe the same system at different altitudes. Process numbers in the DFD
> (1.0–8.0) map to the service modules named here.

**Conventions.** Solid arrows are synchronous calls or request/response; dashed arrows are
asynchronous or inbound-from-outside (webhooks, server-sent events, in-process events).
Cylinders are persistent stores. Every claim below is traceable to a named module.

---

## 1. System / deployment architecture

```mermaid
graph TB
    subgraph Clients["Client tier"]
        BR["Attendee / organiser browser"]
        DOOR["Door-staff device<br/>(camera QR scan, mobile web)"]
    end

    subgraph FE["Frontend — Next.js 15 App Router (:3000)"]
        MW["middleware.ts<br/>UX-level route guard:<br/>decodes JWT cookie, checks expiry"]
        RSC["Server + client components<br/>(app/ routes)"]
        SA["Server actions / queries<br/>utils/actions.ts · utils/queries.ts"]
        ST["Client state<br/>TanStack Query · Zustand"]
    end

    subgraph BE["Backend — Node / Express (:4000)"]
        SEC["Security middleware<br/>helmet · cors(credentials) · rate-limit (configurable)<br/>mongo-sanitize · xss · hpp · rawBody capture"]
        subgraph PRES["Presentation"]
            RT["Routes<br/>/api/v1: events · users · bookings · chat"]
            CTL["Controllers<br/>auth · event · booking · payment · admission<br/>guest · usher · dashboard · nlQuery · networking · chat"]
        end
        subgraph SVC["Services — business rules + authorisation"]
            CORE["auth · user · event · booking · payment<br/>guest · usher · admission · dashboard · retention"]
            NET["Meet and Greet<br/>networking · networkingGuest · networkingNotification"]
            AI["Analytics (local)<br/>anomaly · anomalyReport · noShow · nlGuestQuery"]
            BOT["AI concierge<br/>chatbotService · llmProvider · weatherService"]
            BUS["admissionBus · networkingBus<br/>(in-process EventEmitters)"]
            SWEEP["reservationSweeper<br/>(in-process, 5-min interval)"]
        end
        subgraph REPO["Repositories"]
            RP["user · event · booking · guest · auditLog · message"]
        end
        SH["Shared<br/>email(pug) · generateQrCode · paystack HMAC<br/>ticketIdGenerator · parseGuestCsv · networkingOtp · AppError"]
    end

    subgraph DATA["Data tier"]
        MDB[("MongoDB replica set<br/>users · events · bookings<br/>guests · auditlogs · messages")]
        MLM[("ml/no_show/model.json<br/>portable weights, read-only")]
    end

    subgraph EXT["External services"]
        PS["Paystack"]
        CLD["Cloudinary"]
        SMTP["Gmail SMTP (nodemailer)"]
        LLM["OpenAI (primary)<br/>Gemini (fallback)"]
        METEO["Open-Meteo<br/>geocoding + forecast, no key"]
    end

    BR --> MW --> RSC
    DOOR --> RSC
    RSC --> SA
    RSC --- ST
    SA -->|"REST, JWT httpOnly cookie"| SEC
    ST -->|"REST + SSE"| SEC

    SEC --> RT --> CTL --> CORE
    CTL --> AI
    CTL --> NET
    CTL --> BOT
    CORE --> RP
    AI --> RP
    NET --> RP
    BOT --> RP
    CORE --> SH
    NET --> SH
    AI --> MLM
    RP --> MDB

    CORE -->|"init transaction"| PS
    PS -.->|"signed webhook<br/>POST /api/bookings/webhook/paystack"| SEC
    SH --> SMTP
    CORE --> CLD
    BOT -->|"fetch, no SDK"| LLM
    BOT -->|"fetch"| METEO

    CORE -.->|"emit admitted / rejected"| BUS
    NET -.->|"emit message / presence"| BUS
    BUS -.->|"SSE push<br/>/events/:id/stream · /events/:id/network/stream"| ST
    SWEEP -.->|"release lapsed holds"| RP

    CRON["scripts/gdpr-retention-sweep.js<br/>(external scheduler / CI cron)"] --> CORE
```

**Note on the AI boundary.** Only the concierge chatbot (`BOT`) leaves the process for
inference. Everything else labelled AI here — anomaly detection, no-show prediction and
natural-language guest queries — runs locally: the first two on rule thresholds and a
portable weights file, and the NL guest query on a **regex intent parser, not a language
model**. The distinction matters both for the data-protection argument (guest lists are never
sent to a third party) and for accuracy in the report.

**Note on provider failure.** `llmProvider` calls OpenAI first and falls back to Gemini over
plain `fetch` with no vendor SDK, and with neither key configured the chatbot degrades to a
canned reply rather than erroring. An outage at either provider therefore removes a feature;
it never takes down a request path that sells or admits a ticket.

**Note on the frontend guard.** `middleware.ts` decodes the JWT client-side and treats any
unexpired token as authenticated — it does not verify the signature or read the role. It is a
redirect/UX convenience only. Every real authorisation decision is server-side
(`authController.protect`, `restrictTo`, and the ownership rules inside the services).

## 2. Layering and the dependency rule

```mermaid
graph LR
    A["Presentation<br/>routes · controllers"] --> B["Services<br/>business rules · authorisation"]
    B --> C["Repositories<br/>query encapsulation"]
    C --> D["Models<br/>Mongoose schemas + indexes"]
    B -.-> E["Shared<br/>utils · middleware · errors"]
    A -.-> E
```

Dependencies point one way. Controllers never touch models directly; services never touch
`req`/`res`. Authorisation lives in the service layer — `canViewDashboard` is reused by the
dashboard, the guest list, the NL query, and erasure, so the same ownership rule holds on
every route that reaches them.

## 3. Booking status state machine

The admission model is a six-state machine on `Booking.status`, not a boolean. `isCheckedIn`
is a derived virtual (`status === 'admitted'`), so there is one source of truth.

```mermaid
stateDiagram-v2
    [*] --> issued: created (purchase or invite)
    issued --> delivered: ticket / invite emailed
    delivered --> scanned: QR presented
    issued --> admitted: scan wins the atomic claim
    delivered --> admitted: scan wins the atomic claim
    scanned --> admitted: scan wins the atomic claim
    issued --> rejected: not admittable at door
    delivered --> rejected
    scanned --> rejected
    admitted --> [*]
    rejected --> [*]
    issued --> revoked: organiser revokes
    delivered --> revoked
    revoked --> [*]
```

`bookingRepository.admitById` only matches `status ∈ {issued, delivered, scanned}` — that
guard *is* the single-use guarantee.

## 4. Door check-in — the integrity-critical path

```mermaid
sequenceDiagram
    participant U as Usher device
    participant API as POST /api/bookings/scan
    participant AC as restrictTo('usher','creator','admin')
    participant AS as admissionService
    participant BR as bookingRepository
    participant AL as auditLogRepository
    participant BUS as admissionBus
    participant D as Organiser dashboard

    U->>API: { code, deviceId, ip }
    API->>AC: verify JWT + role
    AC->>AS: checkInByScan(code, actor, context)
    AS->>BR: findByScanCode (inviteToken OR ticketId)
    alt unknown code
        AS-->>U: 404 invalid ticket
    else wrong event for this usher
        AS->>AL: record rejected (reason: wrong_event)
        AS-->>U: 403
    else authorised
        AS->>BR: admitById inside transaction<br/>{status ∈ issued, delivered, scanned} → admitted
        alt claim won
            AS->>AL: record admitted (same transaction)
            AS->>BUS: emit ADMISSION_ADMITTED
            AS-->>U: 200 admitted
        else already admitted / revoked
            AS->>BR: re-read status for an accurate reason
            AS->>AL: record rejected (reason from status)
            AS->>BUS: emit ADMISSION_REJECTED
            AS-->>U: 409
        end
    end
    BUS-->>D: SSE event on the open stream
```

Two simultaneous scans of one token both reach MongoDB; exactly one matches the status
guard, and the loser is written to `auditlogs` as a rejection with a reason. The audit write
shares the admission transaction, so an admitted booking can never lack its audit row. This
is why deployment requires a **replica set** — `withTransaction` throws on a standalone
`mongod`.

## 5. Purchase and payment

The flow is **reserve → pay → confirm**. Seats are held before the buyer reaches Paystack,
so a charge always has a booking behind it.

```mermaid
sequenceDiagram
    participant B as Buyer
    participant FE as Next.js
    participant BS as bookingService.reserveBooking
    participant ER as eventRepository
    participant PS as Paystack
    participant CF as confirm / release

    B->>FE: select tickets
    FE->>BS: POST /api/bookings/create (auth optional)
    BS->>BS: reject if event.accessMode === 'invite_only'
    BS->>ER: reserveTicketInventory per tier, in a transaction<br/>guarded $inc: match ticketQuantity >= count
    alt any tier short
        BS-->>B: 409 not enough tickets (rolled back, nothing charged)
    else all reserved
        BS->>BS: insertMany bookings — pending, with reservationExpiresAt<br/>server-issued reference + ticketId
        BS-->>FE: { reference, requiresPayment }
    end

    alt free event
        BS->>CF: confirmReservation inline (no charge to wait for)
    else paid event
        FE->>PS: checkout with the server-issued reference
        par webhook
            PS-->>CF: signed charge.success / charge.failed
        and browser callback
            FE->>CF: POST /api/bookings/confirm { reference }
            CF->>PS: verify the charge server-side
        end
    end

    alt charge confirmed
        CF->>CF: confirmByReference (guarded on pending)
        CF->>B: email PDF ticket + QR — once, by whoever won the transition
    else failed, abandoned, or hold expired
        CF->>ER: releaseTicketInventory — seats go back on sale
    end
```

Three details that are easy to get wrong when reading this quickly:

- **Overselling is prevented by the guarded `$inc`, not by the transaction.**
  `reserveTicketInventory` matches `ticketQuantity: { $gte: count }` and decrements in one
  atomic operation; the transaction's job is all-or-nothing across *multiple tiers*.
- **Confirmation is idempotent and runs from two directions.** The webhook and the browser
  callback both land on `confirmReservation`; `confirmByReference` is guarded on
  `transactionStatus: 'pending'`, so exactly one call transitions the bookings and only that
  call sends email. Paystack's retries are therefore harmless.
- **The browser is never believed.** The callback supplies only a reference;
  `paymentService.confirmCheckout` verifies the charge against Paystack's API before
  confirming anything. It exists because a webhook can be delayed or misconfigured, and
  without it a paid reservation would be swept away 15 minutes later.

Every reservation has exactly one terminal outcome — confirmed, failed, or expired — and
each of them leaves inventory correct. `scripts/release-expired-reservations.js`
(`npm run reservations:release`) sweeps holds nobody resolved.

## 6. Analytics and live reporting

```mermaid
graph LR
    AL[("auditlogs")] -->|"latest 1000 rows for the event,<br/>grouped by booking"| AR["anomalyReportService"]
    AR --> AN["anomalyService.detectAnomalies<br/>repeated_rejects · multi_device · rapid_sequential"]
    AN -->|"flagged bookings + flags"| DASH["GET /:eventId/anomalies"]

    BK[("bookings")] -->|"pending bookings"| NS["dashboardService.getNoShowPrediction"]
    GU[("guests")] -->|"vip, plusOnes, lead time"| NS
    NS --> NSM["noShowService<br/>standardize → sigmoid"]
    MODEL[("ml/no_show/model.json")] --> NSM

    BUS["admissionBus"] -.->|"live admitted/rejected"| SSE["GET /:eventId/stream"]
    BK -->|"counts by status"| SNAP["GET /:eventId/dashboard"]
    AL -->|"recent decisions"| SNAP

    Q["Organiser question<br/>POST /:eventId/guests/query"] --> NLP["nlGuestQueryService<br/>intentParser → executeQuery"]
    GU --> NLP
```

`anomalyService` is rule-based and pure — no training step, unit-testable, and evaluated
against a committed labelled fixture (`scripts/eval-anomaly.js`: precision 0.948, recall
0.821, F1 0.880). `noShowService` reimplements scikit-learn inference in JS from exported
weights, so the running app needs no Python; `tests/unit/noShow.test.js` is a parity test
against `predict_proba`.
