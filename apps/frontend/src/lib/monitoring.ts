'use client';

import { useEffect } from 'react';

interface PerformanceMetric {
  name: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  delta?: number;
  id?: string;
  navigationType?: string;
}

/**
 * Report Core Web Vitals to analytics endpoint
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
      console.error('Failed to report web vital:', error);
    }
  });

  // Log in development
  if (process.env.NODE_ENV === 'development') {
    const color = metric.rating === 'good' ? 'green' : metric.rating === 'needs-improvement' ? 'orange' : 'red';
    console.log(
      `%c🎯 [Web Vital] ${metric.name}: ${Math.round(metric.value)}ms (${metric.rating})`,
      `color: ${color}; font-weight: bold;`
    );
  }
}

/**
 * Hook to track Core Web Vitals
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
 * Track custom performance marks
 */
export function trackPerformance(name: string, startMark?: string) {
  if (typeof window === 'undefined' || !window.performance) return;

  try {
    if (startMark && performance.getEntriesByName(startMark).length > 0) {
      performance.measure(name, startMark);
      const measure = performance.getEntriesByName(name, 'measure')[0];
      
      if (measure) {
        console.log(`⏱️  [Performance] ${name}: ${Math.round(measure.duration)}ms`);
      }
    } else {
      performance.mark(name);
    }
  } catch (error) {
    // Silently fail
  }
}

/**
 * Track user interactions
 */
export function trackUserAction(action: string, target?: string) {
  if (process.env.NODE_ENV === 'development') {
    console.log(`👆 [User Action] ${action}${target ? ` on ${target}` : ''}`);
  }

  // In production, send to analytics service
  // Example: analytics.track(action, { target });
}

/**
 * Monitor API call performance
 */
export function trackAPICall(
  method: string,
  endpoint: string,
  duration: number,
  status: number
) {
  const rating = duration < 300 ? 'good' : duration < 1000 ? 'needs-improvement' : 'poor';
  
  if (process.env.NODE_ENV === 'development') {
    const color = rating === 'good' ? 'green' : rating === 'needs-improvement' ? 'orange' : 'red';
    console.log(
      `%c🌐 [API] ${method} ${endpoint}: ${duration}ms (${status})`,
      `color: ${color};`
    );
  }

  // In production, aggregate and send to monitoring service
}
