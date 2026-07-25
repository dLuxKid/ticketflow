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

// ─── Rate Limiting ─────────────────────────────────────────────────────────────
const limiter = rateLimit({
  max: 100,
  windowMs: 60 * 60 * 1000,
  message: 'Too many requests from this IP, please try again in an hour!',
});
app.use('/api', limiter);

// ─── CORS ──────────────────────────────────────────────────────────────────────
const corsOptions = {
  credentials: true,
  origin: process.env.DEV_FRONTEND_URL || 'http://localhost:3000',
  optionsSuccessStatus: 200,
};
app.use(cors(corsOptions));

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

// ─── 404 Handler ───────────────────────────────────────────────────────────────
app.all('*', (req, res, next) => {
  next(new AppError(`Cannot find ${req.originalUrl} on this server`, 404));
});

// ─── Global Error Handler ──────────────────────────────────────────────────────
app.use(errorHandler);

export default app;
