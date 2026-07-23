import * as eventRepository from '../repositories/eventRepository.js';
import AppError from '../shared/errors/AppError.js';

/**
 * Business logic layer for event management.
 * Framework-agnostic: no req/res/next.
 */

export const createEvent = (eventData, userId) =>
  eventRepository.create({ ...eventData, user: userId });

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

export const updateEvent = async (eventId, data) => {
  if (!eventId) throw new AppError('Event ID is required', 400);
  const event = await eventRepository.updateById(eventId, data);
  if (!event) throw new AppError('No event found with that ID', 404);
  return event;
};

export const getTrendingEvents = () => eventRepository.findTrending();

export const getUpcomingEvents = () => eventRepository.findUpcoming();
