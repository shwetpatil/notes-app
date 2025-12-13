# Deployment Guide

**Deploying the Notes Application Backend**

---

## Prerequisites

- Node.js 20+
- PostgreSQL 16+
- Docker (optional, for containerized deployment)

---

## Local Development

### 1. Setup Database

**Option A: Docker** (Recommended)
```bash
docker run --name notes-postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=notes_db \
  -p 5432:5432 \
  -d postgres:16
```

**Option B: Local PostgreSQL**
```bash
# macOS with Homebrew
brew install postgresql@16
brew services start postgresql@16

# Create database
createdb notes_db
```

### 2. Install Dependencies

```bash
cd apps/backend
pnpm install
```

### 3. Configure Environment

```bash
# Copy example environment file
cp .env.example .env

# Edit .env and set:
# - DATABASE_URL
# - SESSION_SECRET
```

### 4. Setup Database Schema

```bash
# Generate Prisma client
pnpm prisma:generate

# Run migrations
pnpm prisma:migrate:dev
```

### 5. Start Server

```bash
# Single process
pnpm dev

# Cluster mode (multi-core)
pnpm dev:cluster

# Or use interactive menu
./quick-start.sh
```

---

## Docker Deployment

### Development

```bash
# Start all services (backend + database)
docker-compose up

# Start in background
docker-compose up -d

# View logs
docker-compose logs -f backend

# Stop
docker-compose down
```

### Production

**Build image**:
```bash
docker build -t notes-backend:latest -f Dockerfile .
```

**Run container**:
```bash
docker run -d \
  --name notes-backend \
  -p 3001:3001 \
  -e DATABASE_URL="postgresql://..." \
  -e SESSION_SECRET="your-secret" \
  -e NODE_ENV=production \
  -e CLUSTER_MODE=true \
  notes-backend:latest
```

**Docker Compose** (production):
```yaml
# docker-compose.prod.yml
version: '3.8'

services:
  backend:
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - "3001:3001"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://postgres:password@db:5432/notes_db
      - SESSION_SECRET=${SESSION_SECRET}
      - CLUSTER_MODE=true
      - MAX_WORKERS=4
    depends_on:
      - db
    restart: unless-stopped

  db:
    image: postgres:16
    environment:
      - POSTGRES_DB=notes_db
      - POSTGRES_PASSWORD=your-secure-password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped

volumes:
  postgres_data:
```

```bash
docker-compose -f docker-compose.prod.yml up -d
```

---

## Cloud Deployment

### AWS (ECS with Fargate)

**1. Build and push Docker image**:
```bash
# Login to ECR
aws ecr get-login-password --region us-east-1 | \
  docker login --username AWS --password-stdin <account-id>.dkr.ecr.us-east-1.amazonaws.com

# Build and push
docker build -t notes-backend .
docker tag notes-backend:latest <account-id>.dkr.ecr.us-east-1.amazonaws.com/notes-backend:latest
docker push <account-id>.dkr.ecr.us-east-1.amazonaws.com/notes-backend:latest
```

**2. Create RDS PostgreSQL database**:
```bash
aws rds create-db-instance \
  --db-instance-identifier notes-db \
  --db-instance-class db.t3.micro \
  --engine postgres \
  --master-username postgres \
  --master-user-password <strong-password> \
  --allocated-storage 20
```

**3. Create ECS task definition and service** (use AWS Console or CLI)

**Environment variables**:
```
DATABASE_URL=postgresql://postgres:password@<rds-endpoint>:5432/notes_db
SESSION_SECRET=<strong-secret>
NODE_ENV=production
CLUSTER_MODE=true
MAX_WORKERS=2
```

### Google Cloud (Cloud Run)

**1. Build and push**:
```bash
# Build with Cloud Build
gcloud builds submit --tag gcr.io/<project-id>/notes-backend

# Or push local image
docker tag notes-backend gcr.io/<project-id>/notes-backend
docker push gcr.io/<project-id>/notes-backend
```

**2. Create Cloud SQL instance**:
```bash
gcloud sql instances create notes-db \
  --database-version=POSTGRES_16 \
  --tier=db-f1-micro \
  --region=us-central1
```

**3. Deploy to Cloud Run**:
```bash
gcloud run deploy notes-backend \
  --image gcr.io/<project-id>/notes-backend \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars="NODE_ENV=production,SESSION_SECRET=<secret>" \
  --add-cloudsql-instances=<project-id>:us-central1:notes-db \
  --memory=512Mi \
  --cpu=1 \
  --min-instances=1 \
  --max-instances=10
```

### Azure (Container Instances)

**1. Push to Azure Container Registry**:
```bash
az acr login --name <registry-name>
docker tag notes-backend <registry-name>.azurecr.io/notes-backend:latest
docker push <registry-name>.azurecr.io/notes-backend:latest
```

**2. Create Azure Database for PostgreSQL**:
```bash
az postgres server create \
  --resource-group notes-rg \
  --name notes-db \
  --location eastus \
  --admin-user postgres \
  --admin-password <strong-password> \
  --sku-name B_Gen5_1 \
  --version 16
```

**3. Deploy container**:
```bash
az container create \
  --resource-group notes-rg \
  --name notes-backend \
  --image <registry-name>.azurecr.io/notes-backend:latest \
  --cpu 1 \
  --memory 1 \
  --ports 3001 \
  --environment-variables \
    NODE_ENV=production \
    SESSION_SECRET=<secret> \
    DATABASE_URL=<connection-string>
```

### DigitalOcean (App Platform)

**1. Connect GitHub repository** via DigitalOcean dashboard

**2. Configure app**:
```yaml
name: notes-backend
region: nyc
services:
  - name: backend
    github:
      repo: your-username/notes-application
      branch: main
      deploy_on_push: true
    dockerfile_path: apps/backend/Dockerfile
    http_port: 3001
    instance_count: 1
    instance_size_slug: basic-xs
    envs:
      - key: NODE_ENV
        value: production
      - key: SESSION_SECRET
        value: <secret>
        type: SECRET
      - key: DATABASE_URL
        value: ${db.DATABASE_URL}
        type: SECRET
      - key: CLUSTER_MODE
        value: "false"  # App Platform handles scaling

databases:
  - name: db
    engine: PG
    version: "16"
    size: db-s-1vcpu-1gb
```

---

## Production Configuration

### Environment Variables

```dotenv
# Server
BACKEND_PORT=3001
NODE_ENV=production

# Database (with SSL)
DATABASE_URL="postgresql://user:pass@host:5432/db?sslmode=require&connection_limit=20"

# Security (MUST be strong!)
SESSION_SECRET="<32-char-random-string>"
CORS_ORIGIN="https://yourapp.com"

# Scaling
CLUSTER_MODE=true
MAX_WORKERS=4

# Monitoring
ENABLE_MEMORY_MONITORING=true
ENABLE_PERFORMANCE_LOGGING=true

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### Nginx Reverse Proxy

```nginx
# /etc/nginx/sites-available/notes-backend
server {
    listen 80;
    server_name api.yourapp.com;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable HTTPS with Let's Encrypt:
```bash
sudo certbot --nginx -d api.yourapp.com
```

---

## Health Checks & Monitoring

### Load Balancer Health Check

Configure your load balancer to check:
```
Path: /api/health
Interval: 30 seconds
Timeout: 5 seconds
Healthy threshold: 2
Unhealthy threshold: 3
```

### Application Monitoring

**Health endpoint**:
```bash
curl https://api.yourapp.com/api/health
```

**Metrics endpoint** (protect in production):
```bash
curl https://api.yourapp.com/api/metrics
```

**Set up alerts** for:
- Response time > 1s
- Error rate > 1%
- Memory usage > 80%
- CPU usage > 80%

---

## Database Migrations

### Development
```bash
# Create new migration
pnpm prisma:migrate:dev --name add_feature

# Reset database (WARNING: deletes data)
pnpm prisma:migrate:reset
```

### Production
```bash
# Apply pending migrations
pnpm prisma:migrate:deploy

# DO NOT use migrate:dev in production!
```

**Best practice**: Run migrations before deploying new code version.

---

## Backup & Recovery

### Database Backup

```bash
# Backup
pg_dump -h <host> -U <user> -d notes_db > backup-$(date +%Y%m%d).sql

# Restore
psql -h <host> -U <user> -d notes_db < backup-20251213.sql
```

**Automated backups**:
- AWS RDS: Enable automatic backups (7-35 day retention)
- Google Cloud SQL: Automatic daily backups
- Azure Database: Geo-redundant backups

---

## Scaling

### Vertical Scaling (Single Server)

```dotenv
# Enable cluster mode to use all CPU cores
CLUSTER_MODE=true
MAX_WORKERS=8  # Set to number of CPU cores

# Increase memory limit
NODE_OPTIONS=--max-old-space-size=2048
```

### Horizontal Scaling (Multiple Servers)

**Requirements**:
- Load balancer (AWS ALB, nginx, etc.)
- External session store (Redis)
- Shared database

**Setup Redis for sessions**:
```bash
npm install connect-redis redis
```

```typescript
// In server.ts
import RedisStore from 'connect-redis';
import { createClient } from 'redis';

const redisClient = createClient({
  url: process.env.REDIS_URL
});
redisClient.connect();

app.use(session({
  store: new RedisStore({ client: redisClient }),
  // ... other options
}));
```

---

## Troubleshooting

### Container won't start

```bash
# Check logs
docker logs notes-backend

# Common issues:
# - DATABASE_URL not set
# - Database not accessible
# - Port already in use
```

### Database connection errors

```bash
# Test connection
docker exec -it notes-backend \
  psql $DATABASE_URL -c "SELECT 1"

# Check if using SSL: add ?sslmode=require
DATABASE_URL="postgresql://...?sslmode=require"
```

### High memory usage

```bash
# Set memory limit
NODE_OPTIONS=--max-old-space-size=512

# Monitor memory
curl http://localhost:3001/api/metrics
```

### Slow performance

1. Enable cluster mode
2. Check database indexes
3. Increase connection pool
4. Add caching layer (Redis)

---

## Production Checklist

- [ ] Strong `SESSION_SECRET` (32+ chars)
- [ ] Database with SSL enabled
- [ ] `NODE_ENV=production`
- [ ] `CORS_ORIGIN` set to production domain
- [ ] Cluster mode enabled for multi-core
- [ ] Health check endpoint configured
- [ ] Database backups enabled
- [ ] Monitoring and alerts set up
- [ ] HTTPS/TLS configured
- [ ] Rate limiting enabled
- [ ] Error tracking (Sentry, etc.) configured
- [ ] Load testing completed
- [ ] Documentation updated

---

**Last Updated**: December 13, 2025
