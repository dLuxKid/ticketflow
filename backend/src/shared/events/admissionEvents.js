import { EventEmitter } from 'events';

/**
 * In-process admission event bus.
 *
 * The admission service publishes here on every door decision; it neither knows nor cares
 * how the events reach a client. Phase 3 subscribes a Socket.IO gateway to this bus, so the
 * service stays framework-agnostic (no transport code in the business layer).
 */
export const admissionBus = new EventEmitter();

export const ADMISSION_ADMITTED = 'guest:admitted';
export const ADMISSION_REJECTED = 'guest:rejected';

export const emitAdmitted = (payload) =>
  admissionBus.emit(ADMISSION_ADMITTED, payload);

export const emitRejected = (payload) =>
  admissionBus.emit(ADMISSION_REJECTED, payload);
