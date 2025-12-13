/**
 * Security configuration
 * Contains authentication, session, and rate limiting settings
 */
export const securityConfig = {
  sessionSecret: process.env.SESSION_SECRET || "your-secret-key-change-this",
  
  // Rate limiting configuration
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || "900000", 10), // 15 minutes
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || "100", 10),
  },
} as const;
