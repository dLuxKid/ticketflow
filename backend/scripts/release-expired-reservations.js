/**
 * Releases abandoned checkout reservations.
 *
 * A purchase now holds its seats (bookings written as `pending`) before the buyer is sent
 * to Paystack. Most reservations resolve within seconds - the webhook confirms the charge,
 * or reports it failed and the seats go straight back. What this script cleans up is the
 * remainder: the buyer who closed the tab mid-checkout, or whose webhook never arrived.
 * Without it those seats would be held forever and the event would report a phantom
 * sell-out.
 *
 * Idempotent: releaseReservation only acts on bookings still in `pending`, guarded by a
 * conditional update, so concurrent or repeated runs cannot return the same seats twice.
 * Safe to run every few minutes from cron, a GitHub Actions schedule, or any scheduler.
 *
 * Run: node scripts/release-expired-reservations.js
 */
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { releaseExpiredReservations } from '../src/services/bookingService.js';

dotenv.config({ path: './config.env' });

const run = async () => {
  const DB = process.env.DB;
  if (!DB) throw new Error('DB connection string missing from config.env');

  await mongoose.connect(DB);
  console.warn('Connected. Releasing expired reservations...');

  const { references, seats } = await releaseExpiredReservations();

  console.warn(
    [
      `Expired reservations released: ${references}`,
      `Seats returned to inventory:   ${seats}`,
    ].join('\n'),
  );

  await mongoose.disconnect();
};

run().catch((err) => {
  console.error('Reservation release failed:', err);
  process.exit(1);
});
