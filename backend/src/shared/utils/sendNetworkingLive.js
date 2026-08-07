import nodemailer from 'nodemailer';

/**
 * Emails an attendee the moment their event goes live, with the link to join the group
 * chat / directory / DMs. Mirrors sendInvite.js's shape (own transport, inline HTML) rather
 * than the pug-templated Email class, since this is a bulk best-effort broadcast to every
 * attendee of an event, not a one-off transactional account email. Callers should treat
 * failure as non-fatal - the networking space already exists and is reachable by URL either
 * way.
 *
 * @param {object} args
 * @param {string} args.to
 * @param {string} args.name
 * @param {string} args.eventName
 * @param {string} args.link - the event's networking URL
 */
export const sendNetworkingLive = async ({ to, name, eventName, link }) => {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 480px; margin: auto;">
      <h2 style="color:#6528F7;">${eventName} is live!</h2>
      <p>Hi ${name},</p>
      <p>The event has started. Jump into the networking space to see who else is here, chat with everyone, or message someone directly.</p>
      <div style="text-align:center; margin: 24px 0;">
        <a href="${link}" style="display:inline-block; padding:12px 24px; background:#6528F7; color:#fff; border-radius:8px; text-decoration:none;">Join the networking group</a>
      </div>
      <p style="color:#666; font-size: 12px;">If the button doesn't work, copy this link: ${link}</p>
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
    subject: `${eventName} is live - join the networking group`,
    html,
  });
};
