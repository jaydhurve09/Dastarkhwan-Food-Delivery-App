/**
 * Application constants and configuration
 */

export const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key_here';
export const JWT_EXPIRE = '24h';

// Admin roles
export const ROLES = {
  SUPER_ADMIN: 'super_admin',
  SUB_ADMIN: 'sub_admin'
};

// Token types (for future use)
export const TOKEN_TYPES = {
  ACCESS: 'access',
  REFRESH: 'refresh',
  RESET_PASSWORD: 'reset_password',
  VERIFY_EMAIL: 'verify_email'
};

// Default pagination
const DEFAULT_PAGE_LIMIT = 10;
const DEFAULT_PAGE_NUMBER = 1;

export const PAGINATION = {
  DEFAULT_LIMIT: DEFAULT_PAGE_LIMIT,
  DEFAULT_PAGE: DEFAULT_PAGE_NUMBER,
  MAX_LIMIT: 100
};

// API response status codes
export const STATUS_CODES = {
  SUCCESS: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  INTERNAL_SERVER_ERROR: 500
};

// API response messages
export const MESSAGES = {
  // Authentication
  AUTH: {
    INVALID_CREDENTIALS: 'Invalid email or password',
    UNAUTHORIZED: 'Not authorized to access this route',
    INVALID_TOKEN: 'Invalid token',
    TOKEN_EXPIRED: 'Token expired',
    NO_TOKEN: 'No token, authorization denied',
    LOGIN_SUCCESS: 'Successfully logged in',
    LOGOUT_SUCCESS: 'Successfully logged out',
    PASSWORD_RESET_SENT: 'Password reset email sent',
    PASSWORD_RESET_SUCCESS: 'Password reset successful'
  },
  
  // General
  SERVER_ERROR: 'Internal server error',
  ROUTE_NOT_FOUND: 'Route not found',
  VALIDATION_ERROR: 'Validation error',
  
  // CRUD Operations
  CREATED: (resource) => `${resource} created successfully`,
  UPDATED: (resource) => `${resource} updated successfully`,
  DELETED: (resource) => `${resource} deleted successfully`,
  NOT_FOUND: (resource) => `${resource} not found`,
  ALREADY_EXISTS: (resource) => `${resource} already exists`
};

// Export all constants as default
export default {
  JWT_SECRET,
  JWT_EXPIRE,
  ROLES,
  TOKEN_TYPES,
  PAGINATION,
  STATUS_CODES,
  MESSAGES
};
