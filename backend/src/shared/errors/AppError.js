class AppError extends Error {
  /**
   * @param {string} message - human-readable, safe to show a user
   * @param {number} statusCode
   * @param {string} [code] - stable machine-readable identifier (e.g. 'at_capacity').
   *   Lets a client branch on *which* failure occurred without string-matching the message,
   *   which would otherwise break the moment the wording is reworded or translated.
   */
  constructor(message, statusCode, code) {
    super(message);

    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;
    if (code) this.code = code;

    Error.captureStackTrace(this, this.constructor);
  }
}

export default AppError;
