import nodemailer from 'nodemailer';
import generateQRCode from './generateQrCode.js';

/**
 * Emails a guest their invite with a scannable QR encoding the single-use invite token —
 * the same delivery channel as a purchased ticket, minus the checkout. The QR is embedded
 * as an inline data URL so no attachment or asset host is needed.
 *
 * Transport mirrors generatePdf.js (Gmail). Callers should treat failure as non-fatal: the
 * guest and invite already exist and the organiser can resend.
 *
 * @param {object} args
 * @param {string} args.to - guest email
 * @param {string} args.name - guest name
 * @param {string} args.eventName
 * @param {string} args.inviteToken - encoded into the QR
 */
export const sendInvite = async ({ to, name, eventName, inviteToken }) => {
  const qr = await generateQRCode(inviteToken);

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 480px; margin: auto;">
      <h2 style="color:#6528F7;">You're invited to ${eventName}</h2>
      <p>Hi ${name},</p>
      <p>Show this QR code at the door to be admitted. It is valid for a single entry.</p>
      <div style="text-align:center; margin: 24px 0;">
        <img src="${qr}" alt="Your entry QR code" width="200" height="200" />
      </div>
      <p style="color:#666; font-size: 12px;">If you can't scan it, present this reference: ${inviteToken}</p>
    </div>`;

  const transport = nodemailer.createTransport({
    service: 'gmail',
    host: process.env.GMAIL_HOST,
    port: Number(process.env.GMAIL_PORT) || 587,
    auth: {
      user: process.env.GMAIL_EMAIL,
      pass: process.env.GMAIL_PASSWORD,
    },
  });

  await transport.sendMail({
    from: `Ticketflow <${process.env.GMAIL_EMAIL}>`,
    to,
    subject: `Your invite to ${eventName}`,
    html,
  });
};
