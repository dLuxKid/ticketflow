import * as eventRepository from '../repositories/eventRepository.js';
import * as bookingRepository from '../repositories/bookingRepository.js';
import * as messageRepository from '../repositories/messageRepository.js';
import { emitMessage } from '../shared/events/networkingEvents.js';
import AppError from '../shared/errors/AppError.js';

/**
 * Guest networking (Phase 7): a per-event group chat, an opt-in attendee directory, and
 * DMs, open while the event is live.
 *
 * Eligibility is "holds a non-revoked/non-rejected booking for this event" - the same
 * admission-status check Phase 2/4 already established, not a new "attendee" concept.
 */

const isOrganizerOrAdmin = (event, user) =>
  user?.role === 'admin' || Boolean(event.user?.equals?.(user?._id));

/**
 * Pure: has the organiser switched networking on for this event? Exported for unit testing.
 *
 * Only an explicit `false` disables it. Events created before the field existed store
 * `undefined`, and those already had networking - treating absence as "off" would silently
 * remove a feature from every event already in the database.
 */
export const isNetworkingEnabled = (event) =>
  event?.networkingEnabled !== false;

/** Pure: may `user` view this event's networking space? Exported for unit testing. */
export const canAccessNetworking = (user, event, booking) => {
  if (!user || !event) return false;
  if (!isNetworkingEnabled(event)) return false;
  if (booking) return true;
  return isOrganizerOrAdmin(event, user);
};

/** Pure: is this event currently accepting new networking messages? Exported for unit testing. */
export const canPostToNetworking = (event) =>
  isNetworkingEnabled(event) && event?.isLive === 'live';

/**
 * Loads the event and the viewer's booking (if any), authorizes access, and - the first
 * time a booking created without an account (an invite, or a guest checkout) is accessed by
 * its matching email - links it to the now-authenticated user. That link is what makes an
 * attendee DM-addressable by user id afterward without requiring every booking to have been
 * created by a logged-in buyer.
 */
export const resolveViewer = async (eventId, user) => {
  const event = await eventRepository.findById(eventId);
  if (!event) throw new AppError('No event found with that ID', 404);

  let booking = await bookingRepository.findByEventAndEmail(
    eventId,
    user.email,
  );
  if (booking && !booking.user) {
    booking = await bookingRepository.claimBooking(booking._id, user._id);
  }

  if (!canAccessNetworking(user, event, booking)) {
    throw new AppError(
      "You do not have access to this event's networking space",
      403,
    );
  }

  return { event, booking };
};

const assertLive = (event) => {
  if (!canPostToNetworking(event)) {
    throw new AppError('Networking is only open while the event is live', 403);
  }
};

export const getDirectory = async (eventId, user) => {
  await resolveViewer(eventId, user);
  return bookingRepository.findOptedInByEvent(eventId);
};

export const setOptIn = async (
  eventId,
  user,
  { networkingOptIn, networkingBio } = {},
) => {
  const { booking } = await resolveViewer(eventId, user);
  if (!booking) {
    throw new AppError(
      'Only attendees with a booking can join the directory',
      400,
    );
  }
  return bookingRepository.setNetworkingProfile(booking._id, {
    networkingOptIn,
    networkingBio,
  });
};

export const getGroupHistory = async (eventId, user) => {
  await resolveViewer(eventId, user);
  return messageRepository.findGroupHistory(eventId);
};

export const postGroupMessage = async (eventId, user, body) => {
  const { event } = await resolveViewer(eventId, user);
  assertLive(event);
  if (!body?.trim()) throw new AppError('Message cannot be empty', 400);

  const created = await messageRepository.create({
    event: eventId,
    sender: user._id,
    recipient: null,
    body: body.trim(),
  });
  const message = await created.populate('sender', 'name');

  emitMessage({ eventId: String(eventId), recipient: null, message });
  return message;
};

export const getDmThread = async (eventId, user, peerUserId) => {
  await resolveViewer(eventId, user);
  return messageRepository.findDmThread(eventId, user._id, peerUserId);
};

export const postDm = async (eventId, user, peerUserId, body) => {
  const { event } = await resolveViewer(eventId, user);
  assertLive(event);
  if (!body?.trim()) throw new AppError('Message cannot be empty', 400);

  // The recipient must themselves be an eligible attendee of this event - DMs stay inside
  // the event, they are not a general messaging feature.
  const peerBooking = await bookingRepository.findByEventAndUser(
    eventId,
    peerUserId,
  );
  if (!peerBooking) {
    throw new AppError('That attendee is not part of this event', 404);
  }

  const created = await messageRepository.create({
    event: eventId,
    sender: user._id,
    recipient: peerUserId,
    body: body.trim(),
  });
  const message = await created.populate('sender', 'name');

  emitMessage({
    eventId: String(eventId),
    recipient: String(peerUserId),
    sender: String(user._id),
    message,
  });
  return message;
};
