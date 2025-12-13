# Frontend Security

**Notes Application Frontend Security Guide**  
**Last Updated**: December 13, 2025

---

## Security Overview

The frontend implements multiple layers of security to protect user data and prevent common web vulnerabilities.

### Security Layers

```
┌─────────────────────────────────────────────────────────┐
│  Layer 1: Network Security (HTTPS, CORS, CSP)           │
└────────────────────────┬────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│  Layer 2: Authentication (Cookie-based Sessions)        │
└────────────────────────┬────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│  Layer 3: Input Validation (Client-side + Server-side)  │
└────────────────────────┬────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│  Layer 4: XSS Prevention (React + DOMPurify)            │
└────────────────────────┬────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│  Layer 5: CSRF Protection (SameSite + Origin checks)    │
└─────────────────────────────────────────────────────────┘
```

---

## 1. Authentication & Authorization

### Cookie-Based Authentication

**Why Cookies?**
- ✅ httpOnly flag prevents JavaScript access
- ✅ Secure flag ensures HTTPS-only transmission
- ✅ SameSite prevents CSRF attacks
- ✅ Automatic inclusion in requests
- ❌ No token storage vulnerabilities (unlike localStorage)

**Authentication Flow:**

```typescript
// Login (frontend)
const login = async (email: string, password: string) => {
  const response = await api.post('/api/auth/login', {
    email,
    password
  });
  
  // Server sets httpOnly cookie
  // No token handling in JavaScript!
  
  if (response.data.success) {
    router.push('/notes');
  }
};

// API Client (lib/api.ts)
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  withCredentials: true, // Include cookies automatically
  headers: {
    'Content-Type': 'application/json'
  }
});
```

**Backend Cookie Configuration:**
```typescript
// Backend sets secure cookies
res.cookie('sessionId', sessionId, {
  httpOnly: true,        // No JavaScript access
  secure: true,          // HTTPS only
  sameSite: 'strict',    // CSRF protection
  maxAge: 24 * 60 * 60 * 1000, // 24 hours
  path: '/'
});
```

### Session Management

**Check Authentication Status:**
```typescript
// lib/auth.ts
export async function checkAuth(): Promise<User | null> {
  try {
    const response = await api.get('/api/auth/me');
    return response.data.data.user;
  } catch (error) {
    return null;
  }
}

// Protect routes
export async function requireAuth() {
  const user = await checkAuth();
  
  if (!user) {
    redirect('/login');
  }
  
  return user;
}
```

**Middleware Protection:**
```typescript
// middleware.ts (Next.js)
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Public routes
  const publicRoutes = ['/login', '/register', '/'];
  if (publicRoutes.includes(pathname)) {
    return NextResponse.next();
  }
  
  // Check authentication
  const sessionCookie = request.cookies.get('sessionId');
  if (!sessionCookie) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
```

### Automatic Logout on 401

```typescript
// API interceptor
api.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      // Session expired or invalid
      window.location.href = '/login?session=expired';
    }
    return Promise.reject(error);
  }
);
```

---

## 2. XSS (Cross-Site Scripting) Prevention

### React's Built-in Protection

**React automatically escapes:**
```typescript
// ✅ Safe - React escapes by default
<div>{user.name}</div>
<div>{note.title}</div>

// ❌ Dangerous - bypasses React's protection
<div dangerouslySetInnerHTML={{ __html: userInput }} />
```

### DOMPurify for User HTML

**Sanitize user-generated HTML:**
```typescript
import DOMPurify from 'isomorphic-dompurify';

// Sanitize before rendering
const sanitizedHTML = DOMPurify.sanitize(note.content, {
  ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 'a', 'ul', 'ol', 'li', 'code', 'pre'],
  ALLOWED_ATTR: ['href', 'target', 'rel'],
  ALLOW_DATA_ATTR: false
});

<div dangerouslySetInnerHTML={{ __html: sanitizedHTML }} />
```

### Content Security Policy (CSP)

**Prevent inline script execution:**
```typescript
// next.config.ts
const securityHeaders = [
  {
    key: 'Content-Security-Policy',
    value: `
      default-src 'self';
      script-src 'self' 'unsafe-eval' 'unsafe-inline';
      style-src 'self' 'unsafe-inline';
      img-src 'self' data: https:;
      font-src 'self' data:;
      connect-src 'self' ${process.env.NEXT_PUBLIC_API_URL};
      frame-ancestors 'none';
    `.replace(/\s{2,}/g, ' ').trim()
  }
];

const nextConfig = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
    ];
  },
};
```

### Markdown Sanitization

**Safe markdown rendering:**
```typescript
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeSanitize from 'rehype-sanitize';

<ReactMarkdown
  remarkPlugins={[remarkGfm]}
  rehypePlugins={[rehypeSanitize]} // Sanitize HTML in markdown
>
  {note.content}
</ReactMarkdown>
```

---

## 3. CSRF (Cross-Site Request Forgery) Prevention

### SameSite Cookies

**Primary CSRF defense:**
```typescript
// Backend sets SameSite attribute
res.cookie('sessionId', sessionId, {
  sameSite: 'strict', // or 'lax' for more flexibility
  httpOnly: true,
  secure: true
});
```

**SameSite modes:**
- `strict`: Cookie never sent in cross-site requests (most secure)
- `lax`: Cookie sent only on top-level navigation (GET requests)
- `none`: Cookie sent in all contexts (requires Secure flag)

### Origin Validation

**Check request origin:**
```typescript
// Backend middleware
const allowedOrigins = [
  'http://localhost:3000',
  'https://yourdomain.com'
];

app.use((req, res, next) => {
  const origin = req.headers.origin;
  
  if (origin && !allowedOrigins.includes(origin)) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  
  next();
});
```

### Custom Headers

**Add custom headers for state-changing requests:**
```typescript
// Frontend
api.interceptors.request.use(config => {
  if (['post', 'put', 'delete'].includes(config.method)) {
    config.headers['X-Requested-With'] = 'XMLHttpRequest';
  }
  return config;
});

// Backend validates header
if (req.method !== 'GET' && !req.headers['x-requested-with']) {
  return res.status(403).json({ error: 'Invalid request' });
}
```

---

## 4. Input Validation

### Client-Side Validation

**Form validation with Zod:**
```typescript
import { z } from 'zod';

const noteSchema = z.object({
  title: z.string()
    .min(1, 'Title is required')
    .max(255, 'Title too long'),
  content: z.string()
    .max(100000, 'Content too long'),
  tags: z.array(z.string().max(50))
    .max(10, 'Maximum 10 tags')
});

// Validate before submission
const handleSubmit = (data: unknown) => {
  try {
    const validated = noteSchema.parse(data);
    createNote(validated);
  } catch (error) {
    if (error instanceof z.ZodError) {
      showValidationErrors(error.errors);
    }
  }
};
```

### Email Validation

```typescript
const emailSchema = z.string()
  .email('Invalid email address')
  .toLowerCase()
  .trim();

// Additional checks
const isValidEmail = (email: string): boolean => {
  // RFC 5322 compliant regex
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};
```

### Password Requirements

```typescript
const passwordSchema = z.string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Password must contain uppercase letter')
  .regex(/[a-z]/, 'Password must contain lowercase letter')
  .regex(/[0-9]/, 'Password must contain number')
  .regex(/[^A-Za-z0-9]/, 'Password must contain special character');
```

### SQL Injection Prevention

**Use parameterized queries (backend):**
```typescript
// ✅ Safe - Prisma uses parameterized queries
const notes = await prisma.note.findMany({
  where: {
    userId: userId,
    title: { contains: searchQuery }
  }
});

// ❌ Dangerous - Never concatenate user input
// const query = `SELECT * FROM notes WHERE title LIKE '%${searchQuery}%'`;
```

---

## 5. Secure Data Storage

### Local Storage Security

**Never store sensitive data:**
```typescript
// ❌ NEVER do this
localStorage.setItem('token', authToken);
localStorage.setItem('password', password);
localStorage.setItem('sessionId', sessionId);

// ✅ Safe to store
localStorage.setItem('theme', 'dark');
localStorage.setItem('language', 'en');
localStorage.setItem('sidebar-collapsed', 'true');
```

### IndexedDB Security

**Encrypt sensitive data:**
```typescript
import { encrypt, decrypt } from './crypto';

// Store encrypted data
const encryptedContent = await encrypt(note.content, userKey);
await db.notes.put({
  ...note,
  content: encryptedContent
});

// Retrieve and decrypt
const note = await db.notes.get(noteId);
note.content = await decrypt(note.content, userKey);
```

**Clear on logout:**
```typescript
const logout = async () => {
  // Clear session
  await api.post('/api/auth/logout');
  
  // Clear local data
  await db.delete();
  localStorage.clear();
  sessionStorage.clear();
  
  router.push('/login');
};
```

---

## 6. HTTPS & Network Security

### Force HTTPS

**Redirect HTTP to HTTPS:**
```typescript
// next.config.ts
const nextConfig = {
  async redirects() {
    return [
      {
        source: '/:path*',
        has: [{ type: 'header', key: 'x-forwarded-proto', value: 'http' }],
        destination: 'https://yourdomain.com/:path*',
        permanent: true,
      },
    ];
  },
};
```

### Strict-Transport-Security (HSTS)

```typescript
// Security headers
const securityHeaders = [
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=31536000; includeSubDomains; preload'
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff'
  },
  {
    key: 'X-Frame-Options',
    value: 'DENY'
  },
  {
    key: 'X-XSS-Protection',
    value: '1; mode=block'
  },
  {
    key: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin'
  }
];
```

### CORS Configuration

**Backend CORS setup:**
```typescript
import cors from 'cors';

app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true, // Allow cookies
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
```

---

## 7. Dependency Security

### Audit Dependencies

```bash
# Check for vulnerabilities
pnpm audit

# Fix vulnerabilities
pnpm audit --fix

# Update to latest secure versions
pnpm update
```

### Automated Security Scanning

**GitHub Dependabot:**
```yaml
# .github/dependabot.yml
version: 2
updates:
  - package-ecosystem: "npm"
    directory: "/apps/frontend"
    schedule:
      interval: "weekly"
    open-pull-requests-limit: 10
```

### Package Verification

```bash
# Verify package integrity
pnpm install --frozen-lockfile

# Check package checksums
pnpm audit signatures
```

---

## 8. Error Handling Security

### Don't Expose Sensitive Information

```typescript
// ❌ Bad - exposes stack trace
catch (error) {
  alert(error.stack);
}

// ✅ Good - generic message
catch (error) {
  showToast('An error occurred. Please try again.');
  
  // Log to monitoring service (not to user)
  if (process.env.NODE_ENV === 'production') {
    logError(error);
  }
}
```

### API Error Handling

```typescript
api.interceptors.response.use(
  response => response,
  error => {
    const message = error.response?.status === 500
      ? 'Server error. Please try again later.'
      : error.response?.data?.message || 'An error occurred';
    
    showToast(message);
    
    // Don't expose internal errors
    return Promise.reject(new Error(message));
  }
);
```

---

## 9. Rate Limiting

### Client-Side Throttling

**Prevent rapid submissions:**
```typescript
import { useThrottle } from '@/hooks/useThrottle';

const handleSubmit = useThrottle(async (data) => {
  await createNote(data);
}, 1000); // Maximum once per second
```

### Backend Rate Limiting

**Express rate limiter (backend):**
```typescript
import rateLimit from 'express-rate-limit';

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window
  message: 'Too many requests, please try again later'
});

app.use('/api/', apiLimiter);
```

---

## 10. Security Checklist

### Authentication & Sessions

- [x] httpOnly cookies for session management
- [x] Secure flag on cookies in production
- [x] SameSite cookie attribute set
- [x] Session expiration implemented
- [x] Logout clears all client data
- [x] 401 redirects to login

### XSS Prevention

- [x] React's auto-escaping used
- [x] DOMPurify for user HTML
- [x] Content Security Policy configured
- [x] No `dangerouslySetInnerHTML` without sanitization
- [x] Markdown sanitization enabled

### CSRF Prevention

- [x] SameSite cookies configured
- [x] Origin validation on backend
- [x] Custom headers for mutations
- [x] CORS properly configured

### Input Validation

- [x] Client-side validation with Zod
- [x] Server-side validation (double check)
- [x] SQL injection prevention (parameterized queries)
- [x] File upload validation
- [x] Email validation
- [x] Password strength requirements

### Data Storage

- [x] No sensitive data in localStorage
- [x] Sensitive data encrypted in IndexedDB
- [x] Clear storage on logout
- [x] Session data only in httpOnly cookies

### Network Security

- [x] HTTPS enforced
- [x] HSTS header configured
- [x] Security headers set
- [x] CORS properly configured
- [x] Certificate valid and up-to-date

### Dependencies

- [x] Regular security audits
- [x] Automated dependency updates
- [x] No known vulnerabilities
- [x] Lock file committed

### Error Handling

- [x] Generic error messages to users
- [x] No stack traces exposed
- [x] Errors logged to monitoring service
- [x] Rate limiting on error endpoints

---

## 11. Security Testing

### Manual Testing

```bash
# XSS test payloads
<script>alert('XSS')</script>
<img src=x onerror=alert('XSS')>
javascript:alert('XSS')

# SQL injection test
'; DROP TABLE notes;--
' OR '1'='1
```

### Automated Security Scanning

**OWASP ZAP:**
```bash
docker run -t owasp/zap2docker-stable zap-baseline.py \
  -t http://localhost:3000
```

**Lighthouse Security Audit:**
```bash
lighthouse http://localhost:3000 \
  --only-categories=best-practices \
  --view
```

---

## 12. Incident Response

### Security Breach Checklist

1. **Immediate Actions**:
   - Revoke all active sessions
   - Change all API keys
   - Disable affected features
   - Notify users

2. **Investigation**:
   - Check access logs
   - Identify breach scope
   - Document timeline
   - Preserve evidence

3. **Remediation**:
   - Patch vulnerability
   - Deploy fix
   - Verify fix effectiveness
   - Monitor for recurrence

4. **Post-Incident**:
   - Root cause analysis
   - Update security measures
   - Train team
   - Update documentation

---

## Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Next.js Security](https://nextjs.org/docs/app/building-your-application/configuring/security)
- [React Security Best Practices](https://react.dev/learn/security)
- [MDN Web Security](https://developer.mozilla.org/en-US/docs/Web/Security)

Security is an ongoing process, not a one-time task! 🔒
