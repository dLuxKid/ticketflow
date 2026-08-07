import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config({ path: './config.env' });

import app from './app.js';
import {
  startReservationSweep,
  stopReservationSweep,
} from './src/shared/reservationSweeper.js';

process.on('uncaughtException', (err) => {
  console.error('UNCAUGHT EXCEPTION 🚩 Shutting down...');
  console.error(err.name, err.message, err);
  process.exit(1);
});

const DB = process.env.DB;

mongoose.connect(DB).then(() => {
  console.warn('DB connection successful ✅');
  // Started only after the connection resolves - the sweep queries immediately on its first
  // tick and would otherwise race the handshake.
  startReservationSweep();
});

const port = process.env.PORT || 4000;

const server = app.listen(port, () => {
  console.warn(
    `Ticketflow API running on port ${port} [${process.env.NODE_ENV}]`,
  );
});

process.on('unhandledRejection', (err) => {
  console.error('UNHANDLED REJECTION 🚩 Shutting down...');
  console.error(err.name, err.message);
  stopReservationSweep();
  server.close(() => {
    process.exit(1);
  });
});

// Containers stop with SIGTERM; drain in-flight requests and cancel the sweep rather than
// being killed mid-request.
process.on('SIGTERM', () => {
  console.warn('SIGTERM received. Shutting down gracefully...');
  stopReservationSweep();
  server.close(() => {
    mongoose.connection.close(false).then(() => process.exit(0));
  });
});
