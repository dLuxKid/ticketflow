import nodemailer from 'nodemailer';

/**
 * Emails a guest their one-time code for an event's networking channel.
 *
 * Styled to match the ticket and invite emails (document.js, sendInvite.js) so all three
 * read as one product. Plain HTML tables and inline styles for the same reason as those:
 * email clients ignore <style> blocks and modern layout.
 *
 * @param {object} args
 * @param {string} args.to
 * @param {string} args.name
 * @param {string} args.eventName
 * @param {string} args.code - the plaintext six-digit code (never persisted)
 * @param {number} args.expiresInMinutes
 */
export const sendNetworkingOtp = async ({
  to,
  name,
  eventName,
  code,
  expiresInMinutes,
}) => {
  const html = `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" /><title>Your code for ${eventName}</title></head>
<body style="margin:0;padding:0;background-color:#f5f6fb;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f5f6fb;padding:32px 12px;">
    <tr><td align="center">
      <table role="presentation" width="380" cellpadding="0" cellspacing="0" border="0" style="width:380px;max-width:100%;border-radius:20px;overflow:hidden;background-color:#ffffff;border:1px solid #e4e6f1;">

        <tr>
          <td style="background-color:#6c5ce7;padding:28px;" align="center">
            <p style="margin:0 0 6px 0;font-family:Arial,Helvetica,sans-serif;font-size:11px;font-weight:bold;letter-spacing:3px;text-transform:uppercase;color:#ffffff;opacity:0.75;">
              Networking access
            </p>
            <h1 style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:24px;line-height:1.2;font-weight:bold;color:#ffffff;">
              ${eventName}
            </h1>
          </td>
        </tr>

        <tr>
          <td align="center" style="padding:26px 28px 6px 28px;">
            <p style="margin:0 0 18px 0;font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.6;color:#3a3f52;">
              Hi <span style="font-weight:bold;color:#2e3244;">${name}</span>, here is your code to join the networking channel:
            </p>
            <table role="presentation" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td style="background-color:#f5f6fb;border:1px solid #e4e6f1;border-radius:14px;padding:16px 28px;font-family:'Courier New',Courier,monospace;font-size:32px;font-weight:bold;letter-spacing:8px;color:#2e3244;">
                  ${code}
                </td>
              </tr>
            </table>
            <p style="margin:18px 0 0 0;font-family:Arial,Helvetica,sans-serif;font-size:12px;color:#9aa0b5;">
              This code expires in ${expiresInMinutes} minutes and can be used once.
            </p>
          </td>
        </tr>

        <tr>
          <td align="center" style="padding:18px 28px 26px 28px;">
            <p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:11px;color:#9aa0b5;">
              If you didn't ask to join, you can ignore this email - nothing has changed.
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
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
    subject: `Your code to join ${eventName}`,
    html,
  });
};
