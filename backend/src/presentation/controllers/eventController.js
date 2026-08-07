import * as eventService from '../../services/eventService.js';
import * as revenueService from '../../services/revenueService.js';
import catchAsync from '../../shared/middleware/catchAsync.js';

/**
 * Presentation layer for event management.
 * Handles HTTP concerns only - delegates all business logic to eventService.
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
  // The whole user is passed, not just the id: the service widens the scope to every event
  // when the caller is an admin.
  const events = await eventService.getMyEvents(req.user, req.query);

  res.status(200).json({
    status: 'success',
    data: { events },
  });
});

/** Events the caller has been assigned to work as door staff (usher). */
export const getAssignedEvents = catchAsync(async (req, res) => {
  const events = await eventService.getAssignedEvents(req.user);

  res.status(200).json({
    status: 'success',
    data: { events },
  });
});

/**
 * Archives an event. Admin-only. Reports what the archive affected so the caller can warn an
 * admin who has just hidden an event with paid attendees.
 */
export const deleteEvent = catchAsync(async (req, res) => {
  const { event, affected } = await eventService.deleteEvent(
    req.params.eventId,
    req.user,
  );

  res.status(200).json({
    status: 'success',
    message: `"${event.eventName}" has been archived`,
    data: { affected },
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
  const event = await eventService.updateEvent(
    req.params.eventId,
    req.body,
    req.user,
  );

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

/**
 * Revenue summary - per event plus totals, scoped by role.
 *
 * No role gate on the route: `revenueService` decides scope from `req.user.role`, so an
 * organiser receives only their own events and an admin the whole platform. Gating the
 * route on `admin` would have hidden organisers' own earnings from them.
 */
export const getRevenueSummary = catchAsync(async (req, res) => {
  const summary = await revenueService.getRevenueSummary(req.user);

  res.status(200).json({ status: 'success', data: summary });
});
