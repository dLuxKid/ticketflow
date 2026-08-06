/**
 * Migration (Phase 0.4): coerce string-typed ticket numeric fields to real Numbers.
 *
 * Before this change, `ticketPrice`, `ticketQuantity`, `minimumBuyingLimit` and
 * `maximumBuyingLimit` on each embedded ticket were stored as `String`. The schema is
 * now `Number`; existing documents still hold strings, which would break the atomic
 * `$inc`/`$gte` inventory reservation in bookingService. This script rewrites them in
 * place.
 *
 * Run ONCE, in a maintenance window, before deploying the new booking code:
 *   node scripts/migrate-numeric-ticket-fields.js
 *
 * Kept under version control as managed-migration evidence (LO3). Idempotent: values
 * already numeric are left untouched.
 */
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config({ path: './config.env' });

const toNumber = (value, fallback = 0) => {
  if (typeof value === 'number') return value;
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const run = async () => {
  const DB = process.env.DB;
  if (!DB) throw new Error('DB connection string missing from config.env');

  await mongoose.connect(DB);
  console.warn('Connected. Migrating ticket numeric fields...');

  // Work at the driver level so we read raw stored values regardless of the current schema.
  const events = mongoose.connection.collection('events');
  const cursor = events.find({ 'ticketDetails.0': { $exists: true } });

  let scanned = 0;
  let updated = 0;

  for await (const event of cursor) {
    scanned += 1;
    const ticketDetails = (event.ticketDetails || []).map((t) => ({
      ...t,
      ticketPrice: toNumber(t.ticketPrice),
      ticketQuantity: toNumber(t.ticketQuantity),
      minimumBuyingLimit: toNumber(t.minimumBuyingLimit, 1) || 1,
      maximumBuyingLimit: toNumber(t.maximumBuyingLimit, 1) || 1,
    }));

    const changed =
      JSON.stringify(ticketDetails) !== JSON.stringify(event.ticketDetails);
    if (changed) {
      await events.updateOne({ _id: event._id }, { $set: { ticketDetails } });
      updated += 1;
    }
  }

  console.warn(`Done. Scanned ${scanned} event(s), updated ${updated}.`);
  await mongoose.disconnect();
};

run().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
