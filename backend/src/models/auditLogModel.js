import mongoose from 'mongoose';

/**
 * Immutable record of every admission attempt at the door.
 *
 * One document per scan — success or rejection. Rejections are kept deliberately: they are
 * the signal the Phase 5 anomaly/fraud detection reads from. Reading the log is role-gated
 * (organiser/admin) in the presentation layer.
 */
const auditLogSchema = new mongoose.Schema(
  {
    event: {
      type: mongoose.Schema.ObjectId,
      ref: 'Event',
      required: [true, 'Audit entry must reference an event'],
    },
    booking: {
      type: mongoose.Schema.ObjectId,
      ref: 'Booking',
    },
    // The usher/admin who performed the scan.
    actor: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: [true, 'Audit entry must record who acted'],
    },
    outcome: {
      type: String,
      enum: ['admitted', 'rejected'],
      required: [true, 'Audit entry must record an outcome'],
    },
    // Populated on rejection, e.g. 'already_admitted' | 'revoked' | 'wrong_event'.
    reason: {
      type: String,
    },
  },
  { timestamps: true },
);

// Dashboard + analytics query pattern: latest events for a given event.
auditLogSchema.index({ event: 1, createdAt: -1 });

const AuditLog = mongoose.model('AuditLog', auditLogSchema);

export default AuditLog;
