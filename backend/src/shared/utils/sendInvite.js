import nodemailer from 'nodemailer';
import { generateQRCodeBuffer } from './generateQrCode.js';

/**
 * Emails a guest their invite with a scannable QR encoding the single-use invite token -
 * the same delivery channel as a purchased ticket, minus the checkout.
 *
 * The QR is attached inline via `cid:` rather than embedded as a data URL: Gmail strips
 * data URIs from <img src>, which is why invites were arriving with a blank square where
 * the code should be. Layout matches the purchased-ticket card (document.js) so both
 * admission emails read as one product.
 *
 * Callers should treat failure as non-fatal: the guest and invite already exist and the
 * organiser can resend.
 *
 * @param {object} args
 * @param {string} args.to - guest email
 * @param {string} args.name - guest name
 * @param {string} args.eventName
 * @param {string} args.inviteToken - encoded into the QR
 */
export const sendInvite = async ({ to, name, eventName, inviteToken }) => {
  const qrPng = await generateQRCodeBuffer(inviteToken);

  const html = `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" /><title>Your invite to ${eventName}</title></head>
<body style="margin:0;padding:0;background-color:#f5f6fb;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f5f6fb;padding:32px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="380" cellpadding="0" cellspacing="0" border="0" style="width:380px;max-width:100%;border-radius:20px;overflow:hidden;background-color:#ffffff;border:1px solid #e4e6f1;">

          <tr>
            <td style="background-color:#6c5ce7;padding:28px;" align="center">
              <p style="margin:0 0 6px 0;font-family:Arial,Helvetica,sans-serif;font-size:11px;font-weight:bold;letter-spacing:3px;text-transform:uppercase;color:#ffffff;opacity:0.75;">
                You're invited &bull; TicketFlow
              </p>
              <h1 style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:26px;line-height:1.2;font-weight:bold;color:#ffffff;">
                ${eventName}
              </h1>
            </td>
          </tr>

          <tr>
            <td style="padding:24px 28px 4px 28px;" align="center">
              <p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.6;color:#3a3f52;">
                Hi <span style="font-weight:bold;color:#2e3244;">${name}</span>,<br />
                you're on the guest list. Show this code at the door to be admitted &mdash; it is valid for a single entry.
              </p>
            </td>
          </tr>

          <!-- Perforation -->
          <tr>
            <td style="padding:14px 0 6px 0;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td width="14" style="background-color:#f5f6fb;height:28px;border-radius:0 14px 14px 0;"></td>
                  <td style="border-top:2px dashed #e4e6f1;height:1px;"></td>
                  <td width="14" style="background-color:#f5f6fb;height:28px;border-radius:14px 0 0 14px;"></td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td align="center" style="padding:8px 28px 6px 28px;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="background-color:#ffffff;border:1px solid #e4e6f1;border-radius:16px;padding:14px;">
                    <img src="cid:invite-qr" alt="Your entry QR code" width="180" height="180" style="display:block;width:180px;height:180px;" />
                  </td>
                </tr>
              </table>
              <p style="margin:12px 0 0 0;font-family:Arial,Helvetica,sans-serif;font-size:11px;color:#9aa0b5;">
                Can't scan? Present this reference at the door:<br />
                <span style="color:#2e3244;font-weight:bold;word-break:break-all;">${inviteToken}</span>
              </p>
            </td>
          </tr>

          <tr>
            <td align="center" style="padding:18px 28px 24px 28px;">
              <p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:11px;color:#9aa0b5;">
                This invitation is personal to you and admits one.
              </p>
            </td>
          </tr>
        </table>

        <p style="margin:18px 0 0 0;font-family:Arial,Helvetica,sans-serif;font-size:11px;color:#9aa0b5;">
          Sent by TicketFlow &bull; Keep this email &mdash; your QR code is your entry.
        </p>
      </td>
    </tr>
  </table>
</body>
</html>`;

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
    attachments: [
      {
        filename: 'invite-qr.png',
        content: qrPng,
        cid: 'invite-qr', // must match <img src="cid:invite-qr"> above
        contentDisposition: 'inline',
      },
    ],
  });
};
