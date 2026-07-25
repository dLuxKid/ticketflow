# Phase 0 — Change log & test plan

Branch: `phase-0-harden-flaws` · Commit: `Phase 0: harden load-bearing flaws before the EntryPoint merge`

Phase 0 fixes the four flaws the EntryPoint guest-management features depend on. This
document records **every change** and the **tests each change should be verified against** —
the automated ones already written, plus the manual/API and edge cases to add for complete
coverage (LO3 evidence).

---

## How to run the tests

```bash
cd backend
node --test "tests/**/*.test.js"          # all tests
node --test "tests/unit/**/*.test.js"     # unit only (no DB needed)
```

- **Unit tests run anywhere** (no DB, no install — Node's built-in `node:test`).
- **Integration tests** (oversell, ownership) self-skip unless `MONGO_TEST_URI` points at a
  throwaway test database. The oversell/transaction path requires MongoDB running as a
  **replica set** (a standalone `mongod` throws on transactions).
- Environment note: `npm test` fails on this Windows→WSL share because npm routes through
  cmd.exe (no UNC support). Call `node --test` directly, or run in CI / WSL-native Node.

Current local result: **6 pass, 2 skipped** (the 2 skips are the DB-gated suites).

---

## 0.1 — Atomic inventory decrement (oversell race)

### Changes
| File | Change |
|------|--------|
| `src/repositories/eventRepository.js` | New `reserveTicketInventory(eventId, ticketName, count, session)` — guarded atomic `findOneAndUpdate` that matches only while `ticketQuantity >= count` and applies `$inc` to decrement stock and increment `numberOfAttendees` in one atomic single-document write. |
| `src/repositories/bookingRepository.js` | `insertMany` now accepts an optional `session` for transactional inserts. |
| `src/services/bookingService.js` | `createBooking` rewritten: fail-fast 404 if event missing; reserve every ticket type inside a `session.withTransaction`; insert bookings in the same session; send ticket emails only **after** commit. |

### What to test
| # | Case | Expected | Status |
|---|------|----------|--------|
| 0.1-a | Two concurrent reservations of the **last** ticket | Exactly one succeeds; the other returns `null` | ✅ automated (`inventory.reservation.test.js`) |
| 0.1-b | Reserve more than remain | Returns `null`; quantity unchanged | ✅ automated |
| 0.1-c | Quantity after a successful sale | Lands at 0, **never negative**; `numberOfAttendees` +1 | ✅ automated |
| 0.1-d | Multi-tier booking where one tier is sold out | Whole transaction rolls back; **no** bookings inserted for the available tier | ➕ add (needs replica set) |
| 0.1-e | Load test: 200 concurrent buys / minute against limited stock | Sold count == stock exactly; no oversell; p95 latency acceptable | ➕ add (perf — k6/artillery, Phase 6) |
| 0.1-f | Regression: normal single purchase | Booking created, stock −1, email sent once | ➕ add (manual/API) |

### Manual/API check
Fire two near-simultaneous `POST /api/v1/bookings/create` for the same last ticket; confirm
only one 201 and one 409 `Not enough "…" tickets remaining`.

---

## 0.2 — RBAC + ownership (broken access control / IDOR)

### Changes
| File | Change |
|------|--------|
| `src/repositories/userRepository.js` | New `findByIdWithRole` (selects the `select:false` `role`). |
| `src/services/authService.js` | `verifyAndGetUser` now loads the user **with role**, so `req.user.role` is populated (previously `undefined`, which would have made `restrictTo` reject everyone). |
| `src/services/eventService.js` | `updateEvent(eventId, data, user)` — loads event, allows update only if `user` is the owner or an admin, else 403. |
| `src/services/bookingService.js` | `checkInAttendee(ticketId, isCheckedIn, user)` — loads booking + event owner, same owner/admin rule, 404 if booking missing. |
| `src/repositories/bookingRepository.js` | New `findByIdWithEventOwner` (populates `event.user` for the check). |
| `src/presentation/controllers/{event,booking}Controller.js` | Pass `req.user` into the two services. |
| `src/presentation/routes/eventRoutes.js` | Comment documents that ownership is enforced in the service (no route role-gate, so user-role owners keep access). |

### What to test
| # | Case | Expected | Status |
|---|------|----------|--------|
| 0.2-a | Non-owner updates another user's event | 403 | ✅ automated (`authorization.test.js`) |
| 0.2-b | Owner updates own event | 200 / success | ✅ automated |
| 0.2-c | Admin updates any event | success | ✅ automated |
| 0.2-d | Non-owner checks in another user's ticket | 403 | ✅ automated |
| 0.2-e | Owner checks in own event's ticket | success, `isCheckedIn:true` | ✅ automated |
| 0.2-f | Unauthenticated request to protected route | 401 | ➕ add |
| 0.2-g | Update / check-in of non-existent id | 404 (not 403) | ➕ add |
| 0.2-h | **Regression:** `req.user.role` now populated — a creator can still create & update their events | success (proves the role-loading fix didn't break auth) | ➕ add |

### Manual/API check
Log in as user B, take their JWT, `PATCH /api/v1/events/update/<A's eventId>` → expect 403.
Repeat with A's JWT → expect 200.

---

## 0.3 — Server-side Paystack verification

### Changes
| File | Change |
|------|--------|
| `src/shared/utils/paystack.js` | New pure `isValidPaystackSignature(rawBody, signature, secretKey)` — recomputes HMAC-SHA512 over the raw body and compares in constant time. |
| `src/services/paymentService.js` | New `handlePaystackWebhook(rawBody, signature)` — 401 on bad/missing signature; on `charge.success` sets bookings' `transactionStatus` to `success` by reference; `charge.failed/abandoned` → `failed`; unknown events acknowledged with no change. |
| `src/repositories/bookingRepository.js` | New `updateStatusByReference(reference, transactionStatus)`. |
| `src/presentation/controllers/paymentController.js` | New webhook controller using the captured raw body. |
| `src/presentation/routes/bookingRoutes.js` | New public route `POST /bookings/webhook/paystack` (authenticated by signature, not JWT). |
| `app.js` | `express.json` now captures `req.rawBody` via its `verify` hook so the signature can be checked against the exact bytes. |

### What to test
| # | Case | Expected | Status |
|---|------|----------|--------|
| 0.3-a | Correctly signed body | valid → `true` | ✅ automated (`paystack.test.js`) |
| 0.3-b | Wrong secret | `false` | ✅ automated |
| 0.3-c | Tampered body, original signature | `false` | ✅ automated |
| 0.3-d | Missing / empty signature | `false` | ✅ automated |
| 0.3-e | Wrong-length signature | `false` (no timing-leak throw) | ✅ automated |
| 0.3-f | Missing secret key | `false` | ✅ automated |
| 0.3-g | Webhook route: invalid signature | HTTP 401, no booking change | ➕ add (route-level, supertest) |
| 0.3-h | Webhook route: valid `charge.success` | HTTP 200; matching bookings → `success` | ➕ add |
| 0.3-i | Valid `charge.failed` | matching bookings → `failed` | ➕ add |
| 0.3-j | Unknown event type | 200, `handled:false`, no state change | ➕ add |
| 0.3-k | `PAYSTACK_SECRET_KEY` unset | 500 "Payment provider is not configured" | ➕ add |

### Manual/API check
```bash
BODY='{"event":"charge.success","data":{"reference":123}}'
SIG=$(printf '%s' "$BODY" | openssl dgst -sha512 -hmac "$PAYSTACK_SECRET_KEY" | awk '{print $2}')
curl -X POST localhost:4000/api/v1/bookings/webhook/paystack \
  -H "Content-Type: application/json" -H "x-paystack-signature: $SIG" -d "$BODY"
# → 200; flip one char of SIG → 401
```

---

## 0.4 — Numeric ticket typing

### Changes
| File | Change |
|------|--------|
| `src/models/eventModel.js` | `ticketPrice`, `ticketQuantity`, `minimumBuyingLimit`, `maximumBuyingLimit` changed `String → Number` with `min` constraints; pre-save `totalQuantity` hook no longer string-coerces. |
| `scripts/migrate-numeric-ticket-fields.js` | New idempotent migration converting existing string values to numbers at the driver level. |
| `package.json` | `migrate:numeric-tickets` and `test` / `test:unit` scripts. |

### What to test
| # | Case | Expected | Status |
|---|------|----------|--------|
| 0.4-a | Create event with numeric ticket fields | Stored as `Number`, not `String` | ➕ add |
| 0.4-b | Negative price or quantity | Rejected by schema `min` validation | ➕ add |
| 0.4-c | `totalQuantity` pre-save with numeric tiers | Correct sum | ➕ add |
| 0.4-d | Migration on legacy string docs | Fields become numbers | ➕ add (run against seeded legacy data) |
| 0.4-e | Migration run twice | Second run is a no-op (idempotent) | ➕ add |
| 0.4-f | Interaction with 0.1 | `$gte` inventory guard works because quantity is numeric | ✅ covered indirectly by 0.1 tests |

---

## Cross-cutting regression checklist

Run before merging Phase 0 — these must still pass:

- [ ] Signup / login unaffected by the `role` select change.
- [ ] Existing happy-path purchase creates bookings, decrements stock, emails a ticket.
- [ ] Event creation by a normal user still works (no accidental role gate).
- [ ] Public event listing / detail endpoints unchanged.
- [ ] App boots and the full module graph loads (`node -e "import('./app.js')"`).

## Definition of done (from the brief)

| Flaw | Done-when | Met |
|------|-----------|-----|
| 0.1 | Two simultaneous buys of last unit → exactly one succeeds, never negative | ✅ (automated; multi-tier rollback + perf to add) |
| 0.2 | Non-owner gets 403 editing/checking-in another's event | ✅ automated |
| 0.3 | Booking not confirmed on a forged/unverified client status | ✅ verifier automated; route-level tests to add |
| 0.4 | Existing purchase flow passes with numeric types | ✅ app loads; add explicit schema tests |

Legend: ✅ automated & passing · ➕ recommended to add for full coverage.
