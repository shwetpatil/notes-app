# Backend Debugging Guide

**Purpose**: Tools and techniques for debugging the notes application backend.

**Last Updated**: December 13, 2025

---

## Table of Contents

1. [Development Tools](#development-tools)
2. [Debugging with VSCode](#debugging-with-vscode)
3. [API Testing](#api-testing)
4. [Database Debugging](#database-debugging)
5. [Logging](#logging)
6. [Performance Profiling](#performance-profiling)
7. [Common Issues](#common-issues)
8. [Production Debugging](#production-debugging)

---

## Development Tools

### Node.js Inspector

```bash
# Start with inspect flag
node --inspect src/index.ts

# Or with breakpoints
node --inspect-brk src/index.ts

# Chrome DevTools: chrome://inspect
```

### pnpm Scripts

```bash
# Development with auto-reload
pnpm dev

# Production mode
pnpm start

# Run tests
pnpm test

# Database operations
pnpm prisma studio  # GUI for database
pnpm prisma migrate dev
```

---

## Debugging with VSCode

### Launch Configuration

```json
// .vscode/launch.json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "Debug Backend",
      "runtimeExecutable": "pnpm",
      "runtimeArgs": ["dev"],
      "cwd": "${workspaceFolder}/apps/backend",
      "console": "integratedTerminal",
      "internalConsoleOptions": "neverOpen",
      "skipFiles": ["<node_internals>/**"]
    },
    {
      "type": "node",
      "request": "launch",
      "name": "Debug Tests",
      "runtimeExecutable": "pnpm",
      "runtimeArgs": ["test"],
      "cwd": "${workspaceFolder}/apps/backend",
      "console": "integratedTerminal"
    }
  ]
}
```

### Breakpoints

```typescript
// 1. Click left margin in VSCode to add breakpoint
// 2. Or add debugger statement
router.get('/notes', async (req, res) => {
  debugger; // Execution pauses here
  const notes = await prisma.note.findMany();
  res.json({ data: notes });
});

// 3. Start debugging (F5)
// 4. Inspect variables in Debug panel
```

---

## API Testing

### cURL

```bash
# GET request
curl http://localhost:3001/api/notes \
  -H "Cookie: sessionId=abc123"

# POST request
curl -X POST http://localhost:3001/api/notes \
  -H "Content-Type: application/json" \
  -H "Cookie: sessionId=abc123" \
  -d '{"title":"Test Note","content":"Content"}'

# With verbose output
curl -v http://localhost:3001/api/health
```

### HTTPie (Better than cURL)

```bash
# Install
brew install httpie

# GET request
http GET :3001/api/notes Cookie:sessionId=abc123

# POST request (auto-detects JSON)
http POST :3001/api/notes \
  title="Test Note" \
  content="Content" \
  Cookie:sessionId=abc123
```

### Thunder Client (VSCode Extension)

```
1. Install Thunder Client extension
2. New Request → POST
3. URL: http://localhost:3001/api/notes
4. Headers: Cookie: sessionId=abc123
5. Body (JSON):
   {
     "title": "Test",
     "content": "Content"
   }
6. Send
```

### Postman

```
1. Import OpenAPI spec: http://localhost:3001/api-docs.json
2. Auto-generates all endpoints
3. Set Cookie header for authentication
4. Test requests
```

---

## Database Debugging

### Prisma Studio

```bash
# Launch GUI
cd apps/backend
pnpm prisma studio

# Opens at: http://localhost:5555
# - Browse all tables
# - Edit records
# - Filter and search
```

### Prisma Logging

```typescript
// src/config/prisma.ts
import { PrismaClient } from '@prisma/client';

export const prisma = new PrismaClient({
  log: [
    { level: 'query', emit: 'event' },
    { level: 'error', emit: 'stdout' },
    { level: 'warn', emit: 'stdout' },
  ],
});

// Log all SQL queries
prisma.$on('query', (e) => {
  console.log('Query:', e.query);
  console.log('Params:', e.params);
  console.log('Duration:', e.duration + 'ms');
});
```

### psql (PostgreSQL CLI)

```bash
# Connect to database
psql $DATABASE_URL

# Or
psql -h localhost -U postgres -d notes_db

# Useful commands:
\dt              # List tables
\d notes         # Describe notes table
\d+ notes        # Detailed table info

SELECT * FROM "Note" LIMIT 10;
SELECT * FROM "User" WHERE email = 'test@example.com';
SELECT * FROM "Session" WHERE "userId" = 'user-123';
```

### Database Queries

```sql
-- Check note count per user
SELECT "userId", COUNT(*) as count 
FROM "Note" 
GROUP BY "userId" 
ORDER BY count DESC;

-- Find slow queries (if slow_query_log enabled)
SELECT * FROM pg_stat_statements 
ORDER BY total_time DESC 
LIMIT 10;

-- Check database size
SELECT pg_database.datname, 
       pg_size_pretty(pg_database_size(pg_database.datname)) AS size 
FROM pg_database;
```

---

## Logging

### Enable Debug Logs

```bash
# Set log level
export LOG_LEVEL=debug
pnpm dev

# Or in .env
LOG_LEVEL=debug
```

### Structured Logging

```typescript
import { logger } from './config/logger';

// Add context to logs
const requestLogger = logger.child({
  requestId: req.id,
  userId: req.session?.user?.id,
});

requestLogger.debug({ query }, 'Executing database query');
requestLogger.info('Request processed successfully');
requestLogger.error({ err }, 'Request failed');
```

### View Logs

```bash
# Development: console output
pnpm dev

# Production: pm2 logs
pm2 logs backend

# Follow logs
pm2 logs backend --lines 100
```

---

## Performance Profiling

### Node.js Profiler

```bash
# Generate CPU profile
node --prof src/index.ts

# Process profile
node --prof-process isolate-*.log > processed.txt

# Analyze: look for hot functions
```

### Clinic.js

```bash
# Install
npm install -g clinic

# Profile performance
clinic doctor -- node src/index.ts

# Flame graph
clinic flame -- node src/index.ts

# Bubbleprof
clinic bubbleprof -- node src/index.ts

# Opens HTML report in browser
```

### API Response Time

```typescript
// Middleware to log response time
app.use((req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info({
      method: req.method,
      url: req.url,
      status: res.statusCode,
      duration: `${duration}ms`,
    }, 'Request completed');
  });
  
  next();
});
```

### Database Query Performance

```typescript
// Prisma query timing
const start = Date.now();
const notes = await prisma.note.findMany();
const duration = Date.now() - start;
logger.debug({ duration: `${duration}ms` }, 'Query executed');
```

---

## Common Issues

### Issue: Port Already in Use

**Error**: `EADDRINUSE: address already in use :::3001`

**Debug**:
```bash
# Find process using port
lsof -i :3001

# Kill process
kill -9 <PID>

# Or use different port
PORT=3002 pnpm dev
```

---

### Issue: Database Connection Failed

**Error**: `Can't reach database server at localhost:5432`

**Debug**:
```bash
# Check PostgreSQL running
pg_isready

# Start PostgreSQL
brew services start postgresql@14

# Check connection
psql -h localhost -U postgres -c "SELECT 1"

# Verify DATABASE_URL in .env
echo $DATABASE_URL
```

---

### Issue: Session Not Persisting

**Symptom**: User logged out after every request

**Debug**:
```typescript
// Check session configuration
console.log('Session config:', {
  secret: !!process.env.SESSION_SECRET,
  secure: app.get('trust proxy'),
  httpOnly: true,
  sameSite: 'strict',
});

// Check session in database
SELECT * FROM "Session" ORDER BY "expiresAt" DESC LIMIT 10;

// Check cookie sent from client
console.log('Cookies:', req.headers.cookie);
```

**Fix**:
- Ensure SESSION_SECRET set in .env
- Check cookie settings (secure, httpOnly, sameSite)
- Verify CORS allows credentials

---

### Issue: Prisma Migration Conflicts

**Error**: `Migration failed to apply`

**Debug**:
```bash
# Check migration status
pnpm prisma migrate status

# Reset database (dev only)
pnpm prisma migrate reset

# Generate migration without applying
pnpm prisma migrate dev --create-only

# Apply specific migration
pnpm prisma migrate deploy
```

---

### Issue: Memory Leak

**Symptom**: Memory usage grows over time

**Debug**:
```bash
# Monitor memory
node --expose-gc --inspect src/index.ts

# Chrome DevTools: Take heap snapshots
# Memory → Take snapshot
# Compare snapshots over time

# Look for:
# - Growing arrays/objects
# - Unclosed database connections
# - Event listeners not removed
```

**Common Causes**:
- Prisma connections not closed
- WebSocket connections not cleaned up
- Large objects in memory cache

---

## Production Debugging

### Remote Logging

```bash
# SSH to server
ssh user@server

# View logs
pm2 logs backend --lines 1000

# Follow logs
pm2 logs backend -f

# Log files location
tail -f /var/log/notes-backend.log
```

### Sentry

```typescript
// Errors automatically sent to Sentry
// View at: sentry.io/[org]/[project]

// Add breadcrumbs for context
Sentry.addBreadcrumb({
  message: 'User action',
  data: { userId, action: 'delete_note' },
});

// Manual error capture
try {
  await riskyOperation();
} catch (error) {
  Sentry.captureException(error, {
    extra: { userId, noteId },
  });
}
```

### Health Check

```bash
# Check if server running
curl http://localhost:3001/api/health

# Expected response:
# {
#   "success": true,
#   "message": "API is healthy",
#   "timestamp": "2025-12-13T..."
# }
```

### Database Connection Pool

```typescript
// Check active connections
const metrics = await prisma.$metrics.json();
console.log('Database connections:', metrics.counters);

// Check for connection leaks
setInterval(async () => {
  const activeConnections = await prisma.$queryRaw`
    SELECT count(*) FROM pg_stat_activity 
    WHERE datname = 'notes_db'
  `;
  logger.info({ connections: activeConnections }, 'Active DB connections');
}, 60000); // Every minute
```

---

## Debug Helpers

### Environment Info

```typescript
// Log environment on startup
logger.info({
  nodeVersion: process.version,
  platform: process.platform,
  env: process.env.NODE_ENV,
  port: process.env.PORT,
  database: !!process.env.DATABASE_URL,
  redis: !!process.env.REDIS_URL,
}, 'Server environment');
```

### Request Logger

```typescript
// Log all requests in development
if (process.env.NODE_ENV === 'development') {
  app.use((req, res, next) => {
    console.log(`${req.method} ${req.url}`, {
      body: req.body,
      query: req.query,
      params: req.params,
    });
    next();
  });
}
```

---

## Tools Summary

| Tool | Purpose | Command |
|------|---------|---------|
| Node Inspector | Debugging | `node --inspect` |
| VSCode Debugger | Breakpoints | F5 |
| Prisma Studio | Database GUI | `pnpm prisma studio` |
| HTTPie | API testing | `http :3001/api/notes` |
| pm2 | Process management | `pm2 logs` |
| psql | Database CLI | `psql $DATABASE_URL` |
| Clinic.js | Performance | `clinic doctor` |
| Sentry | Error tracking | Dashboard |

---

**See Also**:
- [Architecture](../system/architecture.md)
- [Testing Guide](../development/testing.md)
- [Deployment Guide](../system/deployment.md)
