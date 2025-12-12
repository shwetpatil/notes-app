# Architecture Overview

System design, patterns, and technical architecture of the notes application.

## System Architecture

### High-Level Overview

```
┌─────────────┐         ┌──────────────┐         ┌──────────────┐
│   Browser   │ ←──────→ │   Next.js    │ ←──────→ │   Express    │
│  (Client)   │  HTTPS   │  (Frontend)  │   HTTP   │  (Backend)   │
└─────────────┘          └──────────────┘          └──────────────┘
      │                         │                          │
      ↓                         ↓                          ↓
┌─────────────┐          ┌──────────────┐          ┌──────────────┐
│  IndexedDB  │          │    Cache     │          │  PostgreSQL  │
│  (Offline)  │          │   (Redis*)   │          │  (Database)  │
└─────────────┘          └──────────────┘          └──────────────┘

*Redis optional for production session store
```

## Monorepo Structure

### Workspace Organization

```
notes-application/
│
├── apps/
│   ├── frontend/              # Next.js application
│   │   ├── src/
│   │   │   ├── app/          # App Router pages
│   │   │   ├── components/   # React components
│   │   │   ├── context/      # React context providers
│   │   │   └── lib/          # Utilities (api, db)
│   │   ├── e2e/              # Playwright tests
│   │   └── public/           # Static assets
│   │
│   └── backend/               # Express API server
│       ├── src/
│       │   ├── routes/       # API route handlers
│       │   ├── middleware/   # Express middleware
│       │   ├── lib/          # Utilities (prisma)
│       │   └── server.ts     # Entry point
│       ├── prisma/           # Database schema
│       └── __tests__/        # Vitest tests
│
├── packages/
│   ├── types/                 # Shared TypeScript types
│   │   └── src/index.ts      # Types, interfaces, Zod schemas
│   │
│   └── ui-lib/                # Shared UI components
│       └── src/components/   # Button, Input, Card, Spinner
│
├── .github/workflows/         # CI/CD pipelines
├── docs/                      # Documentation
└── docker-compose.yml         # PostgreSQL container
```

## Frontend Architecture

### Technology Stack
- **Next.js 15** - React framework with App Router
- **React 18** - UI library with Server Components
- **TypeScript 5.3** - Type safety
- **Tailwind CSS** - Utility-first styling
- **TanStack Query** - Server state management
- **Dexie** - IndexedDB wrapper for offline storage
- **Axios** - HTTP client

### Key Patterns

#### 1. Offline-First Strategy
```typescript
// Data flow
Browser → IndexedDB (local) → Display (immediate)
       ↓
    API Call → PostgreSQL → Sync back to IndexedDB
```

**Benefits:**
- Instant UI updates
- Works offline
- Automatic sync when online
- Optimistic updates

#### 2. State Management
- **Server State**: TanStack Query for API data
- **Local State**: React useState/useReducer
- **Theme State**: React Context + localStorage
- **Cache**: IndexedDB via Dexie

#### 3. Component Structure
```typescript
// Component hierarchy
App Layout (ThemeProvider)
  ├── Notes Page (Query Client)
  │   ├── Sidebar (User, Theme Toggle)
  │   ├── SearchBar (Filters, Sort)
  │   ├── NotesList (Note Items)
  │   └── NoteEditor (Content, Actions)
  └── Auth Pages (Login, Register)
```

### Data Flow

```
User Action
    ↓
Component Handler
    ↓
├─→ Optimistic Update (IndexedDB)
│       ↓
│   UI Updates Immediately
│
└─→ API Call (Axios)
        ↓
    Backend Processing
        ↓
    Response
        ↓
    Sync IndexedDB
        ↓
    React Query Refetch
```

## Backend Architecture

### Technology Stack
- **Express 4** - Web framework
- **Node.js 20** - Runtime
- **Prisma ORM** - Database ORM
- **PostgreSQL 16** - Relational database
- **bcrypt** - Password hashing
- **Zod** - Schema validation
- **Helmet** - Security headers
- **express-rate-limit** - Rate limiting

### Architecture Layers

```
┌─────────────────────────────────────────┐
│         API Routes Layer                │
│  /api/auth  /api/notes  /api/health    │
└───────────────┬─────────────────────────┘
                ↓
┌─────────────────────────────────────────┐
│         Middleware Layer                │
│  Auth, Rate Limit, Sanitization, CORS  │
└───────────────┬─────────────────────────┘
                ↓
┌─────────────────────────────────────────┐
│         Business Logic Layer            │
│  Controllers, Validation, Error Handling│
└───────────────┬─────────────────────────┘
                ↓
┌─────────────────────────────────────────┐
│         Data Access Layer               │
│         Prisma ORM                      │
└───────────────┬─────────────────────────┘
                ↓
┌─────────────────────────────────────────┐
│         PostgreSQL Database             │
└─────────────────────────────────────────┘
```

### Request Lifecycle

```
1. HTTP Request
   ↓
2. Security Middleware
   - Helmet (headers)
   - CORS validation
   - Rate limiting
   ↓
3. Body Parsing & Sanitization
   - JSON parsing
   - NoSQL injection prevention
   - XSS sanitization
   ↓
4. Session Management
   - Cookie validation
   - User authentication
   ↓
5. Route Handler
   - Input validation (Zod)
   - Business logic
   - Database operations (Prisma)
   ↓
6. Response
   - JSON formatting
   - Error handling
   ↓
7. HTTP Response
```

## Database Architecture

### Schema Design

```sql
User (1) ─────< (N) Note

User {
  id: String (CUID)
  email: String (unique)
  password: String (bcrypt hashed)
  name: String
  failedLoginAttempts: Int
  accountLockedUntil: DateTime?
  lastLoginAt: DateTime?
  preferences: JSON
  createdAt: DateTime
  updatedAt: DateTime
}

Note {
  id: String (CUID)
  title: String
  content: Text
  tags: String[]
  color: String?
  isPinned: Boolean
  isFavorite: Boolean
  isArchived: Boolean
  isMarkdown: Boolean
  isTrashed: Boolean
  trashedAt: DateTime?
  userId: String (FK)
  createdAt: DateTime
  updatedAt: DateTime
}
```

### Indexing Strategy

**Performance Indexes:**
- `User.email` - Fast login lookups
- `Note.userId` - User's notes queries
- `Note.updatedAt` - Sorting by date
- `Note.isPinned` - Pinned notes first
- `Note.isFavorite` - Favorites filtering
- `Note.isArchived` - Archive filtering
- `Note.isTrashed` - Trash filtering

## Security Architecture

### Multi-Layer Security

```
┌─────────────────────────────────────────┐
│  1. Network Layer                       │
│     - HTTPS/TLS                         │
│     - CORS policies                     │
│     - Rate limiting                     │
└─────────────────┬───────────────────────┘
                  ↓
┌─────────────────────────────────────────┐
│  2. Application Layer                   │
│     - Helmet security headers           │
│     - CSRF protection (SameSite)        │
│     - Input sanitization (XSS)          │
│     - SQL injection prevention (Prisma) │
└─────────────────┬───────────────────────┘
                  ↓
┌─────────────────────────────────────────┐
│  3. Authentication Layer                │
│     - bcrypt password hashing           │
│     - Session management                │
│     - Account lockout (5 attempts)      │
│     - Remember me (30 days)             │
└─────────────────┬───────────────────────┘
                  ↓
┌─────────────────────────────────────────┐
│  4. Authorization Layer                 │
│     - User-scoped data access           │
│     - Ownership verification            │
│     - Middleware guards                 │
└─────────────────────────────────────────┘
```

### Authentication Flow

```
Registration:
1. Validate email format
2. Check password strength (8+ chars)
3. Hash password (bcrypt, 12 rounds)
4. Create user in database
5. Create session
6. Return user data

Login:
1. Validate credentials
2. Check account lockout status
3. Find user by email
4. Verify password (bcrypt.compare)
5. Reset failed attempts on success
6. Increment attempts on failure
7. Lock account after 5 failures
8. Create session (24h or 30d)
9. Return user data

Authorization:
1. Check session cookie
2. Verify session validity
3. Extract user ID
4. Attach to request
5. Proceed to route handler
```

## Communication Patterns

### API Communication

**REST API with JSON:**
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User authentication
- `POST /api/auth/logout` - Session termination
- `GET /api/auth/me` - Current user
- `GET /api/notes` - List notes (with filters)
- `GET /api/notes/:id` - Single note
- `POST /api/notes` - Create note
- `PATCH /api/notes/:id` - Update note
- `DELETE /api/notes/:id` - Delete note (permanent)
- `PATCH /api/notes/:id/favorite` - Toggle favorite
- `PATCH /api/notes/:id/trash` - Move to trash
- `PATCH /api/notes/:id/restore` - Restore from trash
- `PATCH /api/notes/:id/pin` - Toggle pin
- `PATCH /api/notes/:id/archive` - Toggle archive

**Response Format:**
```typescript
{
  success: boolean;
  data?: T;
  error?: string;
}
```

### Real-time Updates

**Current**: Polling via React Query (refetch intervals)  
**Future**: WebSockets for real-time collaboration

## Performance Optimization

### Frontend Optimizations
- **Code Splitting**: Automatic with Next.js
- **Image Optimization**: Next.js Image component
- **Lazy Loading**: React.lazy for heavy components
- **Caching**: TanStack Query with stale-while-revalidate
- **IndexedDB**: Local caching for offline access
- **Turbopack**: Fast dev builds

### Backend Optimizations
- **Database Indexes**: On frequently queried fields
- **Connection Pooling**: Prisma connection management
- **Query Optimization**: Select only needed fields
- **Rate Limiting**: Prevent resource exhaustion
- **Compression**: gzip for responses

## Scalability Considerations

### Horizontal Scaling
- **Stateless API**: Session in Redis (recommended for production)
- **Load Balancer**: Distribute requests across instances
- **Database**: PostgreSQL replication for reads
- **CDN**: Static assets on CDN

### Vertical Scaling
- **Database**: Increase PostgreSQL resources
- **Caching**: Redis for sessions and hot data
- **Compute**: Scale Node.js instances

## Error Handling Strategy

### Frontend
```typescript
1. API Call Fails
   ↓
2. Axios Interceptor Logs Error
   ↓
3. React Query onError
   ↓
4. Display User-Friendly Message
   ↓
5. Maintain Local State (IndexedDB)
```

### Backend
```typescript
1. Error Occurs
   ↓
2. Try-Catch Block
   ↓
3. Log Error (console.error)
   ↓
4. Global Error Handler Middleware
   ↓
5. Return Formatted Error Response
   ↓
6. Hide Sensitive Info in Production
```

## Design Patterns

### Used Patterns
- **Repository Pattern**: Data access through Prisma
- **Middleware Pattern**: Express middleware chain
- **Observer Pattern**: React Query subscriptions
- **Singleton Pattern**: Prisma client instance
- **Factory Pattern**: API response formatting
- **Strategy Pattern**: Sanitization strategies

## Future Architecture Enhancements

### Phase 2 (Planned)
- WebSocket server for real-time collaboration
- Redis session store for production
- Elasticsearch for advanced search
- S3 for file attachments
- GraphQL API option
- Microservices for AI features

---

**Next**: See [Technology Stack](./TECH_STACK.md) for detailed technology info
