/**
 * Migration: re-issue server-side ticket IDs so the unique index on Booking.ticketId can build.
 *
 * Ticket IDs used to be minted in the browser (usePaystack.tsx) as a 7-character slice of a
 * uuid. Two problems follow from that, and both have to be cleared out of existing data
 * before `bookingSchema.index({ ticketId: 1 }, { unique: true, ... })` will build:
 *
 *   1. Duplicates. Nothing ever enforced uniqueness, and a 7-character slice is short enough
 *      to collide. A duplicate admission code means two people scan in as the same booking.
 *   2. Missing values. Any purchase booking written without a ticketId cannot be scanned at
 *      the door at all.
 *
 * Every affected booking gets a fresh id from the same generator the API now uses. Note that
 * a re-issued id invalidates any ticket already emailed for that booking - the QR in the old
 * email encodes the old code. Re-send tickets for anything reported below as re-issued, or
 * admit those guests by name against the attendee list.
 *
 * Run ONCE, in a maintenance window, before deploying the unique index:
 *   node scripts/migrate-ticket-ids.js
 *
 * Idempotent: only touches purchase bookings that are missing an id or share one.
 */
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import generateTicketId from '../src/shared/utils/ticketIdGenerator.js';

dotenv.config({ path: './config.env' });

const run = async () => {
  const DB = process.env.DB;
  if (!DB) throw new Error('DB connection string missing from config.env');

  await mongoose.connect(DB);
  console.warn('Connected. Auditing booking ticket IDs...');

  const bookings = mongoose.connection.collection('bookings');

  // Purchase bookings with no usable ticketId at all.
  const missing = await bookings
    .find({ source: 'purchase', ticketId: { $not: { $type: 'string' } } })
    .project({ _id: 1 })
    .toArray();

  // Duplicates: group by ticketId and keep the oldest of each group, re-issuing the rest so
  // the booking that has been in circulation longest keeps the code its holder already has.
  const duplicateGroups = await bookings
    .aggregate([
      { $match: { ticketId: { $type: 'string' } } },
      { $sort: { createdAt: 1, _id: 1 } },
      {
        $group: {
          _id: '$ticketId',
          ids: { $push: '$_id' },
          count: { $sum: 1 },
        },
      },
      { $match: { count: { $gt: 1 } } },
    ])
    .toArray();

  const duplicateIds = duplicateGroups.flatMap((group) => group.ids.slice(1));
  const targets = [...missing.map((doc) => doc._id), ...duplicateIds];

  if (targets.length === 0) {
    console.warn('Nothing to do: every ticketId is present and unique.');
    await mongoose.disconnect();
    return;
  }

  // Generated per document rather than in bulk so each write gets its own fresh id.
  let reissued = 0;
  for (const _id of targets) {
    await bookings.updateOne(
      { _id },
      { $set: { ticketId: generateTicketId() } },
    );
    reissued += 1;
  }

  console.warn(
    [
      `bookings missing a ticketId:  ${missing.length}`,
      `duplicate ticketIds found:    ${duplicateGroups.length} (${duplicateIds.length} bookings re-issued)`,
      `total ticketIds re-issued:    ${reissued}`,
      '',
      'Re-issued bookings need their tickets re-sent: the QR in any email already',
      'delivered for them encodes the previous code and will not scan.',
    ].join('\n'),
  );

  await mongoose.disconnect();
  console.warn('Done.');
};

run().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
