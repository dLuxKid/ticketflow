import { Router } from 'express';
import * as bookingController from '../controllers/bookingController.js';
import * as paymentController from '../controllers/paymentController.js';
import * as authController from '../controllers/authController.js';

const router = Router();

// ─── Public webhook (authenticated by Paystack signature, not JWT) ──────────────
// Server-authoritative payment confirmation. Verified against the raw body in the
// service layer; never trusts a client-reported transaction status.
router.post('/webhook/paystack', paymentController.paystackWebhook);

// ─── Optionally-authenticated routes ───────────────────────────────────────────
// Guest bookings are supported (isLoggedIn sets req.user if present)
router.post(
  '/create',
  authController.isLoggedIn,
  bookingController.createBooking,
);

// ─── Protected routes ──────────────────────────────────────────────────────────
router.use(authController.protect);

router.get('/my-tickets', bookingController.getMyBookings);
router.get('/event/:event', bookingController.getBookingsForEvent);
router.patch('/check-in/:id', bookingController.checkInAttendee);

export default router;
