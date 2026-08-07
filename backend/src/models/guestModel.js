import mongoose from 'mongoose';

/**
 * A guest-list entry for an invite_only or hybrid event.
 *
 * Its own collection (not embedded in Event) because a list can run to hundreds and needs
 * indexed lookups by event and by email independent of loading the event document. Once an
 * invite is issued, the corresponding admission `Booking` (source: 'invite') is created and
 * referenced by `booking` - a guest-list entry becomes exactly one admission document.
 */
const guestSchema = new mongoose.Schema(
  {
    event: {
      type: mongoose.Schema.ObjectId,
      ref: 'Event',
      required: [true, 'Guest must belong to an event'],
    },
    name: {
      type: String,
      required: [true, 'Guest must have a name'],
    },
    email: {
      type: String,
      required: [true, 'Guest must have an email'],
      lowercase: true,
    },
    vip: {
      type: Boolean,
      default: false,
    },
    plusOnes: {
      type: Number,
      default: 0,
      min: [0, 'Plus-ones cannot be negative'],
    },
    // Set once the invite is issued (Phase 4).
    booking: {
      type: mongoose.Schema.ObjectId,
      ref: 'Booking',
    },
    // GDPR retention (Phase 6): set once this guest's PII (name/email) has been
    // anonymized, either by the post-event retention sweep or a manual erasure request.
    // `name`/`email` above are overwritten in place at that point - this flag is what lets
    // the sweep skip documents it has already processed, and lets an organiser/auditor see
    // that erasure happened and when.
    erasedAt: {
      type: Date,
    },
  },
  { timestamps: true },
);

// One invite per email per event - prevents duplicate guest-list entries.
guestSchema.index({ event: 1, email: 1 }, { unique: true });
// Retention sweep query pattern: guests for a set of expired events not yet erased.
guestSchema.index({ event: 1, erasedAt: 1 });

const Guest = mongoose.model('Guest', guestSchema);

export default Guest;
