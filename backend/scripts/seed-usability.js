/**
 * Seeds the fixed starting state for a usability-testing session.
 *
 * docs/usability-test-plan.md §5 requires every participant to meet the same app: at least
 * three published events to browse and one invite-only event with a guest list. Building
 * that by hand before each session takes several minutes and drifts between runs — and if
 * participant 3 sees a different catalogue from participant 1, their task times are not
 * comparable and the effectiveness numbers mean less. This script makes the starting state
 * reproducible, so re-running it between participants resets the world identically.
 *
 * Everything it creates is tagged by the `@usability.test` email domain, which is what
 * `--reset` matches on. Nothing outside that domain is ever touched.
 *
 *   npm run seed:usability            # create (refuses if data is already present)
 *   npm run seed:usability -- --reset # wipe the previous run first, then re-create
 *
 * NEVER point this at a production database: it creates accounts with a published,
 * well-known password and deletes anything under its marker domain.
 */
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../src/models/userModel.js';
import Event from '../src/models/eventModel.js';
import Booking from '../src/models/bookingModel.js';
import Guest from '../src/models/guestModel.js';
import AuditLog from '../src/models/auditLogModel.js';
import * as guestService from '../src/services/guestService.js';
import * as usherService from '../src/services/usherService.js';

dotenv.config({ path: './config.env' });

/** Marker domain. Every seeded account uses it; --reset deletes exactly these. */
const DOMAIN = '@usability.test';
const PASSWORD = process.env.USABILITY_PASSWORD ?? 'usability-test-1234';

const ORGANISER = `organiser${DOMAIN}`;
const USHER = `usher${DOMAIN}`;

// A neutral hosted placeholder. Cover images are normally uploaded to Cloudinary during
// event creation; seeding writes to the database directly, so a plain URL is enough. If the
// test machine is offline the card renders without art — harmless for the tasks being timed.
const COVER =
  'https://res.cloudinary.com/demo/image/upload/w_1200,h_630,c_fill/sample.jpg';

const days = (n) => new Date(Date.now() + n * 24 * 60 * 60 * 1000);

/**
 * Three public events, deliberately varied: a single cheap tier, a multi-tier event with a
 * sold-out option, and a free one. Between them a participant has to actually read the
 * listing rather than clicking the only thing on screen.
 */
const PUBLIC_EVENTS = [
  {
    eventName: 'Lagos Tech Meetup',
    eventCategory: 'Technology',
    eventDescription:
      'A monthly evening meetup for developers, designers and founders. Talks, demos and open networking.',
    startsIn: 7,
    venueName: 'Yaba Innovation Hub',
    ticketDetails: [
      { ticketName: 'General', ticketPrice: 2500, ticketQuantity: 80 },
    ],
  },
  {
    eventName: 'Afrobeats Live Concert',
    eventCategory: 'Music',
    eventDescription:
      'An open-air night of live Afrobeats across two stages, with food stalls and an after-party.',
    startsIn: 21,
    venueName: 'Eko Arena',
    ticketDetails: [
      { ticketName: 'Regular', ticketPrice: 15000, ticketQuantity: 200 },
      { ticketName: 'VIP', ticketPrice: 45000, ticketQuantity: 20 },
      // Deliberately sold out: shows the participant what an unavailable tier looks like.
      { ticketName: 'Backstage', ticketPrice: 120000, ticketQuantity: 0 },
    ],
  },
  {
    eventName: 'Community Yoga in the Park',
    eventCategory: 'Wellness',
    eventDescription:
      'A free Saturday-morning session for all levels. Bring a mat; instructors provided.',
    startsIn: 3,
    venueName: 'Freedom Park',
    // Free: exercises the no-payment path, which confirms immediately without checkout.
    ticketDetails: [
      { ticketName: 'Free entry', ticketPrice: 0, ticketQuantity: 150 },
    ],
  },
];

/** The guest list imported into the invite-only event for the door-scanning scenario. */
const GUESTS = [
  { name: 'Ada Obi', email: `guest1${DOMAIN}`, vip: true },
  { name: 'Bello Musa', email: `guest2${DOMAIN}` },
  { name: 'Chidi Nwosu', email: `guest3${DOMAIN}` },
  { name: 'Dami Adeyemi', email: `guest4${DOMAIN}`, vip: true },
  { name: 'Efe Okonkwo', email: `guest5${DOMAIN}` },
];

const buildEvent = (spec, ownerId, overrides = {}) => {
  const start = days(spec.startsIn);
  const end = new Date(start.getTime() + 4 * 60 * 60 * 1000);

  return {
    eventName: spec.eventName,
    eventDescription: spec.eventDescription,
    eventCategory: spec.eventCategory,
    startDate: start,
    startTime: start,
    endDate: end,
    endTime: end,
    eventLocation: {
      address: '1 Marina Road',
      city: 'Lagos',
      state: 'Lagos',
      country: 'Nigeria',
    },
    venueName: spec.venueName,
    coverImage: COVER,
    user: ownerId,
    ticketDetails: spec.ticketDetails ?? [],
    salesStartDate: new Date(),
    salesStartTime: new Date(),
    salesEndDate: start,
    salesEndTime: start,
    ...overrides,
  };
};

const findSeeded = async () => {
  const users = await User.find({ email: new RegExp(`${DOMAIN}$`) }).select(
    '+role',
  );
  const owner = users.find((u) => u.email === ORGANISER);
  const events = owner ? await Event.find({ user: owner._id }) : [];
  return { users, owner, events };
};

const reset = async () => {
  const { users, events } = await findSeeded();
  const eventIds = events.map((e) => e._id);

  if (eventIds.length) {
    await Promise.all([
      Booking.deleteMany({ event: { $in: eventIds } }),
      Guest.deleteMany({ event: { $in: eventIds } }),
      AuditLog.deleteMany({ event: { $in: eventIds } }),
    ]);
    await Event.deleteMany({ _id: { $in: eventIds } });
  }
  await User.deleteMany({ email: new RegExp(`${DOMAIN}$`) });

  console.warn(
    `Reset: removed ${users.length} account(s), ${eventIds.length} event(s) and their bookings, guests and audit rows.`,
  );
};

const run = async () => {
  const DB = process.env.DB;
  if (!DB) throw new Error('DB connection string missing from config.env');

  await mongoose.connect(DB);

  if (process.argv.includes('--reset')) {
    await reset();
  } else {
    const { users } = await findSeeded();
    if (users.length) {
      console.warn(
        `Usability data already exists (${users.length} account(s) under ${DOMAIN}).\n` +
          'Re-run with --reset to wipe it and start from a clean state:\n' +
          '  npm run seed:usability -- --reset',
      );
      await mongoose.disconnect();
      return;
    }
  }

  // ─── Accounts ────────────────────────────────────────────────────────────────
  // Created through the model so the password is hashed by the same pre-save hook the
  // real signup path uses — these have to be able to log in normally.
  const organiser = await User.create({
    name: 'Session Organiser',
    email: ORGANISER,
    password: PASSWORD,
    passwordConfirm: PASSWORD,
    role: 'creator',
  });

  // Assigned to the invite-only event further down — assignUsher looks the account up by
  // email, so the document itself is not needed here.
  await User.create({
    name: 'Session Door Staff',
    email: USHER,
    password: PASSWORD,
    passwordConfirm: PASSWORD,
    role: 'usher',
  });

  // ─── Public events (Scenario 1: find an event and buy a ticket) ──────────────
  const published = await Event.create(
    PUBLIC_EVENTS.map((spec) => buildEvent(spec, organiser._id)),
  );

  // ─── Invite-only event (Scenario 3: admit a guest, then handle a duplicate) ──
  const privateEvent = await Event.create(
    buildEvent(
      {
        eventName: 'Product Launch (Invite Only)',
        eventCategory: 'Business',
        eventDescription:
          'A private launch evening for invited guests, press and partners.',
        startsIn: 2,
        venueName: 'Victoria Island Rooftop',
        ticketDetails: [],
      },
      organiser._id,
      { accessMode: 'invite_only', venueCapacity: 60 },
    ),
  );

  // Imports through the real service, so each guest gets a genuine single-use invite and
  // the same booking rows the door scanner resolves against. Invite emails will fail
  // harmlessly if SMTP is unconfigured — the invites themselves are still issued.
  const imported = await guestService.importGuests(
    privateEvent._id,
    GUESTS,
    organiser,
  );

  await usherService.assignUsher(privateEvent._id, USHER, organiser);

  // The codes to scan during Scenario 3. inviteToken is select:false, so ask for it.
  const invites = await Booking.find({ event: privateEvent._id })
    .select('+inviteToken name email')
    .sort({ createdAt: 1 });

  // ─── Session card ────────────────────────────────────────────────────────────
  console.warn(
    [
      '',
      '════════════════════════════════════════════════════════════════',
      '  USABILITY SESSION — starting state ready',
      '════════════════════════════════════════════════════════════════',
      '',
      `  Password for both accounts: ${PASSWORD}`,
      '',
      `  Organiser (Scenario 2):  ${ORGANISER}`,
      `  Door staff (Scenario 3): ${USHER}`,
      '',
      `  Published events (Scenario 1): ${published.length}`,
      ...published.map(
        (e) =>
          `    · ${e.eventName} — ${e.ticketDetails
            .map(
              (t) =>
                `${t.ticketName} ${t.ticketPrice === 0 ? 'free' : t.ticketPrice} (${t.ticketQuantity} left)`,
            )
            .join(', ')}`,
      ),
      '',
      `  Invite-only event: ${privateEvent.eventName}`,
      `    guests imported: ${imported.added.length}, skipped: ${imported.skipped.length}, failed: ${imported.failed.length}`,
      '',
      '  Invite codes to scan at the door:',
      ...invites.map(
        (b) => `    · ${b.name.padEnd(16)} ${b.inviteToken ?? '(none)'}`,
      ),
      '',
      '  Scenario 3 duplicate-scan step: scan the FIRST code twice — the second',
      '  attempt must be refused as already admitted.',
      '',
      '  Reset between participants:  npm run seed:usability -- --reset',
      '════════════════════════════════════════════════════════════════',
      '',
    ].join('\n'),
  );

  await mongoose.disconnect();
};

run().catch(async (err) => {
  console.error('Usability seed failed:', err.message);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});
