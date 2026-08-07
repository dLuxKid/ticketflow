import { EventEmitter } from 'events';

/**
 * In-process networking event bus - same shape as admissionEvents.js (Phase 3). The
 * networking service publishes every group/DM message here; it doesn't know or care how it
 * reaches a client. The SSE controller subscribes and filters per-viewer.
 */
export const networkingBus = new EventEmitter();

export const MESSAGE_EVENT = 'chat:message';

/**
 * @param {object} payload
 * @param {string} payload.eventId
 * @param {string|null} payload.recipient - null = group broadcast (everyone watching this
 *   event's stream); a set user id = a DM, delivered only to that recipient and the
 *   sender's own session.
 * @param {string} [payload.sender]
 * @param {object} payload.message - the persisted, populated Message document
 */
export const emitMessage = (payload) =>
  networkingBus.emit(MESSAGE_EVENT, payload);
