/**
 * "Event is live" notification sweep (Phase 7).
 *
 * Emails every admittable attendee of any event that just entered its live window
 * (startDate <= now <= endDate) and hasn't been notified yet, with the link to join the
 * networking group. Idempotent: re-running is a no-op for events already marked notified
 * (see scripts/gdpr-retention-sweep.js for the same shape).
 *
 * Run: node scripts/send-event-live-emails.js
 */
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { sweepNewlyLiveEvents } from '../src/services/networkingNotificationService.js';

dotenv.config({ path: './config.env' });

const run = async () => {
  const DB = process.env.DB;
  if (!DB) throw new Error('DB connection string missing from config.env');

  const frontendUrl =
    process.env.NODE_ENV === 'production'
      ? process.env.PROD_FRONTEND_URL
      : process.env.DEV_FRONTEND_URL || 'http://localhost:3000';

  await mongoose.connect(DB);
  console.warn('Connected. Checking for newly-live events...');

  const result = await sweepNewlyLiveEvents(frontendUrl);

  console.warn(
    [
      `Events notified: ${result.eventsNotified}`,
      `Emails sent:      ${result.emailsSent}`,
    ].join('\n'),
  );

  await mongoose.disconnect();
};

run().catch((err) => {
  console.error('Event-live notification sweep failed:', err);
  process.exit(1);
});
