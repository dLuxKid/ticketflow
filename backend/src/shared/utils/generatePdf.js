import nodemailer from 'nodemailer';
import pdfTemplate from './document.js';
import { generateQRCodeBuffer } from './generateQrCode.js';

/**
 * Sends a digital ticket as an HTML email to the booking recipient.
 *
 * The QR is generated here as a PNG buffer and attached inline with a `cid:` - the
 * template references `cid:ticket-qr`. It used to be inlined as a base64 data URL, which
 * Gmail strips from <img src>, so tickets were delivered with an empty square where the
 * QR belonged. A CID attachment renders in Gmail, Outlook and Apple Mail alike.
 *
 * @param {object} ticketBodyDetails - Combined event + booking data (must carry ticketId)
 */
export const sendPdf = async (ticketBodyDetails) => {
  const [template, qrPng] = await Promise.all([
    pdfTemplate(ticketBodyDetails),
    generateQRCodeBuffer(ticketBodyDetails.ticketId),
  ]);

  const transport = nodemailer.createTransport({
    service: 'gmail',
    host: process.env.GMAIL_HOST,
    port: Number(process.env.GMAIL_PORT) || 587,
    auth: {
      user: process.env.GMAIL_EMAIL,
      pass: process.env.GMAIL_PASSWORD,
    },
  });

  const mailOptions = {
    from: `Ticketflow <${process.env.GMAIL_EMAIL}>`,
    to: ticketBodyDetails.email,
    subject: `Your ticket for ${ticketBodyDetails.eventName}`,
    html: template,
    attachments: [
      {
        filename: 'ticket-qr.png',
        content: qrPng,
        cid: 'ticket-qr', // must match the template's <img src="cid:ticket-qr">
        contentDisposition: 'inline',
      },
    ],
  };

  await transport.sendMail(mailOptions);
};
