import QRCode from 'qrcode';

/**
 * Generates a QR code as a base64 data URL.
 * @param {string} data - The data to encode in the QR code
 * @returns {Promise<string>} Base64-encoded PNG data URL
 */
const generateQRCode = async (data) => {
  const qrCodeBase64 = await QRCode.toDataURL(data, {
    errorCorrectionLevel: 'H',
    type: 'image/png',
    width: 200,
    margin: 1,
    color: '#6528F7',
  });
  return qrCodeBase64;
};

export default generateQRCode;
