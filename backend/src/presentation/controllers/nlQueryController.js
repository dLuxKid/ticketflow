import * as nlGuestQueryService from '../../services/nlGuestQueryService.js';
import catchAsync from '../../shared/middleware/catchAsync.js';

/**
 * Presentation layer for natural-language guest-list queries.
 * HTTP concerns only - parsing and execution live in nlGuestQueryService.
 */
export const query = catchAsync(async (req, res) => {
  const result = await nlGuestQueryService.answerQuestion(
    req.params.eventId,
    req.body.question,
    req.user,
  );
  res.status(200).json({ status: 'success', data: result });
});
