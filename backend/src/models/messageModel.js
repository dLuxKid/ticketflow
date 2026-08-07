import mongoose from 'mongoose';

/**
 * One collection for both the event-wide group chat and one-to-one DMs (Phase 7) - the
 * same "one collection, not a parallel structure kept in sync" rule the guest-management merge
 * already applied to admissions (single `Booking`, not separate purchase/invite
 * collections). `recipient: null` means a broadcast to everyone watching the event's
 * networking stream; a set `recipient` means a DM between `sender` and `recipient`.
 */
const messageSchema = new mongoose.Schema(
  {
    event: {
      type: mongoose.Schema.ObjectId,
      ref: 'Event',
      required: [true, 'Message must belong to an event'],
    },
    sender: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: [true, 'Message must have a sender'],
    },
    recipient: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      default: null,
    },
    body: {
      type: String,
      required: [true, 'Message cannot be empty'],
      trim: true,
      maxlength: [1000, 'Message is too long'],
    },
  },
  { timestamps: true },
);

// Room/thread history query pattern: one event's group feed (recipient: null, sorted), or
// scanning one event's messages to build a DM thread between two participants.
messageSchema.index({ event: 1, recipient: 1, createdAt: 1 });

const Message = mongoose.model('Message', messageSchema);

export default Message;
