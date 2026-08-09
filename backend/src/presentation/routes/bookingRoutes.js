import { Router } from 'express';
import * as bookingController from '../controllers/bookingController.js';
import * as paymentController from '../controllers/paymentController.js';
import * as admissionController from '../controllers/admissionController.js';
import * as authController from '../controllers/authController.js';

const router = Router();

// ─── Public webhook (authenticated by Paystack signature, not JWT) ──────────────
// Server-authoritative payment confirmation. Verified against the raw body in the
// service layer; never trusts a client-reported transaction status.
router.post('/webhook/paystack', paymentController.paystackWebhook);

// ─── Optionally-authenticated routes ───────────────────────────────────────────
// Guest bookings are supported (isLoggedIn sets req.user if present).
// `/create` reserves seats and returns the reference to pay against - it runs BEFORE
// checkout, so a charge can never exist without a booking behind it.
router.post(
  '/create',
  authController.isLoggedIn,
  bookingController.createBooking,
);

// Post-checkout confirmation. Unauthenticated for the same reason as /create: guest buyers
// have no session. Safe because the body carries only a reference, and the charge is
// verified against Paystack server-side before the reservation is confirmed.
router.post(
  '/confirm',
  authController.isLoggedIn,
  paymentController.confirmCheckout,
);

// ─── Protected routes ──────────────────────────────────────────────────────────
router.use(authController.protect);

router.get('/my-tickets', bookingController.getMyBookings);
router.get('/event/:event', bookingController.getBookingsForEvent);
router.patch('/check-in/:id', bookingController.checkInAttendee);

// ─── Door admission (organiser / assigned usher / admin) ────────────────────────
// Atomic single-use scan-and-admit for every guest type.
//
// **No role gate here, deliberately.** `admissionService.authorizeScan` is the authority:
// it admits an admin, the event's own owner, or an usher assigned to that specific event,
// and refuses everyone else with 403. A `restrictTo('usher','creator','admin')` used to sit
// in front of it and was actively wrong — **role is not a reliable proxy for ownership**.
// Signup only ever grants `user` or `creator`, and creating an event does not promote
// anyone, so an organiser who signed up as a plain `user` owns events they could not scan
// for: the route rejected them before the ownership rule ran, with a generic "you do not
// have permission" that named nothing. An admin worked, which made it look like an
// ownership bug rather than a routing one.
//
// The service already documents this exact reasoning and `checkInAttendee` (manual
// check-in) already relies on it with no role gate; this route was simply left behind.
// Duplicating an authorisation rule in two places is how they drift apart — and the copy
// that drifts is always the one nobody tested.
router.post('/scan', admissionController.scan);

export default router;
