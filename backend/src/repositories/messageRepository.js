import Message from '../models/messageModel.js';

/**
 * Persistence layer for Message documents (Phase 7 networking).
 * No business logic - only database operations.
 */

export const create = (data) => Message.create(data);

/** Most recent group-broadcast messages for an event, oldest first for a chat feed. */
export const findGroupHistory = async (eventId, limit = 50) => {
  const rows = await Message.find({ event: eventId, recipient: null })
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate('sender', 'name');
  return rows.reverse();
};

/** The DM thread between two participants on one event, oldest first. */
export const findDmThread = async (eventId, userA, userB, limit = 50) => {
  const rows = await Message.find({
    event: eventId,
    $or: [
      { sender: userA, recipient: userB },
      { sender: userB, recipient: userA },
    ],
  })
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate('sender', 'name');
  return rows.reverse();
};
