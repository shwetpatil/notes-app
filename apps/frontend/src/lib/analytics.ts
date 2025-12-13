/**
 * Analytics Service
 * 
 * Integrates with Google Analytics 4 and custom analytics endpoints
 * Provides event tracking, user properties, and conversion tracking
 */

import { apiLogger } from './logger';

export interface AnalyticsEvent {
  category: string;
  action: string;
  label?: string;
  value?: number;
  custom Properties?: Record<string, any>;
}

export interface UserProperties {
  userId?: string;
  email?: string;
  plan?: string;
  signupDate?: string;
  [key: string]: any;
}

class AnalyticsService {
  private isEnabled: boolean;
  private debug: boolean;
  private gtag: any;

  constructor() {
    this.isEnabled = process.env.NODE_ENV === 'production' && typeof window !== 'undefined';
    this.debug = process.env.NODE_ENV === 'development';
    this.gtag = typeof window !== 'undefined' ? (window as any).gtag : null;
  }

  /**
   * Initialize Google Analytics
   */
  initialize(measurementId: string) {
    if (typeof window === 'undefined') return;

    // Load Google Analytics script
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
    document.head.appendChild(script);

    // Initialize gtag
    (window as any).dataLayer = (window as any).dataLayer || [];
    this.gtag = function gtag(...args: any[]) {
      (window as any).dataLayer.push(args);
    };
    this.gtag('js', new Date());
    this.gtag('config', measurementId, {
      send_page_view: false, // We'll send manually
      cookie_flags: 'SameSite=None;Secure',
    });

    apiLogger.success('✅ Google Analytics initialized', { measurementId });
  }

  /**
   * Track a page view
   */
  trackPageView(path: string, title?: string) {
    if (!this.isEnabled || !this.gtag) {
      if (this.debug) {
        apiLogger.info('📊 [Debug] Page view:', { path, title });
      }
      return;
    }

    this.gtag('event', 'page_view', {
      page_path: path,
      page_title: title || document.title,
    });

    apiLogger.info('📊 Page view tracked', { path, title });
  }

  /**
   * Track a custom event
   */
  trackEvent(event: AnalyticsEvent) {
    if (!this.isEnabled || !this.gtag) {
      if (this.debug) {
        apiLogger.info('📊 [Debug] Event:', event);
      }
      return;
    }

    const { category, action, label, value, customProperties } = event;

    this.gtag('event', action, {
      event_category: category,
      event_label: label,
      value: value,
      ...customProperties,
    });

    apiLogger.info('📊 Event tracked', { category, action, label });
  }

  /**
   * Track note events
   */
  trackNoteEvent(action: 'create' | 'update' | 'delete' | 'favorite' | 'archive' | 'trash', noteId?: string) {
    this.trackEvent({
      category: 'Notes',
      action: `note_${action}`,
      label: noteId,
    });
  }

  /**
   * Track template events
   */
  trackTemplateEvent(action: 'create' | 'use' | 'delete', templateId?: string) {
    this.trackEvent({
      category: 'Templates',
      action: `template_${action}`,
      label: templateId,
    });
  }

  /**
   * Track authentication events
   */
  trackAuthEvent(action: 'login' | 'logout' | 'register' | 'login_failed') {
    this.trackEvent({
      category: 'Authentication',
      action,
    });
  }

  /**
   * Track search events
   */
  trackSearchEvent(query: string, resultsCount: number) {
    this.trackEvent({
      category: 'Search',
      action: 'search_query',
      label: query,
      value: resultsCount,
    });
  }

  /**
   * Track export events
   */
  trackExportEvent(format: string, noteId?: string) {
    this.trackEvent({
      category: 'Export',
      action: 'export_note',
      label: format,
      customProperties: { note_id: noteId },
    });
  }

  /**
   * Track API performance
   */
  trackAPIPerformance(endpoint: string, duration: number, status: number) {
    if (!this.isEnabled || !this.gtag) {
      if (this.debug) {
        apiLogger.info('📊 [Debug] API Performance:', { endpoint, duration, status });
      }
      return;
    }

    this.gtag('event', 'api_performance', {
      event_category: 'Performance',
      endpoint,
      duration_ms: duration,
      status_code: status,
    });
  }

  /**
   * Track Web Vitals
   */
  trackWebVital(name: string, value: number, id: string) {
    if (!this.isEnabled || !this.gtag) return;

    this.gtag('event', name, {
      event_category: 'Web Vitals',
      value: Math.round(name === 'CLS' ? value * 1000 : value),
      metric_id: id,
      non_interaction: true,
    });

    apiLogger.info('📊 Web Vital tracked', { name, value });
  }

  /**
   * Track user timing (custom performance metrics)
   */
  trackTiming(category: string, variable: string, value: number, label?: string) {
    if (!this.isEnabled || !this.gtag) return;

    this.gtag('event', 'timing_complete', {
      event_category: category,
      name: variable,
      value: Math.round(value),
      event_label: label,
    });
  }

  /**
   * Track errors
   */
  trackError(error: Error, fatal: boolean = false) {
    if (!this.isEnabled || !this.gtag) {
      if (this.debug) {
        apiLogger.error('📊 [Debug] Error:', { error: error.message, fatal });
      }
      return;
    }

    this.gtag('event', 'exception', {
      description: error.message,
      fatal,
    });

    apiLogger.error('📊 Error tracked', { error: error.message, fatal });
  }

  /**
   * Set user properties
   */
  setUserProperties(properties: UserProperties) {
    if (!this.isEnabled || !this.gtag) {
      if (this.debug) {
        apiLogger.info('📊 [Debug] User properties:', properties);
      }
      return;
    }

    this.gtag('set', 'user_properties', properties);
    apiLogger.info('📊 User properties set', properties);
  }

  /**
   * Set user ID for tracking across sessions
   */
  setUserId(userId: string) {
    if (!this.isEnabled || !this.gtag) return;

    this.gtag('config', { user_id: userId });
    apiLogger.info('📊 User ID set', { userId });
  }

  /**
   * Track conversion events
   */
  trackConversion(conversionId: string, value?: number, currency: string = 'USD') {
    if (!this.isEnabled || !this.gtag) return;

    this.gtag('event', 'conversion', {
      send_to: conversionId,
      value,
      currency,
    });
  }
}

export const analyticsService = new AnalyticsService();

// Export convenience functions
export const trackPageView = analyticsService.trackPageView.bind(analyticsService);
export const trackEvent = analyticsService.trackEvent.bind(analyticsService);
export const trackNoteEvent = analyticsService.trackNoteEvent.bind(analyticsService);
export const trackTemplateEvent = analyticsService.trackTemplateEvent.bind(analyticsService);
export const trackAuthEvent = analyticsService.trackAuthEvent.bind(analyticsService);
export const trackSearchEvent = analyticsService.trackSearchEvent.bind(analyticsService);
export const trackExportEvent = analyticsService.trackExportEvent.bind(analyticsService);
export const trackWebVital = analyticsService.trackWebVital.bind(analyticsService);
export const trackError = analyticsService.trackError.bind(analyticsService);
