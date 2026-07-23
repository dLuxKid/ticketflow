import mongoose from 'mongoose';

const bookingSchema = new mongoose.Schema(
  {
    event: {
      type: mongoose.Schema.ObjectId,
      ref: 'Event',
      required: [true, 'Booking must belong to an Event!'],
    },
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
    },
    email: {
      type: String,
      required: [true, 'Booking must have an email!'],
    },
    name: {
      type: String,
      required: [true, 'Booking must have a name!'],
    },
    price: {
      type: Number,
      required: [true, 'Booking must have a price.'],
    },
    currency: {
      type: String,
      required: [true, 'Booking must have a currency.'],
    },
    transactionNumber: {
      type: Number,
      required: [true, 'Booking must have a transaction number.'],
    },
    ticketId: {
      type: String,
      required: [true, 'Booking must have a ticket Id.'],
    },
    ticketUser: {
      type: String,
      required: [true, 'Booking must have a ticket user.'],
    },
    transactionStatus: {
      type: String,
      required: [true, 'Booking must have a transaction status.'],
    },
    redirectUrl: {
      type: String,
      required: [true, 'Booking must have a redirect url.'],
    },
    message: {
      type: String,
      required: [true, 'Booking must have a message.'],
    },
    reference: {
      type: Number,
      required: [true, 'Booking must have a reference.'],
    },
    ticketType: {
      type: String,
      required: [true, 'Booking must have a ticket type.'],
    },
    isCheckedIn: {
      type: Boolean,
      default: false,
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
    timestamps: true,
  },
);

const Booking = mongoose.model('Booking', bookingSchema);

export default Booking;
