import crypto from 'crypto';

import * as bookingRepository from '../repositories/bookingRepository.js';
import * as eventRepository from '../repositories/eventRepository.js';
import * as userRepository from '../repositories/userRepository.js';
import { generateToken } from './authService.js';
import { isNetworkingEnabled } from './networkingService.js';
import {
  generateOtp,
  hashOtp,
  verifyOtp,
  OTP_TTL_MS,
} from '../shared/utils/networkingOtp.js';
import { sendNetworkingOtp } from '../shared/utils/sendNetworkingOtp.js';
import AppError from '../shared/errors/AppError.js';

/**
 * Guest access to an event's networking channel.
 *
 * Most attendees never create an account - a guest checkout or an emailed invite only ever
 * captures a name and an email. Networking sat behind `protect`, so those people, who are
 * the majority of any guest list, could not reach the channel for the event they are
 * actually attending.
 *
 * The flow is email-ownership proof: request a code, receive it at the address on the
 * booking, submit it. Verification then **mints an ordinary session** rather than inventing a
 * parallel guest identity - messages reference a User, the directory lists Users, and DMs
 * address Users, so a second kind of principal would mean touching every one of those. The
 * account is created from the booking's own name and email if it does not already exist;
 * networkingService.resolveViewer then claims the booking on first access, which it was
 * already written to do.
 */

/**
 * Sends a one-time code to a guest holding a booking for this event.
 *
 * Always resolves successfully, whether or not the email matches a booking. Reporting "no
 * booking for that address" would turn this endpoint into an oracle for who is attending a
 * private event.
 *
 * @returns {Promise<{sent: boolean}>} `sent` is for logs and tests, not for the response body
 */
export const requestAccessCode = async (eventId, email) => {
  const address = String(email ?? '')
    .trim()
    .toLowerCase();
  if (!address) throw new AppError('An email address is required', 400);

  const event = await eventRepository.findById(eventId);
  if (!event) throw new AppError('No event found with that ID', 404);

  // Refusing here is safe to state plainly: whether an event has networking is a property of
  // the event, not of who is on its guest list, so it leaks nothing.
  if (!isNetworkingEnabled(event)) {
    throw new AppError('Networking is not enabled for this event', 403);
  }

  const booking = await bookingRepository.findByEventAndEmail(eventId, address);
  if (!booking) return { sent: false };

  const code = generateOtp();
  await bookingRepository.setNetworkingOtp(booking._id, {
    hash: hashOtp(code),
    expiresAt: new Date(Date.now() + OTP_TTL_MS),
  });

  await sendNetworkingOtp({
    to: booking.email,
    name: booking.name || 'there',
    eventName: event.eventName,
    code,
    expiresInMinutes: Math.round(OTP_TTL_MS / 60000),
  });

  return { sent: true };
};

/**
 * Verifies a code and returns a session token for the matching attendee.
 *
 * The code is single-use: it is cleared the moment it verifies, so a code read from an
 * inbox cannot be replayed. A wrong or expired code returns the same generic failure as an
 * unknown email, again so the endpoint reveals nothing about the guest list.
 *
 * @returns {Promise<{token: string, user: object}>}
 */
export const verifyAccessCode = async (eventId, email, code) => {
  const address = String(email ?? '')
    .trim()
    .toLowerCase();
  const invalid = new AppError('That code is invalid or has expired', 401);

  if (!address || !code) throw invalid;

  const booking = await bookingRepository.findByEventAndEmailWithOtp(
    eventId,
    address,
  );
  if (!booking) throw invalid;

  if (
    !verifyOtp(code, booking.networkingOtpHash, booking.networkingOtpExpires)
  ) {
    throw invalid;
  }

  // Burn the code before issuing anything, so a crash between the two cannot leave a live
  // code behind.
  await bookingRepository.clearNetworkingOtp(booking._id);

  let user = await userRepository.findByEmail(address);
  if (!user) {
    // The password is random and never disclosed: this account exists so the attendee has a
    // User identity to post and be messaged as. They can take ownership any time through the
    // ordinary forgot-password flow, which is why the address must already be verified -
    // and it is, by the code they just submitted.
    const password = crypto.randomBytes(24).toString('base64url');
    user = await userRepository.create({
      name: booking.name || 'Guest',
      email: address,
      password,
      passwordConfirm: password,
      role: 'user',
    });
  }

  return { token: generateToken(user._id), user };
};
