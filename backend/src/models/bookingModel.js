import mongoose from 'mongoose';

// These fields describe a paid transaction and only exist for purchased bookings. Invite
// bookings (source: 'invite') are created without a checkout, so they are required only
// when the booking came from a purchase.
const requiredForPurchase = [
  function isPurchase() {
    return this.source === 'purchase';
  },
  'This field is required for purchased bookings.',
];

const bookingSchema = new mongoose.Schema(
  {
    event: {
      type: mongoose.Schema.ObjectId,
      ref: 'Event',
      required: [true, 'Booking must belong to an Event!'],
    },
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
    },
    email: {
      type: String,
      required: [true, 'Booking must have an email!'],
    },
    name: {
      type: String,
      required: [true, 'Booking must have a name!'],
    },
    price: {
      type: Number,
      default: 0,
      min: [0, 'Price cannot be negative'],
    },
    currency: {
      type: String,
      required: requiredForPurchase,
    },
    // Only known once the charge settles - a purchase booking is now reserved BEFORE
    // checkout (see bookingService.reserveBooking), so this cannot be required at insert.
    transactionNumber: {
      type: Number,
    },
    // The code a purchased ticket's QR carries, and what the door scanner resolves against
    // (see bookingRepository.findByInviteTokenOrTicketId). Always server-issued by
    // shared/utils/ticketIdGenerator.js - never accepted from the client. Unique index below.
    ticketId: {
      type: String,
      required: requiredForPurchase,
    },
    ticketUser: {
      type: String,
      required: requiredForPurchase,
    },
    // Payment lifecycle for a purchase booking. `pending` is the state a reservation sits
    // in between holding the seats and Paystack confirming (or failing) the charge.
    transactionStatus: {
      type: String,
      enum: ['pending', 'success', 'failed', 'expired'],
      default: 'pending',
    },
    redirectUrl: {
      type: String,
    },
    // Provider message, only present after the charge resolves.
    message: {
      type: String,
    },
    // When an unpaid reservation stops holding its seats. Cleared once the charge is
    // confirmed; the sweep in bookingService.releaseExpiredReservations returns the
    // inventory of anything still pending past this instant.
    reservationExpiresAt: {
      type: Date,
    },
    reference: {
      type: Number,
      required: requiredForPurchase,
    },
    ticketType: {
      type: String,
      required: [true, 'Booking must have a ticket type.'],
    },
    // How this admission came to exist: a paid purchase or an organiser invite.
    // Reporting-only - it never changes how admission is granted (see guest-management merge).
    source: {
      type: String,
      enum: ['purchase', 'invite'],
      required: true,
      default: 'purchase',
    },
    // Admission lifecycle. Replaces the old boolean `isCheckedIn` with a state machine
    // so we can distinguish delivered/scanned/rejected/revoked, not just in/out.
    status: {
      type: String,
      enum: [
        'issued',
        'delivered',
        'scanned',
        'admitted',
        'rejected',
        'revoked',
      ],
      default: 'issued',
    },
    // Signed, single-use token scanned at the door. `select: false` so it is never
    // returned by default queries. Unique+sparse index below (purchase bookings may
    // not carry one yet).
    inviteToken: {
      type: String,
      select: false,
    },
    // GDPR retention (Phase 6): set once name/email/ticketUser on this booking have been
    // anonymized. Every booking carries PII regardless of source (a purchase booking has
    // no linked Guest record at all), so this lives on Booking directly, mirroring
    // Guest.erasedAt.
    piiErasedAt: {
      type: Date,
    },
    // One-time code letting a guest who never made an account into this event's networking
    // channel. Only the SHA-256 hash is stored, so a database leak cannot be replayed -
    // the same treatment as passwordResetToken on the user model. `select: false` keeps it
    // out of every ordinary booking read.
    networkingOtpHash: {
      type: String,
      select: false,
    },
    networkingOtpExpires: {
      type: Date,
      select: false,
    },
    // Guest networking (Phase 7): must opt in to appear in the event's attendee directory -
    // privacy-by-default, not privacy-by-exception. Lives on Booking, not User, because
    // visibility is scoped to *this* event; the same account attending a different event
    // should not inherit it.
    networkingOptIn: {
      type: Boolean,
      default: false,
    },
    networkingBio: {
      type: String,
      trim: true,
      maxlength: [280, 'Bio is too long'],
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
    timestamps: true,
  },
);

// Backwards-compatible boolean the frontend/attendee list still reads. Derived from the
// state machine rather than stored, so there is a single source of truth for check-in.
bookingSchema.virtual('isCheckedIn').get(function () {
  return this.status === 'admitted';
});

bookingSchema.index({ inviteToken: 1 }, { unique: true, sparse: true });
// Two bookings must never share an admission code. Partial rather than sparse: invite
// bookings carry no ticketId at all, and a sparse unique index would still index any
// document that sets the field to an explicit null, colliding on the second such write.
bookingSchema.index(
  { ticketId: 1 },
  { unique: true, partialFilterExpression: { ticketId: { $type: 'string' } } },
);
// Confirm/release look every booking up by its Paystack reference.
bookingSchema.index({ reference: 1 });
// Expiry sweep query pattern: still-pending reservations whose hold has lapsed.
bookingSchema.index({ transactionStatus: 1, reservationExpiresAt: 1 });
// Retention sweep query pattern: bookings for a set of expired events not yet erased.
bookingSchema.index({ event: 1, piiErasedAt: 1 });

const Booking = mongoose.model('Booking', bookingSchema);

export default Booking;
