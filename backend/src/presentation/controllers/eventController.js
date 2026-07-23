import * as eventService from '../../services/eventService.js';
import catchAsync from '../../shared/middleware/catchAsync.js';

/**
 * Presentation layer for event management.
 * Handles HTTP concerns only — delegates all business logic to eventService.
 */

export const createEvent = catchAsync(async (req, res) => {
  const event = await eventService.createEvent(req.body, req.user._id);

  res.status(201).json({
    status: 'success',
    message: 'Your event has been created',
    data: { event },
  });
});

export const getAllEvents = catchAsync(async (req, res) => {
  const event = await eventService.getAllEvents(req.query);

  res.status(200).json({
    status: 'success',
    data: { event },
  });
});

export const getAllEventsLength = catchAsync(async (req, res) => {
  const count = await eventService.getAllEventsCount(req.query);

  res.status(200).json({
    status: 'success',
    results: count,
  });
});

export const getMyEvents = catchAsync(async (req, res) => {
  const events = await eventService.getMyEvents(req.user.id, req.query);

  res.status(200).json({
    status: 'success',
    data: { events },
  });
});

export const getEvent = catchAsync(async (req, res) => {
  const event = await eventService.getEventBySlug(req.params.slug);

  res.status(200).json({
    status: 'success',
    data: { event },
  });
});

export const updateEvent = catchAsync(async (req, res, next) => {
  const event = await eventService.updateEvent(req.params.eventId, req.body);

  res.status(200).json({
    status: 'success',
    message: 'Your event has been updated',
    data: { event },
  });
});

export const getTrendingEvents = catchAsync(async (req, res) => {
  const event = await eventService.getTrendingEvents();

  res.status(200).json({
    status: 'success',
    data: { event },
  });
});

export const getUpcomingEvents = catchAsync(async (req, res) => {
  const event = await eventService.getUpcomingEvents();

  res.status(200).json({
    status: 'success',
    data: { event },
  });
});
