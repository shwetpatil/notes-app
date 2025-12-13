# Monitoring & Performance Tracking

Comprehensive monitoring implementation for frontend and backend with Core Web Vitals tracking.

## 📊 Overview

This monitoring solution provides:
- **Core Web Vitals**: LCP, FCP, CLS, TTFB, INP tracking
- **API Performance**: Request duration, status codes, endpoint metrics
- **System Metrics**: CPU, memory, process monitoring
- **Error Tracking**: Global error handling and logging
- **User Actions**: Interaction tracking

## Frontend Monitoring

### Core Web Vitals

The following metrics are automatically tracked:

| Metric | Name | Description | Good | Needs Improvement | Poor |
|--------|------|-------------|------|-------------------|------|
| **LCP** | Largest Contentful Paint | Loading performance | ≤2.5s | 2.5-4s | >4s |
| **FCP** | First Contentful Paint | Loading speed | ≤1.8s | 1.8-3s | >3s |
| **CLS** | Cumulative Layout Shift | Visual stability | ≤0.1 | 0.1-0.25 | >0.25 |
| **TTFB** | Time to First Byte | Server response | ≤800ms | 800-1800ms | >1800ms |
| **INP** | Interaction to Next Paint | Responsiveness | ≤200ms | 200-500ms | >500ms |

### Implementation

#### 1. Automatic Tracking

Core Web Vitals are automatically tracked in all pages:

```tsx
// Already integrated in layout.tsx
import { MonitoringProvider } from '@/components/MonitoringProvider';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <MonitoringProvider>
          {children}
        </MonitoringProvider>
      </body>
    </html>
  );
}
```

#### 2. Manual Performance Tracking

Track custom performance metrics:

```tsx
import { trackPerformance, trackUserAction } from '@/lib/monitoring';

// Start a performance mark
trackPerformance('data-fetch-start');

// ... perform operation ...

// End and measure
trackPerformance('data-fetch-complete', 'data-fetch-start');

// Track user interactions
trackUserAction('button-click', 'save-note');
```

#### 3. API Call Tracking

API calls are automatically tracked via axios interceptors:

```typescript
// Automatically tracks:
// - Request duration
// - Response status
// - Endpoint
// - Method

// Example output:
// 🌐 [API] GET /api/notes: 145ms (200)
```

### Error Tracking

Global error tracking is automatically enabled:

```tsx
// Tracks:
// - Unhandled promise rejections
// - Global JavaScript errors
// - Console errors (in development)

// In production, integrate with error tracking services:
// - Sentry
// - Rollbar
// - Bugsnag
```

## Backend Monitoring

### Performance Middleware

Request/response metrics are tracked automatically:

```typescript
// Tracked metrics:
// - Request duration
// - Status code
// - Endpoint
// - CPU usage per request
// - Worker ID (in cluster mode)

// Enable in .env:
ENABLE_PERFORMANCE_LOGGING=true
ENABLE_METRICS_COLLECTION=true
```

### Metrics Endpoints

#### GET /api/metrics

Get aggregated API performance metrics:

```bash
curl http://localhost:3001/api/metrics
```

Response:
```json
{
  "totalRequests": 1250,
  "avgDuration": 145,
  "maxDuration": 2340,
  "minDuration": 12,
  "percentiles": {
    "p50": 120,
    "p95": 450,
    "p99": 890
  },
  "statusCodes": {
    "200": 1100,
    "404": 50,
    "500": 5
  },
  "paths": {
    "/api/notes": 800,
    "/api/auth/login": 150
  }
}
```

#### GET /api/metrics/system

Get system resource metrics:

```bash
curl http://localhost:3001/api/metrics/system
```

Response:
```json
{
  "memory": {
    "total": 16384,
    "used": 8192,
    "free": 8192,
    "percentage": 50
  },
  "cpu": {
    "count": 8,
    "model": "Apple M1",
    "loadAverage": {
      "1min": 2.5,
      "5min": 2.1,
      "15min": 1.8
    }
  },
  "process": {
    "pid": 12345,
    "uptime": 3600,
    "memoryUsage": {
      "rss": 256,
      "heapUsed": 128,
      "heapTotal": 200,
      "external": 10
    }
  }
}
```

#### POST /api/metrics/vitals

Receive Core Web Vitals from frontend:

```bash
curl -X POST http://localhost:3001/api/metrics/vitals \
  -H "Content-Type: application/json" \
  -d '{
    "name": "LCP",
    "value": 1250,
    "rating": "good",
    "id": "v3-1234567890",
    "navigationType": "navigate"
  }'
```

## Configuration

### Backend Environment Variables

```env
# Enable performance logging to console
ENABLE_PERFORMANCE_LOGGING=true

# Enable metrics collection in memory
ENABLE_METRICS_COLLECTION=true

# Enable Web Vitals logging
ENABLE_WEB_VITALS_LOGGING=true
```

### Frontend Environment Variables

```env
# Backend API URL for sending metrics
NEXT_PUBLIC_API_URL=http://localhost:3001
```

## Metrics Dashboard

View real-time metrics in the UI:

```tsx
import { MetricsDashboard } from '@/components/MetricsDashboard';

export default function AdminPage() {
  return (
    <div>
      <h1>Server Metrics</h1>
      <MetricsDashboard />
    </div>
  );
}
```

The dashboard shows:
- Memory usage with visual indicators
- CPU load average
- Process information
- API performance metrics
- Status code distribution
- Request counts per endpoint

## Console Output

### Development Mode

#### Frontend

```
🎯 [Web Vital] LCP: 1250ms (good)
🎯 [Web Vital] FCP: 850ms (good)
🎯 [Web Vital] CLS: 0.05 (good)
🌐 [API] GET /api/notes: 145ms (200)
👆 [User Action] button-click on save-note
```

#### Backend

```
📊 [Performance] GET /api/notes - 200 - 145ms (good)
📊 [Performance] POST /api/auth/login - 200 - 230ms (needs-improvement)
⚠️  [Slow Request] GET /api/notes/search took 1250ms
   CPU: user=50000μs, system=10000μs
🎯 [Web Vital] LCP: 1250ms (good) - navigation
```

## Performance Ratings

Requests are automatically rated:

- **Good**: < 100ms (green)
- **Needs Improvement**: 100-300ms (yellow)
- **Poor**: > 300ms (red)

Slow requests (>1000ms) automatically log CPU usage details.

## Integration with Monitoring Services

### Production Recommendations

#### Frontend

**Vercel Analytics** (if deploying to Vercel):
```tsx
import { Analytics } from '@vercel/analytics/react';

export default function RootLayout({ children }) {
  return (
    <>
      {children}
      <Analytics />
    </>
  );
}
```

**Sentry** (error tracking):
```typescript
// In monitoring.ts
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 1.0,
});
```

**Google Analytics 4**:
```typescript
// Send Web Vitals to GA4
function reportWebVital(metric: PerformanceMetric) {
  if (window.gtag) {
    window.gtag('event', metric.name, {
      value: Math.round(metric.value),
      metric_rating: metric.rating,
      metric_delta: metric.delta,
    });
  }
}
```

#### Backend

**DataDog**:
```typescript
import { StatsD } from 'node-dogstatsd';

const dogstatsd = new StatsD();

function logMetrics(metrics: APIMetrics) {
  dogstatsd.timing('api.duration', metrics.duration, {
    method: metrics.method,
    path: metrics.path,
    status: metrics.statusCode.toString(),
  });
}
```

**New Relic**:
```typescript
import newrelic from 'newrelic';

function logMetrics(metrics: APIMetrics) {
  newrelic.recordMetric('API/Duration', metrics.duration);
  newrelic.recordMetric(`API/Status/${metrics.statusCode}`, 1);
}
```

**Prometheus**:
```typescript
import { Counter, Histogram } from 'prom-client';

const httpRequestDuration = new Histogram({
  name: 'http_request_duration_ms',
  help: 'Duration of HTTP requests in ms',
  labelNames: ['method', 'route', 'status_code'],
});

function logMetrics(metrics: APIMetrics) {
  httpRequestDuration
    .labels(metrics.method, metrics.path, metrics.statusCode.toString())
    .observe(metrics.duration);
}
```

## Monitoring Best Practices

### 1. Set Baselines

Establish performance baselines for your application:

```typescript
const PERFORMANCE_BASELINES = {
  LCP: 2500, // 2.5s
  FCP: 1800, // 1.8s
  CLS: 0.1,
  TTFB: 800, // 800ms
  INP: 200, // 200ms
  API_AVG: 200, // 200ms
  API_P95: 500, // 500ms
};
```

### 2. Set Alerts

Configure alerts for performance degradation:

```typescript
if (metrics.avgDuration > PERFORMANCE_BASELINES.API_AVG * 1.5) {
  // Alert: API performance degraded
  sendAlert('API performance degraded', metrics);
}

if (systemMetrics.memory.percentage > 85) {
  // Alert: High memory usage
  sendAlert('High memory usage', systemMetrics);
}
```

### 3. Regular Review

- Review metrics weekly
- Identify slow endpoints
- Monitor error rates
- Track memory leaks
- Optimize slow queries

### 4. A/B Testing

Track metrics during feature rollouts:

```typescript
trackPerformance('feature-new-editor', {
  variant: 'A',
  duration: 1250,
});
```

## Troubleshooting

### High LCP

- Optimize images (use Next.js Image component)
- Lazy load below-the-fold content
- Reduce render-blocking resources
- Use CDN for static assets

### High CLS

- Set explicit dimensions for images/videos
- Avoid inserting content above existing content
- Use CSS aspect-ratio
- Preload fonts

### High API Duration

- Check database query performance
- Add caching layer (Redis)
- Optimize database indexes
- Review N+1 query problems

### High Memory Usage

- Check for memory leaks
- Increase heap size
- Reduce worker count
- Review caching strategies

## Files Created

### Frontend
- `src/lib/monitoring.ts` - Core Web Vitals tracking
- `src/lib/errorTracking.ts` - Error tracking utilities
- `src/components/MonitoringProvider.tsx` - Monitoring wrapper
- `src/components/MetricsDashboard.tsx` - Metrics UI

### Backend
- `src/middleware/monitoring.ts` - Performance middleware
- `src/routes/metrics.ts` - Metrics API endpoints

### Shared
- `packages/types/src/monitoring.ts` - Monitoring types

## Testing Monitoring

### Frontend

```bash
# Start frontend in development
cd apps/frontend
pnpm dev

# Open browser console
# Navigate through the app
# Check for Web Vitals logs
```

### Backend

```bash
# Start backend with monitoring enabled
cd apps/backend
ENABLE_PERFORMANCE_LOGGING=true \
ENABLE_METRICS_COLLECTION=true \
ENABLE_WEB_VITALS_LOGGING=true \
pnpm dev

# Make API requests
curl http://localhost:3001/api/health

# View metrics
curl http://localhost:3001/api/metrics
curl http://localhost:3001/api/metrics/system
```

## Next Steps

1. ✅ Monitor application in development
2. ✅ Review console logs for Web Vitals
3. ✅ Check API performance metrics
4. ✅ Test error tracking
5. ⏭️ Integrate with production monitoring service
6. ⏭️ Set up alerts and dashboards
7. ⏭️ Configure performance budgets
8. ⏭️ Regular performance audits

---

**Note**: Metrics are stored in memory by default. In production, integrate with proper monitoring services like DataDog, New Relic, or Prometheus for persistent storage and advanced analytics.
