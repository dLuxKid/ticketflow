import * as chatbotService from '../../services/chatbot/chatbotService.js';
import catchAsync from '../../shared/middleware/catchAsync.js';

/**
 * Presentation layer for the AI concierge chatbot (Phase 8).
 * Public/unauthenticated on purpose - event discovery and FAQ help should work for
 * anonymous visitors, unlike everything else the guest-management merge added.
 */
export const sendMessage = catchAsync(async (req, res) => {
  const { reply, toolUsed } = await chatbotService.handleMessage({
    message: req.body.message,
    history: Array.isArray(req.body.history) ? req.body.history.slice(-6) : [],
  });

  res.status(200).json({ status: 'success', data: { reply, toolUsed } });
});
