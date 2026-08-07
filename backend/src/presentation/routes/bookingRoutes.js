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

// ─── Door admission (usher / organiser / admin) ─────────────────────────────────
// Atomic single-use scan-and-admit for every guest type. Event-level scope (an usher may
// only admit for their assigned events) is enforced in admissionService.
router.post(
  '/scan',
  authController.restrictTo('usher', 'creator', 'admin'),
  admissionController.scan,
);

export default router;
