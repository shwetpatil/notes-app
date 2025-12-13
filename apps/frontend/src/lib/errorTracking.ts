'use client';

import { useEffect } from 'react';
import { logger, logError } from './logger';

/**
 * Client-side error boundary and global error handler
 */
export function useErrorTracking() {
  useEffect(() => {
    // Track unhandled promise rejections
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      logError('❌ Unhandled Promise Rejection', event.reason);
      
      // In production, send to error tracking service
      if (process.env.NODE_ENV === 'production') {
        // Example: Sentry.captureException(event.reason);
      }
    };

    // Track global errors
    const handleError = (event: ErrorEvent) => {
      logError('❌ Global Error', event.error);
      
      // In production, send to error tracking service
      if (process.env.NODE_ENV === 'production') {
        // Example: Sentry.captureException(event.error);
      }
    };

    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    window.addEventListener('error', handleError);

    return () => {
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
      window.removeEventListener('error', handleError);
    };
  }, []);
}

/**
 * Track console errors (for development)
 */
export function setupConsoleErrorTracking() {
  if (typeof window === 'undefined') return;

  const originalError = console.error;
  console.error = (...args: any[]) => {
    originalError.apply(console, args);

    // Track in development
    if (process.env.NODE_ENV === 'development') {
      // Could send to local monitoring dashboard
    }
  };
}
