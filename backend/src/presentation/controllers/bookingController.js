import * as bookingService from '../../services/bookingService.js';
import catchAsync from '../../shared/middleware/catchAsync.js';

/**
 * Presentation layer for bookings.
 * Handles HTTP concerns only - delegates all business logic to bookingService.
 */

/**
 * Holds seats and creates `pending` bookings before the buyer is sent to checkout.
 * The response carries the server-issued reference the client must pay against.
 */
export const createBooking = catchAsync(async (req, res) => {
  const userId = req.user?._id;

  const { reference, bookings, requiresPayment, checkout } =
    await bookingService.reserveBooking(
      req.body.ticketBuyers,
      req.body.event,
      userId,
    );

  res.status(201).json({
    status: 'success',
    message: requiresPayment
      ? 'Your tickets are reserved - complete payment to confirm'
      : 'You have successfully registered for this event',
    data: { booking: bookings, reference, requiresPayment, checkout },
  });
});

export const getMyBookings = catchAsync(async (req, res) => {
  const bookings = await bookingService.getMyBookings(req.user._id);

  res.status(200).json({
    status: 'success',
    data: { bookings },
  });
});

export const getBookingsForEvent = catchAsync(async (req, res) => {
  const { bookers, event } = await bookingService.getBookingsForEvent(
    req.params.event,
    req.user,
  );

  res.status(200).json({
    status: 'success',
    data: { bookers, event },
  });
});

export const checkInAttendee = catchAsync(async (req, res) => {
  const ticket = await bookingService.checkInAttendee(
    req.params.id,
    req.body.isCheckedIn,
    req.user,
  );

  res.status(200).json({
    status: 'success',
    data: { ticket },
  });
});
