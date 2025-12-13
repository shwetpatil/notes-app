import * as Sentry from '@sentry/node';
import { ProfilingIntegration } from '@sentry/profiling-node';
import { appConfig } from './index';

export const initializeSentry = (app: any) => {
  // Only initialize Sentry in production or if explicitly enabled
  if (!process.env.SENTRY_DSN) {
    console.log('⚠️  Sentry DSN not configured - error tracking disabled');
    return;
  }

  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: appConfig.nodeEnv,
    integrations: [
      // Enable HTTP calls tracing
      new Sentry.Integrations.Http({ tracing: true }),
      // Enable Express.js middleware tracing
      new Sentry.Integrations.Express({ app }),
      // Enable profiling
      new ProfilingIntegration(),
    ],
    // Performance Monitoring
    tracesSampleRate: appConfig.isProduction ? 0.1 : 1.0, // 10% in production, 100% in dev
    // Profiling
    profilesSampleRate: appConfig.isProduction ? 0.1 : 1.0,
    
    // Don't send errors in test environment
    enabled: !appConfig.isTest,
    
    // Ignore specific errors
    ignoreErrors: [
      'ECONNRESET',
      'ENOTFOUND',
      'ETIMEDOUT',
      'ECONNREFUSED',
    ],
    
    // Scrub sensitive data
    beforeSend(event, hint) {
      // Remove sensitive headers
      if (event.request?.headers) {
        delete event.request.headers.cookie;
        delete event.request.headers.authorization;
      }
      
      // Remove sensitive query params
      if (event.request?.query_string && typeof event.request.query_string === 'string') {
        const sanitized = event.request.query_string
          .replace(/password=[^&]*/gi, 'password=[REDACTED]')
          .replace(/token=[^&]*/gi, 'token=[REDACTED]');
        event.request.query_string = sanitized;
      }
      
      return event;
    },
  });

  console.log('✅ Sentry error tracking initialized');
};

export const getSentryMiddleware = (): {
  requestHandler: ReturnType<typeof Sentry.Handlers.requestHandler>;
  tracingHandler: ReturnType<typeof Sentry.Handlers.tracingHandler>;
  errorHandler: ReturnType<typeof Sentry.Handlers.errorHandler>;
} => {
  return {
    requestHandler: Sentry.Handlers.requestHandler(),
    tracingHandler: Sentry.Handlers.tracingHandler(),
    errorHandler: Sentry.Handlers.errorHandler({
      shouldHandleError(error) {
        // Capture all errors with status >= 500
        return true;
      },
    }),
  };
};

// Helper to capture custom errors
export const captureError = (error: Error, context?: Record<string, any>) => {
  Sentry.captureException(error, {
    extra: context,
  });
};

// Helper to capture messages
export const captureMessage = (message: string, level: Sentry.SeverityLevel = 'info') => {
  Sentry.captureMessage(message, level);
};

// Helper to set user context
export const setUserContext = (user: { id: string; email?: string; username?: string }) => {
  Sentry.setUser(user);
};

// Helper to add breadcrumb
export const addBreadcrumb = (breadcrumb: Sentry.Breadcrumb) => {
  Sentry.addBreadcrumb(breadcrumb);
};

export default Sentry;
