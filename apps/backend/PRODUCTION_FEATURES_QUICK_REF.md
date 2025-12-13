# Production Features - Quick Reference

Quick reference guide for Swagger, Sentry, and Advanced Rate Limiting.

## Swagger/OpenAPI Documentation

### Access Points

```bash
# Interactive UI
http://localhost:4000/api-docs

# JSON Specification
http://localhost:4000/api-docs.json
```

### Adding Documentation

```typescript
/**
 * @swagger
 * /api/v1/endpoint:
 *   post:
 *     summary: Endpoint description
 *     tags: [TagName]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - field1
 *             properties:
 *               field1:
 *                 type: string
 *     responses:
 *       200:
 *         description: Success response
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.post('/endpoint', async (req, res) => {
  // Implementation
});
```

### Available Schemas

- `User` - User object
- `Note` - Note object  
- `Folder` - Folder object
- `Pagination` - Pagination metadata
- `SearchResult` - Search result with ranking
- `Error` - Standard error format

### Available Responses

- `UnauthorizedError` (401)
- `NotFoundError` (404)
- `ValidationError` (400)
- `RateLimitError` (429)

---

## Sentry Error Tracking

### Configuration

```env
SENTRY_DSN=https://your-dsn@sentry.io/project-id
SENTRY_ENVIRONMENT=production
SENTRY_TRACES_SAMPLE_RATE=0.1
SENTRY_PROFILES_SAMPLE_RATE=0.1
```

### Usage Examples

#### Capture Errors

```typescript
import { captureError } from '../config/sentry';

try {
  await operation();
} catch (error) {
  captureError(error, {
    tags: { operation: 'db-query' },
    level: 'error',
  });
  throw error;
}
```

#### Capture Messages

```typescript
import { captureMessage } from '../config/sentry';

captureMessage('Important event occurred', {
  level: 'info',
  tags: { category: 'user-action' },
});
```

#### Set User Context

```typescript
import { setUserContext } from '../config/sentry';

setUserContext({
  id: user.id,
  email: user.email,
});
```

#### Add Breadcrumbs

```typescript
import { addBreadcrumb } from '../config/sentry';

addBreadcrumb({
  category: 'auth',
  message: 'User login attempt',
  level: 'info',
  data: { method: 'email' },
});
```

### Data Privacy

Automatically scrubbed:
- Cookies
- Authorization headers
- Password fields
- Tokens

---

## Advanced Rate Limiting

### Available Limiters

#### Auth Rate Limiter (Strictest)

```typescript
import { authRateLimiter } from '../middleware/rateLimiter';

router.post('/login', authRateLimiter, handler);
```

- **Limit**: 5 requests per 15 minutes
- **Block**: 15 minutes
- **Use for**: Login, register, password reset

#### API Rate Limiter (Standard)

```typescript
import { apiRateLimiter } from '../middleware/rateLimiter';

router.get('/notes', apiRateLimiter, handler);
```

- **Limit**: 100 requests per minute
- **Block**: 1 minute
- **Use for**: General API endpoints

#### Strict Rate Limiter

```typescript
import { strictRateLimiter } from '../middleware/rateLimiter';

router.post('/export/pdf', strictRateLimiter, handler);
```

- **Limit**: 10 requests per minute
- **Block**: 5 minutes
- **Use for**: Expensive operations

#### Search Rate Limiter

```typescript
import { searchRateLimiter } from '../middleware/rateLimiter';

router.get('/search', searchRateLimiter, handler);
```

- **Limit**: 30 requests per minute
- **Block**: 1 minute
- **Use for**: Search, autocomplete

#### Custom Rate Limiter

```typescript
import { customRateLimiter } from '../middleware/rateLimiter';

const myLimiter = customRateLimiter({
  points: 20,
  duration: 3600,
  blockDuration: 7200,
  keyPrefix: 'custom',
});

router.post('/special', myLimiter, handler);
```

#### User-Specific Rate Limiter

```typescript
import { userRateLimiter } from '../middleware/rateLimiter';

const premiumLimiter = userRateLimiter(1000, 3600);

router.get('/premium', premiumLimiter, handler);
```

### Rate Limit Headers

```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 73
X-RateLimit-Reset: 1640000000
Retry-After: 60
```

### Redis Commands

```bash
# View all rate limit keys
docker exec -it notes-redis redis-cli KEYS "rl:*"

# Check user's limit
docker exec -it notes-redis redis-cli GET "rl:user:123:api"

# Get TTL (time until reset)
docker exec -it notes-redis redis-cli TTL "rl:user:123:api"

# Clear user's limits
docker exec -it notes-redis redis-cli DEL "rl:user:123:api"
```

---

## Testing

### Test Swagger

```bash
# Open in browser
open http://localhost:4000/api-docs

# Get JSON spec
curl http://localhost:4000/api-docs.json | jq
```

### Test Sentry

```bash
# Trigger test error
curl -X POST http://localhost:4000/api/test-error

# Check dashboard
open https://sentry.io
```

### Test Rate Limiting

```bash
# Test auth limiter (blocks after 5)
for i in {1..6}; do
  curl -X POST http://localhost:4000/api/v1/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"test","password":"test"}' \
    -i | grep -E "HTTP|Retry-After"
  sleep 1
done

# Test API limiter  
for i in {1..5}; do
  curl http://localhost:4000/api/v1/notes \
    -H "Cookie: connect.sid=your-session" \
    -w "%{http_code}\n"
done
```

### Monitor Redis

```bash
# Real-time monitoring
docker exec -it notes-redis redis-cli MONITOR

# Stats
docker exec -it notes-redis redis-cli INFO stats

# Memory
docker exec -it notes-redis redis-cli MEMORY STATS
```

---

## Environment Variables Summary

```env
# Database
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/notes_db"

# Security
SESSION_SECRET=your-secret-key-change-this

# Redis (Required for rate limiting)
REDIS_URL=redis://localhost:6379

# Sentry (Recommended for production)
SENTRY_DSN=https://your-dsn@sentry.io/project-id
SENTRY_ENVIRONMENT=production
SENTRY_TRACES_SAMPLE_RATE=0.1
SENTRY_PROFILES_SAMPLE_RATE=0.1

# Server
BACKEND_PORT=4000
NODE_ENV=production
FRONTEND_URL=http://localhost:3000
CORS_ORIGIN=http://localhost:3000
```

---

## Troubleshooting

### Swagger not loading

```bash
# Check dependencies
pnpm list swagger-ui-express swagger-jsdoc

# Restart server
pnpm dev
```

### Sentry not capturing errors

```bash
# Verify DSN
echo $SENTRY_DSN

# Check logs
pnpm dev | grep -i sentry
```

### Rate limiting not working

```bash
# Check Redis
docker ps | grep redis
redis-cli ping

# Check logs
pnpm dev | grep -i "rate limit"
```

---

## Production Checklist

- [ ] Set `NODE_ENV=production`
- [ ] Change `SESSION_SECRET` to secure value
- [ ] Configure `SENTRY_DSN`
- [ ] Verify `REDIS_URL` is correct
- [ ] Test all endpoints in Swagger UI
- [ ] Verify rate limits under load
- [ ] Set up Sentry alerts
- [ ] Configure CORS for production domain
- [ ] Enable HTTPS
- [ ] Document custom rate limits

---

**For detailed documentation, see**: [PRODUCTION_FEATURES.md](./PRODUCTION_FEATURES.md)
