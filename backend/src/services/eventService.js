import * as eventRepository from '../repositories/eventRepository.js';
import AppError from '../shared/errors/AppError.js';

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

export const getMyEvents = (userId, queryParams) =>
  eventRepository.findByUserWithFeatures(userId, queryParams);

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
 * tool) to the query-string shape APIFeatures already expects — reuses the exact same
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
