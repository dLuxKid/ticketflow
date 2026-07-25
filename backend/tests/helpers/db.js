import mongoose from 'mongoose';

/**
 * Shared helpers for DB-backed integration tests.
 *
 * These tests run only when MONGO_TEST_URI is set (a throwaway test database — in CI a
 * single-node replica set; see the Phase 0 note on transactions). When it is unset the
 * test files register a single skipped test so the suite stays green locally without a
 * database, and exercises the real invariants in CI.
 */

export const MONGO_TEST_URI = process.env.MONGO_TEST_URI;
export const skipReason = MONGO_TEST_URI
  ? false
  : 'set MONGO_TEST_URI to run DB integration tests';

export const connect = () => mongoose.connect(MONGO_TEST_URI);
export const disconnect = () => mongoose.disconnect();

/** A fully-valid Event payload; override any field via `overrides`. */
export const buildEvent = (overrides = {}) => {
  const now = new Date();
  const later = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  return {
    eventName: 'Test Event',
    startDate: later,
    startTime: later,
    endDate: later,
    endTime: later,
    eventDescription: 'A test event',
    eventLocation: {
      address: '1 Test Street',
      city: 'Testville',
      state: 'Test State',
      country: 'Testland',
    },
    eventCategory: 'Test',
    salesStartDate: now,
    salesEndDate: later,
    salesStartTime: now,
    salesEndTime: later,
    coverImage: 'https://example.com/cover.png',
    ticketDetails: [
      { ticketName: 'General', ticketPrice: 100, ticketQuantity: 1 },
    ],
    ...overrides,
  };
};
