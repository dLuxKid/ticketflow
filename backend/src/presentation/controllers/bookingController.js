import * as bookingService from '../../services/bookingService.js';
import catchAsync from '../../shared/middleware/catchAsync.js';

/**
 * Presentation layer for bookings.
 * Handles HTTP concerns only — delegates all business logic to bookingService.
 */

export const createBooking = catchAsync(async (req, res) => {
  const userId = req.user?._id;

  const booking = await bookingService.createBooking(
    req.body.ticketBuyers,
    req.body.event,
    userId,
  );

  res.status(201).json({
    status: 'success',
    message: 'You have successfully registered for this event',
    data: { booking },
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
