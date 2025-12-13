# Deployment Guide

Production deployment guide for the notes application.

## Deployment Overview

### Architecture Options

**Option 1: Monolithic Deployment** (Recommended for MVP)
- Single server running both frontend and backend
- Easiest to setup and maintain
- Lower cost
- Good for small-medium scale

**Option 2: Separated Services**
- Frontend on Vercel/Netlify
- Backend on Render/Railway/Fly.io
- Database on managed PostgreSQL
- Better scalability
- Higher cost

**Option 3: Container Orchestration**
- Docker containers
- Kubernetes/Docker Swarm
- Full control and scalability
- Complex setup
- Best for large scale

This guide covers **Option 2** (most common for modern web apps).

---

## Prerequisites

### Services to Setup

1. **Frontend Hosting**: Vercel (recommended) or Netlify
2. **Backend Hosting**: Render, Railway, or Fly.io
3. **Database**: Neon, Supabase, or Railway PostgreSQL
4. **Domain** (optional): Namecheap, Cloudflare, etc.
5. **Monitoring** (optional): Sentry, LogRocket

### Required Accounts

- [ ] GitHub account (for repository)
- [ ] Vercel account (for frontend)
- [ ] Render/Railway account (for backend)
- [ ] Neon/Supabase account (for database)

---

## Database Deployment

### Option 1: Neon (Recommended)

**Pros**: Serverless, auto-scaling, generous free tier
**Pricing**: Free tier: 0.5GB storage, 1 project

**Setup:**

1. **Create account**: https://neon.tech
2. **Create project**: "notes-app-production"
3. **Get connection string**:
   ```
   postgresql://username:password@ep-xxx.region.aws.neon.tech/notesdb?sslmode=require
   ```
4. **Save for later**: Copy to notepad

### Option 2: Supabase

**Pros**: Full Postgres, includes auth/storage, good free tier
**Pricing**: Free tier: 500MB database, 1GB file storage

**Setup:**

1. **Create account**: https://supabase.com
2. **Create project**: "notes-app"
3. **Database settings** → Connection string:
   ```
   postgresql://postgres:[password]@db.xxx.supabase.co:5432/postgres
   ```

### Option 3: Railway

**Pros**: Simple setup, includes other services
**Pricing**: $5/month minimum (no free tier for database)

**Setup:**

1. **Create account**: https://railway.app
2. **New project** → "PostgreSQL"
3. **Variables tab** → Copy DATABASE_URL

### Migrate Schema

Once database is created:

```bash
# Update DATABASE_URL in .env
DATABASE_URL="your-production-database-url"

# Push schema
pnpm --filter @notes/database prisma:push

# Or use migrations
pnpm --filter @notes/database prisma:migrate deploy
```

---

## Backend Deployment

### Option 1: Render (Recommended)

**Pros**: Simple, auto-deploys, free tier available
**Pricing**: Free tier (spins down after inactivity), Starter $7/mo

**Setup:**

1. **Create account**: https://render.com

2. **New Web Service**:
   - Connect GitHub repository
   - Name: "notes-backend"
   - Environment: Node
   - Region: Choose closest to users
   - Branch: main
   - Root Directory: `apps/backend`
   - Build Command: `cd ../.. && pnpm install && pnpm --filter @notes/database prisma:generate && pnpm --filter @notes/types build && pnpm --filter @notes/backend build`
   - Start Command: `node dist/server.js`

3. **Environment Variables**:
   ```env
   NODE_ENV=production
   PORT=3001
   DATABASE_URL=<your-neon-connection-string>
   SESSION_SECRET=<generate-with-openssl-rand-base64-32>
   FRONTEND_URL=<your-vercel-url>
   ```

4. **Health Check Path**: `/` (returns 200 OK)

5. **Deploy**: Click "Create Web Service"

6. **Get URL**: Copy service URL (e.g., `https://notes-backend.onrender.com`)

**Note**: Free tier spins down after 15 min inactivity (first request takes ~30s)

### Option 2: Railway

**Pros**: Excellent DX, automatic HTTPS, instant deploys
**Pricing**: $5/month minimum

**Setup:**

1. **Create account**: https://railway.app

2. **New Project** → "Deploy from GitHub repo"

3. **Add service**:
   - Select repository
   - Root Directory: `apps/backend`
   - Build Command: `cd ../.. && pnpm install && pnpm --filter @notes/database prisma:generate && pnpm --filter @notes/types build && pnpm --filter @notes/backend build`
   - Start Command: `node dist/server.js`

4. **Environment Variables**: Same as Render above

5. **Generate domain**: Settings → Public Networking → Generate Domain

6. **Deploy**: Automatic on push to main

### Option 3: Fly.io

**Pros**: Global edge network, free tier, Docker-based
**Pricing**: Free tier: 3 shared VMs

**Setup:**

1. **Install flyctl**:
   ```bash
   curl -L https://fly.io/install.sh | sh
   ```

2. **Login**:
   ```bash
   fly auth login
   ```

3. **Create app**:
   ```bash
   cd apps/backend
   fly launch --name notes-backend
   ```

4. **Configure `fly.toml`**:
   ```toml
   app = "notes-backend"
   
   [build]
     dockerfile = "Dockerfile"
   
   [[services]]
     internal_port = 3001
     protocol = "tcp"
     
     [[services.ports]]
       port = 80
       handlers = ["http"]
     
     [[services.ports]]
       port = 443
       handlers = ["tls", "http"]
   ```

5. **Set secrets**:
   ```bash
   fly secrets set DATABASE_URL="..."
   fly secrets set SESSION_SECRET="..."
   fly secrets set FRONTEND_URL="..."
   ```

6. **Deploy**:
   ```bash
   fly deploy
   ```

---

## Frontend Deployment

### Option 1: Vercel (Recommended)

**Pros**: Zero-config Next.js, automatic HTTPS, global CDN
**Pricing**: Free tier (generous limits)

**Setup:**

1. **Create account**: https://vercel.com

2. **New Project**:
   - Import from GitHub
   - Select repository
   - Framework Preset: Next.js
   - Root Directory: `apps/frontend`

3. **Build Settings**:
   - Build Command: `cd ../.. && pnpm install && pnpm --filter @notes/types build && pnpm --filter @notes/frontend build`
   - Output Directory: `.next`
   - Install Command: `pnpm install`

4. **Environment Variables**:
   ```env
   NEXT_PUBLIC_API_URL=https://notes-backend.onrender.com
   NODE_ENV=production
   ```

5. **Deploy**: Click "Deploy"

6. **Get URL**: Copy deployment URL (e.g., `https://notes-app.vercel.app`)

7. **Update backend**: Update FRONTEND_URL in backend environment variables

**Custom Domain** (optional):
- Settings → Domains → Add Domain
- Follow DNS configuration steps
- HTTPS automatic with Let's Encrypt

### Option 2: Netlify

**Pros**: Similar to Vercel, good DX
**Pricing**: Free tier available

**Setup:**

1. **Create account**: https://netlify.com

2. **New site from Git**:
   - Connect GitHub
   - Select repository
   - Base directory: `apps/frontend`
   - Build command: `cd ../.. && pnpm install && pnpm --filter @notes/types build && pnpm --filter @notes/frontend build`
   - Publish directory: `apps/frontend/.next`

3. **Environment Variables**: Same as Vercel

4. **Deploy**: Automatic

---

## Environment Variables Reference

### Backend (.env)

```env
# Required
NODE_ENV=production
PORT=3001
DATABASE_URL=postgresql://user:pass@host:5432/db?sslmode=require
SESSION_SECRET=your-secure-random-string-min-32-chars
FRONTEND_URL=https://your-app.vercel.app

# Optional
LOG_LEVEL=info
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=5
```

### Frontend (.env.production)

```env
# Required
NEXT_PUBLIC_API_URL=https://your-backend.onrender.com

# Optional
NODE_ENV=production
```

**Security Notes:**
- Never commit `.env` files to Git
- Use platform secret management (Vercel/Render secrets)
- Rotate SESSION_SECRET periodically
- Use strong DATABASE_URL passwords

---

## CI/CD Setup

### GitHub Actions (Recommended)

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'
      
      - name: Setup pnpm
        uses: pnpm/action-setup@v2
        with:
          version: 9
      
      - name: Install dependencies
        run: pnpm install
      
      - name: Build packages
        run: |
          pnpm --filter @notes/types build
          pnpm --filter @notes/database build
      
      - name: Type check
        run: |
          pnpm --filter @notes/backend tsc --noEmit
          pnpm --filter @notes/frontend tsc --noEmit
      
      - name: Lint
        run: |
          pnpm --filter @notes/backend lint
          pnpm --filter @notes/frontend lint

  deploy-backend:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to Render
        run: |
          curl -X POST ${{ secrets.RENDER_DEPLOY_HOOK }}

  deploy-frontend:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to Vercel
        run: |
          # Vercel auto-deploys on push
          echo "Vercel deployment triggered"
```

**Setup secrets** in GitHub:
- Settings → Secrets → Actions
- Add: `RENDER_DEPLOY_HOOK` (from Render settings)

### Automatic Deployments

**Vercel**: Automatic on push to main
**Render**: Automatic on push to main (or use deploy hook)
**Railway**: Automatic on push to main
**Fly.io**: Use `fly deploy` in GitHub Actions

---

## Health Checks

### Backend Health Endpoint

Already implemented in `server.ts`:

```typescript
app.get('/', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy',
    database: 'connected',  // Add DB check
    uptime: process.uptime()
  });
});
```

### Monitoring Setup

**Render** (built-in):
- Automatic health checks every 30s
- Alerts on failures
- Metrics dashboard

**UptimeRobot** (external):
1. Create account: https://uptimerobot.com
2. Add monitor: HTTP(s), your backend URL
3. Check interval: 5 minutes
4. Alert contacts: Email/SMS

---

## Database Backups

### Neon

**Automatic backups**: 7 days retention (free tier)

**Manual backup**:
```bash
# Export to SQL file
pg_dump $DATABASE_URL > backup.sql

# Restore
psql $DATABASE_URL < backup.sql
```

### Supabase

**Automatic backups**: Daily (Pro plan only)

**Manual backup**:
- Dashboard → Database → Backups → Download

### Railway

**Automatic backups**: Daily snapshots

**Manual backup**:
```bash
railway run pg_dump $DATABASE_URL > backup.sql
```

---

## SSL/HTTPS

### Automatic SSL

**Vercel**: Automatic Let's Encrypt SSL
**Render**: Automatic Let's Encrypt SSL
**Railway**: Automatic SSL on generated domains
**Fly.io**: Automatic SSL certificates

### Custom Domain SSL

1. **Add custom domain** in platform dashboard
2. **Update DNS records** (CNAME or A record)
3. **Wait for SSL provisioning** (5-15 minutes)
4. **Verify HTTPS** works

**DNS Records Example:**
```
Type: CNAME
Name: notes (or @)
Value: cname.vercel-dns.com
TTL: 3600
```

---

## Performance Optimization

### Frontend

**Vercel optimizations** (automatic):
- ✅ Global CDN (300+ locations)
- ✅ Image optimization
- ✅ Automatic compression (gzip/brotli)
- ✅ HTTP/3 support
- ✅ Edge caching

**Manual optimizations**:
```typescript
// next.config.js
module.exports = {
  compress: true,
  images: {
    formats: ['image/avif', 'image/webp'],
  },
  experimental: {
    optimizeCss: true,
  },
};
```

### Backend

**Render optimizations**:
- Choose region closest to users
- Upgrade to paid tier (no spin-down)
- Enable HTTP/2

**Code optimizations**:
```typescript
// Database connection pooling
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
  // Connection pool settings
  log: ['error'],
});

// Compression middleware
import compression from 'compression';
app.use(compression());
```

### Database

**Neon optimizations**:
- Autoscaling enabled (automatic)
- Connection pooling (pgBouncer)
- Query optimization (indexes)

**Schema indexes**:
```prisma
model Note {
  userId String
  isDeleted Boolean
  updatedAt DateTime
  
  @@index([userId])
  @@index([userId, isDeleted])
  @@index([userId, updatedAt])
}
```

---

## Monitoring & Logging

### Application Monitoring

**Sentry** (errors):
```bash
pnpm add @sentry/nextjs @sentry/node
```

**Setup**:
```typescript
// Frontend (next.config.js)
const { withSentryConfig } = require('@sentry/nextjs');
module.exports = withSentryConfig({...});

// Backend (server.ts)
import * as Sentry from '@sentry/node';
Sentry.init({ dsn: process.env.SENTRY_DSN });
```

**LogRocket** (session replay):
```bash
pnpm add logrocket
```

### Server Monitoring

**Render Dashboard**:
- CPU/Memory usage
- Response times
- Error rates
- Request logs

**Railway Dashboard**:
- Metrics tab
- Deployments history
- Real-time logs

### Database Monitoring

**Neon Dashboard**:
- Active connections
- Query performance
- Storage usage

**Query optimization**:
```bash
# Slow query log
EXPLAIN ANALYZE SELECT * FROM "Note" WHERE "userId" = '...';
```

---

## Scaling Strategy

### Phase 1: MVP (Current)
- Free tier services
- Single region
- Basic monitoring
- **Cost**: $0-15/month

### Phase 2: Growth (100-1000 users)
- Paid Render/Railway ($7-20/mo)
- Database Pro plan ($15-25/mo)
- CDN optimization
- Advanced monitoring
- **Cost**: $30-60/month

### Phase 3: Scale (1000-10000 users)
- Multiple regions
- Load balancing
- Database replicas
- Caching layer (Redis)
- Full monitoring suite
- **Cost**: $100-300/month

### Phase 4: Enterprise (10000+ users)
- Kubernetes cluster
- Microservices architecture
- Multi-region database
- Dedicated infrastructure
- **Cost**: $500-2000+/month

---

## Security Checklist

### Pre-Deployment

- [ ] Environment variables secured (not in code)
- [ ] SESSION_SECRET is strong (32+ chars)
- [ ] HTTPS enabled (automatic on Vercel/Render)
- [ ] CORS configured correctly
- [ ] Rate limiting enabled
- [ ] Input sanitization active
- [ ] SQL injection prevention (Prisma)
- [ ] XSS protection enabled
- [ ] Security headers configured (Helmet)
- [ ] Database backups enabled

### Post-Deployment

- [ ] Test authentication flow
- [ ] Verify session management
- [ ] Test API rate limits
- [ ] Check HTTPS certificate
- [ ] Review security headers
- [ ] Monitor error logs
- [ ] Setup uptime monitoring
- [ ] Test CORS from frontend
- [ ] Verify database connection
- [ ] Test account lockout feature

---

## Troubleshooting

### Common Issues

**Build fails**:
```bash
# Clear cache
rm -rf node_modules .next dist
pnpm install

# Check build logs for specific errors
```

**Database connection fails**:
- Verify DATABASE_URL format
- Check SSL mode (`?sslmode=require`)
- Ensure database is accessible
- Test connection locally

**CORS errors**:
- Verify FRONTEND_URL in backend
- Check credentials: 'include' in fetch
- Ensure both use HTTPS

**Session not persisting**:
- Check SESSION_SECRET is set
- Verify secure: true only in production
- Check sameSite: 'strict' compatibility

**Slow response times**:
- Check Render free tier spin-down
- Upgrade to paid tier
- Enable database connection pooling
- Add indexes to database

---

## Rollback Plan

### Vercel

**Instant rollback**:
1. Deployments → Select previous deployment
2. Click "Promote to Production"
3. Previous version live in seconds

### Render

**Rollback**:
1. Dashboard → Service → Deploys
2. Find previous successful deploy
3. Click "Redeploy"

### Database

**Restore backup**:
```bash
# Download backup
# Restore to database
psql $DATABASE_URL < backup.sql
```

---

## Cost Estimation

### Free Tier (MVP)

| Service | Cost | Limits |
|---------|------|--------|
| Vercel | $0 | 100GB bandwidth, unlimited sites |
| Render | $0 | Spins down after 15min inactivity |
| Neon | $0 | 0.5GB storage, 1 project |
| **Total** | **$0/mo** | Good for testing/MVP |

### Paid Tier (Production)

| Service | Cost | Benefits |
|---------|------|----------|
| Vercel Pro | $20/mo | More bandwidth, priority support |
| Render Starter | $7/mo | Always-on, no spin-down |
| Neon Pro | $19/mo | 10GB storage, daily backups |
| **Total** | **$46/mo** | Production-ready |

---

**Next**: See [Security Guide](./SECURITY.md) for security best practices

