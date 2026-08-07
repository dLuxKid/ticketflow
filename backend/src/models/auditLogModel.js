import mongoose from 'mongoose';

/**
 * Immutable record of every admission attempt at the door.
 *
 * One document per scan - success or rejection. Rejections are kept deliberately: they are
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
      enum: ['admitted', 'rejected', 'revoked'],
      required: [true, 'Audit entry must record an outcome'],
    },
    // Populated on rejection, e.g. 'already_admitted' | 'revoked' | 'wrong_event'.
    reason: {
      type: String,
    },
    // True when an organiser or usher set the status by hand instead of scanning a QR
    // (damaged code, flat battery). Recorded so the log stays a complete account of who
    // admitted whom, but excluded from anomaly detection: a manual entry has no device
    // fingerprint and no scan timing, so feeding it to the detector would only manufacture
    // false `rapid_sequential` flags next to a genuine scan.
    manual: {
      type: Boolean,
      default: false,
    },
    // Best-effort fingerprint of the scanning device, used only as an anomaly-detection
    // signal (Phase 5) - never for authorization. Optional: older rows and non-web
    // scanners may not have one.
    deviceId: {
      type: String,
    },
    ip: {
      type: String,
    },
  },
  { timestamps: true },
);

// Dashboard + analytics query pattern: latest events for a given event.
auditLogSchema.index({ event: 1, createdAt: -1 });

const AuditLog = mongoose.model('AuditLog', auditLogSchema);

export default AuditLog;
