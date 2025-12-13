# Backend Architecture

**Notes Application Backend Architecture**  
**Last Updated**: December 13, 2025

---

## System Overview

```
┌─────────────────────────────────────────────────────────┐
│                     Client (Browser)                     │
│              Frontend (Next.js - Port 3000)              │
└────────────────────────┬────────────────────────────────┘
                         │ HTTP/HTTPS
                         │ Cookies (Session)
                         ↓
┌─────────────────────────────────────────────────────────┐
│                Backend (Express.js - Port 3001)          │
│  ┌────────────────────────────────────────────────────┐ │
│  │  Middleware Layer                                  │ │
│  │  • Helmet (Security Headers)                       │ │
│  │  • CORS                                            │ │
│  │  • Rate Limiting                                   │ │
│  │  • Session Management                              │ │
│  │  • Body Parser                                     │ │
│  │  • Sanitization                                    │ │
│  └────────────────────────────────────────────────────┘ │
│                         ↓                                │
│  ┌────────────────────────────────────────────────────┐ │
│  │  Route Layer                                       │ │
│  │  • /api/auth (login, register, logout)            │ │
│  │  • /api/notes (CRUD operations)                   │ │
│  │  • /api/health (health check)                     │ │
│  │  • /api/metrics (performance metrics)             │ │
│  └────────────────────────────────────────────────────┘ │
│                         ↓                                │
│  ┌────────────────────────────────────────────────────┐ │
│  │  Business Logic                                    │ │
│  │  • Authentication (requireAuth middleware)        │ │
│  │  • Validation (Zod schemas)                       │ │
│  │  • Authorization (user ownership checks)          │ │
│  └────────────────────────────────────────────────────┘ │
│                         ↓                                │
│  ┌────────────────────────────────────────────────────┐ │
│  │  Data Access Layer (Prisma ORM)                   │ │
│  │  • Type-safe database queries                     │ │
│  │  • Connection pooling                             │ │
│  │  • Automatic migrations                           │ │
│  └────────────────────────────────────────────────────┘ │
└────────────────────────┬────────────────────────────────┘
                         │ PostgreSQL Protocol
                         │ Connection Pool
                         ↓
┌─────────────────────────────────────────────────────────┐
│           Database (PostgreSQL - Port 5432)              │
│  ┌────────────────┐  ┌────────────────┐                │
│  │  User Table    │  │  Note Table    │                │
│  │  • id          │  │  • id          │                │
│  │  • email       │  │  • userId      │                │
│  │  • password    │  │  • title       │                │
│  │  • name        │  │  • content     │                │
│  │  • timestamps  │  │  • flags       │                │
│  └────────────────┘  └────────────────┘                │
└─────────────────────────────────────────────────────────┘
```

---

## Technology Stack

### Core Technologies
- **Runtime**: Node.js 20+
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: PostgreSQL 16+
- **ORM**: Prisma

### Key Libraries
- **Authentication**: express-session, bcrypt
- **Validation**: Zod (@notes/types)
- **Security**: helmet, cors, express-rate-limit, express-mongo-sanitize
- **Monitoring**: Custom middleware (performanceMonitoring)

---

## Project Structure

```
apps/backend/
├── src/
│   ├── index.ts                    # Entry point (cluster vs single)
│   ├── cluster.ts                  # Cluster mode implementation
│   ├── server.ts                   # Express app configuration
│   │
│   ├── routes/                     # API endpoints
│   │   ├── auth.ts                 # Authentication routes
│   │   ├── notes.ts                # Notes CRUD routes
│   │   ├── health.ts               # Health check
│   │   └── metrics.ts              # Performance metrics
│   │
│   ├── middleware/                 # Express middleware
│   │   ├── auth.ts                 # requireAuth middleware
│   │   ├── errorHandler.ts        # Global error handling
│   │   ├── monitoring.ts           # Performance tracking
│   │   └── sanitize.ts             # Input sanitization
│   │
│   ├── lib/                        # Utilities
│   │   └── prisma.ts               # Prisma client instance
│   │
│   └── __tests__/                  # Test files
│       └── api.test.ts
│
├── prisma/
│   ├── schema.prisma               # Database schema
│   └── migrations/                 # Database migrations
│       ├── migration_lock.toml
│       └── [timestamp]_[name]/
│           └── migration.sql
│
├── docs/                           # Documentation
├── .env.example                    # Environment template
├── package.json
├── tsconfig.json
├── vitest.config.ts
└── Dockerfile
```

---

## Request Flow

### Authentication Flow

```
1. Client submits login
   POST /api/auth/login
   Body: { email, password }
   
2. Rate limiter checks
   • Max 5 attempts per 15 minutes
   • If exceeded → 429 Too Many Requests
   
3. Input validation
   • Zod schema validation
   • Email format check
   • If invalid → 400 Bad Request
   
4. Account lockout check
   • Check accountLockedUntil timestamp
   • If locked → 403 Forbidden
   
5. Database query
   • Find user by email
   • If not found → 401 Unauthorized
   
6. Password verification
   • bcrypt.compare(password, hash)
   • If invalid → Increment failedLoginAttempts
   • If >= 5 attempts → Lock account for 15 min
   
7. Success
   • Reset failedLoginAttempts to 0
   • Update lastLoginAt timestamp
   • Create session: req.session.user = { id, email, name }
   • Return 200 OK with user data
   
8. Session cookie sent
   • HttpOnly, Secure (prod), SameSite=strict
   • Stored in browser
   • Sent with every subsequent request
```

### Protected Resource Flow

```
1. Client requests notes
   GET /api/notes
   Cookie: sessionId=abc123...
   
2. Session middleware
   • Decode session cookie
   • Load session data from memory/store
   • Attach to req.session.user
   
3. requireAuth middleware
   • Check if req.session.user exists
   • If not → 401 Unauthorized
   • If yes → Continue to route handler
   
4. Route handler
   • Extract userId from req.session.user
   • Query database with userId filter
   
5. Database query
   • Prisma: findMany({ where: { userId } })
   • Returns only user's notes
   
6. Response
   • Return 200 OK with notes array
   • Client receives data
```

---

## Cluster Mode Architecture

### Single Process Mode

```
┌─────────────────────────┐
│   Node.js Process       │
│   PID: 12345            │
│                         │
│   • Express Server      │
│   • Routes              │
│   • Database Client     │
│                         │
│   CPU: 25% (1 core)     │
│   Memory: 350MB         │
│   Throughput: ~250 req/s│
└─────────────────────────┘
```

### Cluster Mode (4 Workers)

```
┌─────────────────────────────────────────────────────┐
│              Master Process (PID 12345)              │
│              • Manages workers                       │
│              • Restarts on crash                     │
│              • No HTTP handling                      │
└───────────────┬─────────────────────────────────────┘
                │
    ┌───────────┼───────────┬───────────┐
    ↓           ↓           ↓           ↓
┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐
│Worker 1 │ │Worker 2 │ │Worker 3 │ │Worker 4 │
│PID 12346│ │PID 12347│ │PID 12348│ │PID 12349│
│         │ │         │ │         │ │         │
│Express  │ │Express  │ │Express  │ │Express  │
│Routes   │ │Routes   │ │Routes   │ │Routes   │
│DB Client│ │DB Client│ │DB Client│ │DB Client│
│         │ │         │ │         │ │         │
│CPU: 90% │ │CPU: 90% │ │CPU: 90% │ │CPU: 90% │
│Mem: 380M│ │Mem: 375M│ │Mem: 390M│ │Mem: 385M│
└─────────┘ └─────────┘ └─────────┘ └─────────┘

Total Throughput: ~900 req/s (3.6x improvement)
Total Memory: ~1.5GB (4 workers × ~380MB)
CPU Utilization: 90% (all cores)
```

**Load Distribution**: Round-robin by OS (automatic)

---

## Database Architecture

### Schema Design

```
┌─────────────────────────────────────┐
│           User Table                │
├─────────────────────────────────────┤
│ id                  String (PK)     │
│ email               String (Unique) │
│ password            String (bcrypt) │
│ name                String          │
│ preferences         Json            │
│ failedLoginAttempts Int             │
│ accountLockedUntil  DateTime?       │
│ lastLoginAt         DateTime?       │
│ createdAt           DateTime        │
│ updatedAt           DateTime        │
│                                     │
│ Indexes:                            │
│ • PRIMARY KEY (id)                  │
│ • UNIQUE INDEX (email)              │
└─────────────────────────────────────┘
                  │
                  │ One-to-Many
                  ↓
┌─────────────────────────────────────┐
│           Note Table                │
├─────────────────────────────────────┤
│ id          String (PK)             │
│ title       String (255)            │
│ content     Text                    │
│ tags        String[]                │
│ color       String?                 │
│ isPinned    Boolean                 │
│ isFavorite  Boolean                 │
│ isArchived  Boolean                 │
│ isMarkdown  Boolean                 │
│ isTrashed   Boolean                 │
│ trashedAt   DateTime?               │
│ userId      String (FK)             │
│ createdAt   DateTime                │
│ updatedAt   DateTime                │
│                                     │
│ Indexes:                            │
│ • PRIMARY KEY (id)                  │
│ • INDEX (userId)                    │
│ • INDEX (userId, isPinned)          │
│ • INDEX (userId, isFavorite)        │
│ • INDEX (userId, updatedAt)         │
│ • INDEX (isTrashed)                 │
│                                     │
│ Foreign Keys:                       │
│ • userId → User.id (CASCADE)        │
└─────────────────────────────────────┘
```

### Connection Pooling

```
Application Layer (4 workers)
    ↓
Connection Pool (20 connections)
    ├─ Connection 1  ────┐
    ├─ Connection 2  ────┤
    ├─ ...               ├──→ PostgreSQL Server
    ├─ Connection 19 ────┤
    └─ Connection 20 ────┘

Configuration:
• Pool size: 20 connections
• Idle timeout: 60 seconds
• Max lifetime: 30 minutes
• Acquire timeout: 10 seconds
```

---

## Security Architecture

### Defense Layers

```
Request
  ↓
┌──────────────────────────────────┐
│ Layer 1: Network                 │
│ • Helmet (Security Headers)      │
│ • CORS (Origin Restriction)      │
│ • Rate Limiting                  │
└──────────────────────────────────┘
  ↓
┌──────────────────────────────────┐
│ Layer 2: Authentication          │
│ • Session Check (requireAuth)    │
│ • Account Lockout                │
│ • Password Hash (bcrypt)         │
└──────────────────────────────────┘
  ↓
┌──────────────────────────────────┐
│ Layer 3: Input Validation        │
│ • Zod Schema Validation          │
│ • Body Size Limits               │
│ • Sanitization                   │
└──────────────────────────────────┘
  ↓
┌──────────────────────────────────┐
│ Layer 4: Authorization           │
│ • Resource Ownership Check       │
│ • User ID Filter                 │
└──────────────────────────────────┘
  ↓
┌──────────────────────────────────┐
│ Layer 5: Data Access             │
│ • Prisma (SQL Injection Safe)    │
│ • Parameterized Queries          │
└──────────────────────────────────┘
  ↓
Database
```

### Session Management

```
1. Login Success
   ↓
2. Create Session Object
   req.session.user = { id, email, name }
   ↓
3. Store Session
   • Memory: In-process storage (development)
   • Redis: External storage (production)
   ↓
4. Generate Session ID
   • Cryptographically random
   • Signed with SESSION_SECRET
   ↓
5. Set Cookie
   • Name: sessionId
   • HttpOnly: true (no JS access)
   • Secure: true (HTTPS only in prod)
   • SameSite: strict (CSRF protection)
   • MaxAge: 24 hours
   ↓
6. Browser Stores Cookie
   • Automatically sent with every request
   ↓
7. Subsequent Requests
   • Cookie sent automatically
   • Session middleware decodes
   • Session data available in req.session
```

---

## Monitoring Architecture

### Health Check Endpoint

```
GET /api/health

Response:
{
  "status": "ok",
  "timestamp": "2025-12-13T10:00:00.000Z",
  "uptime": 123.456
}

Used by:
• Load balancers
• Docker health checks
• Monitoring services
```

### Metrics Collection

```
┌─────────────────────────────────────┐
│   Request Middleware                │
│   • Start timer                     │
│   • Count request                   │
│   • Track endpoint                  │
└─────────────────────────────────────┘
              ↓
┌─────────────────────────────────────┐
│   Route Handler                     │
│   • Process request                 │
│   • Query database                  │
│   • Return response                 │
└─────────────────────────────────────┘
              ↓
┌─────────────────────────────────────┐
│   Response Middleware               │
│   • Stop timer                      │
│   • Record duration                 │
│   • Increment counters              │
│   • Update memory stats             │
└─────────────────────────────────────┘
              ↓
┌─────────────────────────────────────┐
│   Metrics Store (in-memory)         │
│   • Request counts                  │
│   • Response times (array)          │
│   • Error counts                    │
│   • Active connections              │
└─────────────────────────────────────┘
              ↓
GET /api/metrics
Returns aggregated metrics:
• Total requests
• Success/Error counts
• Response time percentiles (p50, p95, p99)
• Memory usage
• Uptime
```

---

## Deployment Architectures

### Development (Local)

```
Developer Machine
├── Frontend (localhost:3000)
├── Backend (localhost:3001)
│   └── Single process / Cluster mode
└── PostgreSQL (localhost:5432)
    └── Docker container
```

### Production (Single Server)

```
Server (VPS/EC2)
├── Nginx (Port 80/443)
│   ├── SSL/TLS Termination
│   └── Reverse Proxy
│       └── localhost:3001
│
├── Backend (Port 3001)
│   └── Cluster Mode (4 workers)
│       ├── Worker 1
│       ├── Worker 2
│       ├── Worker 3
│       └── Worker 4
│
└── PostgreSQL (Port 5432)
    └── Local or RDS/Cloud SQL
```

### Production (Docker)

```
Docker Network
├── nginx-proxy
│   └── Port 80/443 → backend:3001
│
├── backend (4 replicas)
│   ├── Container 1
│   ├── Container 2
│   ├── Container 3
│   └── Container 4
│
└── postgres
    └── Port 5432 (internal)
```

### Production (Cloud - Auto-scaling)

```
Load Balancer (AWS ALB / Cloud Load Balancer)
        ↓
┌───────┴───────┬───────────┬───────────┐
│               │           │           │
Container 1   Container 2   Container 3   Container N
(Auto-scale)  (Auto-scale)  (Auto-scale)  (Auto-scale)
│               │           │           │
└───────┬───────┴───────────┴───────────┘
        ↓
Managed Database (RDS / Cloud SQL)
```

---

## Key Design Decisions

### 1. Session-Based Authentication
**Why**: Simple, secure, works well for web applications  
**Alternatives considered**: JWT (stateless but harder to revoke)

### 2. Prisma ORM
**Why**: Type-safe, great DX, automatic migrations, SQL injection protection  
**Alternatives considered**: Raw SQL (error-prone), TypeORM (less mature)

### 3. bcrypt for Password Hashing
**Why**: Industry standard, adaptive (can increase rounds), battle-tested  
**Alternatives considered**: Argon2 (newer but less proven)

### 4. Cluster Mode
**Why**: Maximize CPU utilization on multi-core systems  
**Trade-offs**: More memory, harder to debug, sessions need external storage

### 5. Express.js
**Why**: Mature, vast ecosystem, flexible  
**Alternatives considered**: Fastify (faster but smaller ecosystem), Nest.js (more opinionated)

---

## Performance Characteristics

### Response Times (P95)
- Health check: < 5ms
- Authentication: < 100ms
- Notes list (50 items): < 50ms
- Note create/update: < 80ms
- Note search: < 150ms

### Throughput
- Single process: ~250 req/s
- Cluster (4 workers): ~900 req/s

### Memory Usage
- Single process: ~350MB
- Cluster (4 workers): ~1.5GB total

### Database
- Connection pool: 20 connections
- Query time (indexed): < 10ms
- Query time (full scan): > 500ms

---

## Scalability

### Vertical Scaling (Current)
- Enable cluster mode: Use all CPU cores
- Increase memory: More cache, larger pool
- Better server: More cores, faster CPU

### Horizontal Scaling (Future)
- Multiple servers behind load balancer
- External session store (Redis)
- Read replicas for database
- CDN for static assets

---

**Last Updated**: December 13, 2025