import nodemailer from 'nodemailer';
import pdfTemplate from './document.js';

/**
 * Sends a digital ticket as an HTML email to the booking recipient.
 * @param {object} ticketBodyDetails - Combined event + booking data
 */
export const sendPdf = async (ticketBodyDetails) => {
  const template = await pdfTemplate(ticketBodyDetails);

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
    subject: `YOUR DIGITAL TICKET FOR ${ticketBodyDetails.eventName}`,
    html: template,
  };

  await transport.sendMail(mailOptions);
};
