/**
 * Digital ticket email template.
 *
 * Laid out as a boarding-pass-style card: brand header, a details grid (ticket ID, holder,
 * date, time), a perforation rule, then the QR on its own light panel. Built from nested
 * tables with inline styles throughout - email clients ignore <style> blocks and modern
 * layout, so tables are the only geometry that renders consistently in Gmail and Outlook.
 *
 * The QR is referenced as `cid:ticket-qr` and attached by the sender (generatePdf.js).
 * Never a data: URI here - Gmail strips those from <img src>, which is exactly the bug
 * that made delivered tickets arrive with a blank square.
 *
 * @param {object} t - Combined event + booking fields
 * @returns {Promise<string>} HTML string
 */
const pdfTemplate = async (t) => {
  const {
    eventCategory,
    eventName,
    eventLocation,
    startDate,
    startTime,
    currency,
    price,
    organizer,
    ticketId,
    name,
    ticketType,
  } = t;

  const formattedDate = new Date(startDate).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  const formattedTime = new Date(startTime).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });

  const locationString = [
    eventLocation?.address,
    eventLocation?.city,
    eventLocation?.state,
    eventLocation?.country,
  ]
    .filter(Boolean)
    .join(', ');

  const label =
    'font-family:Arial,Helvetica,sans-serif;font-size:11px;font-weight:bold;letter-spacing:1px;text-transform:uppercase;color:#9aa0b5;padding:0 0 3px 0;';
  const value =
    'font-family:Arial,Helvetica,sans-serif;font-size:15px;font-weight:bold;color:#2e3244;';

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Your ticket for ${eventName}</title>
</head>
<body style="margin:0;padding:0;background-color:#f5f6fb;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f5f6fb;padding:32px 12px;">
    <tr>
      <td align="center">

        <table role="presentation" width="380" cellpadding="0" cellspacing="0" border="0" style="width:380px;max-width:100%;border-radius:20px;overflow:hidden;background-color:#ffffff;border:1px solid #e4e6f1;">

          <!-- Header band -->
          <tr>
            <td style="background-color:#6c5ce7;padding:28px 28px 22px 28px;" align="center">
              <p style="margin:0 0 6px 0;font-family:Arial,Helvetica,sans-serif;font-size:11px;font-weight:bold;letter-spacing:3px;text-transform:uppercase;color:#ffffff;opacity:0.75;">
                ${eventCategory || 'Event'} &bull; TicketFlow
              </p>
              <h1 style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:26px;line-height:1.2;font-weight:bold;color:#ffffff;">
                ${eventName}
              </h1>
              <p style="margin:10px 0 0 0;font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#ffffff;opacity:0.85;">
                ${locationString}
              </p>
            </td>
          </tr>

          <!-- Details grid -->
          <tr>
            <td style="padding:24px 28px 8px 28px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td width="50%" style="padding:0 8px 16px 0;">
                    <p style="${label}">Ticket ID</p>
                    <p style="${value}margin:0;">${ticketId}</p>
                  </td>
                  <td width="50%" style="padding:0 0 16px 8px;">
                    <p style="${label}">Name</p>
                    <p style="${value}margin:0;">${name || 'Guest'}</p>
                  </td>
                </tr>
                <tr>
                  <td width="50%" style="padding:0 8px 16px 0;">
                    <p style="${label}">Date</p>
                    <p style="${value}margin:0;">${formattedDate}</p>
                  </td>
                  <td width="50%" style="padding:0 0 16px 8px;">
                    <p style="${label}">Time</p>
                    <p style="${value}margin:0;">${formattedTime}</p>
                  </td>
                </tr>
                <tr>
                  <td width="50%" style="padding:0 8px 4px 0;">
                    <p style="${label}">${ticketType ? 'Ticket type' : 'Organiser'}</p>
                    <p style="${value}margin:0;">${ticketType || organizer || 'TicketFlow'}</p>
                  </td>
                  <td width="50%" style="padding:0 0 4px 8px;">
                    <p style="${label}">Price</p>
                    <p style="${value}margin:0;">${Number(price) > 0 ? `${currency || ''} ${price}` : 'Free'}</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Perforation -->
          <tr>
            <td style="padding:8px 0;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td width="14" style="background-color:#f5f6fb;height:28px;border-radius:0 14px 14px 0;"></td>
                  <td style="border-top:2px dashed #e4e6f1;height:1px;"></td>
                  <td width="14" style="background-color:#f5f6fb;height:28px;border-radius:14px 0 0 14px;"></td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- QR panel: attached inline by the sender, never a data URI (Gmail strips them) -->
          <tr>
            <td align="center" style="padding:8px 28px 6px 28px;">
              <p style="margin:0 0 14px 0;font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#3a3f52;">
                Show this code at the entrance to be admitted
              </p>
              <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="background-color:#ffffff;border:1px solid #e4e6f1;border-radius:16px;padding:14px;">
                    <img src="cid:ticket-qr" alt="Your ticket QR code - reference ${ticketId}" width="180" height="180" style="display:block;width:180px;height:180px;" />
                  </td>
                </tr>
              </table>
              <p style="margin:12px 0 0 0;font-family:Arial,Helvetica,sans-serif;font-size:11px;color:#9aa0b5;">
                Can't scan? Quote your ticket ID: <span style="color:#2e3244;font-weight:bold;">${ticketId}</span>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="padding:18px 28px 24px 28px;">
              <p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:11px;color:#9aa0b5;">
                Organised by ${organizer || 'TicketFlow'} &bull; This ticket admits one and is valid for a single entry.
              </p>
            </td>
          </tr>
        </table>

        <p style="margin:18px 0 0 0;font-family:Arial,Helvetica,sans-serif;font-size:11px;color:#9aa0b5;">
          Sent by TicketFlow &bull; Keep this email - your QR code is your entry.
        </p>
      </td>
    </tr>
  </table>
</body>
</html>`;
};

export default pdfTemplate;
