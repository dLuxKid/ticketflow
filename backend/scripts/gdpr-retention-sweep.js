/**
 * GDPR retention sweep (Phase 6).
 *
 * Anonymizes guest/buyer PII (name, email) for every event that ended more than
 * RETENTION_DAYS ago and hasn't been processed yet. Anonymizes in place rather than
 * deleting the record outright, so status/vip/plusOnes/ticketType remain available for
 * post-event analytics and the no-show model's training data - only personally
 * identifying fields are overwritten.
 *
 * Idempotent: already-erased documents are excluded by the underlying queries
 * (erasedAt/piiErasedAt not set), so this is safe to run on a repeating schedule (see the
 * GitHub Actions cron workflow, or any external scheduler pointed at this script).
 *
 * Run: node scripts/gdpr-retention-sweep.js [retentionDays]
 *   node scripts/gdpr-retention-sweep.js        # uses the default (30 days)
 *   node scripts/gdpr-retention-sweep.js 90     # a custom retention window
 */
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import {
  sweepExpiredEvents,
  DEFAULT_RETENTION_DAYS,
} from '../src/services/retentionService.js';

dotenv.config({ path: './config.env' });

const run = async () => {
  const DB = process.env.DB;
  if (!DB) throw new Error('DB connection string missing from config.env');

  const retentionDays =
    Number.parseInt(process.argv[2], 10) || DEFAULT_RETENTION_DAYS;

  await mongoose.connect(DB);
  console.warn(
    `Connected. Sweeping events ended more than ${retentionDays} days ago...`,
  );

  const result = await sweepExpiredEvents(retentionDays);

  console.warn(
    [
      `Expired events found: ${result.expiredEvents}`,
      `Guests erased:        ${result.guestsErased}`,
      `Bookings erased:      ${result.bookingsErased}`,
    ].join('\n'),
  );

  await mongoose.disconnect();
};

run().catch((err) => {
  console.error('GDPR retention sweep failed:', err);
  process.exit(1);
});
