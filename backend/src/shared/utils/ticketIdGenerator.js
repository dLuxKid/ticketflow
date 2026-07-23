/**
 * Generates a unique numeric ticket ID prefixed with '#'.
 * @returns {string} e.g. '#4829301847'
 */
const generateTicketId = () => {
  const characters = '0123456789';
  const uuidLength = 10;

  let id = '#';
  for (let i = 0; i < uuidLength; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    id += characters[randomIndex];
  }

  return id;
};

export default generateTicketId;
