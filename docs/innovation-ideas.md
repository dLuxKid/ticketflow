# Innovation & differentiation ideas — EntryPoint × TicketFlow

Mapped to the 7003SCN marking criteria (quality, **complexity**, **creativity**,
entrepreneurship, market fit). Ordered by return-on-effort for the assessment: what gives
the most "advanced concepts / exceptional complexity" credit per unit of build time.

Legend: **Effort** S/M/L · **Assessment lift** = which criterion it strengthens.

---

## Already built (make sure these are demonstrated — they already earn the marks)

These exist in the codebase now; the marking value is in *showing and evaluating* them, not
just having them. Reference them explicitly in the report and demo video.

| Feature | Why it scores | Where to show it |
|---|---|---|
| Atomic single-use door check-in (transaction + guarded update) | Concurrency correctness — the "two simultaneous scans admit exactly once" proof is genuine advanced-concepts evidence | `admission.scan.test.js`, the demo scan |
| Rule-based scan anomaly detection with a precision/recall/F1 + confusion-matrix eval | Measurable ML/analytics evaluation, not a toy | `eval-anomaly.js` output |
| NL guest queries with an exact-match accuracy eval | A *second, different* evaluation metric — shows methodological range | `eval-nlquery.js` output |
| No-show prediction (scikit-learn → portable JS runtime, parity-tested) | Real train/serve pipeline; the parity test is a strong QA artefact | `ml/no_show/`, dashboard card |
| RBAC + ownership + scoped usher role | Security depth (broken-access-control fixes) | usher assignment + scan authz |
| GDPR retention/erasure (sweep + manual, anonymize-not-delete) | Social/legal/ethical (LO5, BCS code) with a *working* mechanism | `retentionService.js` |

---

## High-value additions (strong marks, bounded effort)

### 1. Real-time capacity & safety guardrails at the door — **S/M**, complexity + SLE
When admissions approach venue capacity, the dashboard flips to a red "at capacity" state
and the scanner warns before admitting the over-capacity guest. Ties the live dashboard,
the atomic check-in, and a safety/legal concern (fire-code occupancy limits) together into
one story. Cheap: you already have live admitted-count and capacity in the snapshot.

### 2. Waitlist + automatic promotion — **M**, entrepreneurship + complexity
When a paid event sells out, buyers join a waitlist; if a booking is refunded/cancelled, the
next waitlisted person is automatically offered the seat (time-boxed). Demonstrates event-
driven design and a real revenue/market mechanic (Eventbrite/DICE both monetise this).

### 3. Dynamic / tiered QR that rotates — **M**, security complexity
Instead of one static token, the guest's QR rotates on a short interval (TOTP-style) in the
emailed link's live page, so a screenshot shared to a stranger expires. Directly strengthens
the anti-fraud story and pairs with the existing anomaly detector. Advanced-concepts credit.

### 4. Offline-capable scanner (PWA) — **M/L**, complexity + real-world fit
Door staff often have poor connectivity. Make the scanner a PWA that caches the guest list
and queues admissions locally, syncing (with conflict resolution against the atomic check-in)
when back online. This is a genuinely hard distributed-systems problem = high complexity
marks, and it's a real pain point Eventbrite Organizer solves.

### 5. Multi-channel invites (email + WhatsApp/SMS) — **M**, entrepreneurship
Guests in many markets ignore email. Add a second delivery channel (WhatsApp Business API or
SMS via Twilio) behind the same invite-issuance flow. Small code change, strong market-fit
narrative for the 2.2 entrepreneurial-practice essay (channel strategy for a target region).

---

## Differentiators / "wow" (bigger, but each is a distinct advanced concept)

### 6. Facial or NFC check-in as an alternate lane — **L**, exceptional complexity
Optional express lane: guests opt in to a selfie at RSVP; the door device matches on arrival
(on-device embedding comparison, not cloud face storage — a deliberate privacy design you can
*evaluate* for SLE marks). Even a limited prototype is strong "variety of advanced
technologies" evidence. Frame the privacy trade-offs explicitly.

### 7. Organiser analytics with cohort insight — **M**, complexity + entrepreneurship
Post-event: arrival-time distribution, no-show rate by ticket tier / VIP / lead-time cohort,
and a "who to re-target" export. You already log the data (AuditLog, Booking). This turns the
raw log into a business intelligence surface — good for the entrepreneurship essay (data as a
product).

### 8. Fraud-risk score fusion — **M**, ML complexity
Combine the three existing signals (anomaly flags, no-show probability, scan velocity) into a
single per-ticket risk score with a calibrated threshold, and show a precision/recall curve.
Moves from "three separate rules" to "an evaluated scoring model" — a clear step up in the
analytics-complexity narrative for minimal new code.

---

## What to actually pick for the assessment

If time is short, do **#1 (capacity guardrails)** and **#7 (cohort analytics)** — both reuse
data you already capture, both add a genuinely new evaluated surface, and together they cover
complexity, SLE, and entrepreneurship. If you have one more sprint, **#4 (offline PWA
scanner)** is the single highest "advanced concepts / exceptional complexity" lift.

Whatever you pick: the marks come from **evaluating** it (metrics, trade-offs, strengths /
weaknesses / recommendations), not just building it. Every feature above should land with a
short evaluation — a test, a metric, or a documented design trade-off — the same way the
anomaly detector shipped with a confusion matrix rather than just a claim.
