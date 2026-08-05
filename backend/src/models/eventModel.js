import mongoose from 'mongoose';
import slugify from 'slugify';

// True when the event sells tickets (public/hybrid) — used to make sales-date fields
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
    currency: String,
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
    //   public      — ticket tiers required, checkout open, listed in public discovery
    //   invite_only — no tiers, checkout disabled, hidden from discovery, guest-list only
    //   hybrid      — ticket tiers AND a guest list both active
    // See the EntryPoint merge design note: one access mode, not two event types.
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
    // the wrong number to enforce at the door — fire-safety occupancy limits apply to bodies
    // in the room. Optional: when unset the door falls back to totalQuantity, and an event
    // with neither (an invite-only event carries no ticket inventory) is treated as
    // unlimited rather than blocked. See admissionService.capacityDecision.
    venueCapacity: {
      type: Number,
      min: [1, 'Venue capacity must be at least 1'],
    },
    refundPolicy: { type: String, default: 'No refunds' },
    additionalComments: { type: String },
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
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
    timestamps: true,
  },
);

eventSchema.virtual('isLive').get(function () {
  const currentDate = new Date();
  if (this.startDate > currentDate) return 'upcoming';
  if (this.startDate <= currentDate && this.endDate >= currentDate)
    return 'live';
  return 'past';
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
