import { Request, Response, NextFunction } from "express";
import { APIMetrics } from "@notes/types";
import { logger } from "../config";

interface RequestTiming {
  startTime: number;
  startCpuUsage: NodeJS.CpuUsage;
}

// Store request timings
const requestTimings = new WeakMap<Request, RequestTiming>();

/**
 * Performance monitoring middleware for Express routes
 * Tracks request timing, CPU usage, and response metrics
 * 
 * @middleware
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next middleware function
 * @returns {void}
 * 
 * Metrics Collected:
 * - Request duration (milliseconds)
 * - HTTP method and path
 * - Response status code
 * - CPU usage (user + system time)
 * - Error messages for failed requests
 * - Request tags (environment, worker ID, route)
 * 
 * Performance Ratings:
 * - **good**: < 100ms
 * - **needs-improvement**: 100-300ms
 * - **poor**: > 300ms
 * 
 * Features:
 * - Color-coded console logging in development
 * - Slow request warnings (> 1000ms)
 * - Error request logging (5xx status codes)
 * - In-memory metrics storage for aggregation
 * - Configurable via environment variables
 * 
 * Environment Variables:
 * - ENABLE_PERFORMANCE_LOGGING: Enable detailed console logs
 * - ENABLE_METRICS_COLLECTION: Store metrics for aggregation
 * 
 * @example
 * // Add to Express app:
 * import { performanceMonitoring } from './middleware/monitoring';
 * app.use(performanceMonitoring);
 * 
 * @see getAggregatedMetrics() for retrieving collected metrics
 */
export function performanceMonitoring(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const startTime = Date.now();
  const startCpuUsage = process.cpuUsage();

  // Store timing info
  requestTimings.set(req, { startTime, startCpuUsage });

  // Capture original end function
  const originalEnd = res.end;

  // Override end function to log metrics
  res.end = function (this: Response, ...args: any[]): Response {
    const timing = requestTimings.get(req);
    if (timing) {
      const duration = Date.now() - timing.startTime;
      const cpuUsage = process.cpuUsage(timing.startCpuUsage);

      // Build metrics
      const metrics: APIMetrics = {
        method: req.method,
        path: req.route?.path || req.path,
        statusCode: res.statusCode,
        duration,
        timestamp: Date.now(),
        tags: {
          environment: process.env.NODE_ENV || "development",
          workerId: process.pid.toString(),
          method: req.method,
          statusClass: `${Math.floor(res.statusCode / 100)}xx`,
          route: req.route?.path || "unknown",
        },
      };

      // Add error info if present
      if (res.statusCode >= 400) {
        metrics.error = res.statusMessage || "Unknown error";
      }

      logMetrics(metrics, cpuUsage);

      // Clean up
      requestTimings.delete(req);
    }

    // Call original end
    return originalEnd.apply(this, args as any) as any;
  };

  next();
}

/**
 * Logs request metrics to console and stores for aggregation
 * Color-codes output based on performance rating
 * 
 * @private
 * @param {APIMetrics} metrics - Request metrics object
 * @param {NodeJS.CpuUsage} cpuUsage - CPU usage statistics
 * @returns {void}
 * 
 * Logging Behavior:
 * - Green: Fast requests (< 100ms)
 * - Yellow: Moderate requests (100-300ms)
 * - Red: Slow requests (> 300ms)
 * - Warns on slow requests > 1000ms with CPU details
 * - Logs server errors (5xx) separately
 */
function logMetrics(metrics: APIMetrics, cpuUsage: NodeJS.CpuUsage) {
  // Calculate rating
  const rating =
    metrics.duration < 100
      ? "good"
      : metrics.duration < 300
      ? "needs-improvement"
      : "poor";

  // Color code by rating
  const color =
    rating === "good" ? "\x1b[32m" : rating === "needs-improvement" ? "\x1b[33m" : "\x1b[31m";
  const reset = "\x1b[0m";

  // Detailed logging
  if (process.env.ENABLE_PERFORMANCE_LOGGING === "true") {
    logger.debug({
      method: metrics.method,
      path: metrics.path,
      statusCode: metrics.statusCode,
      duration: metrics.duration,
      rating
    }, `📊 Performance: ${metrics.method} ${metrics.path}`);

    if (metrics.duration > 1000) {
      logger.warn({
        method: metrics.method,
        path: metrics.path,
        duration: metrics.duration,
        cpuUser: cpuUsage.user,
        cpuSystem: cpuUsage.system
      }, '⚠️  Slow request detected');
    }

    if (metrics.statusCode >= 500) {
      logger.error({
        method: metrics.method,
        path: metrics.path,
        statusCode: metrics.statusCode,
        error: metrics.error
      }, '❌ Server error');
    }
  }

  // Store metrics for aggregation (in production, send to monitoring service)
  if (process.env.ENABLE_METRICS_COLLECTION === "true") {
    storeMetric(metrics);
  }
}

/**
 * In-memory metrics storage (replace with proper monitoring service in production)
 */
const metricsStore: APIMetrics[] = [];
const MAX_METRICS = 1000;

function storeMetric(metric: APIMetrics) {
  metricsStore.push(metric);

  // Keep only recent metrics
  if (metricsStore.length > MAX_METRICS) {
    metricsStore.shift();
  }
}

/**
 * Retrieves aggregated performance metrics from in-memory store
 * Calculates statistical analysis of recent requests
 * 
 * @returns {Object|null} Aggregated metrics or null if no data
 * @returns {number} return.totalRequests - Total requests tracked
 * @returns {number} return.avgDuration - Average response time (ms)
 * @returns {number} return.maxDuration - Slowest response time (ms)
 * @returns {number} return.minDuration - Fastest response time (ms)
 * @returns {Object} return.percentiles - Response time percentiles
 * @returns {number} return.percentiles.p50 - 50th percentile (median)
 * @returns {number} return.percentiles.p95 - 95th percentile
 * @returns {number} return.percentiles.p99 - 99th percentile
 * @returns {Record<number, number>} return.statusCodes - Count by status code
 * @returns {Record<string, number>} return.paths - Request count by path
 * @returns {number} return.timestamp - Metrics generation timestamp
 * 
 * @example
 * const metrics = getAggregatedMetrics();
 * console.log(`Average response: ${metrics.avgDuration}ms`);
 * console.log(`95th percentile: ${metrics.percentiles.p95}ms`);
 * console.log(`Status codes:`, metrics.statusCodes);
 * 
 * @example
 * // Use in metrics endpoint:
 * router.get('/api/metrics', (req, res) => {
 *   const metrics = getAggregatedMetrics();
 *   res.json({ success: true, data: metrics });
 * });
 */
export function getAggregatedMetrics() {
  if (metricsStore.length === 0) {
    return null;
  }

  const totalRequests = metricsStore.length;
  const avgDuration =
    metricsStore.reduce((sum, m) => sum + m.duration, 0) / totalRequests;
  const maxDuration = Math.max(...metricsStore.map((m) => m.duration));
  const minDuration = Math.min(...metricsStore.map((m) => m.duration));

  // Calculate percentiles
  const sorted = [...metricsStore].sort((a, b) => a.duration - b.duration);
  const p50 = sorted[Math.floor(sorted.length * 0.5)]?.duration || 0;
  const p95 = sorted[Math.floor(sorted.length * 0.95)]?.duration || 0;
  const p99 = sorted[Math.floor(sorted.length * 0.99)]?.duration || 0;

  // Group by status code
  const statusCodes = metricsStore.reduce((acc, m) => {
    acc[m.statusCode] = (acc[m.statusCode] || 0) + 1;
    return acc;
  }, {} as Record<number, number>);

  // Group by path
  const paths = metricsStore.reduce((acc, m) => {
    acc[m.path] = (acc[m.path] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return {
    totalRequests,
    avgDuration: Math.round(avgDuration),
    maxDuration,
    minDuration,
    percentiles: {
      p50: Math.round(p50),
      p95: Math.round(p95),
      p99: Math.round(p99),
    },
    statusCodes,
    paths,
    timestamp: Date.now(),
  };
}

/**
 * Clears all stored metrics from memory
 * Useful for testing or periodic resets
 * 
 * @returns {void}
 * 
 * @example
 * // Reset metrics after aggregation:
 * const metrics = getAggregatedMetrics();
 * await sendToMonitoringService(metrics);
 * resetMetrics(); // Clear for next period
 */
export function resetMetrics() {
  metricsStore.length = 0;
}
