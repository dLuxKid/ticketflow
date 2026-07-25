import { Router } from 'express';
import * as eventController from '../controllers/eventController.js';
import * as dashboardController from '../controllers/dashboardController.js';
import * as guestController from '../controllers/guestController.js';
import * as authController from '../controllers/authController.js';
import handleImg from '../../shared/middleware/uploadImage.js';

const router = Router();

// ─── Public routes ─────────────────────────────────────────────────────────────
router.get('/', eventController.getAllEvents);
router.get('/count', eventController.getAllEventsLength);
router.get('/trending', eventController.getTrendingEvents);
router.get('/upcoming', eventController.getUpcomingEvents);
router.get('/:slug', eventController.getEvent);

// ─── Protected routes ──────────────────────────────────────────────────────────
router.use(authController.protect);

router.post('/create', handleImg, eventController.createEvent);
router.get('/my/events', eventController.getMyEvents);
// Ownership is enforced in eventService.updateEvent; the service allows the event's
// own creator or an admin. No role gate here so any user who owns an event can edit it.
router.patch('/update/:eventId', eventController.updateEvent);

// ─── Live arrivals dashboard (organiser / admin) ────────────────────────────────
// Snapshot for initial render; SSE stream for live updates. Both authorize the viewer
// against the event in dashboardService, so no one can watch another organiser's event.
router.get('/:eventId/dashboard', dashboardController.getSnapshot);
router.get('/:eventId/stream', dashboardController.streamEvent);

// ─── Guest list (organiser / admin) ─────────────────────────────────────────────
// Manage the guest list of an invite_only / hybrid event. Ownership + access-mode are
// enforced in guestService; importing issues single-use invites with emailed QR codes.
router
  .route('/:eventId/guests')
  .get(guestController.listGuests)
  .post(guestController.importGuests);

export default router;
