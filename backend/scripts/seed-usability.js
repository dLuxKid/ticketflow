/**
 * Seeds the fixed starting state for a usability-testing session.
 *
 * docs/usability-test-plan.md §5 requires every participant to meet the same app: at least
 * three published events to browse and one invite-only event with a guest list. Building
 * that by hand before each session takes several minutes and drifts between runs - and if
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
import * as bookingService from '../src/services/bookingService.js';
import * as admissionService from '../src/services/admissionService.js';

dotenv.config({ path: './config.env' });

/** Marker domain. Every seeded account uses it; --reset deletes exactly these. */
const DOMAIN = '@usability.test';
const PASSWORD = process.env.USABILITY_PASSWORD ?? 'usability-test-1234';

const ORGANISER = `organiser${DOMAIN}`;
const USHER = `usher${DOMAIN}`;
const ATTENDEE = `attendee${DOMAIN}`;

/**
 * A fake Paystack payout account for the seeded organiser.
 *
 * Not decoration: `bookingService.buildCheckoutConfig` refuses to sell tickets for an event
 * whose organiser has no `payout.subaccountCode`, so without this every participant would
 * hit "the organiser has not set up payouts yet" the moment they tried to buy - Scenario 1
 * would fail for reasons that have nothing to do with usability. The code is obviously fake
 * and is never sent anywhere: checkout is driven with Paystack test keys during a session.
 */
const PAYOUT = {
  subaccountCode: 'ACCT_usability_test_seed',
  bankName: 'Test Bank',
  bankCode: '001',
  accountNameMasked: 'SESSION ORGANISER',
  accountNumberLast4: '4321',
  platformFeePercent: 3,
  connectedAt: new Date(),
};

// A neutral hosted placeholder. Cover images are normally uploaded to Cloudinary during
// event creation; seeding writes to the database directly, so a plain URL is enough. If the
// test machine is offline the card renders without art - harmless for the tasks being timed.
const COVER =
  'https://res.cloudinary.com/demo/image/upload/w_1200,h_630,c_fill/sample.jpg';

const days = (n) => new Date(Date.now() + n * 24 * 60 * 60 * 1000);

const LAGOS = {
  address: '1 Marina Road',
  city: 'Lagos',
  state: 'Lagos',
  country: 'Nigeria',
};
const COVENTRY = {
  address: 'Priory Street',
  city: 'Coventry',
  state: 'West Midlands',
  country: 'United Kingdom',
};
const BIRMINGHAM = {
  address: 'Broad Street',
  city: 'Birmingham',
  state: 'West Midlands',
  country: 'United Kingdom',
};

/**
 * The event catalogue.
 *
 * Each entry exists to put a specific state in front of the participant. A catalogue of
 * near-identical happy-path events would tell you only that people can click the one thing
 * on screen; the variety here is what makes Scenario 1 a real find-and-choose task, and what
 * lets the organiser and door scenarios meet events that are live, past, full or free.
 *
 * `startsIn` / `endsIn` are in days relative to now - fractions allowed, negatives are in
 * the past. An event with `startsIn` negative and `endsIn` positive is *live* right now,
 * which is what gates the live dashboard and Meet and Greet.
 */
const EVENTS = [
  {
    key: 'meetup',
    covers: 'the ordinary case - one tier, cheap, plenty of stock',
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
    key: 'concert',
    covers: 'choosing between tiers, one of which is already sold out',
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
    key: 'yoga',
    covers: 'the free path - confirmed inline, no checkout at all',
    eventName: 'Community Yoga in the Park',
    eventCategory: 'Wellness',
    eventDescription:
      'A free Saturday-morning session for all levels. Bring a mat; instructors provided.',
    startsIn: 3,
    venueName: 'Freedom Park',
    ticketDetails: [
      { ticketName: 'Free entry', ticketPrice: 0, ticketQuantity: 150 },
    ],
  },
  {
    key: 'soldout',
    covers: 'a completely unavailable event - can the participant tell?',
    eventName: 'Jazz Night at the Shrine',
    eventCategory: 'Music',
    eventDescription:
      'An intimate evening of live jazz. This event has sold out.',
    startsIn: 10,
    venueName: 'The New Afrika Shrine',
    ticketDetails: [
      { ticketName: 'Standard', ticketPrice: 8000, ticketQuantity: 0 },
      { ticketName: 'Table for two', ticketPrice: 20000, ticketQuantity: 0 },
    ],
  },
  {
    key: 'live',
    covers:
      'happening right now - live arrivals dashboard, door scanning and Meet and Greet are all reachable only for a live event',
    eventName: 'Design Week Lagos',
    eventCategory: 'Design',
    eventDescription:
      'A full day of talks, portfolio reviews and studio tours, running today.',
    // Started two hours ago, runs to the end of today.
    startsIn: -2 / 24,
    endsIn: 8 / 24,
    venueName: 'Alliance Française',
    venueCapacity: 120,
    ticketDetails: [
      { ticketName: 'Day pass', ticketPrice: 5000, ticketQuantity: 100 },
      {
        ticketName: 'Studio tour add-on',
        ticketPrice: 9000,
        ticketQuantity: 30,
      },
    ],
  },
  {
    key: 'hybrid',
    covers:
      'hybrid access - tickets on sale AND an invited guest list on the same event',
    eventName: 'Startup Founders Mixer',
    eventCategory: 'Business',
    eventDescription:
      'Open tickets for the main room, with a separately invited list for the founders’ table.',
    startsIn: 5,
    venueName: 'Ikoyi Club Terrace',
    accessMode: 'hybrid',
    venueCapacity: 90,
    ticketDetails: [
      { ticketName: 'General', ticketPrice: 6000, ticketQuantity: 60 },
    ],
    guests: [
      { name: 'Funke Alabi', email: `founder1${DOMAIN}`, vip: true },
      { name: 'Gbenga Sule', email: `founder2${DOMAIN}`, plusOnes: 1 },
    ],
  },
  {
    key: 'private',
    covers:
      'invite-only - no checkout, guest list only; the door scenario runs here',
    eventName: 'Product Launch (Invite Only)',
    eventCategory: 'Business',
    eventDescription:
      'A private launch evening for invited guests, press and partners.',
    startsIn: 2,
    venueName: 'Victoria Island Rooftop',
    accessMode: 'invite_only',
    venueCapacity: 60,
    ticketDetails: [],
    guests: [
      { name: 'Ada Obi', email: `guest1${DOMAIN}`, vip: true },
      { name: 'Bello Musa', email: `guest2${DOMAIN}` },
      { name: 'Chidi Nwosu', email: `guest3${DOMAIN}` },
      {
        name: 'Dami Adeyemi',
        email: `guest4${DOMAIN}`,
        vip: true,
        plusOnes: 2,
      },
      { name: 'Efe Okonkwo', email: `guest5${DOMAIN}` },
    ],
  },
  // ─── UK events ───────────────────────────────────────────────────────────────
  // A UK participant reading a listing priced in naira is being asked to do two unfamiliar
  // things at once, and you cannot tell afterwards which one confused them. These carry USD
  // and West Midlands addresses so the catalogue matches the people testing it.
  //
  // Read the Paystack note on `free` below before choosing which event a buy-ticket task
  // points at.
  {
    key: 'coventry-free',
    covers:
      'the UK buy-a-ticket task - free, so it completes end to end without depending on which currencies the Paystack test account is enabled for',
    eventName: 'Coventry Student Welcome Fair',
    eventCategory: 'Education',
    eventDescription:
      'Meet societies, support services and local employers. Free entry for all students.',
    startsIn: 4,
    venueName: 'Coventry University Hub',
    location: COVENTRY,
    currency: 'USD',
    ticketDetails: [
      { ticketName: 'Free entry', ticketPrice: 0, ticketQuantity: 400 },
    ],
  },
  {
    key: 'coventry-paid',
    covers: 'a realistic USD-priced listing with a capacity limit',
    eventName: 'Coventry Guest Lecture: Software at Scale',
    eventCategory: 'Technology',
    eventDescription:
      'An evening lecture and Q&A with engineers from three West Midlands employers.',
    startsIn: 14,
    venueName: 'Alan Berry Building',
    location: COVENTRY,
    currency: 'USD',
    venueCapacity: 150,
    ticketDetails: [
      { ticketName: 'Standard', ticketPrice: 12, ticketQuantity: 120 },
      { ticketName: 'Student', ticketPrice: 5, ticketQuantity: 60 },
    ],
  },
  {
    key: 'birmingham-festival',
    covers:
      'a larger multi-tier USD event, with the cheapest tier already gone',
    eventName: 'Birmingham Jazz Festival',
    eventCategory: 'Music',
    eventDescription:
      'Three stages across the city centre, with headline sets each evening.',
    startsIn: 12,
    venueName: 'Symphony Hall',
    location: BIRMINGHAM,
    currency: 'USD',
    ticketDetails: [
      { ticketName: 'Early bird', ticketPrice: 18, ticketQuantity: 0 },
      { ticketName: 'Standard', ticketPrice: 25, ticketQuantity: 300 },
      { ticketName: 'Weekend pass', ticketPrice: 60, ticketQuantity: 80 },
    ],
  },
  {
    key: 'birmingham-live',
    covers:
      'a second live event, hybrid and UK-based - door scanning and the arrivals dashboard in a setting a UK participant recognises',
    eventName: 'Birmingham Graduate Careers Expo',
    eventCategory: 'Education',
    eventDescription:
      'Employers, CV clinics and interview practice, running today.',
    startsIn: -1 / 24,
    endsIn: 6 / 24,
    venueName: 'ICC Birmingham',
    location: BIRMINGHAM,
    currency: 'USD',
    accessMode: 'hybrid',
    venueCapacity: 200,
    ticketDetails: [
      { ticketName: 'Graduate entry', ticketPrice: 0, ticketQuantity: 250 },
    ],
    guests: [
      { name: 'Harriet Shah', email: `uk-guest1${DOMAIN}`, vip: true },
      { name: 'Idris Campbell', email: `uk-guest2${DOMAIN}` },
      { name: 'Joanna Wright', email: `uk-guest3${DOMAIN}`, plusOnes: 1 },
    ],
  },
  {
    key: 'past',
    covers:
      'an event that already finished - listings, "my tickets" history, and networking correctly switched off',
    eventName: 'Campus Career Fair',
    eventCategory: 'Education',
    eventDescription:
      'Graduate recruitment fair with 40 employers. This event has ended.',
    startsIn: -9,
    endsIn: -8,
    venueName: 'University of Lagos Sports Hall',
    networkingEnabled: false,
    ticketDetails: [
      { ticketName: 'Student entry', ticketPrice: 0, ticketQuantity: 500 },
    ],
  },
];

const buildEvent = (spec, ownerId) => {
  const start = days(spec.startsIn);
  const end =
    spec.endsIn != null
      ? days(spec.endsIn)
      : new Date(start.getTime() + 4 * 60 * 60 * 1000);

  // Sales must already be open for a participant to buy, including for the event that is
  // running right now - so the window opens in the past rather than at `new Date()`.
  const salesOpen = days(-30);

  return {
    eventName: spec.eventName,
    eventDescription: spec.eventDescription,
    eventCategory: spec.eventCategory,
    startDate: start,
    startTime: start,
    endDate: end,
    endTime: end,
    eventLocation: spec.location ?? LAGOS,
    // Stamped onto every booking made for this event (pricingService.priceBuyers), so the
    // UK events below have to name their own currency or their tickets would be sold in
    // naira. They use USD rather than GBP: Paystack cannot settle GBP at all, so the Event
    // schema refuses it (pricingService.SUPPORTED_CURRENCIES) and a GBP event could never
    // sell a single ticket — the charge is rejected at the gateway after the buyer commits.
    ...(spec.currency ? { currency: spec.currency } : {}),
    venueName: spec.venueName,
    coverImage: COVER,
    user: ownerId,
    ticketDetails: spec.ticketDetails ?? [],
    ...(spec.accessMode ? { accessMode: spec.accessMode } : {}),
    ...(spec.venueCapacity ? { venueCapacity: spec.venueCapacity } : {}),
    ...(spec.networkingEnabled === false ? { networkingEnabled: false } : {}),
    salesStartDate: salesOpen,
    salesStartTime: salesOpen,
    salesEndDate: end,
    salesEndTime: end,
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
  // real signup path uses - these have to be able to log in normally.
  const organiser = await User.create({
    name: 'Session Organiser',
    email: ORGANISER,
    password: PASSWORD,
    passwordConfirm: PASSWORD,
    role: 'creator',
    payout: PAYOUT,
  });

  // Assigned to the events further down - assignUsher looks the account up by email, so
  // the document itself is not needed here.
  await User.create({
    name: 'Session Door Staff',
    email: USHER,
    password: PASSWORD,
    passwordConfirm: PASSWORD,
    role: 'usher',
  });

  // An ordinary attendee with tickets already bought, so "my tickets" is not empty and a
  // participant asked to find an existing booking has one to find.
  const attendee = await User.create({
    name: 'Session Attendee',
    email: ATTENDEE,
    password: PASSWORD,
    passwordConfirm: PASSWORD,
    role: 'user',
  });

  // ─── Events ──────────────────────────────────────────────────────────────────
  const created = new Map();
  for (const spec of EVENTS) {
    created.set(spec.key, await Event.create(buildEvent(spec, organiser._id)));
  }

  // ─── Guest lists ─────────────────────────────────────────────────────────────
  // Imported through the real service, so each guest gets a genuine single-use invite and
  // the same booking rows the door scanner resolves against. Invite emails fail harmlessly
  // if SMTP is unconfigured - the invites themselves are still issued.
  const importedCounts = {};
  for (const spec of EVENTS) {
    if (!spec.guests) continue;
    const result = await guestService.importGuests(
      created.get(spec.key)._id,
      spec.guests,
      organiser,
    );
    importedCounts[spec.key] = result.added.length;
  }

  // Door staff work every event with a guest list, plus both events running today.
  for (const key of ['private', 'hybrid', 'live', 'birmingham-live']) {
    await usherService.assignUsher(created.get(key)._id, USHER, organiser);
  }

  // ─── Existing sales on the live event ────────────────────────────────────────
  // An organiser opening the live dashboard onto zeros learns nothing, and neither does a
  // participant. These go through the real reserve→confirm path, so they are ordinary paid
  // bookings with scannable ticket IDs, and they move the event's inventory honestly.
  const liveEvent = created.get('live');
  const sold = [];
  for (const [name, email] of [
    ['Session Attendee', ATTENDEE],
    ['Kemi Balogun', `buyer1${DOMAIN}`],
    ['Tunde Bakare', `buyer2${DOMAIN}`],
    ['Zainab Yusuf', `buyer3${DOMAIN}`],
  ]) {
    const { reference } = await bookingService.reserveBooking(
      [{ name, email, ticketType: 'Day pass', ticketUser: name }],
      liveEvent._id,
      email === ATTENDEE ? attendee._id : undefined,
    );
    await bookingService.confirmReservation(reference);
    sold.push(reference);
  }

  // Admit two of them through the real scan path, so the dashboard shows arrivals and the
  // audit log has genuine rows behind it.
  const paid = await Booking.find({ event: liveEvent._id }).sort({
    createdAt: 1,
  });
  for (const booking of paid.slice(0, 2)) {
    await admissionService.checkInByScan(booking.ticketId, organiser, {
      deviceId: 'seed-door-device',
    });
  }

  // The codes to scan during Scenario 3. inviteToken is select:false, so ask for it.
  const privateEvent = created.get('private');
  const invites = await Booking.find({ event: privateEvent._id })
    .select('+inviteToken name email')
    .sort({ createdAt: 1 });

  // Re-read before printing: the documents in `created` were captured before the sales
  // above ran, so their tier quantities are stale and the card would advertise seats that
  // are no longer free.
  for (const [key, event] of created) {
    created.set(key, await Event.findById(event._id));
  }

  // ─── Session card ────────────────────────────────────────────────────────────
  console.warn(
    [
      '',
      '════════════════════════════════════════════════════════════════',
      '  USABILITY SESSION - starting state ready',
      '════════════════════════════════════════════════════════════════',
      '',
      `  Password for all three accounts: ${PASSWORD}`,
      '',
      `  Organiser (Scenario 2):  ${ORGANISER}`,
      `  Door staff (Scenario 3): ${USHER}`,
      `  Attendee (has tickets):  ${ATTENDEE}`,
      '',
      `  Events (${EVENTS.length}) - each one covers a different state:`,
      ...EVENTS.map((spec) => {
        const e = created.get(spec.key);
        const when = e.isLive === 'live' ? 'LIVE NOW' : e.isLive.toUpperCase();
        const money = e.currency ?? 'NGN';
        const tiers = e.ticketDetails.length
          ? e.ticketDetails
              .map(
                (t) =>
                  `${t.ticketName} ${t.ticketPrice === 0 ? 'free' : `${money} ${t.ticketPrice}`} (${t.ticketQuantity} left)`,
              )
              .join(', ')
          : 'no tickets - guest list only';
        const guests = importedCounts[spec.key]
          ? `, ${importedCounts[spec.key]} guests invited`
          : '';
        return [
          `    · ${e.eventName}  [${when}, ${e.accessMode}, ${e.eventLocation?.city}${guests}]`,
          `        ${tiers}`,
          `        covers: ${spec.covers}`,
        ].join('\n');
      }),
      '',
      `  Live event "${liveEvent.eventName}" already has ${sold.length} paid bookings,`,
      '  two of them already admitted - so the arrivals dashboard has real data.',
      '',
      '  Invite codes to scan at the door:',
      ...invites.map(
        (b) => `    · ${b.name.padEnd(16)} ${b.inviteToken ?? '(none)'}`,
      ),
      '',
      '  Scenario 3 duplicate-scan step: scan the FIRST code twice - the second',
      '  attempt must be refused as already admitted.',
      '',
      '  NOTE on the UK events: they are priced in USD, not GBP - Paystack cannot',
      '  settle GBP at all, so a GBP event would be refused at checkout. Point a',
      '  buy-a-ticket task at the free UK event (completes end to end) or at a naira',
      '  event; the paid USD listings are there to be browsed.',
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
