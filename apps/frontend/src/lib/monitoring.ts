'use client';

import { useEffect } from 'react';
import { logger, perfLogger, apiLogger, logPerformance } from './logger';

interface PerformanceMetric {
  name: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  delta?: number;
  id?: string;
  navigationType?: string;
}

interface MonitoringMetric {
  type: string;
  timestamp: number;
  [key: string]: any;
}

// Metrics buffer for batch sending
let metricsBuffer: MonitoringMetric[] = [];
const BATCH_SIZE = 10;
const BATCH_INTERVAL = 30000; // 30 seconds

/**
 * Send metrics to monitoring service in production
 * Batches metrics for efficiency and sends to Sentry or custom endpoint
 */
function sendMetricToMonitoring(metric: MonitoringMetric) {
  metricsBuffer.push(metric);
  
  // Send batch when buffer is full
  if (metricsBuffer.length >= BATCH_SIZE) {
    flushMetrics();
  }
}

/**
 * Flush all buffered metrics to monitoring service
 */
function flushMetrics() {
  if (metricsBuffer.length === 0) return;
  
  const metrics = [...metricsBuffer];
  metricsBuffer = [];
  
  // Send to Sentry as breadcrumbs or custom context
  if (typeof window !== 'undefined' && (window as any).Sentry) {
    const Sentry = (window as any).Sentry;
    
    metrics.forEach(metric => {
      Sentry.addBreadcrumb({
        category: 'performance',
        message: `${metric.type}: ${JSON.stringify(metric)}`,
        level: 'info',
        data: metric,
      });
    });
  }
  
  // Send to custom monitoring endpoint
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
  
  fetch(`${apiUrl}/api/metrics/batch`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ metrics }),
    keepalive: true,
  }).catch((error) => {
    // Silently fail in production
    if (process.env.NODE_ENV === 'development') {
      logger.error('Failed to send metrics batch', error);
    }
  });
}

// Flush metrics periodically
if (typeof window !== 'undefined') {
  setInterval(flushMetrics, BATCH_INTERVAL);
  
  // Flush on page unload
  window.addEventListener('beforeunload', flushMetrics);
  window.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      flushMetrics();
    }
  });
}

/**
 * Reports Core Web Vitals metrics to backend analytics endpoint
 * Silently fails in production to avoid disrupting user experience
 * 
 * @param {PerformanceMetric} metric - Web vital metric object
 * @param {string} metric.name - Metric name (CLS, FCP, LCP, TTFB, INP)
 * @param {number} metric.value - Metric value in milliseconds
 * @param {'good'|'needs-improvement'|'poor'} metric.rating - Performance rating
 * @param {number} [metric.delta] - Change since last measurement
 * @param {string} [metric.id] - Unique metric ID
 * @param {string} [metric.navigationType] - Navigation type (navigate, reload, etc.)
 * 
 * Behavior:
 * - Sends metrics to /api/metrics/vitals endpoint using keepalive
 * - Logs color-coded metrics in development console
 * - Fails silently in production
 * 
 * @example
 * reportWebVital({
 *   name: 'LCP',
 *   value: 1500,
 *   rating: 'good',
 *   delta: 50,
 *   id: 'v3-123',
 *   navigationType: 'navigate'
 * });
 */
function reportWebVital(metric: PerformanceMetric) {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
  
  // Send to backend
  fetch(`${apiUrl}/api/metrics/vitals`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(metric),
    keepalive: true, // Ensure request completes even if page unloads
  }).catch((error) => {
    // Silently fail in production
    if (process.env.NODE_ENV === 'development') {
      logger.error('Failed to report web vital', error);
    }
  });

  if (process.env.NODE_ENV === 'development') {
    const logFn = metric.rating === 'good' ? perfLogger.success : metric.rating === 'needs-improvement' ? perfLogger.warn : perfLogger.error;
    logFn(`🎯 Web Vital ${metric.name}: ${Math.round(metric.value)}ms`, { rating: metric.rating });
  }
}

/**
 * React hook to automatically track Core Web Vitals metrics
 * Monitors performance metrics recommended by Google for user experience
 * 
 * Tracked Metrics:
 * - **CLS** (Cumulative Layout Shift): Visual stability (target: < 0.1)
 * - **FCP** (First Contentful Paint): Loading performance (target: < 1.8s)
 * - **LCP** (Largest Contentful Paint): Loading performance (target: < 2.5s)
 * - **TTFB** (Time to First Byte): Server response time (target: < 600ms)
 * - **INP** (Interaction to Next Paint): Interactivity (target: < 200ms)
 * 
 * @hook
 * @returns {void} Sets up metric observers on mount, cleans up on unmount
 * 
 * Usage:
 * Place this hook in your root layout or _app component to track
 * metrics across your entire application
 * 
 * @example
 * // In app/layout.tsx or pages/_app.tsx:
 * 'use client';
 * import { useWebVitals } from '@/lib/monitoring';
 * 
 * export function RootLayout({ children }) {
 *   useWebVitals();
 *   return <html>{children}</html>;
 * }
 * 
 * @see https://web.dev/vitals/ - Google's Core Web Vitals documentation
 */
export function useWebVitals() {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Dynamically import web-vitals
    import('web-vitals').then(({ onCLS, onFCP, onLCP, onTTFB, onINP }) => {
      // Cumulative Layout Shift
      onCLS((metric: any) => {
        reportWebVital({
          name: 'CLS',
          value: metric.value,
          rating: metric.rating,
          delta: metric.delta,
          id: metric.id,
          navigationType: metric.navigationType,
        });
      });


      // First Contentful Paint
      onFCP((metric) => {
        reportWebVital({
          name: 'FCP',
          value: metric.value,
          rating: metric.rating,
          delta: metric.delta,
          id: metric.id,
          navigationType: metric.navigationType,
        });
      });

      // Largest Contentful Paint
      onLCP((metric: any) => {
        reportWebVital({
          name: 'LCP',
          value: metric.value,
          rating: metric.rating,
          delta: metric.delta,
          id: metric.id,
          navigationType: metric.navigationType,
        });
      });

      // Time to First Byte
      onTTFB((metric: any) => {
        reportWebVital({
          name: 'TTFB',
          value: metric.value,
          rating: metric.rating,
          delta: metric.delta,
          id: metric.id,
          navigationType: metric.navigationType,
        });
      });

      // Interaction to Next Paint (replaces FID)
      onINP((metric: any) => {
        reportWebVital({
          name: 'INP',
          value: metric.value,
          rating: metric.rating,
          delta: metric.delta,
          id: metric.id,
          navigationType: metric.navigationType,
        });
      });
    });
  }, []);
}

/**
 * Tracks custom performance metrics using Performance API
 * Creates marks and measures for timing critical operations
 * 
 * @param {string} name - Name of the performance mark or measure
 * @param {string} [startMark] - Optional start mark name for measuring duration
 * @returns {void}
 * 
 * Behavior:
 * - If startMark provided: Creates a measure from startMark to now
 * - If no startMark: Creates a performance mark at current time
 * - Logs duration to console in development
 * - Fails silently if Performance API unavailable
 * 
 * @example
 * // Mark start of operation:
 * trackPerformance('data-fetch-start');
 * 
 * // ... perform operation ...
 * await fetchData();
 * 
 * // Measure duration:
 * trackPerformance('data-fetch-complete', 'data-fetch-start');
 * // Console: "⏱️  [Performance] data-fetch-complete: 145ms"
 * 
 * @example
 * // Track component render:
 * useEffect(() => {
 *   trackPerformance('component-mounted');
 * }, []);
 */
export function trackPerformance(name: string, startMark?: string) {
  if (typeof window === 'undefined' || !window.performance) return;

  try {
    if (startMark && performance.getEntriesByName(startMark).length > 0) {
      performance.measure(name, startMark);
      const measure = performance.getEntriesByName(name, 'measure')[0];
      
      if (measure) {
        logPerformance(name, measure.duration);
      }
    } else {
      performance.mark(name);
    }
  } catch (error) {
    // Silently fail
  }
}

/**
 * Tracks user interactions for analytics and debugging
 * Logs actions in development, can be extended for production analytics
 * 
 * @param {string} action - Description of the user action (e.g., 'button-click', 'form-submit')
 * @param {string} [target] - Optional target element or identifier
 * @returns {void}
 * 
 * @example
 * // Track button click:
 * <button onClick={() => trackUserAction('create-note-click', 'main-toolbar')}>
 *   Create Note
 * </button>
 * 
 * @example
 * // Track form submission:
 * const handleSubmit = (e) => {
 *   trackUserAction('login-form-submit');
 *   // ... submit logic
 * };
 * 
 * Integrated with analytics service for production monitoring
 */
export function trackUserAction(action: string, target?: string) {
  if (process.env.NODE_ENV === 'development') {
    logger.debug({ action, target }, '👆 User action');
  }

  // Send to analytics service
  if (typeof window !== 'undefined') {
    import('./analytics').then(({ trackEvent }) => {
      trackEvent({
        category: 'User Action',
        action,
        label: target,
      });
    }).catch(() => {
      // Silent fail - don't break app if analytics unavailable
    });
  }

  // Production: Aggregate metrics
  if (process.env.NODE_ENV === 'production') {
    sendMetricToMonitoring({
      type: 'user_action',
      action,
      target,
      timestamp: Date.now(),
    });
  }
}

/**
 * Monitors API call performance with automatic rating
 * Color-coded logging in development, aggregation ready for production
 * 
 * @param {string} method - HTTP method (GET, POST, PATCH, DELETE, etc.)
 * @param {string} endpoint - API endpoint URL
 * @param {number} duration - Request duration in milliseconds
 * @param {number} status - HTTP response status code
 * @returns {void}
 * 
 * Performance Ratings:
 * - **good**: < 300ms (green)
 * - **needs-improvement**: 300-1000ms (orange)
 * - **poor**: > 1000ms (red)
 * 
 * Automatically called by axios interceptor in api.ts
 * 
 * @example
 * // Manual tracking (usually done by interceptor):
 * const startTime = Date.now();
 * const response = await fetch('/api/notes');
 * trackAPICall('GET', '/api/notes', Date.now() - startTime, response.status);
 * // Console: "🌐 [API] GET /api/notes: 145ms (200)" in green
 * 
 * Metrics are aggregated and sent to monitoring service in production
 */
export function trackAPICall(
  method: string,
  endpoint: string,
  duration: number,
  status: number
) {
  const rating = duration < 300 ? 'good' : duration < 1000 ? 'needs-improvement' : 'poor';
  
  if (process.env.NODE_ENV === 'development') {
    const logFn = rating === 'good' ? apiLogger.success : rating === 'needs-improvement' ? apiLogger.warn : apiLogger.error;
    logFn(`🌐 ${method} ${endpoint}`, { duration: `${duration}ms`, status, rating });
  }

  // Production: Send to monitoring service
  if (process.env.NODE_ENV === 'production') {
    sendMetricToMonitoring({
      type: 'api_call',
      method,
      endpoint,
      duration,
      status,
      rating,
      timestamp: Date.now(),
    });
    
    // Track in analytics
    import('./analytics').then(({ analyticsService }) => {
      analyticsService.trackAPIPerformance(endpoint, duration, status === 200);
    }).catch(() => {
      // Silent fail - don't break app if analytics unavailable
    });
  }
}
