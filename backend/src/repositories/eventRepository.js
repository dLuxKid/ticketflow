import Event from '../models/eventModel.js';
import APIFeatures from '../shared/utils/apiFeatures.js';

/**
 * Persistence layer for Event documents.
 * No business logic — only database operations.
 */

export const create = (data) => Event.create(data);

export const findById = (id) => Event.findById(id);

/**
 * Events that ended on or before `cutoffDate` — the population eligible for GDPR
 * retention. Inclusive (`$lte`, not `$lt`) to match retentionService.isPastRetentionWindow's
 * `now >= cutoff` contract exactly — a mismatched boundary here would mean the sweep's
 * real behavior silently diverged from its tested/documented one-day-early-or-late edge case.
 */
export const findEndedBefore = (cutoffDate) =>
  Event.find({ endDate: { $lte: cutoffDate } }).select('_id');

export const findByIdWithOrganizer = (id) =>
  Event.findById(id).populate({ path: 'user', select: 'name' });

export const updateById = (id, data, options = { new: true }) =>
  Event.findByIdAndUpdate(id, data, options);

export const save = (event) => event.save();

/**
 * Atomically reserves `count` tickets of a given type on an event.
 *
 * The update only matches (and therefore only succeeds) when the event has an embedded
 * ticket of `ticketName` whose `ticketQuantity` is still >= `count`. Because MongoDB
 * applies a single-document update atomically, two concurrent buyers cannot both pass
 * the `$gte` guard for the last remaining tickets — one update matches and decrements,
 * the other matches nothing and returns null. This eliminates the oversell race and can
 * never drive `ticketQuantity` below zero.
 *
 * @returns {Promise<object|null>} the updated event, or null if not enough tickets remain
 */
export const reserveTicketInventory = (eventId, ticketName, count, session) =>
  Event.findOneAndUpdate(
    {
      _id: eventId,
      ticketDetails: {
        $elemMatch: { ticketName, ticketQuantity: { $gte: count } },
      },
    },
    {
      $inc: {
        'ticketDetails.$.ticketQuantity': -count,
        numberOfAttendees: count,
      },
    },
    { new: true, session },
  );

/**
 * Returns all active events (currently running or yet to start) with
 * query string filtering, sorting, field limiting, and pagination applied.
 */
export const findActiveWithFeatures = (queryParams) => {
  const query = Event.find({
    accessMode: { $ne: 'invite_only' },
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
    accessMode: { $ne: 'invite_only' },
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
    accessMode: { $ne: 'invite_only' },
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
  Event.find({
    accessMode: { $ne: 'invite_only' },
    startDate: { $gt: new Date() },
  })
    .sort({ startDate: 1, startTime: 1, _id: 1 })
    .limit(3)
    .select(
      '_id slug eventName startDate startTime endDate endTime eventLocation coverImage numberOfAttendees timezone salesStartDate salesEndDate',
    );
