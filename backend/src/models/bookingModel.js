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
    transactionNumber: {
      type: Number,
      required: requiredForPurchase,
    },
    ticketId: {
      type: String,
      required: requiredForPurchase,
    },
    ticketUser: {
      type: String,
      required: requiredForPurchase,
    },
    transactionStatus: {
      type: String,
      required: requiredForPurchase,
    },
    redirectUrl: {
      type: String,
      // required: requiredForPurchase,
    },
    message: {
      type: String,
      required: requiredForPurchase,
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
    // Reporting-only — it never changes how admission is granted (see EntryPoint merge).
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
// Retention sweep query pattern: bookings for a set of expired events not yet erased.
bookingSchema.index({ event: 1, piiErasedAt: 1 });

const Booking = mongoose.model('Booking', bookingSchema);

export default Booking;
