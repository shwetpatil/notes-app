import { Request, Response, NextFunction } from "express";
import { APIMetrics } from "@notes/types";

interface RequestTiming {
  startTime: number;
  startCpuUsage: NodeJS.CpuUsage;
}

// Store request timings
const requestTimings = new WeakMap<Request, RequestTiming>();

/**
 * Performance monitoring middleware
 * Tracks request duration, response size, and tags requests
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

      // Log metrics
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
 * Log metrics to console or monitoring service
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
    console.log(
      `${color}📊 [Performance]${reset} ${metrics.method} ${metrics.path} - ${metrics.statusCode} - ${metrics.duration}ms (${rating})`
    );

    // Log slow requests
    if (metrics.duration > 1000) {
      console.warn(
        `⚠️  [Slow Request] ${metrics.method} ${metrics.path} took ${metrics.duration}ms`
      );
      console.warn(`   CPU: user=${cpuUsage.user}μs, system=${cpuUsage.system}μs`);
    }

    // Log errors
    if (metrics.statusCode >= 500) {
      console.error(
        `❌ [Server Error] ${metrics.method} ${metrics.path} - ${metrics.statusCode}: ${metrics.error}`
      );
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
 * Get aggregated metrics
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
 * Reset metrics store
 */
export function resetMetrics() {
  metricsStore.length = 0;
}
