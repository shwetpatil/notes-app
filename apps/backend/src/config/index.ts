/**
 * Centralized Configuration Module
 * 
 * This module consolidates all application configuration in one place,
 * making it easy to manage and update settings.
 * 
 * @module config
 * 
 * @example
 * // Import specific config modules
 * import { serverConfig, securityConfig } from './config';
 * 
 * @example
 * // Import database client
 * import { prisma } from './config';
 * 
 * @example
 * // Check environment
 * import { appConfig } from './config';
 * if (appConfig.isDevelopment) {
 *   console.log('Running in development mode');
 * }
 */

import dotenv from "dotenv";

// Load environment variables from .env file
dotenv.config();

// Export all configuration modules
export { serverConfig } from "./server.config";
export { databaseConfig, prisma } from "./database.config";
export { securityConfig } from "./security.config";
export { clusterConfig } from "./cluster.config";
export { monitoringConfig } from "./monitoring.config";
export { logger, createChildLogger } from "./logger.config";

/**
 * Application-wide configuration helpers
 */
export const appConfig = {
  isDevelopment: process.env.NODE_ENV === "development",
  isProduction: process.env.NODE_ENV === "production",
  isTest: process.env.NODE_ENV === "test",
  nodeEnv: process.env.NODE_ENV || "development",
} as const;
