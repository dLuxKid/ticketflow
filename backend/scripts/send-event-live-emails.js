/**
 * "Event is live" notification sweep (Phase 7).
 *
 * Emails every admittable attendee of every event currently in its live window
 * (startDate <= now <= endDate), with the link to join the networking group. Fires on
 * every run by design - there is no "already notified" gate, so running this repeatedly
 * (or on a short cron interval) re-sends every time. See
 * networkingNotificationService.js for the reasoning and its consequence for the cron.
 *
 * Run: node scripts/send-event-live-emails.js
 */
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { sweepLiveEvents } from '../src/services/networkingNotificationService.js';

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

  const result = await sweepLiveEvents(frontendUrl);

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
