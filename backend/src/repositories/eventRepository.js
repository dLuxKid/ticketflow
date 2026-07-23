import Event from '../models/eventModel.js';
import APIFeatures from '../shared/utils/apiFeatures.js';

/**
 * Persistence layer for Event documents.
 * No business logic — only database operations.
 */

export const create = (data) => Event.create(data);

export const findById = (id) => Event.findById(id);

export const findByIdWithOrganizer = (id) =>
  Event.findById(id).populate({ path: 'user', select: 'name' });

export const updateById = (id, data, options = { new: true }) =>
  Event.findByIdAndUpdate(id, data, options);

export const save = (event) => event.save();

/**
 * Returns all active events (currently running or yet to start) with
 * query string filtering, sorting, field limiting, and pagination applied.
 */
export const findActiveWithFeatures = (queryParams) => {
  const query = Event.find({
    $or: [
      { startDate: { $gte: new Date() } },
      { endDate: { $gte: new Date() } },
    ],
  });
  return new APIFeatures(query, queryParams)
    .filter()
    .sort()
    .limitFields()
    .paginate().query;
};

/**
 * Returns active events with only the _id field — used to compute total count.
 */
export const countActive = () => {
  const query = Event.find({
    $or: [
      { startDate: { $gte: new Date() } },
      { endDate: { $gte: new Date() } },
    ],
  });
  return new APIFeatures(query, { fields: '_id' }).limitFields().query;
};

/**
 * Returns events belonging to a specific user.
 */
export const findByUserWithFeatures = (userId, queryParams) => {
  const query = Event.find({});
  return new APIFeatures(query, {
    user: userId,
    sort: '-startDate',
    ...queryParams,
  })
    .filter()
    .sort()
    .limitFields().query;
};

/**
 * Returns a single event by its slug, with organizer details populated.
 */
export const findBySlug = (slug) =>
  Event.findOne({ slug }).populate('user', 'name email photo');

/**
 * Returns top 3 upcoming events sorted by attendee count (trending).
 */
export const findTrending = () => {
  const query = Event.find({
    $or: [
      { startDate: { $gte: new Date() } },
      { endDate: { $gte: new Date() } },
    ],
  });
  return new APIFeatures(query, { sort: '-numberOfAttendees', limit: 3 })
    .sort()
    .limitFields()
    .paginate().query;
};

/**
 * Returns the next 3 upcoming events sorted by start date.
 */
export const findUpcoming = () =>
  Event.find({ startDate: { $gt: new Date() } })
    .sort({ startDate: 1, startTime: 1, _id: 1 })
    .limit(3)
    .select(
      '_id slug eventName startDate startTime endDate endTime eventLocation coverImage numberOfAttendees timezone salesStartDate salesEndDate',
    );
