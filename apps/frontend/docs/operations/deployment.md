# Deployment Guide

**Purpose**: Deploy the notes application frontend to production environments.

**Last Updated**: December 13, 2025

---

## Deployment Platforms

### Vercel (Recommended)

**Why Vercel**:
- Built by Next.js team
- Zero-config deployment
- Automatic HTTPS
- Edge functions
- Analytics included

**Deploy Steps**:

```bash
# 1. Install Vercel CLI
pnpm add -g vercel

# 2. Login
vercel login

# 3. Deploy
cd apps/frontend
vercel --prod
```

**Environment Variables**:
```bash
# Vercel Dashboard → Settings → Environment Variables
NEXT_PUBLIC_API_URL=https://api.yourapp.com
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX
NEXT_PUBLIC_SENTRY_DSN=https://xxx@sentry.io/xxx
NEXT_PUBLIC_ENABLE_WS=true
```

**Custom Domain**:
```bash
vercel domains add yourdomain.com
# Follow DNS instructions
```

---

### Netlify

**Deploy Steps**:

```bash
# 1. Install Netlify CLI
pnpm add -g netlify-cli

# 2. Login
netlify login

# 3. Initialize
netlify init

# 4. Deploy
netlify deploy --prod
```

**Build Settings**:
```toml
# netlify.toml
[build]
  command = "pnpm build"
  publish = ".next"

[[plugins]]
  package = "@netlify/plugin-nextjs"
```

---

### Docker + Self-Hosted

**Dockerfile**:
```dockerfile
FROM node:20-alpine AS base

# Install dependencies
FROM base AS deps
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN corepack enable pnpm && pnpm install --frozen-lockfile

# Build
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN corepack enable pnpm && pnpm build

# Production
FROM base AS runner
WORKDIR /app
ENV NODE_ENV production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000
ENV PORT 3000

CMD ["node", "server.js"]
```

**Docker Compose**:
```yaml
version: '3.8'

services:
  frontend:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NEXT_PUBLIC_API_URL=https://api.yourapp.com
    restart: unless-stopped
```

**Deploy**:
```bash
docker build -t notes-app-frontend .
docker run -p 3000:3000 notes-app-frontend
```

---

## Build Optimization

### next.config.ts

```typescript
const nextConfig = {
  // Output standalone for Docker
  output: 'standalone',
  
  // Compress images
  images: {
    formats: ['image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
  },
  
  // Enable SWC minification
  swcMinify: true,
  
  // Compression
  compress: true,
  
  // Production source maps (optional)
  productionBrowserSourceMaps: false,
  
  // Strict mode
  reactStrictMode: true,
  
  // Security headers
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
        ],
      },
    ];
  },
};

export default nextConfig;
```

---

## Environment Variables

### Required Variables

```bash
# API Configuration
NEXT_PUBLIC_API_URL=https://api.production.com

# Analytics
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX

# Error Tracking
NEXT_PUBLIC_SENTRY_DSN=https://xxx@sentry.io/xxx

# Feature Flags
NEXT_PUBLIC_ENABLE_WS=true
NEXT_PUBLIC_ENABLE_PWA=true

# Environment
NODE_ENV=production
```

### Security

```bash
# ❌ Never commit secrets
NEXT_PUBLIC_API_KEY=secret123  # Exposed to client!

# ✅ Server-side only (no NEXT_PUBLIC_ prefix)
DATABASE_URL=postgresql://...  # Safe, server-only
API_SECRET_KEY=secret123       # Safe, server-only
```

---

## Performance Checklist

- [ ] Enable compression (gzip/brotli)
- [ ] Optimize images (WebP format)
- [ ] Code splitting implemented
- [ ] Bundle analyzer run: `pnpm analyze`
- [ ] Lighthouse score >90
- [ ] Core Web Vitals passing
- [ ] CDN configured for static assets
- [ ] Service Worker registered

---

## CI/CD Pipeline

### GitHub Actions

```yaml
# .github/workflows/deploy.yml
name: Deploy Frontend

on:
  push:
    branches: [main]
    paths:
      - 'apps/frontend/**'

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          
      - name: Install pnpm
        run: corepack enable pnpm
        
      - name: Install dependencies
        run: pnpm install --frozen-lockfile
        
      - name: Run tests
        run: pnpm test
        working-directory: apps/frontend
        
      - name: Build
        run: pnpm build
        working-directory: apps/frontend
        env:
          NEXT_PUBLIC_API_URL: ${{ secrets.API_URL }}
          
      - name: Deploy to Vercel
        run: vercel --prod --token=${{ secrets.VERCEL_TOKEN }}
        working-directory: apps/frontend
```

---

## Monitoring

### Vercel Analytics

```tsx
// Already included with Vercel deployment
// View at: vercel.com/[project]/analytics
```

### Google Analytics

```tsx
// src/app/layout.tsx
import { GoogleAnalytics } from '@next/third-parties/google';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID!} />
      </body>
    </html>
  );
}
```

### Sentry

```bash
# Already configured in sentry.client.config.ts
# View errors at: sentry.io/[org]/[project]
```

---

## Rollback Strategy

```bash
# Vercel: Instant rollback
vercel rollback [deployment-url]

# Docker: Tag and revert
docker tag notes-frontend:latest notes-frontend:backup
docker pull notes-frontend:v1.2.3
docker tag notes-frontend:v1.2.3 notes-frontend:latest
docker restart notes-frontend
```

---

## Post-Deployment Checklist

- [ ] Deployment successful
- [ ] Environment variables configured
- [ ] Custom domain connected
- [ ] HTTPS enabled
- [ ] Sentry receiving errors
- [ ] Analytics tracking events
- [ ] Service Worker registering
- [ ] PWA installable
- [ ] API endpoints reachable
- [ ] WebSocket connections working
- [ ] Dark mode functioning
- [ ] i18n working (all languages)
- [ ] Performance metrics acceptable

---

**See Also**:
- [Performance Monitoring](./performance-monitoring.md)
- [Backend Deployment](../../../backend/docs/system/deployment.md)
