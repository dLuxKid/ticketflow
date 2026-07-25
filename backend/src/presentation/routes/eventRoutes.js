import { Router } from 'express';
import * as eventController from '../controllers/eventController.js';
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

export default router;
