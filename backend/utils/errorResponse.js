/**
 * Custom error class to handle operational errors
 */
class ErrorResponse extends Error {
  /**
   * Create an error response
   * @param {string} message - Error message
   * @param {number} statusCode - HTTP status code
   * @param {Object} [details] - Additional error details
   */
  constructor(message, statusCode = 500, details = {}) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
    this.isOperational = true;

    // Capture stack trace, excluding constructor call from it
    Error.captureStackTrace(this, this.constructor);
  }

  /**
   * Create a 400 Bad Request error
   * @param {string} message - Error message
   * @param {Object} [details] - Additional error details
   * @returns {ErrorResponse} Bad Request error
   */
  static badRequest(message = 'Bad Request', details = {}) {
    return new ErrorResponse(message, 400, details);
  }

  /**
   * Create a 401 Unauthorized error
   * @param {string} [message='Not authorized'] - Error message
   * @returns {ErrorResponse} Unauthorized error
   */
  static unauthorized(message = 'Not authorized to access this route') {
    return new ErrorResponse(message, 401);
  }

  /**
   * Create a 403 Forbidden error
   * @param {string} [message='Forbidden'] - Error message
   * @returns {ErrorResponse} Forbidden error
   */
  static forbidden(message = 'Forbidden') {
    return new ErrorResponse(message, 403);
  }

  /**
   * Create a 404 Not Found error
   * @param {string} resource - Name of the resource not found
   * @returns {ErrorResponse} Not Found error
   */
  static notFound(resource = 'Resource') {
    return new ErrorResponse(`${resource} not found`, 404);
  }

  /**
   * Create a 409 Conflict error
   * @param {string} message - Error message
   * @param {Object} [details] - Additional error details
   * @returns {ErrorResponse} Conflict error
   */
  static conflict(message = 'Conflict', details = {}) {
    return new ErrorResponse(message, 409, details);
  }

  /**
   * Create a 422 Unprocessable Entity error
   * @param {string} message - Error message
   * @param {Object} [details] - Validation errors
   * @returns {ErrorResponse} Validation error
   */
  static validationError(message = 'Validation failed', details = {}) {
    return new ErrorResponse(message, 422, { errors: details });
  }

  /**
   * Create a 500 Internal Server Error
   * @param {string} [message='Server Error'] - Error message
   * @returns {ErrorResponse} Server error
   */
  static serverError(message = 'Server Error') {
    return new ErrorResponse(message, 500);
  }

  /**
   * Format error for response
   * @param {boolean} [includeStack=false] - Whether to include stack trace
   * @returns {Object} Formatted error response
   */
  toJSON(includeStack = process.env.NODE_ENV === 'development') {
    const response = {
      success: false,
      message: this.message,
      ...(Object.keys(this.details).length > 0 && { details: this.details })
    };

    if (includeStack) {
      response.stack = this.stack;
    }

    return response;
  }
}

export default ErrorResponse;
