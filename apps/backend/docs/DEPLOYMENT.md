# Deployment Guide - Vertical Scaling

This guide covers deploying the backend with vertical scaling capabilities.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Local Development](#local-development)
3. [Production Deployment](#production-deployment)
4. [Cloud Deployment Examples](#cloud-deployment-examples)
5. [Monitoring & Maintenance](#monitoring--maintenance)
6. [Troubleshooting](#troubleshooting)

## Prerequisites

### Hardware Requirements

| Environment | Min CPU | Min RAM | Recommended CPU | Recommended RAM |
|-------------|---------|---------|-----------------|-----------------|
| Development | 2 cores | 4GB | 4 cores | 8GB |
| Staging | 2 cores | 4GB | 4 cores | 8GB |
| Production (Low) | 2 cores | 4GB | 4 cores | 8GB |
| Production (Medium) | 4 cores | 8GB | 8 cores | 16GB |
| Production (High) | 8 cores | 16GB | 16+ cores | 32GB+ |

### Software Requirements

- Node.js 20+
- Docker & Docker Compose (for containerized deployment)
- PostgreSQL 16+
- Redis 7+ (optional, but recommended for cluster mode)

## Local Development

### Quick Start

```bash
# Interactive mode
./quick-start.sh

# Or direct command
./quick-start.sh dev:cluster
```

### Manual Setup

1. **Install dependencies**
   ```bash
   pnpm install
   ```

2. **Configure environment**
   ```bash
   cp .env.example .env
   # Edit .env with your settings
   ```

3. **Start database**
   ```bash
   docker-compose up -d postgres
   ```

4. **Run migrations**
   ```bash
   pnpm prisma:migrate
   ```

5. **Start in cluster mode**
   ```bash
   pnpm dev:cluster
   ```

## Production Deployment

### Option 1: Direct Node.js Deployment

#### Step 1: Prepare Environment

```bash
# Create production environment file
cp .env.prod.example .env.prod

# Edit .env.prod - IMPORTANT: Update these values!
# - SESSION_SECRET (use strong random string)
# - POSTGRES_PASSWORD
# - CORS_ORIGIN (your frontend domain)
# - MAX_WORKERS (based on your CPU cores)
# - MAX_OLD_SPACE_SIZE (based on available RAM)
```

#### Step 2: Install Production Dependencies

```bash
# Install dependencies
pnpm install --prod

# Generate Prisma client
pnpm prisma:generate
```

#### Step 3: Build

```bash
pnpm build
```

#### Step 4: Database Setup

```bash
# Run migrations
NODE_ENV=production pnpm prisma migrate deploy
```

#### Step 5: Start Application

```bash
# Load production environment
export $(cat .env.prod | xargs)

# Start in cluster mode
pnpm start:cluster
```

### Option 2: Docker Deployment (Recommended)

#### Step 1: Prepare Environment

```bash
cp .env.prod.example .env.prod
# Edit .env.prod with your configuration
```

#### Step 2: Build and Deploy

```bash
# Build images
pnpm docker:prod:build

# Start services
pnpm docker:prod:up

# View logs
pnpm docker:prod:logs
```

#### Step 3: Verify Deployment

```bash
# Check health
curl http://localhost:3001/api/health

# Check container status
docker ps
```

### Environment Configuration Examples

#### Small Application (Low Traffic)

```env
MAX_WORKERS=2
MAX_OLD_SPACE_SIZE=1024
BACKEND_CPU_LIMIT=2
BACKEND_MEMORY_LIMIT=4G
```

#### Medium Application (Moderate Traffic)

```env
MAX_WORKERS=4
MAX_OLD_SPACE_SIZE=2048
BACKEND_CPU_LIMIT=4
BACKEND_MEMORY_LIMIT=8G
```

#### Large Application (High Traffic)

```env
MAX_WORKERS=8
MAX_OLD_SPACE_SIZE=3072
BACKEND_CPU_LIMIT=8
BACKEND_MEMORY_LIMIT=16G
```

## Cloud Deployment Examples

### AWS EC2

#### Instance Selection

| Traffic Level | Instance Type | vCPUs | RAM | Cost/Month* |
|--------------|---------------|-------|-----|-------------|
| Low | t3.medium | 2 | 4GB | ~$30 |
| Medium | t3.xlarge | 4 | 16GB | ~$120 |
| High | t3.2xlarge | 8 | 32GB | ~$240 |

*Approximate costs for on-demand Linux instances in us-east-1

#### Deployment Steps

```bash
# 1. Launch EC2 instance (Ubuntu 22.04)

# 2. Install dependencies
ssh ec2-user@your-instance
sudo apt update
sudo apt install -y docker.io docker-compose nodejs npm
sudo npm install -g pnpm

# 3. Clone repository
git clone your-repo
cd notes-application/apps/backend

# 4. Configure environment
cp .env.prod.example .env.prod
nano .env.prod

# 5. Deploy with Docker
pnpm docker:prod:up

# 6. Configure reverse proxy (Nginx)
sudo apt install nginx
# Configure Nginx to proxy to port 3001
```

### DigitalOcean Droplet

#### Droplet Selection

- **Basic**: 2 vCPUs, 4GB RAM ($24/month)
- **General Purpose**: 4 vCPUs, 8GB RAM ($48/month)
- **CPU-Optimized**: 8 vCPUs, 16GB RAM ($144/month)

#### One-Click Docker Droplet

1. Create Docker droplet
2. SSH into droplet
3. Follow same deployment steps as AWS EC2

### Google Cloud Platform (GCP)

#### Compute Engine VM

```bash
# Create VM
gcloud compute instances create notes-backend \
  --machine-type=n2-standard-4 \
  --image-family=ubuntu-2204-lts \
  --image-project=ubuntu-os-cloud \
  --boot-disk-size=50GB

# SSH and deploy
gcloud compute ssh notes-backend
# Follow deployment steps
```

### Azure VM

```bash
# Create VM
az vm create \
  --resource-group notes-rg \
  --name notes-backend \
  --image Ubuntu2204 \
  --size Standard_D4s_v3 \
  --admin-username azureuser

# Deploy
ssh azureuser@your-vm-ip
# Follow deployment steps
```

## Monitoring & Maintenance

### Application Monitoring

The application includes built-in monitoring when `ENABLE_MEMORY_MONITORING=true`:

```bash
# View logs
pnpm docker:prod:logs

# Example output:
# 📊 Master Memory Usage: RSS=256MB, Heap=128MB
# 💚 Worker 12345 is online
# 📊 Worker 12345 Memory: RSS=384MB, Heap=256MB
```

### Health Checks

```bash
# Check application health
curl http://localhost:3001/api/health

# Expected response:
{
  "status": "ok",
  "timestamp": "2024-12-12T10:00:00.000Z"
}
```

### Resource Monitoring

```bash
# Monitor Docker containers
docker stats

# Monitor system resources
htop

# Check worker processes
ps aux | grep node
```

### Log Management

```bash
# Follow logs
docker logs -f notes-backend-prod

# View last 100 lines
docker logs --tail 100 notes-backend-prod

# Save logs to file
docker logs notes-backend-prod > backend.log 2>&1
```

### Database Backups

```bash
# Backup database
docker exec notes-postgres-prod pg_dump -U postgres notes_db > backup.sql

# Restore database
cat backup.sql | docker exec -i notes-postgres-prod psql -U postgres notes_db
```

## Troubleshooting

### High Memory Usage

**Symptoms:**
- `⚠️ Worker memory usage exceeds threshold` warnings
- Application slowdown
- Workers crashing

**Solutions:**

1. Increase heap size:
   ```env
   MAX_OLD_SPACE_SIZE=3072
   ```

2. Reduce worker count:
   ```env
   MAX_WORKERS=2
   ```

3. Increase container memory:
   ```env
   BACKEND_MEMORY_LIMIT=16G
   ```

### Workers Keep Restarting

**Check logs:**
```bash
docker logs notes-backend-prod | grep "Worker died"
```

**Common causes:**
- Out of memory
- Uncaught exceptions
- Database connection issues

**Solutions:**
1. Check memory limits
2. Review application logs for errors
3. Verify database connectivity

### High CPU Usage

**Symptoms:**
- CPU at 100%
- Slow response times

**Solutions:**

1. Check if all cores are utilized:
   ```bash
   docker stats
   ```

2. Increase worker count (if CPU not maxed):
   ```env
   MAX_WORKERS=8
   ```

3. Increase CPU limits:
   ```env
   BACKEND_CPU_LIMIT=8
   ```

### Database Connection Errors

**Symptoms:**
- `Connection refused` errors
- `Too many connections` warnings

**Solutions:**

1. Check database status:
   ```bash
   docker ps
   docker logs notes-postgres-prod
   ```

2. Verify DATABASE_URL in .env.prod

3. Increase PostgreSQL connection limit (in docker-compose.prod.yml):
   ```yaml
   environment:
     POSTGRES_MAX_CONNECTIONS: "200"
   ```

### Port Already in Use

**Error:** `EADDRINUSE: address already in use`

**Solutions:**

1. Find process using port:
   ```bash
   lsof -i :3001
   ```

2. Kill process:
   ```bash
   kill -9 <PID>
   ```

3. Or change port:
   ```env
   BACKEND_PORT=3002
   ```

## Performance Optimization

### Database Tuning

See PostgreSQL settings in [docker-compose.prod.yml](../docker-compose.prod.yml)

Key settings to adjust based on your hardware:
- `POSTGRES_SHARED_BUFFERS`: 25% of RAM
- `POSTGRES_EFFECTIVE_CACHE_SIZE`: 50-75% of RAM
- `POSTGRES_WORK_MEM`: RAM / (MAX_CONNECTIONS * 3)

### Application Tuning

1. **Session Store**: Use Redis in production
   ```bash
   # Redis is included in docker-compose.prod.yml
   ```

2. **Rate Limiting**: Adjust based on traffic
   ```env
   RATE_LIMIT_MAX_REQUESTS=1000
   RATE_LIMIT_WINDOW_MS=60000  # 1 minute
   ```

3. **Body Parser Limits**: Adjust based on needs
   ```env
   BODY_PARSER_LIMIT=10mb
   ```

## Security Checklist

- [ ] Change default passwords
- [ ] Set strong SESSION_SECRET
- [ ] Configure CORS_ORIGIN to your domain
- [ ] Enable HTTPS (use reverse proxy like Nginx)
- [ ] Set secure cookie settings
- [ ] Configure firewall rules
- [ ] Regular security updates
- [ ] Monitor logs for suspicious activity
- [ ] Set up automated backups
- [ ] Implement rate limiting

## Scaling Further

### When Vertical Scaling Isn't Enough

Consider horizontal scaling (multiple servers) when:
- Single server CPU/RAM maxed out
- Need high availability (no single point of failure)
- Traffic exceeds ~10-20k requests/minute
- Geographic distribution needed

### Transition to Horizontal Scaling

Options:
1. **Load Balancer + Multiple Instances**
   - Nginx/HAProxy
   - AWS ALB/ELB
   - Google Cloud Load Balancer

2. **Container Orchestration**
   - Kubernetes
   - Docker Swarm
   - AWS ECS/Fargate

3. **Platform as a Service**
   - Heroku
   - Railway
   - Render
   - Fly.io

## Support

For issues and questions:
1. Check logs: `pnpm docker:prod:logs`
2. Review [SCALING.md](./SCALING.md)
3. Check [README.md](../README.md)
4. Open issue on GitHub
