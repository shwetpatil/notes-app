# Authentication & Authorization

**Authentication and Authorization Implementation for Notes Application Backend**

---

## Overview

**Authentication Strategy:** Session-based authentication with HttpOnly cookies  
**Password Hashing:** bcrypt with 12 rounds  
**Session Store:** Prisma (development) / Redis (production recommended)  
**Account Security:** Rate limiting, account lockout, failed attempt tracking

---

## Authentication Flow

### 1. User Registration

**Endpoint:** `POST /api/auth/register`

**Request:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123",
  "name": "John Doe"
}
```

**Process:**
```typescript
1. Validate input (Zod schema)
   ├─ Email format validation
   ├─ Password min length (8 chars)
   └─ Name optional

2. Check existing user
   ├─ Query: SELECT * FROM User WHERE email = ?
   └─ Return 409 if exists

3. Hash password
   ├─ bcrypt.hash(password, 12)
   ├─ 12 rounds = ~300ms compute time
   └─ Salt automatically generated

4. Create user
   ├─ INSERT INTO User (id, email, password, name, ...)
   └─ Return user object (without password)

5. Create session
   ├─ req.session.user = { id, email, name }
   ├─ Save session to store
   └─ Set connect.sid cookie

6. Return response
   └─ { success: true, data: { user } }
```

**Response (Success):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "clx123456789",
      "email": "user@example.com",
      "name": "John Doe",
      "createdAt": "2025-12-13T10:00:00.000Z"
    }
  }
}
```

**Headers:**
```
Set-Cookie: connect.sid=s%3A...; Path=/; HttpOnly; SameSite=Strict
```

---

### 2. User Login

**Endpoint:** `POST /api/auth/login`

**Request:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123",
  "rememberMe": true
}
```

**Process:**
```typescript
1. Rate limit check
   ├─ Max 5 login attempts per 15 minutes per IP
   └─ Return 429 if exceeded

2. Validate input
   ├─ Email format
   └─ Password present

3. Find user by email
   ├─ SELECT * FROM User WHERE email = ?
   └─ Return 401 if not found (generic error)

4. Check account lockout
   ├─ if (user.accountLockedUntil > now())
   │   └─ Return 423 "Account locked. Try again in X minutes"
   └─ else continue

5. Verify password
   ├─ bcrypt.compare(plainPassword, hashedPassword)
   ├─ Returns true/false
   └─ Takes ~300ms (constant time)

6a. If password INVALID:
   ├─ Increment failedLoginAttempts
   ├─ If attempts >= 5:
   │   └─ Set accountLockedUntil = now() + 15 minutes
   └─ Return 401 "Invalid credentials"

6b. If password VALID:
   ├─ Reset failedLoginAttempts to 0
   ├─ Clear accountLockedUntil
   ├─ Update lastLoginAt to now()
   ├─ Create session with maxAge:
   │   ├─ rememberMe=true: 30 days
   │   └─ rememberMe=false: 24 hours
   └─ Return user data
```

**Response (Success):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "clx123456789",
      "email": "user@example.com",
      "name": "John Doe",
      "lastLoginAt": "2025-12-13T10:05:00.000Z"
    }
  }
}
```

**Response (Account Locked):**
```json
{
  "success": false,
  "error": "Account locked. Try again in 12 minutes."
}
```

---

### 3. Session Verification

**Middleware:** `requireAuth`

**Process:**
```typescript
1. Express session middleware runs first
   ├─ Read connect.sid cookie
   ├─ Decrypt with SESSION_SECRET
   ├─ Load session from store (Prisma/Redis)
   ├─ Check expiresAt > now()
   └─ Attach to req.session

2. requireAuth middleware
   ├─ Check if req.session.user exists
   ├─ If NO: Return 401 "Authentication required"
   └─ If YES: Call next() to proceed

3. Route handler has access to:
   ├─ req.session.user.id
   ├─ req.session.user.email
   └─ req.session.user.name
```

**Usage in Route:**
```typescript
// Protect route with requireAuth
router.get('/api/notes', requireAuth, async (req, res) => {
  const userId = req.session.user.id;
  const notes = await prisma.note.findMany({
    where: { userId }
  });
  res.json({ success: true, data: notes });
});
```

---

### 4. Logout

**Endpoint:** `POST /api/auth/logout`

**Process:**
```typescript
1. requireAuth check (must be authenticated)

2. Destroy session
   ├─ req.session.destroy()
   ├─ DELETE FROM Session WHERE sid = ?
   └─ Clear cookie

3. Return success
```

**Response:**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

**Headers:**
```
Set-Cookie: connect.sid=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT
```

---

## Authorization (Access Control)

### Row-Level Security

**Principle:** Users can only access their own data

```typescript
// ✅ Correct: Filter by userId
const notes = await prisma.note.findMany({
  where: { 
    userId: req.session.user.id  // Enforce ownership
  }
});

// ❌ Wrong: No ownership check
const notes = await prisma.note.findMany();  // Returns ALL users' notes!
```

### Note Access Authorization

```typescript
// Get single note (check ownership)
router.get('/api/notes/:id', requireAuth, async (req, res) => {
  const note = await prisma.note.findFirst({
    where: {
      id: req.params.id,
      userId: req.session.user.id  // Must belong to this user
    }
  });
  
  if (!note) {
    return res.status(404).json({
      success: false,
      error: 'Note not found'
    });
  }
  
  res.json({ success: true, data: note });
});

// Update note (check ownership)
router.put('/api/notes/:id', requireAuth, async (req, res) => {
  const note = await prisma.note.updateMany({
    where: {
      id: req.params.id,
      userId: req.session.user.id  // Only update if owner
    },
    data: req.body
  });
  
  if (note.count === 0) {
    return res.status(404).json({
      success: false,
      error: 'Note not found or unauthorized'
    });
  }
  
  res.json({ success: true });
});
```

---

## Security Mechanisms

### 1. Password Security

**Hashing with bcrypt:**
```typescript
import bcrypt from 'bcrypt';

// Registration: Hash password
const hashedPassword = await bcrypt.hash(plainPassword, 12);
// 12 rounds = 2^12 = 4096 iterations
// Takes ~300ms (intentionally slow to prevent brute force)

await prisma.user.create({
  data: {
    email,
    password: hashedPassword,
    name
  }
});

// Login: Verify password
const user = await prisma.user.findUnique({ where: { email } });
const isValid = await bcrypt.compare(plainPassword, user.password);
// Returns true/false
// Takes ~300ms (constant time, prevents timing attacks)
```

**Why bcrypt?**
- Adaptive (can increase rounds as hardware improves)
- Salt automatically generated and stored with hash
- Constant-time comparison (prevents timing attacks)
- Industry standard (OWASP recommended)

**Password Requirements:**
```typescript
const passwordSchema = z.string()
  .min(8, 'Password must be at least 8 characters')
  .max(128, 'Password too long')
  .regex(/[a-zA-Z]/, 'Password must contain letters')
  .regex(/[0-9]/, 'Password must contain numbers');
```

---

### 2. Account Lockout

**Protection:** Prevents brute force attacks

```typescript
const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes

// On failed login
const updatedUser = await prisma.user.update({
  where: { id: user.id },
  data: {
    failedLoginAttempts: { increment: 1 },
    accountLockedUntil: 
      user.failedLoginAttempts + 1 >= MAX_LOGIN_ATTEMPTS
        ? new Date(Date.now() + LOCKOUT_DURATION)
        : null
  }
});

// On successful login
await prisma.user.update({
  where: { id: user.id },
  data: {
    failedLoginAttempts: 0,
    accountLockedUntil: null,
    lastLoginAt: new Date()
  }
});
```

**Lockout Check:**
```typescript
if (user.accountLockedUntil && user.accountLockedUntil > new Date()) {
  const remainingMinutes = Math.ceil(
    (user.accountLockedUntil.getTime() - Date.now()) / 60000
  );
  return res.status(423).json({
    success: false,
    error: `Account locked. Try again in ${remainingMinutes} minute(s).`
  });
}
```

---

### 3. Rate Limiting

**IP-based rate limiting:**

```typescript
import rateLimit from 'express-rate-limit';

// Auth endpoints (stricter)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutes
  max: 5,                     // 5 requests per window
  message: 'Too many authentication attempts. Try again later.',
  standardHeaders: true,      // Return rate limit info in headers
  legacyHeaders: false,
  skip: (req) => req.session?.user !== undefined  // Skip if authenticated
});

app.use('/api/auth', authLimiter);

// General API (less strict)
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,                   // 100 requests per window
  message: 'Too many requests. Try again later.'
});

app.use('/api', apiLimiter);
```

**Headers returned:**
```
RateLimit-Limit: 5
RateLimit-Remaining: 4
RateLimit-Reset: 1702467600
```

---

### 4. Session Security

**Session Configuration:**
```typescript
import session from 'express-session';
import { PrismaSessionStore } from '@quixo3/prisma-session-store';

app.use(
  session({
    store: new PrismaSessionStore(prisma, {
      checkPeriod: 2 * 60 * 1000,  // Cleanup expired sessions every 2 minutes
      dbRecordIdIsSessionId: true,
      dbRecordIdFunction: undefined
    }),
    secret: process.env.SESSION_SECRET!,  // HMAC key for signing
    resave: false,                        // Don't save if unmodified
    saveUninitialized: false,             // Don't create session until something stored
    name: 'connect.sid',                  // Cookie name
    cookie: {
      httpOnly: true,                     // No JavaScript access (XSS protection)
      secure: process.env.NODE_ENV === 'production',  // HTTPS only in production
      sameSite: 'strict',                 // CSRF protection
      maxAge: 24 * 60 * 60 * 1000,       // 24 hours (or 30 days with rememberMe)
      path: '/'
    }
  })
);
```

**Session Data Structure:**
```typescript
// req.session object
{
  cookie: {
    originalMaxAge: 86400000,
    expires: "2025-12-14T10:00:00.000Z",
    httpOnly: true,
    path: "/",
    secure: false,
    sameSite: "strict"
  },
  user: {
    id: "clx123456789",
    email: "user@example.com",
    name: "John Doe"
  }
}
```

**Session Lifecycle:**
```
1. Login → Create session
   ├─ Generate unique session ID
   ├─ Encrypt with SESSION_SECRET
   ├─ Store in database: { sid, data, expiresAt }
   └─ Set cookie: connect.sid=encrypted_sid

2. Request → Verify session
   ├─ Read cookie
   ├─ Decrypt sid
   ├─ Load from database
   ├─ Check expiresAt > now()
   └─ Attach to req.session

3. Activity → Extend session
   ├─ session.touch() updates expiresAt
   └─ Session stays alive while active

4. Logout → Destroy session
   ├─ DELETE FROM Session WHERE sid = ?
   └─ Clear cookie
```

---

### 5. CSRF Protection

**Strategy:** SameSite cookies + Origin checking

```typescript
// SameSite=strict in session cookie
cookie: {
  sameSite: 'strict'  // Blocks cross-site requests
}

// Additional: Check Origin/Referer header
app.use((req, res, next) => {
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
    const origin = req.get('Origin') || req.get('Referer');
    const allowedOrigin = process.env.CORS_ORIGIN;
    
    if (!origin || !origin.startsWith(allowedOrigin)) {
      return res.status(403).json({
        success: false,
        error: 'Invalid request origin'
      });
    }
  }
  next();
});
```

---

## TypeScript Type Safety

### Session Types

```typescript
// src/types/session.d.ts
import 'express-session';

declare module 'express-session' {
  interface SessionData {
    user?: {
      id: string;
      email: string;
      name: string | null;
    };
  }
}

// Now req.session.user is typed!
router.get('/api/notes', requireAuth, (req, res) => {
  const userId: string = req.session.user.id;  // Type-safe
  const email: string = req.session.user.email;
});
```

---

## Testing Authentication

### Test Helpers

```typescript
// src/__tests__/helpers.ts
export async function registerUser(userData: {
  email: string;
  password: string;
  name?: string;
}) {
  const response = await request(app)
    .post('/api/auth/register')
    .send(userData);
  
  const cookie = response.headers['set-cookie'][0];
  return { response, cookie };
}

export async function loginUser(credentials: {
  email: string;
  password: string;
  rememberMe?: boolean;
}) {
  const response = await request(app)
    .post('/api/auth/login')
    .send(credentials);
  
  const cookie = response.headers['set-cookie'][0];
  return { response, cookie };
}

export function authenticatedRequest(cookie: string) {
  return request(app).set('Cookie', cookie);
}
```

### Test Examples

```typescript
describe('Authentication', () => {
  it('should register new user', async () => {
    const { response } = await registerUser({
      email: 'test@example.com',
      password: 'SecurePass123',
      name: 'Test User'
    });
    
    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.data.user.email).toBe('test@example.com');
  });
  
  it('should login with valid credentials', async () => {
    // Register first
    await registerUser({
      email: 'test@example.com',
      password: 'SecurePass123'
    });
    
    // Then login
    const { response } = await loginUser({
      email: 'test@example.com',
      password: 'SecurePass123'
    });
    
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
  });
  
  it('should access protected route when authenticated', async () => {
    const { cookie } = await registerUser({
      email: 'test@example.com',
      password: 'SecurePass123'
    });
    
    const response = await authenticatedRequest(cookie)
      .get('/api/notes');
    
    expect(response.status).toBe(200);
  });
  
  it('should reject unauthenticated requests', async () => {
    const response = await request(app).get('/api/notes');
    
    expect(response.status).toBe(401);
    expect(response.body.error).toBe('Authentication required');
  });
});
```

---

## Security Best Practices Checklist

### Password Security
- [x] Hash passwords with bcrypt (12+ rounds)
- [x] Never store plain-text passwords
- [x] Enforce minimum password length (8+ chars)
- [x] Constant-time password comparison
- [ ] Future: Password strength meter (frontend)
- [ ] Future: Check against common passwords

### Session Security
- [x] HttpOnly cookies (no JavaScript access)
- [x] Secure flag in production (HTTPS only)
- [x] SameSite=strict (CSRF protection)
- [x] Strong SESSION_SECRET (32+ characters)
- [x] Session expiration (24h default, 30d with rememberMe)
- [ ] Future: Redis session store (production)
- [ ] Future: Session renewal on activity

### Access Control
- [x] Row-level security (filter by userId)
- [x] Ownership verification on updates/deletes
- [x] Generic error messages (prevent enumeration)
- [x] Rate limiting on auth endpoints
- [x] Account lockout (5 failed attempts)

### Attack Prevention
- [x] SQL injection (Prisma parameterized queries)
- [x] XSS (content sanitization)
- [x] CSRF (SameSite cookies)
- [x] Brute force (rate limiting + account lockout)
- [x] Timing attacks (constant-time comparison)
- [ ] Future: 2FA (TOTP)
- [ ] Future: Email verification

---

**Last Updated**: December 13, 2025  
**Auth Version**: 1.0
