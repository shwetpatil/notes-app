// Shared monitoring types for frontend and backend
export interface CoreWebVitals {
  // Largest Contentful Paint
  LCP?: number;
  // First Input Delay (deprecated in favor of INP)
  FID?: number;
  // Cumulative Layout Shift
  CLS?: number;
  // Time to First Byte
  TTFB?: number;
  // Interaction to Next Paint (replaces FID)
  INP?: number;
  // First Contentful Paint
  FCP?: number;
}

export interface PerformanceMetric {
  name: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  delta?: number;
  id?: string;
  navigationType?: string;
}

export interface MonitoringEvent {
  type: 'performance' | 'error' | 'user-action' | 'api-call';
  timestamp: number;
  sessionId: string;
  userId?: string;
  tags: Record<string, string>;
  data: Record<string, any>;
}

export interface APIMetrics {
  method: string;
  path: string;
  statusCode: number;
  duration: number;
  timestamp: number;
  tags?: Record<string, string>;
  error?: string;
}

export interface SystemMetrics {
  cpu: number;
  memory: {
    used: number;
    total: number;
    percentage: number;
  };
  timestamp: number;
  workerId?: number;
  tags?: Record<string, string>;
}

export interface ErrorLog {
  message: string;
  stack?: string;
  level: 'error' | 'warn' | 'info';
  timestamp: number;
  context?: Record<string, any>;
  tags?: Record<string, string>;
}

export interface UserActionMetric {
  action: string;
  target?: string;
  duration?: number;
  timestamp: number;
  tags?: Record<string, string>;
}
