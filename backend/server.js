import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config({ path: './config.env' });

import app from './app.js';

process.on('uncaughtException', (err) => {
  console.error('UNCAUGHT EXCEPTION 🚩 Shutting down...');
  console.error(err.name, err.message, err);
  process.exit(1);
});

const DB = process.env.DB;

mongoose.connect(DB).then(() => console.warn('DB connection successful ✅'));

const port = process.env.PORT || 4000;

const server = app.listen(port, () => {
  console.warn(
    `Ticketflow API running on port ${port} [${process.env.NODE_ENV}]`,
  );
});

process.on('unhandledRejection', (err) => {
  console.error('UNHANDLED REJECTION 🚩 Shutting down...');
  console.error(err.name, err.message);
  server.close(() => {
    process.exit(1);
  });
});
