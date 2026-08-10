import mongoose from 'mongoose';
import slugify from 'slugify';
import {
  SUPPORTED_CURRENCIES,
  DEFAULT_CURRENCY,
} from '../services/pricingService.js';

// True when the event sells tickets (public/hybrid) - used to make sales-date fields
// required only for those, since an invite_only event has no ticket sales at all.
function requiredForTicketedEvent() {
  return this.accessMode !== 'invite_only';
}

const ticketSchema = new mongoose.Schema({
  ticketName: {
    type: String,
    unique: false,
    required: [true, 'Ticket must have a type'],
  },
  ticketPrice: {
    type: Number,
    min: [0, 'Ticket price cannot be negative'],
    required: [true, 'Ticket must have a price'],
  },
  ticketQuantity: {
    type: Number,
    min: [0, 'Ticket quantity cannot be negative'],
    required: [true, 'Ticket must have a available quantity'],
  },
  minimumBuyingLimit: {
    type: Number,
    min: [1, 'Minimum buying limit must be at least 1'],
    default: 1,
  },
  maximumBuyingLimit: {
    type: Number,
    min: [1, 'Maximum buying limit must be at least 1'],
    default: 1,
  },
  ticketPerks: {
    type: String,
  },
  discountPercentage: {
    type: Number,
    default: 0,
  },
});

const eventSchema = new mongoose.Schema(
  {
    eventName: {
      type: String,
      required: [true, 'Event must have a name'],
    },
    slug: String,
    startDate: {
      type: Date,
      required: [true, 'Event must have a start date'],
    },
    startTime: {
      type: Date,
      required: [true, 'Event must have a start time'],
    },
    endDate: {
      type: Date,
      required: [true, 'Event must have a end date'],
    },
    endTime: {
      type: Date,
      required: [true, 'Event must have a end time'],
    },
    timezone: {
      type: String,
      default: 'WAT',
    },
    eventDescription: {
      type: String,
      required: [true, 'Event must have a description'],
    },
    // Constrained to what Paystack can settle. Previously a free String derived from the
    // event's country, which let an organiser create a GBP or EUR event whose tickets could
    // never actually be bought — the charge is rejected at the gateway, after the buyer has
    // committed. `uppercase` normalises input so 'ngn' and 'NGN' are the same currency.
    currency: {
      type: String,
      uppercase: true,
      trim: true,
      enum: {
        values: SUPPORTED_CURRENCIES,
        message: 'Payments cannot be taken in {VALUE}',
      },
      default: DEFAULT_CURRENCY,
    },
    eventLocation: {
      type: {
        address: {
          type: String,
          required: [true, 'Enter event address venue'],
        },
        city: {
          type: String,
          required: [true, 'Enter city of address city'],
        },
        postalCode: String,
        state: {
          type: String,
          required: [true, 'Enter event address state'],
        },
        country: {
          type: String,
          required: [true, 'Enter event address country'],
        },
      },
    },
    eventCategory: {
      type: String,
      required: [true, 'Event must have a category'],
    },
    socialMediaLinks: {
      type: {
        twitter: String,
        facebook: String,
        youtube: String,
        others: String,
        instagram: String,
      },
    },
    ticketDetails: [ticketSchema],
    // How guests get in:
    //   public      - ticket tiers required, checkout open, listed in public discovery
    //   invite_only - no tiers, checkout disabled, hidden from discovery, guest-list only
    //   hybrid      - ticket tiers AND a guest list both active
    // See the guest-management merge design note: one access mode, not two event types.
    accessMode: {
      type: String,
      enum: ['public', 'invite_only', 'hybrid'],
      default: 'public',
    },
    totalQuantity: {
      type: Number,
      default: 0,
    },
    numberOfAttendees: {
      type: Number,
      default: 0,
    },
    // Safe physical occupancy of the venue, as distinct from how many tickets were put on
    // sale. Organisers routinely oversell against expected no-shows, so ticket inventory is
    // the wrong number to enforce at the door - fire-safety occupancy limits apply to bodies
    // in the room. Optional: when unset the door falls back to totalQuantity, and an event
    // with neither (an invite-only event carries no ticket inventory) is treated as
    // unlimited rather than blocked. See admissionService.capacityDecision.
    venueCapacity: {
      type: Number,
      min: [1, 'Venue capacity must be at least 1'],
    },
    // Guest networking (Phase 7) is opt-out per event, chosen at creation. Defaults to true
    // so existing events - which predate the field and read as `undefined` - keep the
    // behaviour they already had; the service treats only an explicit `false` as disabled.
    // Some events genuinely should not have one (a private ceremony, a corporate briefing),
    // and the organiser is the only one who can know that.
    networkingEnabled: {
      type: Boolean,
      default: true,
    },
    // Soft delete, mirroring User.isActive. Deletion is never destructive here: an event is
    // referenced by bookings (including paid ones), guests, audit logs and chat messages, so
    // removing the document would invalidate real tickets and destroy the admission record
    // that GDPR retention and any payment dispute depend on. Archiving hides it everywhere
    // while keeping all of that intact, and is reversible.
    isActive: {
      type: Boolean,
      default: true,
      select: false,
    },
    deletedAt: { type: Date, select: false },
    refundPolicy: { type: String, default: 'No refunds' },
    additionalComments: { type: String },
    // Practical details attendees ask about before arriving. All optional - an organiser
    // filling none of them leaves the event exactly as it behaved before these existed.
    // The chatbot reads these directly (chatbotService.get_event_details) so its answers
    // come from what the organiser actually stated rather than from a model's guess.
    venueName: { type: String, trim: true },
    dressCode: { type: String, trim: true },
    parkingInfo: { type: String, trim: true },
    accessibilityInfo: { type: String, trim: true },
    ageRestriction: { type: String, trim: true },
    // Sales dates only apply to events that actually sell tickets. An invite_only event
    // has no tickets and no checkout, so these are required only when the event is not
    // invite_only (public/hybrid). Required-as-a-function evaluates per-document at save.
    salesStartDate: {
      type: Date,
      required: [
        requiredForTicketedEvent,
        'Event must have a sales start date',
      ],
    },
    salesEndDate: {
      type: Date,
      required: [requiredForTicketedEvent, 'Event must have a sales end date'],
    },
    salesStartTime: {
      type: Date,
      required: [
        requiredForTicketedEvent,
        'Event must have a sales start time',
      ],
    },
    salesEndTime: {
      type: Date,
      required: [requiredForTicketedEvent, 'Event must have a sales end time'],
    },
    coverImage: {
      type: String,
      required: [true, 'Event must have a cover image'],
    },
    otherImages: [String],
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
    },
    // Guest networking (Phase 7): set once the "this event just went live, here's your
    // networking link" email has gone out. Checked by the same startDate<=now<=endDate
    // window Event.isLive already calls 'live', so the email and the in-app networking gate
    // can never disagree about whether an event is live.
    networkingEmailSentAt: {
      type: Date,
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
    timestamps: true,
  },
);

/**
 * The end of the calendar day `date` falls in.
 *
 * The live window runs to the end of the final day rather than to the exact `endDate`
 * instant. Two reasons:
 *
 * 1. Events are routinely stored with an identical `startDate` and `endDate` (a single-day
 *    event picked from one date field), which made the window zero-length - such an event
 *    was *never* live, so its networking channel could never open. That is the bug this
 *    fixes.
 * 2. `startTime`/`endTime` are deliberately not folded in. They are stored in a different
 *    frame from the dates in existing records - one event here has startDate at 23:00 UTC
 *    (local midnight) but startTime at 17:00 - so combining them would produce a confidently
 *    wrong window rather than a roughly right one.
 *
 * The bias is intentional: for a chat channel, opening slightly early or closing slightly
 * late is far less harmful than locking attendees out of their own live event.
 */
export const endOfDay = (date) => {
  const end = new Date(date);
  end.setUTCHours(23, 59, 59, 999);
  return end;
};

/**
 * Whether an event carries a guest list at all.
 *
 * Only `invite_only` and `hybrid` events do: a public event admits people purely by ticket,
 * and guestService refuses to manage a guest list for one. Defined once, here, because the
 * rule is enforced in three places that must not drift - the guest-management authorisation
 * check, the workspace lookup that decides whether the UI offers the tab, and the My Events
 * card. Two of those previously carried their own copy of the condition, written in opposite
 * directions (`=== 'public'` vs `invite_only || hybrid`), which disagreed on any event whose
 * accessMode was absent.
 *
 * Tested positively, so an event with no accessMode at all is treated as having no guest
 * list rather than as "not public". The schema defaults the field to 'public', so this only
 * concerns records written before it existed - and offering a guest list that the backend
 * then refuses is the worse of the two failures.
 */
export const hasGuestList = (event) =>
  event?.accessMode === 'invite_only' || event?.accessMode === 'hybrid';

eventSchema.virtual('isLive').get(function () {
  if (!this.startDate || !this.endDate) return 'upcoming';

  const now = new Date();
  if (new Date(this.startDate) > now) return 'upcoming';
  if (now <= endOfDay(this.endDate)) return 'live';
  return 'past';
});

// Archived events disappear from every query that does not explicitly ask for them - the
// same mechanism userModel uses. `$ne: false` rather than `true` so the thousands of events
// created before this field existed (which store nothing) keep showing.
eventSchema.pre(/^find/, function (next) {
  if (this.getOptions?.().includeArchived) return next();
  this.find({ isActive: { $ne: false } });
  next();
});

eventSchema.pre('save', function (next) {
  this.slug = slugify(this.eventName, { lower: true });
  next();
});

eventSchema.pre('save', function (next) {
  const ticketTypeQuantities = new Map();

  for (const ticket of this.ticketDetails) {
    const type = ticket.ticketName;
    // ticketQuantity is now a Number (see ticketSchema); no string coercion needed.
    const availableQuantity = ticket.ticketQuantity || 0;
    ticketTypeQuantities.set(
      type,
      (ticketTypeQuantities.get(type) || 0) + availableQuantity,
    );
  }

  this.totalQuantity = [...ticketTypeQuantities.values()].reduce(
    (total, quantity) => total + quantity,
    0,
  );

  next();
});

const Event = mongoose.model('Event', eventSchema);

export default Event;
