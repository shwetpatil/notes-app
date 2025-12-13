# Production Features Guide

This guide covers the production-ready features implemented in the notes application backend.

## Table of Contents

1. [API Documentation with Swagger](#api-documentation-with-swagger)
2. [Error Tracking with Sentry](#error-tracking-with-sentry)
3. [Advanced Rate Limiting](#advanced-rate-limiting)
4. [Quick Start](#quick-start)
5. [Configuration](#configuration)
6. [Monitoring & Troubleshooting](#monitoring--troubleshooting)

---

## API Documentation with Swagger

### Overview

The API documentation is automatically generated using **Swagger/OpenAPI 3.0** specification. This provides:

- Interactive API testing interface
- Complete endpoint documentation
- Request/response schemas
- Authentication requirements
- Rate limit information

### Accessing Swagger UI

Once the server is running, visit:

```
http://localhost:4000/api-docs
```

**Features:**
- 🎨 Clean, modern UI
- 🧪 Try-it-out functionality
- 📋 Copy-paste ready examples
- 🔒 Authentication support
- 📊 Response schema visualization

### Swagger JSON Specification

Get the raw OpenAPI spec for tools like Postman:

```
http://localhost:4000/api-docs.json
```

### Adding Documentation to Routes

Use JSDoc comments with Swagger annotations:

```typescript
/**
 * @swagger
 * /api/v1/notes:
 *   post:
 *     summary: Create a new note
 *     tags: [Notes]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - content
 *             properties:
 *               title:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 255
 *               content:
 *                 type: string
 *     responses:
 *       201:
 *         description: Note created successfully
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.post('/', async (req, res) => {
  // Implementation
});
```

### Available Components

The Swagger configuration defines reusable schemas:

- **User**: User object with id, email, createdAt
- **Note**: Note object with title, content, tags, folder
- **Folder**: Folder organization structure
- **Pagination**: Standard pagination metadata
- **SearchResult**: Search result with relevance ranking
- **Error**: Standard error response format

### API Tags/Categories

- **Authentication**: Login, register, logout, session management
- **Notes**: CRUD operations for notes
- **Search**: Full-text search and suggestions
- **Folders**: Folder organization
- **Sharing**: Collaborative features
- **Templates**: Note templates
- **Export**: Export to various formats
- **Health**: Health check and metrics

---

## Error Tracking with Sentry

### Overview

**Sentry** provides comprehensive error tracking and performance monitoring for production environments.

### Features

✅ **Automatic Error Capture**: All unhandled errors are captured  
✅ **Performance Monitoring**: Track slow requests and bottlenecks  
✅ **Release Tracking**: Associate errors with specific deployments  
✅ **User Context**: Identify which users are affected  
✅ **Breadcrumbs**: Understand the sequence of events leading to errors  
✅ **Data Scrubbing**: Sensitive data is automatically removed  

### Setup

1. **Create Sentry Account**:
   - Sign up at https://sentry.io
   - Create a new project
   - Copy your DSN (Data Source Name)

2. **Configure Environment**:

```bash
# .env
SENTRY_DSN=https://your-sentry-dsn@sentry.io/your-project-id
SENTRY_ENVIRONMENT=production
SENTRY_TRACES_SAMPLE_RATE=0.1  # 10% of requests
SENTRY_PROFILES_SAMPLE_RATE=0.1  # 10% of requests
```

3. **Sentry automatically initializes** when the server starts (if DSN is configured)

### Using Sentry in Code

#### Capture Custom Errors

```typescript
import { captureError } from '../config/sentry';

try {
  await riskyOperation();
} catch (error) {
  captureError(error, {
    tags: { operation: 'data-sync' },
    level: 'error',
  });
  throw error;
}
```

#### Capture Messages

```typescript
import { captureMessage } from '../config/sentry';

captureMessage('User performed unusual action', {
  level: 'warning',
  tags: { action: 'bulk-delete' },
});
```

#### Set User Context

```typescript
import { setUserContext } from '../config/sentry';

// After authentication
setUserContext({
  id: user.id,
  email: user.email,
  username: user.email.split('@')[0],
});
```

#### Add Breadcrumbs

```typescript
import { addBreadcrumb } from '../config/sentry';

addBreadcrumb({
  category: 'database',
  message: 'Executing complex query',
  level: 'info',
  data: { queryType: 'aggregation' },
});
```

### Data Privacy

Sentry automatically scrubs:
- Cookies
- Authorization headers
- Password fields
- API tokens
- Session data

This is configured in `src/config/sentry.ts`:

```typescript
beforeSend(event) {
  // Remove sensitive data
  if (event.request?.cookies) {
    event.request.cookies = '[Filtered]';
  }
  if (event.request?.headers?.authorization) {
    event.request.headers.authorization = '[Filtered]';
  }
  return event;
}
```

### Performance Monitoring

Track request performance:

```typescript
// Automatic tracing is enabled by default
// Every HTTP request is traced with duration
// Slow queries are flagged automatically
```

View in Sentry Dashboard:
- Response time percentiles (p50, p75, p95, p99)
- Slowest endpoints
- Database query performance
- External API call duration

### Sample Rates

**Traces Sample Rate**: Controls what percentage of requests are traced for performance monitoring

- **Development**: 100% (`1.0`) - trace everything
- **Production**: 10% (`0.1`) - balance between insights and overhead

**Profiles Sample Rate**: Controls what percentage of traced requests include CPU profiling

- **Development**: 100% (`1.0`) - profile everything  
- **Production**: 10% (`0.1`) - minimize performance impact

### Testing Sentry Integration

```bash
# Trigger a test error
curl -X POST http://localhost:4000/api/test-error

# Check Sentry dashboard at sentry.io for the error
```

---

## Advanced Rate Limiting

### Overview

Advanced Redis-backed rate limiting protects your API from abuse with distributed, production-ready limits.

### Why Redis-backed?

- **Distributed**: Works across multiple server instances
- **Fast**: Sub-millisecond rate limit checks
- **Accurate**: Precise tracking across all servers
- **Graceful Fallback**: Switches to memory if Redis is down

### Available Limiters

#### 1. Auth Rate Limiter (Strictest)

**Purpose**: Protect authentication endpoints from brute force attacks

```typescript
import { authRateLimiter } from '../middleware/rateLimiter';

router.post('/login', authRateLimiter, async (req, res) => {
  // Login logic
});
```

**Limits:**
- 5 attempts per 15 minutes
- Blocks for 15 minutes after exceeding
- Applied to: `/login`, `/register`, `/reset-password`

#### 2. API Rate Limiter (Standard)

**Purpose**: General API protection for normal use

```typescript
import { apiRateLimiter } from '../middleware/rateLimiter';

router.get('/notes', apiRateLimiter, async (req, res) => {
  // Notes logic
});
```

**Limits:**
- 100 requests per minute
- Blocks for 1 minute after exceeding
- Applied to: Most API endpoints

#### 3. Strict Rate Limiter

**Purpose**: Protect expensive operations

```typescript
import { strictRateLimiter } from '../middleware/rateLimiter';

router.post('/export/pdf', strictRateLimiter, async (req, res) => {
  // PDF generation logic
});
```

**Limits:**
- 10 requests per minute
- Blocks for 5 minutes after exceeding
- Applied to: Export, bulk operations

#### 4. Search Rate Limiter

**Purpose**: Balance between usability and database load

```typescript
import { searchRateLimiter } from '../middleware/rateLimiter';

router.get('/search', searchRateLimiter, async (req, res) => {
  // Search logic
});
```

**Limits:**
- 30 requests per minute
- Blocks for 1 minute after exceeding
- Applied to: Search, autocomplete

#### 5. Custom Rate Limiter

**Purpose**: Create custom limits for specific needs

```typescript
import { customRateLimiter } from '../middleware/rateLimiter';

const imageUploadLimiter = customRateLimiter({
  points: 5,
  duration: 3600, // 1 hour
  blockDuration: 7200, // 2 hours
  keyPrefix: 'img-upload',
});

router.post('/upload', imageUploadLimiter, async (req, res) => {
  // Upload logic
});
```

#### 6. User-Specific Rate Limiter

**Purpose**: Implement per-user custom limits

```typescript
import { userRateLimiter } from '../middleware/rateLimiter';

// Premium users get 1000 requests/hour
const premiumLimiter = userRateLimiter(1000, 3600);

router.get('/premium/feature', premiumLimiter, async (req, res) => {
  // Premium feature
});
```

### Rate Limit Headers

All rate-limited responses include headers:

```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 73
X-RateLimit-Reset: 1640000000
Retry-After: 60
```

### Rate Limit Key Strategy

**Authenticated Users**: Uses user ID from session

```typescript
key = `rl:${userId}:${keyPrefix}`
```

**Anonymous Users**: Uses IP address

```typescript
key = `rl:${ipAddress}:${keyPrefix}`
```

### Redis Connection Handling

**Connected**: Uses Redis for distributed rate limiting

```
[Rate Limiter] Redis connected for distributed rate limiting
```

**Disconnected**: Falls back to memory storage

```
[Rate Limiter] Switched to memory rate limiting (Redis unavailable)
```

**Auto-Recovery**: Automatically switches back when Redis reconnects

```
[Rate Limiter] Redis reconnected - reinitializing distributed rate limiters
```

### Monitoring Rate Limits

Check Redis for rate limit data:

```bash
# Connect to Redis
docker exec -it notes-redis redis-cli

# View all rate limit keys
KEYS "rl:*"

# Check specific user's limits
KEYS "rl:user:123:*"

# Get current count
GET "rl:user:123:api"

# Get TTL (time until reset)
TTL "rl:user:123:api"
```

### Customizing Limits

Edit `src/middleware/rateLimiter.ts`:

```typescript
export const authRateLimiter = createRateLimiter({
  points: 5,              // Increase/decrease attempts
  duration: 900,          // Change time window (seconds)
  blockDuration: 900,     // Change block duration (seconds)
  keyPrefix: 'auth',      // Unique identifier
});
```

### Testing Rate Limits

```bash
# Test auth rate limiter (should block after 5 requests)
for i in {1..6}; do
  curl -X POST http://localhost:4000/api/v1/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"test@example.com","password":"wrong"}' \
    -i | grep -E "HTTP|Retry-After"
done

# Test API rate limiter
for i in {1..101}; do
  curl http://localhost:4000/api/v1/notes \
    -H "Cookie: connect.sid=your-session" \
    -s -o /dev/null -w "%{http_code}\n"
done | sort | uniq -c
```

---

## Quick Start

### Prerequisites

1. **Redis Running** (for rate limiting and caching):

```bash
docker run --name notes-redis -p 6379:6379 -d redis:7-alpine
```

2. **Sentry Account** (optional but recommended):
   - Sign up at https://sentry.io
   - Create a project
   - Get your DSN

### Configuration

```bash
# Copy environment template
cp .env.example .env

# Edit .env with your settings
nano .env
```

**Minimum Configuration**:

```env
# Required
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/notes_db"
SESSION_SECRET=your-secret-key-change-this
REDIS_URL=redis://localhost:6379

# Recommended for production
SENTRY_DSN=https://your-dsn@sentry.io/project-id
NODE_ENV=production
```

### Starting the Server

```bash
# Install dependencies
pnpm install

# Run database migrations
pnpm prisma:migrate

# Start server
pnpm dev
```

### Verify Features

1. **Swagger Documentation**:
   ```bash
   open http://localhost:4000/api-docs
   ```

2. **Rate Limiting**:
   ```bash
   # Should return 429 after 5 attempts
   for i in {1..6}; do
     curl -X POST http://localhost:4000/api/v1/auth/login \
       -H "Content-Type: application/json" \
       -d '{"email":"test","password":"test"}' \
       -i | grep HTTP
   done
   ```

3. **Sentry** (if configured):
   - Check dashboard at sentry.io
   - Trigger test error: `curl -X POST http://localhost:4000/api/test-error`

---

## Configuration

### Environment Variables

#### Swagger Configuration

```env
# No configuration needed - automatically enabled
# Access at: http://localhost:4000/api-docs
```

#### Sentry Configuration

```env
# Required
SENTRY_DSN=https://examplePublicKey@o0.ingest.sentry.io/0

# Optional
SENTRY_ENVIRONMENT=production           # Environment name
SENTRY_TRACES_SAMPLE_RATE=0.1           # 10% of requests traced
SENTRY_PROFILES_SAMPLE_RATE=0.1         # 10% of traces profiled
SENTRY_RELEASE=v1.0.0                   # Release version
```

#### Rate Limiting Configuration

```env
# Redis connection (required for distributed limiting)
REDIS_URL=redis://localhost:6379

# Or with authentication:
REDIS_URL=redis://:password@host:port

# Or Redis Cloud:
REDIS_URL=redis://username:password@endpoint:port
```

### Code Configuration

#### Swagger (`src/config/swagger.ts`)

- Modify OpenAPI info (title, version, description)
- Add/remove security schemes
- Define additional schemas
- Customize servers

#### Sentry (`src/config/sentry.ts`)

- Adjust sample rates
- Add custom integrations
- Modify data scrubbing rules
- Add before-send hooks

#### Rate Limiting (`src/middleware/rateLimiter.ts`)

- Create new rate limiters
- Adjust points/duration
- Modify key prefixes
- Add custom logic

---

## Monitoring & Troubleshooting

### Swagger Issues

**Problem**: Swagger UI not loading

```bash
# Check if server is running
curl http://localhost:4000/api-docs

# Verify swagger dependencies installed
pnpm list swagger-ui-express swagger-jsdoc
```

**Problem**: Missing endpoints in documentation

- Ensure JSDoc comments use proper `@swagger` format
- Check that route files are in `./src/routes/*.ts`
- Restart server after adding documentation

### Sentry Issues

**Problem**: Errors not appearing in Sentry

```bash
# Verify DSN is set
echo $SENTRY_DSN

# Check logs for Sentry initialization
pnpm dev | grep -i sentry

# Test with manual error
curl -X POST http://localhost:4000/api/test-error
```

**Problem**: Too many events consuming quota

- Reduce `SENTRY_TRACES_SAMPLE_RATE` (default: 0.1)
- Reduce `SENTRY_PROFILES_SAMPLE_RATE` (default: 0.1)
- Add filters in Sentry dashboard

**Problem**: Sensitive data in error reports

- Check `beforeSend` hook in `src/config/sentry.ts`
- Add fields to scrub list
- Use `denyUrls` to exclude endpoints

### Rate Limiting Issues

**Problem**: Rate limits not working

```bash
# Check Redis connection
docker ps | grep redis

# Test Redis connectivity
redis-cli ping
# Should return: PONG

# Check logs
pnpm dev | grep -i "rate limit"
```

**Problem**: Users blocked unexpectedly

```bash
# Check current limits in Redis
docker exec -it notes-redis redis-cli

redis> KEYS "rl:*"
redis> GET "rl:user:123:api"
redis> TTL "rl:user:123:api"

# Clear specific user's limits
redis> DEL "rl:user:123:api"
```

**Problem**: Rate limiting not distributed

- Verify `REDIS_URL` is set correctly
- Check Redis connection in logs
- Ensure all servers connect to same Redis instance

### Health Checks

```bash
# Server health
curl http://localhost:4000/health

# Redis health
redis-cli ping

# Check rate limiter mode
curl http://localhost:4000/api/v1/auth/login -i | grep "X-RateLimit"
# If present, rate limiting is active
```

### Performance Monitoring

**Sentry Dashboard**:
- Navigate to Performance section
- Check transaction duration (p50, p95, p99)
- Identify slow endpoints
- Review CPU profiles

**Redis Monitoring**:

```bash
# Connect to Redis
redis-cli

# Monitor commands in real-time
redis> MONITOR

# Get info
redis> INFO stats

# Check memory usage
redis> MEMORY STATS
```

### Logs Analysis

```bash
# View production logs with Pino pretty-printing
pnpm dev | pnpm exec pino-pretty

# Filter for errors
pnpm dev | grep -i error

# Filter for rate limit events
pnpm dev | grep -i "rate limit"

# Filter for Sentry events
pnpm dev | grep -i sentry
```

---

## Production Checklist

Before deploying to production:

### Security
- [ ] Change `SESSION_SECRET` to cryptographically secure value
- [ ] Set `NODE_ENV=production`
- [ ] Configure proper `CORS_ORIGIN`
- [ ] Enable HTTPS
- [ ] Review rate limiting values for your use case

### Sentry
- [ ] Create Sentry project
- [ ] Set `SENTRY_DSN`
- [ ] Set `SENTRY_ENVIRONMENT=production`
- [ ] Adjust sample rates based on traffic
- [ ] Configure release tracking
- [ ] Set up alerts in Sentry dashboard

### Rate Limiting
- [ ] Redis instance running and accessible
- [ ] `REDIS_URL` configured correctly
- [ ] Rate limits tested under load
- [ ] Custom limits configured for business logic
- [ ] Monitoring alerts set up for blocked IPs

### Documentation
- [ ] All endpoints documented with Swagger
- [ ] Test Swagger UI with various requests
- [ ] Share API docs URL with frontend team
- [ ] Keep schemas in sync with actual responses

### Monitoring
- [ ] Sentry dashboard configured
- [ ] Redis monitoring set up
- [ ] Performance baselines established
- [ ] Alert thresholds configured
- [ ] On-call rotation defined

---

## Additional Resources

### Documentation
- [Swagger/OpenAPI Specification](https://swagger.io/specification/)
- [Sentry Node.js SDK](https://docs.sentry.io/platforms/node/)
- [rate-limiter-flexible](https://github.com/animir/node-rate-limiter-flexible)

### Related Guides
- [Advanced Features Guide](./ADVANCED_FEATURES.md) - Redis caching, WebSockets, Full-text search
- [Security Guide](./SECURITY.md) - Security best practices
- [Deployment Guide](./DEPLOYMENT.md) - Production deployment strategies

### Support
- For issues: Check GitHub Issues
- For questions: See project README
- For updates: Follow CHANGELOG.md

---

**Last Updated**: December 2024  
**Version**: 1.0.0
