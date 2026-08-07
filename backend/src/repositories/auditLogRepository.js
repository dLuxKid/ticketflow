import AuditLog from '../models/auditLogModel.js';

/**
 * Persistence layer for AuditLog documents.
 * No business logic - only database operations.
 */

/**
 * Records a single admission attempt. When a `session` is supplied the insert joins the
 * caller's transaction (so an "admitted" audit row commits atomically with the status
 * change it describes).
 */
export const record = async (data, session) => {
  if (session) {
    const [doc] = await AuditLog.create([data], { session });
    return doc;
  }
  return AuditLog.create(data);
};

/**
 * Returns audit entries for an event, most recent first - dashboard/analytics read path.
 */
export const findByEvent = (eventId, limit = 100) =>
  AuditLog.find({ event: eventId }).sort({ createdAt: -1 }).limit(limit);
