import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import * as chatController from '../controllers/chatController.js';

/**
 * Stricter than the general `/api` limiter (100/hour) in app.js - LLM calls cost money per
 * request, unlike everything else on this API.
 */
const chatLimiter = rateLimit({
  max: Number(process.env.CHAT_RATE_LIMIT_PER_HOUR) || 20,
  windowMs: 60 * 60 * 1000,
  message: 'Too many chat messages from this IP, please try again in an hour!',
});

const router = Router();

router.post('/', chatLimiter, chatController.sendMessage);

export default router;
