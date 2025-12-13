# 🎯 Monitoring Quick Start

## Enable Monitoring

### Backend

Add to `.env`:
```env
ENABLE_PERFORMANCE_LOGGING=true
ENABLE_METRICS_COLLECTION=true
ENABLE_WEB_VITALS_LOGGING=true
```

### Frontend

Monitoring is automatically enabled in all pages via `MonitoringProvider`.

## View Metrics

### In Browser Console (Development)

```
🎯 [Web Vital] LCP: 1250ms (good)
🌐 [API] GET /api/notes: 145ms (200)
👆 [User Action] button-click on save-note
```

### Backend Console

```
📊 [Performance] GET /api/notes - 200 - 145ms (good)
🎯 [Web Vital] LCP: 1250ms (good) - navigation
```

### API Endpoints

```bash
# Get API metrics
curl http://localhost:3001/api/metrics

# Get system metrics
curl http://localhost:3001/api/metrics/system

# Reset metrics
curl -X POST http://localhost:3001/api/metrics/reset
```

## Add Metrics Dashboard to Your App

```tsx
import { MetricsDashboard } from '@/components/MetricsDashboard';

export default function Page() {
  return <MetricsDashboard />;
}
```

## Core Web Vitals Targets

| Metric | Good | Needs Improvement | Poor |
|--------|------|-------------------|------|
| LCP | ≤2.5s | 2.5-4s | >4s |
| FCP | ≤1.8s | 1.8-3s | >3s |
| CLS | ≤0.1 | 0.1-0.25 | >0.25 |
| TTFB | ≤800ms | 800-1800ms | >1800ms |
| INP | ≤200ms | 200-500ms | >500ms |

## Track Custom Events

```typescript
import { trackPerformance, trackUserAction } from '@/lib/monitoring';

// Performance timing
trackPerformance('operation-start');
// ... do work ...
trackPerformance('operation-end', 'operation-start');

// User actions
trackUserAction('button-click', 'save-note');
```

## Files

- **Full Guide**: [MONITORING.md](./MONITORING.md)
- **Frontend**: `apps/frontend/src/lib/monitoring.ts`
- **Backend**: `apps/backend/src/middleware/monitoring.ts`
- **Dashboard**: `apps/frontend/src/components/MetricsDashboard.tsx`

---

**Next**: See [MONITORING.md](./MONITORING.md) for complete documentation
