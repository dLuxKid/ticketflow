import { setInterval, clearInterval } from 'node:timers';
import { releaseExpiredReservations } from '../services/bookingService.js';

/**
 * Periodically returns seats held by abandoned checkouts.
 *
 * `releaseExpiredReservations` was implemented and tested but nothing ever invoked it, so
 * recoverability existed on paper while abandoned holds sat on inventory indefinitely and an
 * event could report a phantom sell-out. This binds it to the API process.
 *
 * Running in-process rather than as external cron keeps the deployment to one moving part.
 * It is safe to run several instances: releaseReservation is a conditional update guarded on
 * `pending`, so whichever call wins the transition owns the inventory return and a duplicate
 * run is a no-op. `scripts/release-expired-reservations.js` remains available for operators
 * who would rather schedule it externally.
 *
 * The interval must stay comfortably below RESERVATION_TTL_MS (15 minutes) - a sweep slower
 * than the hold itself would let expired seats linger for most of another TTL.
 */

const DEFAULT_INTERVAL_MS = 5 * 60 * 1000;

let timer = null;
/** Guards against a slow sweep overlapping the next tick on a large backlog. */
let running = false;

const runOnce = async () => {
  if (running) return;
  running = true;
  try {
    const { references, seats } = await releaseExpiredReservations();
    if (references > 0) {
      console.warn(
        `[reservation-sweep] released ${references} expired reservation(s), ${seats} seat(s) returned`,
      );
    }
  } catch (err) {
    // Never throw from a timer: an unhandled rejection here would take the API process down
    // over a background job that will simply retry on the next tick.
    console.error('[reservation-sweep] failed:', err.message);
  } finally {
    running = false;
  }
};

/**
 * Starts the sweep. No-op if already started, explicitly disabled, or running under test.
 * @param {number} [intervalMs]
 * @returns {boolean} whether the sweep was started
 */
export const startReservationSweep = (
  intervalMs = Number(process.env.RESERVATION_SWEEP_INTERVAL_MS) ||
    DEFAULT_INTERVAL_MS,
) => {
  if (timer) return false;
  if (process.env.RESERVATION_SWEEP_ENABLED === 'false') return false;
  if (process.env.NODE_ENV === 'test') return false;

  timer = setInterval(runOnce, intervalMs);
  // Do not hold the event loop open: the process should be able to exit on SIGTERM even
  // with a sweep scheduled.
  timer.unref?.();

  console.warn(
    `[reservation-sweep] scheduled every ${Math.round(intervalMs / 1000)}s`,
  );
  return true;
};

/** Stops the sweep. Exported for tests and graceful shutdown. */
export const stopReservationSweep = () => {
  if (!timer) return false;
  clearInterval(timer);
  timer = null;
  return true;
};

export { runOnce as sweepOnce };
