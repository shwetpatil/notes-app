# Backend Security

**Stack**: Express.js + Prisma + PostgreSQL + bcrypt  
**Last Updated**: December 13, 2025

---

## Security Layers

### 1. Network Security

**Helmet.js** (`src/server.ts`)
```typescript
app.use(helmet({
  contentSecurityPolicy: { defaultSrc: ["'self'"] },
  hsts: { maxAge: 31536000, includeSubDomains: true }
}));
```

**CORS** (`src/server.ts`)
```typescript
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true
}));
```

**Rate Limiting**
- General API: 100 req/15min
- Auth endpoints: 5 req/15min (skip successful)

---

## Authentication

### Session-Based Auth

**File**: `src/routes/auth.ts`

**Registration**:
1. Validate with Zod schema
2. Check email uniqueness
3. Hash password: `bcrypt.hash(password, 12)`
4. Create user in database
5. Set session: `req.session.user = { id, email, name }`

**Login**:
1. Check if locked: `accountLockedUntil > now`
2. Find user by email  
3. Verify: `bcrypt.compare(password, hash)`
4. On failure: increment `failedLoginAttempts`, lock if >= 5
5. On success: reset attempts, update `lastLoginAt`, create session

**Logout**:
```typescript
req.session.destroy()
```

### Account Lockout

**Database Schema**:
```prisma
model User {
  failedLoginAttempts Int       @default(0)
  accountLockedUntil  DateTime?
  lastLoginAt         DateTime?
}
```

- **Max attempts**: 5
- **Lock duration**: 15 minutes
- **Auto-unlock**: After `accountLockedUntil` expires

---

## Authorization

**Middleware**: `src/middleware/auth.ts`

```typescript
export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  if (!req.session.user) {
    return res.status(401).json({ success: false, error: "Authentication required" });
  }
  next();
};
```

**Resource Ownership**: All note queries include `where: { userId }` to ensure users only access their own data.

---

## Session Management

**File**: `src/server.ts`

```typescript
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  name: 'sessionId',
  cookie: {
    httpOnly: true,              // Prevents XSS cookie theft
    secure: NODE_ENV === 'production',  // HTTPS only in production
    sameSite: 'strict',          // CSRF protection
    maxAge: 24 * 60 * 60 * 1000  // 24 hours
  }
}));
```

**Storage**: Memory (development), Redis recommended (production)

---

## Password Security

**Hashing**: bcrypt with 12 salt rounds  
**Location**: `src/routes/auth.ts`

```typescript
const SALT_ROUNDS = 12;
const hash = await bcrypt.hash(password, SALT_ROUNDS);
const isValid = await bcrypt.compare(password, user.password);
```

**Requirements** (enforced in frontend):
- Minimum 8 characters
- Validation via Zod schema

---

## Input Validation

**Zod Schemas** (`@notes/types`)

```typescript
// Login/Register
const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
});

// Note creation
const noteSchema = z.object({
  title: z.string().min(1).max(255),
  content: z.string(),
  tags: z.array(z.string()).optional()
});
```

**Sanitization** (`src/server.ts`):
```typescript
app.use(mongoSanitize());  // Removes $ and . from req.body
```

**Body Limits**:
```typescript
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));
```

---

## Attack Prevention

### SQL Injection
**Protection**: Prisma ORM (automatic parameterization)

All queries are safe by design:
```typescript
await prisma.user.findUnique({ where: { email } });  // Auto-escaped
```

### XSS (Cross-Site Scripting)
**Protection**:
- JSON API (no HTML rendering in backend)
- Frontend (React) auto-escapes output
- HttpOnly cookies (JavaScript can't access)

### CSRF (Cross-Site Request Forgery)
**Protection**:
- `sameSite: 'strict'` cookie attribute
- CORS origin restriction
- Credentials required for API calls

---

## Rate Limiting

**File**: `src/server.ts`, `src/routes/auth.ts`

**General API**:
```typescript
windowMs: 15 * 60 * 1000,  // 15 minutes
max: 100                    // requests per window
```

**Auth Endpoints**:
```typescript
windowMs: 15 * 60 * 1000,  // 15 minutes
max: 5,                     // requests per window
skipSuccessfulRequests: true // Don't count successful logins
```

---

## Database Security

### Connection
```dotenv
# Development
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/notes_db"

# Production (with SSL)
DATABASE_URL="postgresql://user:pass@host:5432/db?sslmode=require"
```

### Data Isolation
Every query filters by `userId`:
```typescript
const notes = await prisma.note.findMany({
  where: { userId: req.session.user!.id }  // Always filter by user
});
```

### Soft Deletes
```prisma
model Note {
  isTrashed Boolean   @default(false)
  trashedAt DateTime?
}
```

Notes moved to trash, not permanently deleted immediately.

---

## Security Headers

**File**: `src/server.ts`

Applied headers:
- `Content-Security-Policy`: Restricts resource loading
- `Strict-Transport-Security`: Forces HTTPS
- `X-Content-Type-Options: nosniff`: Prevents MIME sniffing
- `X-Frame-Options: DENY`: Prevents clickjacking

---

## Error Handling

**File**: `src/middleware/errorHandler.ts`

```typescript
export const errorHandler = (error, req, res, next) => {
  console.error('Error:', error);  // Log for debugging
  
  if (NODE_ENV === 'production') {
    return res.status(500).json({ error: 'An error occurred' });
  }
  
  // Development: show details
  return res.status(500).json({ error: error.message, stack: error.stack });
};
```

**Production**: Generic messages only  
**Development**: Detailed error info

---

## Environment Variables

**Required**:
```dotenv
DATABASE_URL="postgresql://..."
SESSION_SECRET="strong-random-secret"
CORS_ORIGIN="http://localhost:3000"
NODE_ENV="development" | "production"
```

**Generate strong secret**:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## Security Checklist

### Pre-Deployment
- [ ] Strong `SESSION_SECRET` (32+ chars)
- [ ] `DATABASE_URL` with SSL in production
- [ ] `NODE_ENV=production`
- [ ] `CORS_ORIGIN` set to production domain
- [ ] No secrets in code or Git
- [ ] Dependencies updated: `pnpm audit`

### Authentication
- [ ] bcrypt with 12+ salt rounds
- [ ] Account lockout enabled (5 attempts/15min)
- [ ] Session cookies: httpOnly, secure, sameSite
- [ ] `requireAuth` on all protected routes
- [ ] User ownership verified for all resources

### Security Headers
- [ ] Helmet.js configured
- [ ] HSTS enabled in production
- [ ] CSP policy defined

### Rate Limiting
- [ ] Auth endpoints: 5/15min
- [ ] API endpoints: 100/15min

### Input Validation
- [ ] Zod validation on all inputs
- [ ] Body size limits set (10MB)
- [ ] Sanitization enabled

### Database
- [ ] SSL connections in production
- [ ] All queries filter by `userId`
- [ ] Soft deletes enabled

### Error Handling
- [ ] Generic error messages in production
- [ ] No stack traces exposed
- [ ] Errors logged server-side

---

## Monitoring

**Health Check**: `GET /api/health`
```json
{
  "status": "ok",
  "timestamp": "2025-12-13T10:00:00.000Z",
  "uptime": 123456
}
```

**Metrics**: `GET /api/metrics`
- Request counts
- Response times
- Error rates
- Memory usage

---

**Last Review**: December 13, 2025  
**Next Review**: March 13, 2026