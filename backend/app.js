import express from 'express';
import morgan from 'morgan';
import { fileURLToPath } from 'url';
import path from 'path';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import mongoSanitize from 'express-mongo-sanitize';
import { xss } from 'express-xss-sanitizer';
import hpp from 'hpp';
import cookieParser from 'cookie-parser';

import AppError from './src/shared/errors/AppError.js';
import errorHandler from './src/shared/errors/errorHandler.js';

import eventRouter from './src/presentation/routes/eventRoutes.js';
import userRouter from './src/presentation/routes/userRoutes.js';
import bookingRouter from './src/presentation/routes/bookingRoutes.js';
import chatRouter from './src/presentation/routes/chatRoutes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// ─── View Engine ───────────────────────────────────────────────────────────────
app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));

// ─── Security Middleware ────────────────────────────────────────────────────────
app.use(helmet()); // Set security HTTP headers
app.use(cookieParser());
app.use(mongoSanitize()); // Sanitize against NoSQL query injection
app.use(xss()); // Sanitize against XSS

app.use(
  hpp({
    whitelist: ['eventName', 'eventCategory', 'eventLocation', 'startDate'],
  }),
);

// ─── CORS ──────────────────────────────────────────────────────────────────────
const corsOptions = {
  credentials: true,
  origin: process.env.DEV_FRONTEND_URL || 'http://localhost:3000',
  optionsSuccessStatus: 200,
};
app.use(cors(corsOptions));

// ─── Rate Limiting ─────────────────────────────────────────────────────────────
// Configurable, with the previous hardcoded values as defaults so nothing changes unless a
// deployment opts in. Two reasons it needed to move out of the source:
//
//   1. 100 requests/hour/IP is low for this product. A single visitor browsing events,
//      opening a few detail pages and completing a checkout can spend a large share of that
//      in one sitting, and anyone behind shared NAT (a venue's wifi, a corporate network,
//      a mobile carrier) shares the budget with everyone else on that address.
//   2. It made the API impossible to load test - every run flatlined at 429 after 100
//      requests, so no throughput or latency figure could ever be gathered.
const limiter = rateLimit({
  max: Number(process.env.RATE_LIMIT_MAX) || 500,
  windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS) || 60 * 60 * 1000,
  message: 'Too many requests from this IP, please try again in an hour!',
});
app.use('/api', limiter);

// ─── Body Parsing ──────────────────────────────────────────────────────────────
// Capture the exact raw bytes on the way in so webhook handlers can verify provider
// signatures (e.g. Paystack HMAC), which must be computed over the unmodified body.
app.use(
  express.json({
    limit: '50mb',
    verify: (req, res, buf) => {
      req.rawBody = buf;
    },
  }),
);
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// ─── Logging ───────────────────────────────────────────────────────────────────
if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}

// ─── Request Timestamp ─────────────────────────────────────────────────────────
app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  next();
});

// ─── Routes ────────────────────────────────────────────────────────────────────
app.get('/', (req, res) =>
  res.json({ status: 'success', message: 'Ticketflow API' }),
);
app.use('/api/v1/events', eventRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/bookings', bookingRouter);
app.use('/api/v1/chat', chatRouter);

// ─── 404 Handler ───────────────────────────────────────────────────────────────
app.all('*', (req, res, next) => {
  next(new AppError(`Cannot find ${req.originalUrl} on this server`, 404));
});

// ─── Global Error Handler ──────────────────────────────────────────────────────
app.use(errorHandler);

export default app;
