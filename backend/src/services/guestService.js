import * as eventRepository from '../repositories/eventRepository.js';
import * as guestRepository from '../repositories/guestRepository.js';
import { hasGuestList } from '../models/eventModel.js';
import * as bookingRepository from '../repositories/bookingRepository.js';
import { generateInviteToken } from '../shared/utils/inviteToken.js';
import { sendInvite } from '../shared/utils/sendInvite.js';
import AppError from '../shared/errors/AppError.js';

/**
 * Guest-list management for invite_only / hybrid events.
 *
 * Adding a guest issues an invite: it creates a Guest entry and a linked admission Booking
 * (source: 'invite') carrying a single-use token, then emails the guest a scannable QR.
 * This is the "a guest-list entry becomes one admission document" rule - the same document
 * the door scanner admits in Phase 2.
 */

const isOwnerOrAdmin = (event, user) =>
  user?.role === 'admin' || Boolean(event.user?.equals?.(user?._id));

/** Loads the event and asserts the caller may manage its guest list. */
const authorizeGuestManagement = async (eventId, user) => {
  const event = await eventRepository.findById(eventId);
  if (!event) throw new AppError('No event found with that ID', 404);
  if (!isOwnerOrAdmin(event, user)) {
    throw new AppError(
      'You do not have permission to manage this guest list',
      403,
    );
  }
  if (!hasGuestList(event)) {
    throw new AppError(
      'This is a public event. Set it to invite-only or hybrid to add guests.',
      400,
    );
  }
  return event;
};

export const getGuests = async (eventId, user) => {
  await authorizeGuestManagement(eventId, user);
  return guestRepository.findByEvent(eventId);
};

/**
 * Imports a batch of guests, issuing an invite for each new one.
 *
 * @returns {Promise<{added: string[], skipped: string[], failed: Array<{email,error}>}>}
 */
export const importGuests = async (eventId, guests, user) => {
  const event = await authorizeGuestManagement(eventId, user);

  if (!Array.isArray(guests) || guests.length === 0) {
    throw new AppError('Provide at least one guest to import', 400);
  }

  const result = { added: [], skipped: [], failed: [] };

  for (const raw of guests) {
    const name = raw?.name?.trim();
    const email = raw?.email?.trim().toLowerCase();

    if (!name || !email) {
      result.failed.push({
        email: email ?? '(missing)',
        error: 'name and email are required',
      });
      continue;
    }

    try {
      // Skip anyone already on the list (also guarded by the unique event+email index).
      const existing = await guestRepository.findOneByEventAndEmail(
        eventId,
        email,
      );
      if (existing) {
        result.skipped.push(email);
        continue;
      }

      await issueInvite(event, {
        name,
        email,
        vip: Boolean(raw.vip),
        plusOnes: Number.parseInt(raw.plusOnes, 10) || 0,
      });
      result.added.push(email);
    } catch (err) {
      // Duplicate-key race → treat as skipped, not failed.
      if (err?.code === 11000) {
        result.skipped.push(email);
      } else {
        result.failed.push({ email, error: err.message });
      }
    }
  }

  return result;
};

/** Creates the Guest + linked invite Booking and emails the QR (email is non-fatal). */
const issueInvite = async (event, guest) => {
  const created = await guestRepository.create({
    event: event._id,
    name: guest.name,
    email: guest.email,
    vip: guest.vip,
    plusOnes: guest.plusOnes,
  });

  const inviteToken = generateInviteToken();
  const booking = await bookingRepository.create({
    event: event._id,
    email: guest.email,
    name: guest.name,
    ticketType: guest.vip ? 'VIP' : 'Guest',
    currency: event.currency,
    price: 0,
    source: 'invite',
    status: 'issued',
    inviteToken,
  });

  await guestRepository.linkBooking(created._id, booking._id);

  // Delivery must not fail the import - the invite exists and can be resent.
  try {
    await sendInvite({
      to: guest.email,
      name: guest.name,
      eventName: event.eventName,
      inviteToken,
    });
    booking.status = 'delivered';
    await booking.save();
  } catch {
    // Left as 'issued'; organiser can resend later.
  }

  return { guest: created, booking };
};
