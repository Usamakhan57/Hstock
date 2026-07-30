export class AppError extends Error {
  /**
   * @param {string} message
   * @param {number} [statusCode=500]
   * @param {{ code?: string, details?: unknown, isOperational?: boolean }} [options]
   */
  constructor(message, statusCode = 500, options = {}) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.code = options.code || 'APP_ERROR';
    this.details = options.details;
    this.isOperational = options.isOperational !== false;
    Error.captureStackTrace?.(this, this.constructor);
  }
}

export default AppError;
