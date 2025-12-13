# Performance Monitoring Guide

**Purpose**: Monitor and optimize frontend performance metrics.

**Last Updated**: December 13, 2025

---

## Core Web Vitals

### Target Metrics

| Metric | Target | Threshold |
|--------|--------|-----------|
| **LCP** (Largest Contentful Paint) | <2.5s | <4.0s |
| **FID** (First Input Delay) | <100ms | <300ms |
| **CLS** (Cumulative Layout Shift) | <0.1 | <0.25 |
| **FCP** (First Contentful Paint) | <1.8s | <3.0s |
| **TTI** (Time to Interactive) | <3.5s | <5.0s |

---

## Monitoring Tools

### 1. Vercel Analytics (Real User Monitoring)

```tsx
// Automatically included with Vercel deployment
// View at: vercel.com/[project]/analytics

// Tracks:
// - Real user metrics (not lab data)
// - Core Web Vitals
// - Geographic distribution
// - Device types
```

### 2. Google Analytics 4 + Web Vitals

```tsx
// Already configured in src/lib/analytics.ts

import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals';

// Automatically sends Core Web Vitals to GA4
getCLS(sendToAnalytics);
getFID(sendToAnalytics);
getFCP(sendToAnalytics);
getLCP(sendToAnalytics);
getTTFB(sendToAnalytics);
```

**View in GA4**:
```
Reports → Events → web_vitals
```

### 3. Custom Performance Tracking

```tsx
// src/lib/monitoring.ts

// API call tracking
export function trackAPICall(method, endpoint, duration, status) {
  // Logs to console in dev
  // Sends to monitoring service in prod
  
  if (process.env.NODE_ENV === 'production') {
    sendMetricToMonitoring({
      type: 'api_call',
      method,
      endpoint,
      duration,
      status,
      timestamp: Date.now(),
    });
  }
}

// User interaction tracking
export function trackUserAction(action, metadata = {}) {
  if (process.env.NODE_ENV === 'production') {
    sendMetricToMonitoring({
      type: 'user_action',
      action,
      ...metadata,
      timestamp: Date.now(),
    });
  }
}
```

---

## Lighthouse CI

### Setup

```bash
# Install
pnpm add -D @lhci/cli

# Configure
cat > lighthouserc.js << EOF
module.exports = {
  ci: {
    collect: {
      startServerCommand: 'pnpm start',
      url: ['http://localhost:3000'],
      numberOfRuns: 3,
    },
    assert: {
      preset: 'lighthouse:recommended',
      assertions: {
        'categories:performance': ['error', {minScore: 0.9}],
        'categories:accessibility': ['error', {minScore: 0.9}],
        'categories:best-practices': ['error', {minScore: 0.9}],
        'categories:seo': ['error', {minScore: 0.9}],
      },
    },
  },
};
EOF
```

### Run

```bash
# Local
pnpm lhci autorun

# CI/CD (GitHub Actions)
- name: Lighthouse CI
  run: |
    pnpm lhci autorun
  env:
    LHCI_GITHUB_APP_TOKEN: ${{ secrets.LHCI_GITHUB_APP_TOKEN }}
```

---

## Performance Budget

### Bundle Size Limits

```json
// package.json
{
  "bundlesize": [
    {
      "path": ".next/static/chunks/*.js",
      "maxSize": "150 KB"
    },
    {
      "path": ".next/static/css/*.css",
      "maxSize": "15 KB"
    }
  ]
}
```

### Monitor Bundle Size

```bash
# Analyze bundle
pnpm build
pnpm analyze  # Opens bundle analyzer

# CI check
pnpm add -D bundlesize
pnpm bundlesize
```

---

## Real-Time Monitoring

### Sentry Performance

```tsx
// src/sentry.client.config.ts

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  
  // Performance Monitoring
  tracesSampleRate: 0.1, // 10% of transactions
  
  // Track Web Vitals
  integrations: [
    new Sentry.BrowserTracing(),
  ],
});

// Manually track operations
const transaction = Sentry.startTransaction({
  name: 'fetchNotes',
  op: 'http.client',
});

try {
  await fetchNotes();
} finally {
  transaction.finish();
}
```

**View in Sentry**:
```
Performance → Transactions
```

---

## Performance Patterns

### Code Splitting

```tsx
// ✅ Lazy load heavy components
import { lazy, Suspense } from 'react';

const RichTextEditor = lazy(() => import('./RichTextEditor'));

<Suspense fallback={<LoadingSpinner />}>
  <RichTextEditor />
</Suspense>
```

### Image Optimization

```tsx
// ✅ Use Next.js Image component
import Image from 'next/image';

<Image
  src="/icon.png"
  width={192}
  height={192}
  alt="App icon"
  loading="lazy"
  quality={85}
/>
```

### Font Optimization

```tsx
// src/app/layout.tsx
import { Inter } from 'next/font/google';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap', // Prevents FOIT (Flash of Invisible Text)
  preload: true,
});
```

---

## Debugging Performance Issues

### React DevTools Profiler

```
1. Install React DevTools
2. Open DevTools → Profiler tab
3. Click record (⚫)
4. Interact with app
5. Click stop (⬛)
6. Analyze:
   - Flame graph (what rendered)
   - Ranked (components by render time)
   - Why component rendered
```

### Chrome Performance Tab

```
1. Open DevTools → Performance tab
2. Click record (⚫)
3. Interact with app (2-5s)
4. Click stop (⬛)
5. Analyze:
   - Main thread activity
   - Network requests
   - Rendering timeline
   - Long tasks (>50ms)
```

### Lighthouse Report

```
1. Open DevTools → Lighthouse tab
2. Select categories:
   - ✅ Performance
   - ✅ Accessibility
   - ✅ Best Practices
   - ✅ SEO
   - ✅ PWA
3. Click "Analyze page load"
4. Review opportunities and diagnostics
```

---

## Alerts and Notifications

### Sentry Alerts

```yaml
# Configure in Sentry Dashboard
Rules:
  - When: LCP > 3s
    Then: Send Slack notification
    
  - When: Error rate > 1%
    Then: Send email to team
    
  - When: API response time > 500ms
    Then: Create Jira ticket
```

### Custom Alerts

```tsx
// Monitor performance thresholds
const THRESHOLDS = {
  LCP: 2500,  // 2.5s
  FID: 100,   // 100ms
  CLS: 0.1,   // 0.1
};

getCLS((metric) => {
  if (metric.value > THRESHOLDS.CLS) {
    // Alert: CLS exceeded threshold
    reportAlert('CLS_HIGH', { value: metric.value });
  }
});
```

---

## Performance Checklist

### Before Deploy

- [ ] Lighthouse score >90 (all categories)
- [ ] Bundle size within budget
- [ ] Images optimized (WebP)
- [ ] Code splitting implemented
- [ ] Lazy loading for heavy components
- [ ] Service Worker caching configured
- [ ] Web Vitals passing thresholds
- [ ] No console.log in production
- [ ] Source maps configured (optional)

### After Deploy

- [ ] Vercel Analytics tracking metrics
- [ ] Sentry receiving performance data
- [ ] Google Analytics tracking Web Vitals
- [ ] Real user metrics acceptable
- [ ] No JavaScript errors in console
- [ ] API response times <500ms
- [ ] WebSocket connections stable

---

## Monthly Review

### Metrics to Track

```
1. Core Web Vitals trend (GA4)
2. Error rate (Sentry)
3. API latency (custom monitoring)
4. Bundle size growth (CI)
5. Lighthouse scores (CI)
6. User complaints (support tickets)
```

### Actions

- Review Sentry performance issues
- Analyze slow API endpoints
- Check for regression in Web Vitals
- Optimize heavy pages
- Update dependencies for performance fixes

---

**See Also**:
- [Performance Guide](../system/performance.md)
- [Deployment Guide](./deployment.md)
- [Debugging Guide](../development/debugging.md)
