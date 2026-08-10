import * as eventRepository from '../repositories/eventRepository.js';
import * as userRepository from '../repositories/userRepository.js';
import AppError from '../shared/errors/AppError.js';
import { hasGuestList } from '../models/eventModel.js';
import { authorizeScan } from './admissionService.js';

/**
 * Business logic layer for event management.
 * Framework-agnostic: no req/res/next.
 */

/**
 * An invite_only event admits guests purely from the organiser's guest list, so it must
 * not carry purchasable ticket tiers. Enforced here (application layer) rather than as a
 * schema conditional-required, which is brittle across sibling paths in Mongoose.
 */
const assertTiersMatchAccessMode = (accessMode, ticketDetails) => {
  if (accessMode === 'invite_only' && ticketDetails?.length) {
    throw new AppError('An invite-only event cannot have ticket tiers', 400);
  }
};

export const createEvent = (eventData, userId) => {
  assertTiersMatchAccessMode(eventData.accessMode, eventData.ticketDetails);
  return eventRepository.create({ ...eventData, user: userId });
};

export const getAllEvents = (queryParams) =>
  eventRepository.findActiveWithFeatures(queryParams);

export const getAllEventsCount = async () => {
  const events = await eventRepository.countActive();
  return events.length;
};

/**
 * The caller's events - or every event on the platform, for an admin.
 *
 * An admin can already act on any event; scoping their list to what they personally created
 * meant a freshly-seeded admin logged in to an empty page and could not reach a single one.
 *
 * @param {object} user - req.user (role decides the scope)
 */
/**
 * The caller's events.
 *
 * An admin used to get *every* event here unconditionally, which left them no way to see
 * only the ones they organise themselves — their own events were buried among everyone
 * else's, and "Events you created" was plainly the wrong heading for that list. `scope` now
 * makes the choice explicit, defaulting to `own` so the answer matches the question the
 * page is asking. Only an admin may widen it; for anyone else the parameter is ignored
 * rather than honoured, so it cannot be used to read another organiser's events.
 *
 * @param {object} user - req.user
 * @param {object} queryParams - filtering/sorting passthrough
 * @param {{scope?: 'own'|'all'}} [options]
 */
export const getMyEvents = (user, queryParams, { scope = 'own' } = {}) => {
  const isAdmin = user?.role === 'admin';
  const wantsAll = isAdmin && scope === 'all';

  return eventRepository.findByUserWithFeatures(
    wantsAll ? null : (user?.id ?? user?._id),
    queryParams,
  );
};

/**
 * Events the caller works as door staff.
 *
 * Reads straight off the authenticated user's `assignedEvents` - the same field
 * admissionService.authorizeScan checks - so the list can never show an event the holder
 * would then be refused at the door.
 *
 * @param {object} user - req.user
 * @returns {Promise<object[]>}
 */
export const getAssignedEvents = (user) => {
  const assigned = user?.assignedEvents ?? [];
  if (assigned.length === 0) return Promise.resolve([]);
  return eventRepository.findByIds(assigned);
};

/**
 * The small amount an organiser surface needs to render its own chrome: which event this is,
 * and which of the per-event tools it actually has.
 *
 * Exists because the Guest list / Live dashboard / Scanner / Door staff pages are addressed
 * by event id alone and previously knew nothing else about the event - so the shared tab
 * strip offered a Guest list for every event, including public ones, where the link led
 * straight to a 400 from guestService. Offering a control that cannot work is a defect in
 * its own right: the user cannot tell "not allowed" from "broken".
 *
 * Authorised with admissionService.authorizeScan rather than a fresh rule, because that is
 * already the platform's definition of "may work this event" - owner, admin, or an usher
 * assigned to it - and the scanner is one of the four surfaces asking.
 */
export const getEventWorkspace = async (eventId, user) => {
  const event = await eventRepository.findById(eventId);
  if (!event) throw new AppError('No event found with that ID', 404);

  const auth = authorizeScan(user, event);
  if (!auth.ok) {
    throw new AppError(
      'You do not have permission to view this event',
      auth.httpStatus ?? 403,
    );
  }

  return {
    eventId: String(event._id),
    eventName: event.eventName,
    // The edit route is addressed by slug, not id, so a surface that only knows the id
    // cannot link to it without this.
    slug: event.slug,
    accessMode: event.accessMode,
    // Computed here, not in the browser, so the UI cannot disagree with the rule the API
    // enforces when the guest-list request actually arrives.
    hasGuestList: hasGuestList(event),
  };
};

export const getEventBySlug = async (slug) => {
  const event = await eventRepository.findBySlug(slug);
  if (!event) throw new AppError('No event found with that slug', 404);
  return event;
};

export const updateEvent = async (eventId, data, user) => {
  if (!eventId) throw new AppError('Event ID is required', 400);

  const event = await eventRepository.findById(eventId);
  if (!event) throw new AppError('No event found with that ID', 404);

  // Ownership enforcement: only the event's own creator (or an admin) may update it.
  // Without this, any authenticated user could edit any event (broken access control).
  const isOwner = event.user?.equals(user._id);
  if (user.role !== 'admin' && !isOwner) {
    throw new AppError('You do not have permission to update this event', 403);
  }

  // Validate against the effective post-update state (new value if provided, else current).
  const effectiveAccessMode = data.accessMode ?? event.accessMode;
  const effectiveTiers = data.ticketDetails ?? event.ticketDetails;
  assertTiersMatchAccessMode(effectiveAccessMode, effectiveTiers);

  return eventRepository.updateById(eventId, data);
};

export const getTrendingEvents = () => eventRepository.findTrending();

export const getUpcomingEvents = () => eventRepository.findUpcoming();

/**
 * Thin translation from a small, LLM-friendly filter set (Phase 8's chatbot search_events
 * tool) to the query-string shape APIFeatures already expects - reuses the exact same
 * search behind public event discovery rather than a second implementation. Only
 * category/city/name are exposed: APIFeatures' `startDate` handling is an exact-match
 * equality check, not a range, so it isn't useful for "events next month"-style queries and
 * isn't offered here rather than pretending it works.
 */
export const searchEvents = ({ category, city, name } = {}) => {
  const queryParams = { limit: 5 };
  if (category) queryParams.eventCategory = category;
  if (city) queryParams.eventLocation = city;
  if (name) queryParams.eventName = name;
  return eventRepository.findActiveWithFeatures(queryParams);
};

/**
 * Archives an event on an admin's authority.
 *
 * Soft delete by design. An event is referenced by bookings (some paid), guests, audit logs
 * and chat messages; removing the document would invalidate tickets people bought and
 * destroy the admission record that GDPR retention and any payment dispute rely on. This
 * hides it everywhere instead, and is reversible by clearing `isActive`.
 *
 * Usher assignments pointing at it are cleared in the same operation: those grant nothing
 * once the event is gone, and leaving them would silently re-arm every one of them if the
 * event were ever restored.
 *
 * @param {string} eventId
 * @param {object} user - req.user; must be an admin
 * @returns {Promise<{event: object, affected: {bookings:number, paidBookings:number, guests:number}}>}
 */
export const deleteEvent = async (eventId, user) => {
  if (user?.role !== 'admin') {
    throw new AppError('Only an administrator can delete an event', 403);
  }

  const event = await eventRepository.findById(eventId);
  if (!event) throw new AppError('No event found with that ID', 404);

  // Reported back so the caller can tell an admin what they just affected - archiving an
  // event with paid attendees is legitimate (a cancellation) but should never be silent.
  const affected = await eventRepository.countReferences(eventId);

  const archived = await eventRepository.archive(eventId);
  await userRepository.unassignAllFromEvent(eventId);

  return { event: archived, affected };
};
