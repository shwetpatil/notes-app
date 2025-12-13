/**
 * Constants used throughout the backend application
 * Centralized location for all magic numbers, strings, and configuration values
 */

// ============================================================================
// Authentication & Security
// ============================================================================

export const AUTH_CONSTANTS = {
  SALT_ROUNDS: 12,
  MAX_LOGIN_ATTEMPTS: 5,
  ACCOUNT_LOCK_DURATION: 15 * 60 * 1000, // 15 minutes
  SESSION_DURATION: 24 * 60 * 60 * 1000, // 24 hours
  REMEMBER_ME_DURATION: 30 * 24 * 60 * 60 * 1000, // 30 days
  PASSWORD_MIN_LENGTH: 8,
} as const;

// ============================================================================
// Rate Limiting
// ============================================================================

export const RATE_LIMIT_CONSTANTS = {
  AUTH: {
    WINDOW_MS: 15 * 60 * 1000, // 15 minutes
    MAX_REQUESTS: 5,
  },
  API: {
    WINDOW_MS: 15 * 60 * 1000, // 15 minutes
    MAX_REQUESTS: 100,
  },
} as const;

// ============================================================================
// Database
// ============================================================================

export const DB_CONSTANTS = {
  MAX_TITLE_LENGTH: 255,
  MAX_TAG_LENGTH: 50,
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
} as const;

// ============================================================================
// File & Content Limits
// ============================================================================

export const CONTENT_LIMITS = {
  BODY_PARSER_LIMIT: '10mb',
  MAX_TAGS_PER_NOTE: 10,
  MAX_NOTES_BULK_OPERATION: 50,
} as const;

// ============================================================================
// Search & Filtering
// ============================================================================

export const SEARCH_CONSTANTS = {
  MIN_SEARCH_LENGTH: 2,
  MAX_SEARCH_LENGTH: 100,
  VALID_SORT_FIELDS: ['updatedAt', 'createdAt', 'title'] as const,
  VALID_SORT_ORDERS: ['asc', 'desc'] as const,
} as const;

// ============================================================================
// Note Status
// ============================================================================

export enum NoteStatus {
  ACTIVE = 'active',
  ARCHIVED = 'archived',
  TRASHED = 'trashed',
}

// ============================================================================
// Share Permissions
// ============================================================================

export enum SharePermission {
  VIEW = 'view',
  EDIT = 'edit',
}

// ============================================================================
// HTTP Status Codes
// ============================================================================

export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  LOCKED: 423,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
} as const;

// ============================================================================
// Error Messages
// ============================================================================

export const ERROR_MESSAGES = {
  // Authentication
  AUTH_REQUIRED: 'Authentication required',
  INVALID_CREDENTIALS: 'Invalid credentials',
  ACCOUNT_LOCKED: 'Account locked due to too many failed login attempts',
  EMAIL_ALREADY_EXISTS: 'Email already registered',
  INVALID_EMAIL: 'Invalid email format',
  PASSWORD_TOO_SHORT: 'Password must be at least 8 characters long',
  
  // Authorization
  PERMISSION_DENIED: 'Permission denied',
  NOT_OWNER: 'You do not own this resource',
  
  // Resources
  NOTE_NOT_FOUND: 'Note not found',
  FOLDER_NOT_FOUND: 'Folder not found',
  TEMPLATE_NOT_FOUND: 'Template not found',
  USER_NOT_FOUND: 'User not found',
  
  // Validation
  INVALID_INPUT: 'Invalid input format',
  REQUIRED_FIELD_MISSING: 'Required field missing',
  
  // Generic
  INTERNAL_ERROR: 'An error occurred',
  ROUTE_NOT_FOUND: 'Route not found',
  TOO_MANY_REQUESTS: 'Too many requests, please try again later',
} as const;

// ============================================================================
// Success Messages
// ============================================================================

export const SUCCESS_MESSAGES = {
  LOGIN_SUCCESS: 'Logged in successfully',
  LOGOUT_SUCCESS: 'Logged out successfully',
  REGISTER_SUCCESS: 'Account created successfully',
  NOTE_CREATED: 'Note created successfully',
  NOTE_UPDATED: 'Note updated successfully',
  NOTE_DELETED: 'Note deleted successfully',
  FOLDER_CREATED: 'Folder created successfully',
  TEMPLATE_CREATED: 'Template created successfully',
  SHARE_CREATED: 'Shared successfully',
} as const;

// ============================================================================
// Validation Patterns
// ============================================================================

export const VALIDATION_PATTERNS = {
  HEX_COLOR: /^#[0-9A-F]{6}$/i,
  CUID: /^c[a-z0-9]{24}$/,
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
} as const;

// ============================================================================
// Log Events
// ============================================================================

export const LOG_EVENTS = {
  // Authentication
  LOGIN_SUCCESS: 'login_success',
  LOGIN_FAILURE: 'login_failure',
  LOGOUT: 'logout',
  REGISTER_SUCCESS: 'register_success',
  
  // Account Security
  ACCOUNT_LOCKED: 'account_locked',
  ACCOUNT_UNLOCKED: 'account_unlocked',
  
  // Resources
  NOTE_CREATED: 'note_created',
  NOTE_UPDATED: 'note_updated',
  NOTE_DELETED: 'note_deleted',
  NOTE_VIEWED: 'note_viewed',
  
  // Errors
  RATE_LIMIT_EXCEEDED: 'rate_limit_exceeded',
  DATABASE_ERROR: 'database_error',
  VALIDATION_ERROR: 'validation_error',
} as const;

// ============================================================================
// Export Types
// ============================================================================

export type SortField = typeof SEARCH_CONSTANTS.VALID_SORT_FIELDS[number];
export type SortOrder = typeof SEARCH_CONSTANTS.VALID_SORT_ORDERS[number];
