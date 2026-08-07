import QRCode from 'qrcode';

/**
 * QR generation for tickets and invites.
 *
 * Two fixes over the original:
 *
 * 1. `color` previously passed a plain string, but the qrcode package expects
 *    `{ dark, light }` objects - the string was silently ignored. Modules are now the
 *    brand slate on white; near-black modules also scan more reliably than brand purple
 *    would, and the door scanner is the whole point of this image.
 *
 * 2. A PNG **buffer** variant exists for email. The data-URL form still works for
 *    on-screen use, but Gmail strips `data:` URIs from <img src> - and this app delivers
 *    through Gmail SMTP, so recipients saw a blank box where the QR should be. Email
 *    callers attach the buffer via nodemailer with a `cid:` and reference that instead.
 */

const QR_OPTIONS = {
  errorCorrectionLevel: 'H',
  type: 'image/png',
  width: 480, // rendered at ~200px; the headroom keeps modules crisp on retina screens
  margin: 2,
  color: { dark: '#2e3244', light: '#ffffff' },
};

/**
 * @param {string} data - The value to encode
 * @returns {Promise<string>} Base64-encoded PNG data URL (on-screen use only - Gmail
 *   strips data URIs, so never put this in an email)
 */
const generateQRCode = (data) => QRCode.toDataURL(data, QR_OPTIONS);

/**
 * @param {string} data - The value to encode
 * @returns {Promise<Buffer>} PNG buffer, for attaching to email as an inline `cid:` image
 */
export const generateQRCodeBuffer = (data) => QRCode.toBuffer(data, QR_OPTIONS);

export default generateQRCode;
