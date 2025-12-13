import { createConsola } from "consola";

/**
 * Frontend Logger Configuration
 * Uses Consola for elegant console logging with support for both client and server side
 */

const isDevelopment = process.env.NODE_ENV === "development";
const isProduction = process.env.NODE_ENV === "production";

/**
 * Main logger instance
 * 
 * Features:
 * - Color-coded output by log level
 * - Timestamps in development
 * - Browser and Node.js compatible
 * - TypeScript support
 * - Performance optimized
 * 
 * Log Levels:
 * - trace: Very detailed debugging (gray)
 * - debug: Debugging information (blue)
 * - info: General information (cyan)
 * - success: Success messages (green)
 * - warn: Warnings (yellow)
 * - error: Errors (red)
 * - fatal: Critical failures (red + bold)
 * 
 * @example
 * import { logger } from '@/lib/logger';
 * 
 * logger.info('Component mounted');
 * logger.debug({ userId: '123' }, 'User data loaded');
 * logger.error('Failed to fetch data', error);
 * logger.success('Note created successfully');
 */
export const logger = createConsola({
  level: isDevelopment ? 4 : 3, // 4 = debug, 3 = info
  formatOptions: {
    colors: isDevelopment,
    date: isDevelopment,
    compact: isProduction,
  },
});

/**
 * Create a child logger with additional context
 * Useful for module-specific logging
 * 
 * @param tag - Tag to prefix all logs from this logger
 * @returns Child logger instance
 * 
 * @example
 * const authLogger = createLogger('auth');
 * authLogger.info('Login attempt');
 * // Output: [auth] Login attempt
 * 
 * @example
 * const noteLogger = createLogger('notes');
 * noteLogger.success('Note saved');
 * // Output: [notes] Note saved
 */
export function createLogger(tag: string) {
  return logger.withTag(tag);
}

/**
 * API logger for tracking HTTP requests
 */
export const apiLogger = createLogger("api");

/**
 * Component logger for React component lifecycle
 */
export const componentLogger = createLogger("component");

/**
 * State logger for state management operations
 */
export const stateLogger = createLogger("state");

/**
 * Performance logger for tracking performance metrics
 */
export const perfLogger = createLogger("perf");

/**
 * Log an API request with timing
 * 
 * @example
 * const startTime = Date.now();
 * try {
 *   const data = await fetch('/api/notes');
 *   logApiRequest('GET', '/api/notes', 200, Date.now() - startTime);
 * } catch (error) {
 *   logApiRequest('GET', '/api/notes', 500, Date.now() - startTime, error);
 * }
 */
export function logApiRequest(
  method: string,
  endpoint: string,
  status: number,
  duration: number,
  error?: Error
) {
  const logData = {
    method,
    endpoint,
    status,
    duration: `${duration}ms`,
  };

  if (status >= 500) {
    apiLogger.error("API Error", logData, error);
  } else if (status >= 400) {
    apiLogger.warn("API Client Error", logData);
  } else if (duration > 1000) {
    apiLogger.warn("Slow API Request", logData);
  } else {
    apiLogger.debug("API Request", logData);
  }
}

/**
 * Log component lifecycle events
 * 
 * @example
 * useEffect(() => {
 *   logComponentLifecycle('NoteEditor', 'mounted');
 *   return () => logComponentLifecycle('NoteEditor', 'unmounted');
 * }, []);
 */
export function logComponentLifecycle(
  componentName: string,
  event: "mounted" | "unmounted" | "updated"
) {
  if (isDevelopment) {
    componentLogger.debug(`${componentName} ${event}`);
  }
}

/**
 * Log performance metrics
 * 
 * @example
 * const startTime = performance.now();
 * // ... some operation
 * logPerformance('data-processing', performance.now() - startTime);
 */
export function logPerformance(operation: string, duration: number) {
  if (duration > 100) {
    perfLogger.warn(`Slow operation: ${operation}`, { duration: `${duration.toFixed(2)}ms` });
  } else if (isDevelopment) {
    perfLogger.debug(`${operation}`, { duration: `${duration.toFixed(2)}ms` });
  }
}

/**
 * Production-safe error logger
 * Logs full error details in development, sanitized in production
 */
export function logError(message: string, error: Error, context?: Record<string, any>) {
  if (isDevelopment) {
    logger.error(message, { error, context });
  } else {
    // In production, don't log sensitive error details
    logger.error(message, {
      errorType: error.name,
      message: error.message,
      context,
    });
  }
}
