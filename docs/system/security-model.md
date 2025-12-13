# Security Documentation

Comprehensive security implementation and best practices for the notes application.

**Last Updated**: December 12, 2025  
**Security Review Status**: ✅ Enhanced (December 2025)

---

## Security Overview

### Security Posture

The application implements **defense-in-depth** security with multiple protection layers:

```
┌─────────────────────────────────────────┐
│  1. Network Security                    │
│     - HTTPS/TLS                         │
│     - Security Headers                  │
│     - CORS Policy                       │
└─────────────────────────────────────────┘
            ↓
┌─────────────────────────────────────────┐
│  2. Application Security                │
│     - Authentication                    │
│     - Session Management                │
│     - Rate Limiting                     │
└─────────────────────────────────────────┘
            ↓
┌─────────────────────────────────────────┐
│  3. Data Security                       │
│     - Input Validation                  │
│     - XSS Protection                    │
│     - SQL Injection Prevention          │
└─────────────────────────────────────────┘
            ↓
┌─────────────────────────────────────────┐
│  4. Infrastructure Security             │
│     - Database Security                 │
│     - Secure Deployment                 │
│     - Monitoring & Logging              │
└─────────────────────────────────────────┘
```

---

## 🔐 Authentication & Authorization

### Password Security

**Implementation**: Bcrypt hashing with salt rounds

**Code**: `apps/backend/src/routes/auth.ts`

```typescript
import bcrypt from 'bcrypt';

// Registration - Hash password
const hashedPassword = await bcrypt.hash(password, 12);

// Login - Verify password
const validPassword = await bcrypt.compare(password, user.password);
```

**Security Features**:
- ✅ **Salt rounds**: 12 (industry standard)
- ✅ **No plaintext storage**: Passwords always hashed
- ✅ **One-way hashing**: Cannot reverse to plaintext
- ✅ **Timing-safe comparison**: Prevents timing attacks

**Password Requirements**:
- Minimum 8 characters
- No maximum (Bcrypt handles up to 72 bytes)
- No complexity requirements (encourages passphrases)

**Recommendations for users**:
- Use unique passwords (password manager)
- Minimum 12+ characters
- Mix of letters, numbers, symbols

---

### Session Management

**Implementation**: express-session with secure configuration

**Code**: `apps/backend/src/server.ts`

```typescript
app.use(
  session({
    secret: process.env.SESSION_SECRET!,
    name: 'notes-session',        // Custom name (not "connect.sid")
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,              // Prevent JavaScript access
      secure: process.env.NODE_ENV === 'production',  // HTTPS only
      sameSite: 'strict',          // CSRF protection
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    },
    store: new PrismaSessionStore(prisma, {
      checkPeriod: 2 * 60 * 1000,  // Cleanup every 2 minutes
    }),
  })
);
```

**Security Features**:
- ✅ **HttpOnly cookies**: No client-side JavaScript access
- ✅ **Secure flag**: HTTPS-only transmission (production)
- ✅ **SameSite strict**: Prevents CSRF attacks
- ✅ **Custom session name**: Obscures tech stack
- ✅ **Session expiry**: 24h default, 30d with "Remember Me"
- ✅ **Database storage**: Sessions in PostgreSQL, not memory
- ✅ **Session rotation**: New session ID on login

**Session Secret**:
```bash
# Generate secure secret (32+ characters)
openssl rand -base64 32

# Store in .env (never commit!)
SESSION_SECRET=your-generated-secret-here
```

**Best Practices**:
- Rotate SESSION_SECRET every 3-6 months
- Use different secrets for dev/staging/production
- Store in environment variables, not code
- Minimum 32 characters, random

---

### Account Lockout

**Implementation**: Failed login attempt tracking

**Database Fields** (`prisma/schema.prisma`):
```prisma
model User {
  failedLoginAttempts Int      @default(0)
  accountLockedUntil  DateTime?
  lastLoginAt         DateTime?
}
```

**Code**: `apps/backend/src/routes/auth.ts`

```typescript
// Check if account is locked
if (user.accountLockedUntil && user.accountLockedUntil > new Date()) {
  return res.status(403).json({ 
    error: 'Account temporarily locked. Try again later.' 
  });
}

// Invalid password - increment attempts
const newFailedAttempts = user.failedLoginAttempts + 1;
if (newFailedAttempts >= 5) {
  // Lock account for 15 minutes
  await prisma.user.update({
    where: { id: user.id },
    data: {
      failedLoginAttempts: newFailedAttempts,
      accountLockedUntil: new Date(Date.now() + 15 * 60 * 1000),
    },
  });
}

// Successful login - reset attempts
await prisma.user.update({
  where: { id: user.id },
  data: {
    failedLoginAttempts: 0,
    accountLockedUntil: null,
    lastLoginAt: new Date(),
  },
});
```

**Configuration**:
- **Threshold**: 5 failed attempts
- **Lockout duration**: 15 minutes
- **Reset**: On successful login
- **Notification**: Generic error message (no enumeration)

**User Experience**:
- Clear error after lockout
- No indication of valid vs. invalid email
- Lockout expires automatically
- No admin intervention needed

---

### Authorization

**Implementation**: Ownership-based access control

**Middleware**: `apps/backend/src/middleware/auth.ts`

```typescript
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.session.userId) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  next();
}
```

**Resource Access**: `apps/backend/src/routes/notes.ts`

```typescript
// Verify note ownership
const note = await prisma.note.findFirst({
  where: {
    id: noteId,
    userId: req.session.userId,  // Only owner's notes
  },
});

if (!note) {
  return res.status(404).json({ error: 'Note not found' });
}
```

**Authorization Rules**:
- ✅ Users can only access their own notes
- ✅ No admin/role system (single-tenant design)
- ✅ Session required for all authenticated routes
- ✅ Ownership verified on every operation

---

## 🛡️ Input Validation & Sanitization

### Validation Layer

**Implementation**: Zod schema validation

**Code**: `packages/types/src/index.ts`

```typescript
import { z } from 'zod';

export const registerSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export const noteSchema = z.object({
  title: z.string().min(1).max(255),
  content: z.string(),
  color: z.enum(['red', 'orange', 'yellow', 'green', 'blue', 'purple', 'pink']).nullable(),
  isFavorite: z.boolean().default(false),
  tags: z.array(z.string()).default([]),
});
```

**Validation Points**:
1. **Client-side**: Form validation (UX improvement)
2. **Server-side**: Zod validation (security enforcement)
3. **Database**: Prisma type checking (data integrity)

**Benefits**:
- ✅ Type safety (TypeScript)
- ✅ Runtime validation
- ✅ Consistent validation logic
- ✅ Detailed error messages

---

### XSS Protection

**Implementation**: xss package for content sanitization

**Code**: `apps/backend/src/middleware/sanitize.ts`

```typescript
import xss from 'xss';

export function sanitizeMarkdown(content: string): string {
  return xss(content, {
    whiteList: {
      // Allowed HTML tags for markdown
      p: [], br: [], strong: [], em: [], u: [],
      h1: [], h2: [], h3: [], h4: [], h5: [], h6: [],
      ul: [], ol: [], li: [],
      a: ['href', 'title', 'target'],
      code: ['class'], pre: [],
      blockquote: [], hr: [],
      table: [], thead: [], tbody: [], tr: [], th: [], td: [],
    },
    stripIgnoreTag: true,      // Remove unknown tags
    stripIgnoreTagBody: ['script', 'style'],  // Remove script/style content
  });
}
```

**Usage**: `apps/backend/src/routes/notes.ts`

```typescript
import { sanitizeMarkdown } from '../middleware/sanitize';

// Sanitize on create/update
const sanitizedContent = sanitizeMarkdown(content);

await prisma.note.create({
  data: {
    content: sanitizedContent,
    // ...
  },
});
```

**Protection Against**:
- ✅ `<script>` tag injection
- ✅ `onerror` attribute attacks
- ✅ JavaScript protocol URLs (`javascript:`)
- ✅ `<iframe>` embedding
- ✅ Style-based attacks

**Example Attack Prevention**:
```javascript
// Malicious input
const input = '<img src=x onerror=alert(1)>';

// Sanitized output
const output = '<img src="x">';  // onerror removed
```

---

### NoSQL Injection Prevention

**Implementation**: express-mongo-sanitize

**Code**: `apps/backend/src/server.ts`

```typescript
import mongoSanitize from 'express-mongo-sanitize';

app.use(mongoSanitize());  // Removes $ and . from req.body
```

**Protection**: Prevents MongoDB operator injection

**Example Attack Prevention**:
```javascript
// Malicious input
{
  "email": { "$ne": null },
  "password": { "$ne": null }
}

// Sanitized (operators removed)
{
  "email": "null",
  "password": "null"
}
```

**Note**: Using Prisma (PostgreSQL) also prevents SQL injection via parameterized queries.

---

### SQL Injection Prevention

**Implementation**: Prisma ORM (parameterized queries)

**Safe Code**:
```typescript
// Automatic parameterization
const user = await prisma.user.findUnique({
  where: { email: userInput },  // Safe - parameterized
});
```

**Unsafe Code** (avoided):
```typescript
// NEVER do this!
await prisma.$queryRaw`SELECT * FROM User WHERE email = '${userInput}'`;
// Vulnerable to SQL injection
```

**Protection**:
- ✅ All queries parameterized
- ✅ No raw SQL (except explicitly marked)
- ✅ Type-safe query builder
- ✅ Prepared statements

---

## 🌐 Network Security

### HTTPS/TLS

**Status**: Enforced in production

**Implementation**:
- **Development**: HTTP (localhost only)
- **Production**: HTTPS (automatic via Vercel/Render)
- **Certificates**: Let's Encrypt (auto-renewal)

**Configuration**: `apps/backend/src/server.ts`

```typescript
const cookieConfig = {
  secure: process.env.NODE_ENV === 'production',  // HTTPS only in prod
  // ...
};
```

**Enforcement**:
```typescript
// Redirect HTTP to HTTPS in production
if (process.env.NODE_ENV === 'production' && req.headers['x-forwarded-proto'] !== 'https') {
  return res.redirect(`https://${req.headers.host}${req.url}`);
}
```

---

### Security Headers

**Implementation**: Helmet.js

**Code**: `apps/backend/src/server.ts`

```typescript
import helmet from 'helmet';

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:', 'https:'],
      },
    },
    hsts: {
      maxAge: 31536000,          // 1 year
      includeSubDomains: true,
      preload: true,
    },
  })
);
```

**Headers Set**:
```
Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
Content-Security-Policy: default-src 'self'
X-Frame-Options: SAMEORIGIN
X-Content-Type-Options: nosniff
X-XSS-Protection: 1; mode=block
Referrer-Policy: strict-origin-when-cross-origin
```

**Protection Against**:
- ✅ Clickjacking (X-Frame-Options)
- ✅ MIME sniffing (X-Content-Type-Options)
- ✅ XSS (Content-Security-Policy)
- ✅ Downgrade attacks (HSTS)

---

### CORS Configuration

**Implementation**: Custom CORS policy

**Code**: `apps/backend/src/server.ts`

```typescript
app.use(
  cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,  // Allow cookies
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);
```

**Configuration**:
- **Development**: `http://localhost:3000`
- **Production**: `https://your-app.vercel.app`
- **Credentials**: Enabled (required for cookies)
- **Methods**: GET, POST, PUT, DELETE only

**Frontend Configuration**:
```typescript
fetch(url, {
  credentials: 'include',  // Send cookies cross-origin
});
```

---

### Rate Limiting

**Implementation**: express-rate-limit

**Code**: `apps/backend/src/routes/auth.ts`

```typescript
import rateLimit from 'express-rate-limit';

// Strict limiter for authentication endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutes
  max: 5,                     // 5 requests per window
  message: 'Too many login attempts, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

router.post('/login', authLimiter, async (req, res) => { ... });
router.post('/register', authLimiter, async (req, res) => { ... });
```

**Global Rate Limit**: `apps/backend/src/server.ts`

```typescript
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutes
  max: 100,                   // 100 requests per window
  message: 'Too many requests, please try again later.',
});

app.use(generalLimiter);
```

**Rate Limits**:
| Endpoint Type | Limit | Window | Response |
|---------------|-------|--------|----------|
| Auth (login/register) | 5 requests | 15 min | 429 Too Many Requests |
| General API | 100 requests | 15 min | 429 Too Many Requests |

**Headers Returned**:
```
X-RateLimit-Limit: 5
X-RateLimit-Remaining: 3
X-RateLimit-Reset: 1702394100000
Retry-After: 900
```

**Protection Against**:
- ✅ Brute force attacks
- ✅ Credential stuffing
- ✅ DoS/DDoS attempts
- ✅ API abuse

---

## 🗄️ Database Security

### Connection Security

**Production Connection String**:
```
postgresql://user:pass@host:5432/db?sslmode=require
```

**Security Features**:
- ✅ **SSL/TLS encryption**: `sslmode=require`
- ✅ **Connection pooling**: Prisma automatic
- ✅ **Environment variables**: Credentials not in code
- ✅ **Limited privileges**: Database user has minimal permissions

**Prisma Configuration**:
```typescript
const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error'] : ['error'],
});
```

---

### Data Encryption

**At Rest**:
- ✅ Database encryption (Neon/Supabase default)
- ✅ Backup encryption
- ✅ Passwords hashed (bcrypt)

**In Transit**:
- ✅ HTTPS (client ↔ server)
- ✅ SSL (server ↔ database)
- ✅ TLS 1.2+ minimum

**Not Encrypted**:
- Note content (stored as plaintext)
- User emails (needed for queries)

**Future**: End-to-end encryption option for notes

---

### Soft Deletes

**Implementation**: Logical deletion (not physical)

**Schema**:
```prisma
model Note {
  isDeleted Boolean @default(false)
}
```

**Benefits**:
- ✅ Accidental delete recovery
- ✅ Audit trail
- ✅ No data loss
- ✅ Retention policy compliance

**Queries**:
```typescript
// Exclude deleted notes
const notes = await prisma.note.findMany({
  where: {
    userId: userId,
    isDeleted: false,  // Always filter
  },
});

// Include trash
const trash = await prisma.note.findMany({
  where: { userId, isDeleted: true },
});
```

---

## 🚨 Attack Prevention

### Brute Force Protection

**Layers**:
1. **Rate limiting**: 5 auth attempts / 15 min
2. **Account lockout**: 5 failed logins = 15 min lock
3. **Generic errors**: No email enumeration

**Example Flow**:
```
Attempt 1-4: Invalid credentials
Attempt 5: Account locked for 15 minutes
Attempt 6+: "Account temporarily locked" (403)
After 15 min: Attempts reset, can try again
```

---

### CSRF Protection

**Implementation**: SameSite cookie attribute

**Configuration**:
```typescript
cookie: {
  sameSite: 'strict',  // Don't send cookies cross-site
}
```

**Why Effective**:
- Cookies not sent from other sites
- Forms from other sites can't authenticate
- No CSRF token needed (SameSite replaces it)

**Limitations**:
- Requires same-site frontend/backend (or CORS)
- Not supported in very old browsers (<5%)

---

### Session Hijacking Prevention

**Protections**:
1. **HttpOnly cookies**: No JavaScript access
2. **Secure flag**: HTTPS-only transmission
3. **Short expiry**: 24h default
4. **Session rotation**: New ID on login
5. **IP binding** (future): Track session IP

**Best Practices**:
- Always use HTTPS in production
- Logout on shared computers
- Clear cookies on logout
- Implement "Logout all devices" (future)

---

### Clickjacking Prevention

**Implementation**: X-Frame-Options header

**Configuration**:
```typescript
helmet({
  frameguard: { action: 'sameorigin' },  // Can't iframe from other sites
});
```

**Result**: Application can't be embedded in malicious iframes

---

## 🔍 Security Monitoring

### Logging

**Current Implementation**: Console logging

**Logged Events**:
- ✅ Server startup
- ✅ Authentication attempts
- ✅ Failed logins
- ✅ Account lockouts
- ✅ Rate limit violations
- ✅ Database errors
- ✅ Unhandled exceptions

**Example**:
```typescript
console.log(`[AUTH] Login attempt for email: ${email}`);
console.log(`[AUTH] Failed login attempt ${attempts}/5 for user ${userId}`);
console.error('[ERROR] Database connection failed:', error);
```

**Future**: Structured logging with Winston/Pino

---

### Error Handling

**Security Principle**: Never expose internal details

**Implementation**:
```typescript
try {
  // Operation
} catch (error) {
  console.error('Internal error:', error);  // Log details
  res.status(500).json({ 
    error: 'Server error' // Generic user message
  });
}
```

**Examples**:
```typescript
// ❌ Bad: Exposes implementation
res.status(500).json({ error: error.message });

// ✅ Good: Generic message
res.status(500).json({ error: 'Server error' });

// ✅ Good: Safe validation errors
res.status(400).json({ error: 'Invalid email format' });
```

---

### Monitoring Setup (Future)

**Recommended Tools**:

1. **Sentry** (error tracking):
   - Real-time error alerts
   - Stack traces
   - User impact analysis

2. **LogRocket** (session replay):
   - User session recording
   - Console logs
   - Network requests

3. **UptimeRobot** (uptime monitoring):
   - 5-minute checks
   - Email/SMS alerts
   - Response time tracking

---

## 🛠️ Security Best Practices

### Development

- [ ] Never commit `.env` files
- [ ] Use `.env.example` for templates
- [ ] Different secrets for dev/prod
- [ ] Keep dependencies updated
- [ ] Run `pnpm audit` regularly
- [ ] Use TypeScript strict mode
- [ ] Enable ESLint security rules

**Commands**:
```bash
# Check for vulnerabilities
pnpm audit

# Fix auto-fixable issues
pnpm audit fix

# Update dependencies
pnpm update --latest
```

---

### Production

- [ ] HTTPS enforced everywhere
- [ ] Strong SESSION_SECRET (32+ chars)
- [ ] Rate limiting enabled
- [ ] Security headers configured
- [ ] Database backups enabled
- [ ] Monitoring/alerting setup
- [ ] Regular security reviews
- [ ] Incident response plan

**Checklist**: See [DEPLOYMENT.md](./DEPLOYMENT.md) security section

---

### Code Review Checklist

When reviewing code for security:

**Authentication**:
- [ ] Passwords hashed (never plaintext)
- [ ] Session management secure
- [ ] Authorization checks present

**Input Validation**:
- [ ] All inputs validated (Zod schemas)
- [ ] Content sanitized (XSS protection)
- [ ] SQL injection prevented (Prisma)

**API Security**:
- [ ] Rate limiting on sensitive endpoints
- [ ] Ownership verification
- [ ] Generic error messages

**Dependencies**:
- [ ] No known vulnerabilities (`pnpm audit`)
- [ ] Minimal dependencies
- [ ] Trusted packages only

---

## 📋 Security Incidents

### Response Plan

**1. Identify**:
- Monitor logs for suspicious activity
- User reports of unusual behavior
- Automated alerts (Sentry/monitoring)

**2. Contain**:
- Identify affected systems/users
- Isolate compromised components
- Block malicious IPs (rate limiting)

**3. Eradicate**:
- Patch vulnerabilities
- Update affected dependencies
- Rotate compromised secrets

**4. Recover**:
- Deploy fixes
- Verify system integrity
- Restore from backups if needed

**5. Learn**:
- Document incident
- Update security measures
- Communicate with users

---

### Contact

**Security Issues**: Report to security@yourapp.com (setup required)

**PGP Key**: (setup required for encrypted reports)

---

## 🔄 Security Roadmap

### Implemented ✅

- [x] Password hashing (bcrypt)
- [x] Session management
- [x] Account lockout
- [x] Rate limiting
- [x] XSS protection
- [x] SQL injection prevention
- [x] HTTPS/TLS
- [x] Security headers
- [x] CORS configuration
- [x] Input validation

### Planned 📋

#### Phase 2
- [ ] Two-factor authentication (2FA)
- [ ] Email verification
- [ ] Password reset flow
- [ ] Security notifications (login alerts)

#### Phase 3
- [ ] OAuth integration (Google, GitHub)
- [ ] IP-based session binding
- [ ] Device fingerprinting
- [ ] Advanced logging (Sentry)

#### Phase 4
- [ ] End-to-end encryption (notes)
- [ ] Zero-knowledge architecture
- [ ] Security audit (professional)
- [ ] Penetration testing

---

**Last Review**: December 12, 2025  
**Next Review**: March 12, 2026 (quarterly)

