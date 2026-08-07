import * as paymentService from '../../services/paymentService.js';
import catchAsync from '../../shared/middleware/catchAsync.js';

/**
 * Presentation layer for payment webhooks.
 * Handles HTTP concerns only - signature verification and effects live in paymentService.
 */

/**
 * Paystack webhook receiver. Uses the raw request body (captured in app.js) to verify the
 * signature before trusting any of its contents.
 */
export const paystackWebhook = catchAsync(async (req, res) => {
  const signature = req.headers['x-paystack-signature'];
  const result = await paymentService.handlePaystackWebhook(
    req.rawBody,
    signature,
  );

  // Always 200 once verified so Paystack does not needlessly retry a handled event.
  res.status(200).json({ status: 'success', ...result });
});

/**
 * Post-checkout confirmation from the buyer's browser. The body supplies only a reference;
 * the charge itself is verified against Paystack server-side before anything is confirmed.
 */
export const confirmCheckout = catchAsync(async (req, res) => {
  const result = await paymentService.confirmCheckout(req.body.reference);

  res.status(200).json({ status: 'success', data: result });
});
