import { Router } from 'express';
import * as eventController from '../controllers/eventController.js';
import * as dashboardController from '../controllers/dashboardController.js';
import * as guestController from '../controllers/guestController.js';
import * as nlQueryController from '../controllers/nlQueryController.js';
import * as usherController from '../controllers/usherController.js';
import * as networkingController from '../controllers/networkingController.js';
import * as authController from '../controllers/authController.js';
import handleImg from '../../shared/middleware/uploadImage.js';

const router = Router();

// ─── Public routes ─────────────────────────────────────────────────────────────
router.get('/', eventController.getAllEvents);
router.get('/count', eventController.getAllEventsLength);
router.get('/trending', eventController.getTrendingEvents);
router.get('/upcoming', eventController.getUpcomingEvents);
router.get('/:slug', eventController.getEvent);

// ─── Guest networking access (public by necessity) ──────────────────────────────
// Most attendees never create an account - a guest checkout or an emailed invite captures
// only a name and an email - so these two sit ahead of `protect`. Authorisation is proof of
// control over the email address on the booking: request a code, then submit it. Registered
// before the router mounts `protect`, and multi-segment so '/:slug' above cannot swallow it.
router.post(
  '/:eventId/network/guest/request',
  networkingController.requestGuestAccess,
);
router.post(
  '/:eventId/network/guest/verify',
  networkingController.verifyGuestAccess,
);

// ─── Protected routes ──────────────────────────────────────────────────────────
router.use(authController.protect);

router.post('/create', handleImg, eventController.createEvent);
router.get('/my/events', eventController.getMyEvents);
// Two segments, so it cannot be swallowed by the public single-segment '/:slug' above.
// Any role may call it: door staff are scoped by their own assignedEvents, and a user with
// none simply gets an empty list.
router.get('/my/assigned-events', eventController.getAssignedEvents);
// Two segments, so the public single-segment '/:slug' above cannot swallow it. No role gate:
// scope is decided inside revenueService from the caller's role - an organiser sees their own
// events, an admin sees the whole platform.
router.get('/revenue/summary', eventController.getRevenueSummary);
// What an organiser surface needs to render its own chrome (name, access mode, whether the
// event has a guest list at all). Two segments, so the public single-segment '/:slug' above
// cannot swallow it. No role gate: eventService.getEventWorkspace authorises owner, admin or
// assigned usher, which is exactly who can open these pages.
router.get('/:eventId/workspace', eventController.getEventWorkspace);
// Ownership is enforced in eventService.updateEvent; the service allows the event's
// own creator or an admin. No role gate here so any user who owns an event can edit it.
router.patch('/update/:eventId', eventController.updateEvent);
// Archives rather than removes - an event is referenced by paid bookings and the admission
// audit log. Admin-only; enforced in eventService.deleteEvent.
router.delete('/:eventId', eventController.deleteEvent);

// ─── Live arrivals dashboard (organiser / admin) ────────────────────────────────
// Snapshot for initial render; SSE stream for live updates. Both authorize the viewer
// against the event in dashboardService, so no one can watch another organiser's event.
router.get('/:eventId/dashboard', dashboardController.getSnapshot);
router.get('/:eventId/stream', dashboardController.streamEvent);
router.get('/:eventId/anomalies', dashboardController.getAnomalies);

// ─── Guest list (organiser / admin) ─────────────────────────────────────────────
// Manage the guest list of an invite_only / hybrid event. Ownership + access-mode are
// enforced in guestService; importing issues single-use invites with emailed QR codes.
router
  .route('/:eventId/guests')
  .get(guestController.listGuests)
  .post(guestController.importGuests);

// Natural-language questions over the guest list ("who hasn't arrived", "how many VIPs
// checked in"). Same organiser/admin access rule as the guest list and dashboard.
router.post('/:eventId/guests/query', nlQueryController.query);

// GDPR: erase one guest's PII immediately, ahead of the scheduled retention sweep
// (scripts/gdpr-retention-sweep.js). Same organiser/admin access rule.
router.delete('/:eventId/guests/:guestId/erase', guestController.eraseGuest);

// ─── Door staff (organiser / admin) ─────────────────────────────────────────────
// Assigning someone here is what actually grants them scan-and-admit access - it sets the
// same assignedEvents field admissionService.authorizeScan checks (Phase 2).
router
  .route('/:eventId/ushers')
  .get(usherController.listUshers)
  .post(usherController.assignUsher);
router.delete('/:eventId/ushers/:userId', usherController.unassignUsher);

// ─── Guest networking (attendees of a live event) ───────────────────────────────
// Eligibility (a non-revoked/rejected booking for this event, or the organiser/admin) is
// enforced in networkingService; posting is additionally gated on the event being live.
router.get('/:eventId/network/stream', networkingController.streamNetwork);
router.get('/:eventId/network/directory', networkingController.getDirectory);
router.patch('/:eventId/network/opt-in', networkingController.setOptIn);
router.post(
  '/:eventId/network/messages',
  networkingController.postGroupMessage,
);
router
  .route('/:eventId/network/dms/:userId')
  .get(networkingController.getDmThread)
  .post(networkingController.postDm);

export default router;
