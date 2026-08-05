/**
 * Generates an HTML email template for a digital event ticket.
 * @param {object} ticketBodyDetails - Combined event + booking fields
 * @returns {Promise<string>} HTML string
 */
const pdfTemplate = async (ticketBodyDetails) => {
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
    qr,
  } = ticketBodyDetails;

  const formattedDate = new Date(startDate).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: '2-digit',
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

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Digital Ticket</title>
    </head>
    <body>
    <table width="100%" align="center" cellpadding="0" cellspacing="0" border="0" style="background-color: #FFFFFF; border-radius: 1.5rem; width: 320px;">
        <tr>
            <td align="center" style="padding: 1rem;">
                <h3 style="font-size: 1.25rem; font-weight: bold; color: #1f1f1f;">
                    Kindly show this <br /> digital ticket at entry
                </h3>
            </td>
        </tr>
        <tr>
            <td align="center">
                <table width="100%" cellpadding="0" cellspacing="0" border="0">
                    <tr>
                        <td width="20" style="background-color: black; height: 40px; border-top-right-radius: 9999px; border-bottom-right-radius: 9999px;"></td>
                        <td style="border-top: 1px dashed rgba(0, 0, 0, 0.5); height: 1px; vertical-align: middle;" valign="middle"></td>
                        <td width="20" style="background-color: black; height: 40px; border-top-left-radius: 9999px; border-bottom-left-radius: 9999px;"></td>
                    </tr>
                </table>
            </td>
        </tr>
        <tr>
            <td style="padding: 1rem 0;">
                <table width="100%" cellpadding="0" cellspacing="0" border="0">
                    <tr>
                        <td>
                            <button style="background-color: #FF006E; padding: 0.375rem 1.25rem; font-size: 0.875rem; font-weight: 500; color: #fff; text-transform: capitalize; border-radius: 9999px; border: 0; outline: 0; margin-bottom: 1rem;">
                                ${eventCategory}
                            </button>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 1rem 0">
                            <table width="100%" cellpadding="0" cellspacing="0" border="0">
                                <tr>
                                    <td style="font-size: 1.125rem; font-weight: bold; color: #1f1f1f;">
                                        ${eventName}
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 0 1rem">
                            <table width="100%" cellpadding="0" cellspacing="0" border="0">
                                <tr>
                                    <td style="font-size: 0.75rem; font-weight: 500; color: rgba(31, 31, 31, 0.5);">Location</td>
                                </tr>
                                <tr>
                                    <td style="font-size: 1rem; font-weight: bold; color: #1f1f1f;">
                                        ${locationString}
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 0 1rem">
                            <table width="100%" cellpadding="0" cellspacing="0" border="0">
                                <tr>
                                    <td style="font-size: 0.75rem; font-weight: 500; color: rgba(31, 31, 31, 0.5);">Date</td>
                                    <td align="right" style="font-size: 0.75rem; font-weight: 500; color: rgba(31, 31, 31, 0.5);">Time</td>
                                </tr>
                                <tr>
                                    <td style="font-size: 1rem; font-weight: bold; color: #1f1f1f;">${formattedDate}</td>
                                    <td align="right" style="font-size: 1rem; font-weight: bold; color: #1f1f1f;">${formattedTime}</td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 0 1rem">
                            <table width="100%" cellpadding="0" cellspacing="0" border="0">
                                <tr>
                                    <td style="font-size: 0.75rem; font-weight: 500; color: rgba(31, 31, 31, 0.5);">Ticket Count</td>
                                    <td align="right" style="font-size: 0.75rem; font-weight: 500; color: rgba(31, 31, 31, 0.5);">Cost</td>
                                </tr>
                                <tr>
                                    <td style="font-size: 1rem; font-weight: bold; color: #1f1f1f;">1</td>
                                    <td align="right" style="font-size: 1rem; font-weight: bold; color: #1f1f1f;">${currency} ${price}</td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 0 1rem">
                            <table width="100%" cellpadding="0" cellspacing="0" border="0">
                                <tr>
                                    <td style="font-size: 0.75rem; font-weight: 500; color: rgba(31, 31, 31, 0.5);">Organizer</td>
                                </tr>
                                <tr>
                                    <td style="font-size: 1rem; font-weight: bold; color: #1f1f1f;">${organizer}</td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 0.5rem 0" align="center">
                            <img src="${qr}" alt="Ticket QR code" width="180" height="180" />
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 0.5rem 0" align="center">
                            <table width="100%" cellpadding="0" cellspacing="0" border="0">
                                <tr>
                                    <td style="font-size: 1rem; font-weight: 500; color: rgba(31, 31, 31, 0.5);">Ticket ID</td>
                                </tr>
                                <tr>
                                    <td style="font-size: 1.125rem; font-weight: bold; color: #1f1f1f;">${ticketId}</td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
    </body>
    </html>
  `;
};

export default pdfTemplate;
