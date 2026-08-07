# TicketFlow - Market Analysis & Competitive Positioning

> **How to use this document.** Everything in the **TicketFlow** column is verified against
> this repository and can be demonstrated. Everything in a **competitor** column is marked
> either ✅ *verified by us* or ⚠️ *to verify* - competitor features and pricing change
> constantly, and the assessment requires CU APA citations to a dated source. Do not submit a
> ⚠️ row without checking the vendor's current pricing or help pages yourself and citing them.
> Suggested citation format is given in §8.

---

## 1. Scope and method

**Question this document answers:** given that mature ticketing platforms already exist, what
gap does TicketFlow occupy, and is that gap defensible?

**Method.** Desk research against publicly documented product and pricing pages, plus a
feature-by-feature comparison built from TicketFlow's own implementation (each claim traced
to a module or an evaluation script). Competitors were selected to span the market rather
than to flatter the product: two incumbents, two modern challengers, one adjacent
guest-list-only tool, and the informal alternative most small organisers actually use.

**Limitations, stated up front.** This is desk research, not primary market research - no
organiser interviews or survey were conducted, so demand claims are inferred from competitor
feature sets and pricing rather than measured. Pricing is list pricing and varies by country,
currency and negotiated terms. A team with more time should validate §6 with a small
organiser survey; that is the honest next step, and saying so is worth more marks than
overclaiming.

---

## 2. The market and where TicketFlow sits

Event ticketing splits into layers that rarely compete directly:

| Layer | Who serves it | Economics |
|---|---|---|
| **Stadium / arena** | Ticketmaster, AXS | Long contracts, exclusive venue deals, high fees |
| **Mid-market public events** | Eventbrite, Universe, DICE | Self-serve, per-ticket fee, discovery marketplace |
| **Private & invite-only events** | Luma, Partiful, RSVPify, Paperless Post | Often free or cheap; guest list, not commerce |
| **Informal** | Google Forms + a spreadsheet + a WhatsApp group | Free, and genuinely dominant at small scale |

**The gap TicketFlow targets is the seam between rows 2 and 3.** Ticketing platforms treat
the guest list as an afterthought; guest-list tools treat payment as an afterthought. An
organiser running an event that is *partly* sold and *partly* invited - a launch with press
plus paying attendees, a conference with sponsors plus ticket buyers, a fundraiser with
donors plus walk-ups - currently has to run two systems and reconcile the door by hand.

TicketFlow's `accessMode` is the direct expression of that thesis: one event can be
`public`, `invite_only`, or **`hybrid`** - tickets on sale *and* an invited guest list, both
admitted through the same atomic door check-in and the same live dashboard.

---

## 3. Feature comparison

Legend: ● full support · ◐ partial or manual · ○ absent · ⚠️ to verify and cite

| Capability | TicketFlow (verified) | Eventbrite | DICE | Luma | Google Forms + sheet |
|---|---|---|---|---|---|
| Paid ticketing, multi-tier | ● `ticketDetails[]`, per-tier price and quantity | ● ⚠️ | ● ⚠️ | ◐ ⚠️ | ○ |
| **Invite-only guest list on the same event** | ● `accessMode: invite_only` | ◐ ⚠️ | ○ ⚠️ | ● ⚠️ | ◐ |
| **Hybrid: sold + invited, one event** | ● `accessMode: hybrid` | ○ ⚠️ | ○ ⚠️ | ○ ⚠️ | ○ |
| Single-use QR admission | ● `inviteToken` / `ticketId`, `select: false` | ● ⚠️ | ● ⚠️ | ● ⚠️ | ○ |
| **Provably single-use under concurrency** | ● guarded conditional update in a transaction; concurrency test | ⚠️ undocumented | ⚠️ undocumented | ⚠️ undocumented | ○ |
| Live arrivals dashboard | ● SSE push via `admissionBus` | ● ⚠️ | ● ⚠️ | ◐ ⚠️ | ○ |
| **Scan-anomaly / fraud detection** | ● rule-based, **P 0.948 / R 0.821 / F1 0.880** | ⚠️ | ⚠️ enforced via closed resale | ○ ⚠️ | ○ |
| **No-show prediction** | ◐ logistic regression, ROC-AUC 0.736 (see §7) | ○ ⚠️ | ○ ⚠️ | ○ ⚠️ | ○ |
| **Natural-language guest queries** | ● rule-based parser, 27/27 exact match | ○ ⚠️ | ○ ⚠️ | ○ ⚠️ | ◐ (spreadsheet filter) |
| AI concierge for attendees | ● OpenAI → Gemini fallback, tool-calling | ○ ⚠️ | ○ ⚠️ | ○ ⚠️ | ○ |
| Attendee networking / chat | ● Meet and Greet, opt-in, per-event | ◐ ⚠️ | ○ ⚠️ | ◐ ⚠️ | ◐ (WhatsApp) |
| Venue-capacity enforcement at the door | ● `venueCapacity` + `capacityDecision` | ⚠️ | ⚠️ | ○ ⚠️ | ○ |
| Scoped door-staff role | ● `usher` + `assignedEvents`, event-scoped | ◐ ⚠️ | ⚠️ | ○ ⚠️ | ○ |
| **GDPR erasure of attendee PII** | ● scheduled sweep + on-demand, anonymise-not-delete | ◐ ⚠️ | ◐ ⚠️ | ⚠️ | ○ organiser's problem |
| Split payment to organiser | ● Paystack subaccounts, 3% platform fee | ● ⚠️ | ● ⚠️ | ● ⚠️ | ○ |
| Offline door scanning | ○ **gap** | ● ⚠️ | ● ⚠️ | ⚠️ | n/a |
| Refunds / cancellations | ○ **gap** (policy is text only) | ● ⚠️ | ● ⚠️ | ● ⚠️ | n/a |
| Ticket transfer / resale | ○ **gap** | ● ⚠️ | ● ⚠️ closed resale is their signature | ⚠️ | n/a |
| Discovery marketplace / audience | ○ **structural gap** | ● ⚠️ large | ● ⚠️ curated | ◐ ⚠️ | ○ |

**Read the last four rows as honestly as the rest.** Two of them (refunds, transfers) are
buildable in a sprint. The other two are not: offline scanning is a hard distributed-systems
problem, and a discovery marketplace is a two-sided network effect that no amount of
engineering substitutes for. Section 6 addresses that directly.

---

## 4. Pricing position

TicketFlow charges a **3% platform fee** per paid ticket (`PLATFORM_FEE_PERCENT`, default 3),
taken at the payment split rather than invoiced, so the organiser receives their share
directly from the processor.

| Platform | Headline fee | Notes |
|---|---|---|
| **TicketFlow** | **3%** + processor fees | ✅ verified: `pricingService.PLATFORM_FEE_PERCENT` |
| Eventbrite | ⚠️ ~3.7% + fixed per ticket (UK), plus payment processing | ⚠️ verify current UK pricing page and cite |
| DICE | ⚠️ typically booking fee charged to the fan | ⚠️ verify |
| Universe | ⚠️ percentage + fixed | ⚠️ verify |
| Luma | ⚠️ free tier for free events; percentage on paid | ⚠️ verify |

**Worked example - 200 tickets at £25 (£5,000 gross).** Fill the competitor rows once you
have cited figures; the TicketFlow row is computed from the implemented fee.

| Platform | Platform fee | Organiser receives (before processing) |
|---|---|---|
| TicketFlow @ 3% | £150 | £4,850 |
| Competitor A | ⚠️ | ⚠️ |

**Strategic caveat worth stating in the report:** a lower percentage is the weakest possible
moat - any incumbent can match it, and undercutting on price while lacking a discovery
audience is how ticketing startups fail. The fee is a *reason to try*, not a reason to stay.
The retention argument has to be the hybrid guest-list workflow and the door operations, not
the 0.7 points.

---

## 5. Differentiation: what is genuinely defensible

Ranked by how hard each would be for an incumbent to copy.

1. **Hybrid access as a first-class model.** Not a feature bolt-on but a property of the
   event, running through pricing, checkout, guest import, admission and reporting. An
   incumbent with separate ticketing and RSVP products would have to merge two data models.
   *Evidence: `accessMode` in `eventModel`, honoured in `bookingService`, `guestService`,
   `admissionService`.*

2. **Door integrity as a proven property, not a claim.** Admission is a guarded conditional
   update inside a transaction: two simultaneous scans of one code both reach the database
   and exactly one wins, with the loser written to the audit log with a reason. This is
   demonstrable in a test, which competitors' marketing pages cannot match with evidence.
   *Evidence: `bookingRepository.admitById`, `tests/integration/admission.scan.test.js`.*

3. **Fraud signals from the door's own data.** Rule-based detection over the audit log -
   repeated rejects, multiple devices, implausibly rapid scans - evaluated on a labelled set
   at **precision 0.948, recall 0.821, F1 0.880**, with a documented known limitation rather
   than a hidden one. *Evidence: `scripts/eval-anomaly.js`.*

4. **Compliance built in rather than promised.** Retention sweeps and on-demand erasure
   anonymise PII in place while preserving the analytics and audit record. For a UK/EU
   organiser this is a purchasing criterion, not a nice-to-have.
   *Evidence: `retentionService`, `scripts/gdpr-retention-sweep.js`.*

5. **Organiser-facing intelligence.** Natural-language guest queries, no-show prediction and
   an attendee concierge. Individually copyable; collectively they change what the organiser
   does on the night.

---

## 6. Barriers, and an evidence-based response

Section 2.2 of the brief asks specifically for barriers to entrepreneurial practice and a
proposed course of action. These are the real ones.

| Barrier | Why it bites | Proposed response |
|---|---|---|
| **No discovery audience** | Eventbrite's value to an organiser is partly the buyers it brings. TicketFlow brings none. | Do not compete on discovery. Target organisers who **already own their audience** - universities, societies, corporate events, private launches - where the marketplace adds nothing and its fee is pure cost. |
| **Two-sided cold start** | No attendees without events, no events without attendees. | The invite-only and hybrid path is single-sided: the organiser supplies the guest list, so the product is useful on day one with zero network. |
| **Trust in taking money** | Organisers hand a startup their revenue. | Split payments settle the organiser's share directly through Paystack; TicketFlow never holds the funds. Make that the headline claim. |
| **Switching costs** | Existing tools hold historical data. | Guest-list CSV import already exists; a booking-history importer is the obvious follow-up. |
| **Payment-provider reach** | Paystack is strong in Nigeria/Ghana/South Africa; a UK rollout implies Stripe. | The payment layer is already isolated behind `pricingService` and `paymentService`. Frame regional expansion as a provider adapter, and note it is not yet built. |
| **Feature gaps vs incumbents** | No refunds, transfers, or offline scanning. | Refunds and transfers are a sprint each and should precede any commercial pilot. Offline scanning is the flagship differentiator to build next - it is a real pain point *and* the hardest thing on this list to copy quickly. |

---

## 7. Weaknesses - state these before a marker finds them

Credibility in an evaluation comes from naming your own limits.

- **No-show prediction is not yet decision-useful.** ROC-AUC 0.736 shows real signal, but at
  the default threshold recall is **0.161** - it catches roughly one no-show in six. It is
  also trained on **synthetic data**, documented as such in `ml/no_show/train.py`. Present it
  as a working train-and-serve pipeline awaiting real data and a tuned operating point, not
  as a finished product feature.
- **The NL query evaluation is saturated.** 27/27 exact match indicates the held-out set is
  too easy, not that the parser is perfect. Report it with that caveat.
- **Anomaly detection has a known blind spot.** Slow, deliberate ticket-sharing spread over
  more than the five-minute window is not caught - 12 of 15 misclassifications. Documented
  deliberately in the eval output.
- **No primary market research.** See §1.
- **Single payment provider, and currency support is unvalidated.** An organiser can create an
  event in a currency the processor may not settle, and nothing rejects it until a buyer
  fails at checkout.

---

## 8. Sources to gather and cite (CU APA)

Every ⚠️ above needs a dated source. Vendor pricing pages change without notice, so record the
access date.

Format: Organisation. (Year). *Title of page*. Site name. URL

Minimum set to collect:

1. Eventbrite - UK pricing/fees page
2. Eventbrite - organiser features (check-in app, offline mode, guest list handling)
3. DICE - organiser/partner page and fan-facing fee terms
4. Luma - pricing and event-management features
5. Universe or RSVPify - for the guest-list-only comparison
6. Paystack - split payments and supported currencies (also cited in the technical docs)
7. One industry report on event-ticketing market size or no-show rates, for §2 context

For anything AI-assisted in preparing this analysis, record it in the AI acknowledgement
table the brief requires, with the tool and what it was used for.

---

## 9. One-paragraph positioning statement

*For organisers who already have their own audience and run events that are part sold and
part invited, TicketFlow is an event platform that treats the guest list and the ticket as
one thing. Unlike Eventbrite, which optimises for public discovery and charges accordingly,
and unlike RSVP tools such as Luma, which have no serious commerce, TicketFlow admits paying
attendees and invited guests through one atomic, auditable door - with live arrivals,
fraud signals from the door's own scan history, and GDPR erasure built in - at a 3% platform
fee that settles directly to the organiser.*
