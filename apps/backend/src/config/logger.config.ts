import pino from "pino";

/**
 * Logger configuration
 * Uses Pino for high-performance structured logging
 */
const logLevel = process.env.LOG_LEVEL || (process.env.NODE_ENV === "production" ? "info" : "debug");

/**
 * Pino logger instance with environment-specific configuration
 * 
 * Development:
 * - Pretty printing with colors
 * - Debug level logging
 * - Human-readable timestamps
 * 
 * Production:
 * - JSON structured logs
 * - Info level logging
 * - Optimized for log aggregation
 * 
 * @example
 * import { logger } from './config';
 * 
 * logger.info('Server started on port 3002');
 * logger.error({ err }, 'Database connection failed');
 * logger.debug({ userId: '123' }, 'User authenticated');
 */
export const logger = pino(
  {
    level: logLevel,
    formatters: {
      level: (label) => {
        return { level: label.toUpperCase() };
      },
    },
    timestamp: pino.stdTimeFunctions.isoTime,
    ...(process.env.NODE_ENV !== "production" && {
      transport: {
        target: "pino-pretty",
        options: {
          colorize: true,
          translateTime: "HH:MM:ss.l",
          ignore: "pid,hostname",
          singleLine: false,
        },
      },
    }),
  }
);

/**
 * Child logger factory for creating context-specific loggers
 * 
 * @example
 * const routeLogger = createChildLogger({ module: 'auth' });
 * routeLogger.info('User login attempt');
 */
export function createChildLogger(bindings: Record<string, any>) {
  return logger.child(bindings);
}
