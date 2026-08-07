import { test } from 'node:test';
import assert from 'node:assert/strict';
import pdfTemplate from '../../src/shared/utils/document.js';
import generateQRCode, {
  generateQRCodeBuffer,
} from '../../src/shared/utils/generateQrCode.js';

/**
 * Pins the ticket-email contract. Two defects shipped here undetected because nothing
 * asserted email content: the purchase email had no QR markup at all, and once it did, the
 * QR was embedded as a data: URI - which Gmail strips from <img src>, so delivered tickets
 * showed a blank square. The email must reference an inline `cid:` attachment instead.
 */

const details = {
  eventCategory: 'Technology',
  eventName: 'Lagos Tech Summit',
  eventLocation: {
    address: '12 Marina Road',
    city: 'Lagos',
    state: 'Lagos',
    country: 'Nigeria',
  },
  startDate: '2026-09-12T18:00:00Z',
  startTime: '2026-09-12T18:00:00Z',
  currency: 'NGN',
  price: 5000,
  organizer: 'TechCo',
  ticketId: '#K4M2XQ9WPR7T',
  name: 'Ada Lovelace',
  ticketType: 'VIP',
};

test('ticket email references the QR as an inline cid attachment, never a data URI', async () => {
  const html = await pdfTemplate(details);
  assert.match(html, /<img[^>]+src="cid:ticket-qr"/);
  // A data: URI would be stripped by Gmail - its presence is the regression this pins.
  assert.doesNotMatch(html, /src="data:image/);
});

test('ticket email carries everything the holder needs at the door', async () => {
  const html = await pdfTemplate(details);
  for (const needle of [
    details.eventName,
    details.ticketId,
    details.name,
    details.ticketType,
  ]) {
    assert.ok(html.includes(needle), `expected email to contain "${needle}"`);
  }
  // ICU abbreviates September as "Sep" or "Sept" depending on Node version - accept both.
  assert.match(html, /12 Sept? 2026/);
});

test('a free ticket shows "Free" rather than a zero price', async () => {
  const html = await pdfTemplate({ ...details, price: 0 });
  assert.ok(html.includes('Free'));
});

test('generateQRCodeBuffer returns a real PNG', async () => {
  const buf = await generateQRCodeBuffer(details.ticketId);
  assert.ok(Buffer.isBuffer(buf));
  // PNG magic bytes - proves an actual image, not an encoding of the failure.
  assert.deepEqual([...buf.subarray(0, 4)], [0x89, 0x50, 0x4e, 0x47]);
  assert.ok(buf.length > 500, 'suspiciously small for a QR PNG');
});

test('the data-URL variant still works for on-screen use', async () => {
  const url = await generateQRCode(details.ticketId);
  assert.match(url, /^data:image\/png;base64,/);
});
