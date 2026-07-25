import mongoose from 'mongoose';

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
      required: [true, 'Booking must have a price.'],
    },
    currency: {
      type: String,
      required: [true, 'Booking must have a currency.'],
    },
    transactionNumber: {
      type: Number,
      required: [true, 'Booking must have a transaction number.'],
    },
    ticketId: {
      type: String,
      required: [true, 'Booking must have a ticket Id.'],
    },
    ticketUser: {
      type: String,
      required: [true, 'Booking must have a ticket user.'],
    },
    transactionStatus: {
      type: String,
      required: [true, 'Booking must have a transaction status.'],
    },
    redirectUrl: {
      type: String,
      required: [true, 'Booking must have a redirect url.'],
    },
    message: {
      type: String,
      required: [true, 'Booking must have a message.'],
    },
    reference: {
      type: Number,
      required: [true, 'Booking must have a reference.'],
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
      enum: ['issued', 'delivered', 'scanned', 'admitted', 'rejected', 'revoked'],
      default: 'issued',
    },
    // Signed, single-use token scanned at the door. `select: false` so it is never
    // returned by default queries. Unique+sparse index below (purchase bookings may
    // not carry one yet).
    inviteToken: {
      type: String,
      select: false,
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

const Booking = mongoose.model('Booking', bookingSchema);

export default Booking;
