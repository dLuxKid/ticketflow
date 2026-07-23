import { Router } from 'express';
import * as bookingController from '../controllers/bookingController.js';
import * as authController from '../controllers/authController.js';

const router = Router();

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
