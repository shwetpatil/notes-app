# Backend Performance

**Stack**: Express.js + Prisma + PostgreSQL + Cluster Mode  
**Last Updated**: December 13, 2025

---

## Performance Targets

| Metric | Target |
|--------|--------|
| API Response Time (P95) | < 200ms |
| Database Query Time | < 50ms |
| Throughput | 500+ req/s |
| Memory per Worker | < 512MB |

---

## Database Performance

### Connection Pooling

**File**: `src/lib/prisma.ts`

```typescript
const prisma = new PrismaClient();
```

**Connection Pool** (configured in `DATABASE_URL`):
```dotenv
DATABASE_URL="postgresql://user:pass@host:5432/db?connection_limit=20"
```

**Recommended Pool Sizes**:
- Single process: 10-20 connections
- Cluster mode (4 workers): 40 total (10 per worker)

### Indexes

**File**: `prisma/schema.prisma`

```prisma
model User {
  id    String @id
  email String @unique
  
  @@index([email])  // Fast login lookups
}

model Note {
  id         String @id
  userId     String
  isPinned   Boolean
  isFavorite Boolean
  updatedAt  DateTime
  
  @@index([userId])              // Get user's notes
  @@index([userId, isPinned])    // Get pinned notes
  @@index([userId, isFavorite])  // Get favorites
  @@index([userId, updatedAt])   // Sort by recent
  @@index([isTrashed])           // Filter trashed
}
```

**Impact**: Queries with proper indexes run 100x faster on large datasets.

### Query Optimization

**Select Only Needed Fields**:
```typescript
// ❌ Fetch all fields
const notes = await prisma.note.findMany({ where: { userId } });

// ✅ Select only list view fields
const notes = await prisma.note.findMany({
  where: { userId },
  select: { id: true, title: true, updatedAt: true, isPinned: true }
});
```

**Avoid N+1 Queries**:
```typescript
// ❌ N+1 problem
const notes = await prisma.note.findMany({ where: { userId } });
for (const note of notes) {
  const user = await prisma.user.findUnique({ where: { id: note.userId } });
}

// ✅ Single query with include
const notes = await prisma.note.findMany({
  where: { userId },
  include: { user: true }
});
```

**Parallel Queries**:
```typescript
// ❌ Sequential (100ms total)
const user = await getUser(userId);        // 30ms
const notes = await getNotes(userId);      // 50ms
const count = await getCount(userId);      // 20ms

// ✅ Parallel (50ms total - max of all)
const [user, notes, count] = await Promise.all([
  getUser(userId),
  getNotes(userId),
  getCount(userId)
]);
```

**Batch Operations**:
```typescript
// ❌ Loop with individual queries
for (const id of noteIds) {
  await prisma.note.update({ where: { id }, data: { isArchived: true } });
}

// ✅ Single batch update
await prisma.note.updateMany({
  where: { id: { in: noteIds } },
  data: { isArchived: true }
});
```

---

## Cluster Mode

**File**: `src/cluster.ts`

### How It Works

```typescript
import cluster from 'cluster';
import os from 'os';

if (cluster.isPrimary) {
  // Master process - fork workers
  const workers = Math.min(MAX_WORKERS, os.cpus().length);
  for (let i = 0; i < workers; i++) {
    cluster.fork();
  }
} else {
  // Worker process - load server
  require('./server');
}
```

**Process Structure**:
```
Master Process (PID 1234)
  ├─ Worker 1 (PID 1235) → Handles requests
  ├─ Worker 2 (PID 1236) → Handles requests
  ├─ Worker 3 (PID 1237) → Handles requests
  └─ Worker 4 (PID 1238) → Handles requests
```

### Configuration

```dotenv
# Enable cluster mode
CLUSTER_MODE=true

# Number of workers (default: CPU cores)
MAX_WORKERS=4

# Memory per worker
NODE_OPTIONS=--max-old-space-size=512
```

### Performance Impact

**Single Process**:
- CPU: 25% (1 core of 4)
- Throughput: ~250 req/s

**Cluster (4 workers)**:
- CPU: 90% (all 4 cores)
- Throughput: ~900 req/s (**3.6x improvement**)

### When to Use

✅ CPU-bound operations  
✅ High traffic (> 100 req/s)  
✅ Multi-core server  
❌ I/O-only operations  
❌ Low traffic  
❌ Docker/Kubernetes (handles scaling externally)

---

## Memory Management

### Monitoring

**File**: `src/cluster.ts`

```typescript
const monitorMemory = () => {
  const used = process.memoryUsage();
  console.log(`RSS: ${Math.round(used.rss / 1024 / 1024)}MB`);
  console.log(`Heap: ${Math.round(used.heapUsed / 1024 / 1024)}MB`);
};

if (process.env.ENABLE_MEMORY_MONITORING === 'true') {
  setInterval(monitorMemory, 60000);  // Every minute
}
```

### Configuration

```dotenv
ENABLE_MEMORY_MONITORING=true
MEMORY_THRESHOLD_MB=512
```

### Memory Limits

```bash
# Set heap size limit
NODE_OPTIONS=--max-old-space-size=2048  # 2GB
```

---

## API Performance

### Response Time Middleware

**File**: `src/middleware/monitoring.ts`

```typescript
export const performanceMonitoring = (req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`${req.method} ${req.path} - ${duration}ms`);
    
    if (duration > 1000) {
      console.warn(`Slow request: ${req.path} took ${duration}ms`);
    }
  });
  
  next();
};
```

### Compression

**File**: `src/server.ts`

```typescript
import compression from 'compression';

app.use(compression({
  level: 6,        // Compression level (0-9)
  threshold: 1024  // Only compress > 1KB
}));
```

**Impact**: 250KB JSON → 25KB compressed (10x smaller)

---

## Monitoring

### Health Check

**File**: `src/routes/health.ts`

```typescript
router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});
```

### Metrics Endpoint

**File**: `src/routes/metrics.ts`

Returns:
- Request counts (total, success, errors)
- Response times (avg, p50, p95, p99)
- Active connections
- Memory usage
- Uptime

```bash
curl http://localhost:3001/api/metrics
```

---

## Performance Best Practices

### Code Level

1. **Use Async/Await Efficiently**
   - Run independent operations in parallel
   - Use `Promise.all()` for concurrent requests

2. **Avoid Blocking Operations**
   - Use async file I/O
   - Don't use `fs.readFileSync()`

3. **Database Optimization**
   - Add indexes for frequent queries
   - Select only needed fields
   - Use batch operations
   - Implement pagination

### Configuration

```dotenv
# Cluster mode for multi-core
CLUSTER_MODE=true
MAX_WORKERS=4

# Memory limits
NODE_OPTIONS=--max-old-space-size=512

# Performance monitoring
ENABLE_PERFORMANCE_LOGGING=true
ENABLE_MEMORY_MONITORING=true
```

### Database

```dotenv
# Connection pool
DATABASE_URL="postgresql://user:pass@host:5432/db?connection_limit=20"

# Production: Enable SSL
DATABASE_URL="postgresql://user:pass@host:5432/db?sslmode=require"
```

---

## Load Testing

### Check Performance

```bash
# Simple load test with Apache Bench
ab -n 10000 -c 100 http://localhost:3001/api/health

# Results to look for:
# - Requests per second: > 500
# - Time per request: < 200ms (mean)
# - Failed requests: 0
```

### Monitor During Load

```bash
# Terminal 1: Run server
pnpm start:cluster

# Terminal 2: Monitor processes
ps aux | grep node

# Terminal 3: Load test
ab -n 10000 -c 100 http://localhost:3001/api/health

# Check metrics
curl http://localhost:3001/api/metrics
```

---

## Troubleshooting

### Slow Response Times

**Check**:
1. Slow query logs (enable Prisma logging)
2. Missing indexes
3. N+1 query problems
4. Blocking operations

**Fix**:
- Add database indexes
- Optimize queries
- Use `Promise.all()` for parallel operations
- Enable cluster mode

### High Memory Usage

**Check**:
```bash
# Monitor memory
NODE_OPTIONS=--expose-gc node --heap-prof dist/index.js
```

**Fix**:
- Set memory limits
- Check for memory leaks
- Use streams for large data
- Clear unused caches

### Low Throughput

**Check**:
1. Is cluster mode enabled?
2. Are workers utilizing all CPU cores?
3. Database connection pool size

**Fix**:
- Enable cluster mode
- Increase connection pool
- Optimize slow endpoints

---

## Performance Checklist

### Development
- [ ] Profile slow endpoints
- [ ] Test with realistic data volumes
- [ ] Monitor memory usage

### Pre-Production
- [ ] Database indexes verified
- [ ] Connection pool configured
- [ ] Cluster mode tested
- [ ] Compression enabled
- [ ] Load testing completed

### Production
- [ ] Cluster mode enabled (if applicable)
- [ ] Memory limits set
- [ ] Performance monitoring enabled
- [ ] Metrics endpoint accessible
- [ ] Health checks configured

---

**Last Review**: December 13, 2025  
**Performance SLA**: 95% of requests < 200ms