/**
 * Monitoring and performance configuration
 * Controls logging, metrics collection, and performance tracking
 */
export const monitoringConfig = {
  performanceLogging: process.env.ENABLE_PERFORMANCE_LOGGING === "true",
  metricsCollection: process.env.ENABLE_METRICS_COLLECTION === "true",
  webVitalsLogging: process.env.ENABLE_WEB_VITALS_LOGGING === "true",
  
  // Combined flag for any performance monitoring
  enabled:
    process.env.ENABLE_PERFORMANCE_LOGGING === "true" ||
    process.env.ENABLE_METRICS_COLLECTION === "true",
} as const;
