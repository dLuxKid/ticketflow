/**
 * Migration (Phase 1): backfill the new domain fields on existing documents.
 *
 * Mongoose `default`s are NOT applied to documents already in the database (and `.lean()`
 * reads skip defaults entirely), so pre-migration rows would return `undefined` for
 * `accessMode`, `source`, and `status`. This script sets them explicitly and derives each
 * booking's `status` from the old `isCheckedIn` boolean before that stored field is dropped.
 *
 * Run ONCE, in a maintenance window, before deploying code that reads the new fields:
 *   node scripts/migrate-phase1-backfill.js
 *
 * Idempotent: only touches documents missing the new fields. Kept under version control as
 * managed-migration evidence (LO3).
 */
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config({ path: './config.env' });

const run = async () => {
  const DB = process.env.DB;
  if (!DB) throw new Error('DB connection string missing from config.env');

  await mongoose.connect(DB);
  console.warn('Connected. Backfilling Phase 1 fields...');

  const events = mongoose.connection.collection('events');
  const bookings = mongoose.connection.collection('bookings');

  // Events → default access mode.
  const eventsRes = await events.updateMany(
    { accessMode: { $exists: false } },
    { $set: { accessMode: 'public' } },
  );

  // Bookings → default source.
  const sourceRes = await bookings.updateMany(
    { source: { $exists: false } },
    { $set: { source: 'purchase' } },
  );

  // Bookings → derive status from the legacy isCheckedIn boolean, then drop the field.
  const admittedRes = await bookings.updateMany(
    { status: { $exists: false }, isCheckedIn: true },
    { $set: { status: 'admitted' } },
  );
  const issuedRes = await bookings.updateMany(
    { status: { $exists: false } },
    { $set: { status: 'issued' } },
  );
  const unsetRes = await bookings.updateMany(
    { isCheckedIn: { $exists: true } },
    { $unset: { isCheckedIn: '' } },
  );

  console.warn(
    [
      `events.accessMode set:        ${eventsRes.modifiedCount}`,
      `bookings.source set:          ${sourceRes.modifiedCount}`,
      `bookings.status = admitted:   ${admittedRes.modifiedCount}`,
      `bookings.status = issued:     ${issuedRes.modifiedCount}`,
      `bookings.isCheckedIn removed: ${unsetRes.modifiedCount}`,
    ].join('\n'),
  );

  await mongoose.disconnect();
  console.warn('Done.');
};

run().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
