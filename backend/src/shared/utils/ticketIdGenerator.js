import crypto from 'crypto';

/**
 * Crockford base32 minus the ambiguous glyphs (I, L, O, U), so an id can be read aloud or
 * typed from a printout without 0/O or 1/I confusion at the door.
 */
const ALPHABET = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
const ID_LENGTH = 12;

/**
 * Generates a ticket ID for a purchased booking.
 *
 * This is not merely a display reference: `bookingRepository.findByInviteTokenOrTicketId`
 * resolves a scanned QR against `inviteToken` OR `ticketId`, so the ticket ID is the bearer
 * credential that admits its holder. It therefore has to be unguessable and issued by the
 * server - it was previously generated in the browser (`usePaystack.tsx`), which let a
 * caller choose its own admission code.
 *
 * `crypto.randomBytes` rather than `Math.random`: the latter is seeded, predictable and
 * unsuitable for anything security-bearing. 256 is an exact multiple of the 32-character
 * alphabet, so the modulo below is unbiased.
 *
 * Entropy is 32^12 ≈ 2^60, comparable to the invite token's, making collisions negligible;
 * the unique index on Booking.ticketId is the backstop that rejects one at insert rather
 * than silently issuing a duplicate admission code.
 *
 * @returns {string} e.g. '#K4M2XQ9WPR7T'
 */
const generateTicketId = () => {
  const bytes = crypto.randomBytes(ID_LENGTH);

  let id = '#';
  for (let i = 0; i < ID_LENGTH; i++) {
    id += ALPHABET[bytes[i] % ALPHABET.length];
  }

  return id;
};

export default generateTicketId;
