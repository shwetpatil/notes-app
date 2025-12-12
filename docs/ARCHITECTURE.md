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

### Phase 2: Real-time Collaboration (Q1 2026)

#### WebSocket Server Implementation

**Technology**: Socket.io for bidirectional communication

**Architecture:**
```
┌─────────────┐         ┌──────────────┐         ┌──────────────┐
│   Browser   │ ←──────→ │  Socket.io   │ ←──────→ │   Express    │
│  (Client)   │  WSS     │   Server     │   Redis  │  (Backend)   │
└─────────────┘          └──────────────┘  Pub/Sub └──────────────┘
      │                         │                          │
      ↓                         ↓                          ↓
  Real-time UI            Room Management            PostgreSQL
```

**Features:**
- Live note editing with operational transforms
- Presence indicators (who's viewing)
- Cursor position sharing
- Change conflict resolution
- Auto-save with debouncing

**Implementation Steps:**
```typescript
// 1. Install dependencies
pnpm add socket.io socket.io-client redis ioredis

// 2. Server setup (apps/backend/src/websocket.ts)
import { Server } from 'socket.io';
import Redis from 'ioredis';

const pubClient = new Redis(process.env.REDIS_URL);
const subClient = pubClient.duplicate();

const io = new Server(httpServer, {
  cors: { origin: process.env.FRONTEND_URL },
  adapter: createAdapter(pubClient, subClient)
});

io.on('connection', (socket) => {
  socket.on('join-note', (noteId) => {
    socket.join(`note:${noteId}`);
    io.to(`note:${noteId}`).emit('user-joined', socket.id);
  });
  
  socket.on('note-update', async ({ noteId, content, userId }) => {
    // Broadcast to all users in room except sender
    socket.to(`note:${noteId}`).emit('note-changed', {
      content,
      userId,
      timestamp: Date.now()
    });
    
    // Save to database (debounced)
    await debouncedSave(noteId, content);
  });
});

// 3. Client setup (apps/frontend/src/lib/socket.ts)
import io from 'socket.io-client';

export const socket = io(process.env.NEXT_PUBLIC_API_URL, {
  autoConnect: false,
  auth: (cb) => cb({ token: getSessionToken() })
});

// 4. React hook (apps/frontend/src/hooks/useCollaboration.ts)
export function useCollaboration(noteId: string) {
  useEffect(() => {
    socket.emit('join-note', noteId);
    
    socket.on('note-changed', ({ content, userId }) => {
      if (userId !== currentUser.id) {
        setNoteContent(content); // Operational transform here
      }
    });
    
    return () => socket.emit('leave-note', noteId);
  }, [noteId]);
}
```

**Operational Transform Strategy:**
```typescript
// Conflict resolution algorithm
type Operation = 
  | { type: 'insert', pos: number, text: string }
  | { type: 'delete', pos: number, length: number };

function transformOperation(op1: Operation, op2: Operation): Operation {
  // Transform op2 based on op1's changes
  // Ensures convergence for concurrent edits
}
```

---

### Phase 2: Redis Session Store (Q1 2026)

**Why Redis:**
- Scalable session storage across multiple servers
- Fast in-memory operations
- Automatic session expiration
- Session sharing in distributed systems

**Implementation:**

```typescript
// 1. Install dependencies
pnpm add connect-redis redis

// 2. Redis setup (apps/backend/src/lib/redis.ts)
import { createClient } from 'redis';
import RedisStore from 'connect-redis';

export const redisClient = createClient({
  url: process.env.REDIS_URL,
  socket: {
    reconnectStrategy: (retries) => Math.min(retries * 50, 500)
  }
});

redisClient.on('error', (err) => console.error('Redis error:', err));
await redisClient.connect();

export const sessionStore = new RedisStore({
  client: redisClient,
  prefix: 'sess:',
  ttl: 86400 // 24 hours in seconds
});

// 3. Update session middleware (apps/backend/src/server.ts)
import { sessionStore } from './lib/redis';

app.use(
  session({
    store: sessionStore, // Use Redis instead of Prisma
    secret: process.env.SESSION_SECRET!,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000
    }
  })
);

// 4. Caching layer (apps/backend/src/lib/cache.ts)
class CacheService {
  async getUserNotes(userId: string): Promise<Note[]> {
    const cached = await redisClient.get(`notes:${userId}`);
    if (cached) return JSON.parse(cached);
    
    const notes = await prisma.note.findMany({ where: { userId } });
    await redisClient.setEx(`notes:${userId}`, 300, JSON.stringify(notes)); // 5 min TTL
    return notes;
  }
  
  async invalidateUserNotes(userId: string): Promise<void> {
    await redisClient.del(`notes:${userId}`);
  }
}
```

**Docker Compose Update:**
```yaml
# docker-compose.yml
services:
  postgres:
    # ... existing config
  
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis-data:/data
    command: redis-server --appendonly yes
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 5s
      timeout: 3s
      retries: 5

volumes:
  postgres-data:
  redis-data:
```

**Environment Variables:**
```env
REDIS_URL=redis://localhost:6379
```

---

### Phase 3: Elasticsearch Integration (Q2 2026)

**Purpose:** Advanced full-text search, fuzzy matching, relevance scoring

**Features:**
- Full-text search across title and content
- Fuzzy matching (typo tolerance)
- Relevance scoring and ranking
- Search suggestions and autocomplete
- Tag-based faceted search
- Search analytics

**Architecture:**
```
┌──────────────┐         ┌──────────────┐         ┌──────────────┐
│  PostgreSQL  │ ───────→ │ Elasticsearch│ ←────── │   Express    │
│  (Source)    │  Sync    │   (Search)   │  Query  │  (Backend)   │
└──────────────┘          └──────────────┘          └──────────────┘
```

**Implementation:**

```typescript
// 1. Install dependencies
pnpm add @elastic/elasticsearch

// 2. Elasticsearch client (apps/backend/src/lib/elasticsearch.ts)
import { Client } from '@elastic/elasticsearch';

export const esClient = new Client({
  node: process.env.ELASTICSEARCH_URL || 'http://localhost:9200',
  auth: {
    username: process.env.ES_USERNAME || 'elastic',
    password: process.env.ES_PASSWORD || 'changeme'
  }
});

// 3. Index mapping
const noteIndexMapping = {
  properties: {
    title: { 
      type: 'text',
      analyzer: 'english',
      fields: {
        keyword: { type: 'keyword' }
      }
    },
    content: { 
      type: 'text',
      analyzer: 'english'
    },
    tags: { type: 'keyword' },
    userId: { type: 'keyword' },
    color: { type: 'keyword' },
    isPinned: { type: 'boolean' },
    isFavorite: { type: 'boolean' },
    createdAt: { type: 'date' },
    updatedAt: { type: 'date' }
  }
};

await esClient.indices.create({
  index: 'notes',
  body: { mappings: noteIndexMapping }
});

// 4. Sync service (apps/backend/src/services/search.ts)
export class SearchService {
  async indexNote(note: Note) {
    await esClient.index({
      index: 'notes',
      id: note.id,
      document: {
        title: note.title,
        content: note.content,
        tags: note.tags,
        userId: note.userId,
        color: note.color,
        isPinned: note.isPinned,
        isFavorite: note.isFavorite,
        createdAt: note.createdAt,
        updatedAt: note.updatedAt
      }
    });
  }
  
  async searchNotes(userId: string, query: string) {
    const result = await esClient.search({
      index: 'notes',
      body: {
        query: {
          bool: {
            must: [
              { term: { userId } },
              {
                multi_match: {
                  query,
                  fields: ['title^2', 'content', 'tags^1.5'],
                  fuzziness: 'AUTO',
                  prefix_length: 2
                }
              }
            ]
          }
        },
        highlight: {
          fields: {
            title: {},
            content: { fragment_size: 150 }
          }
        },
        size: 20
      }
    });
    
    return result.hits.hits.map(hit => ({
      ...hit._source,
      score: hit._score,
      highlights: hit.highlight
    }));
  }
  
  async getSuggestions(userId: string, prefix: string) {
    const result = await esClient.search({
      index: 'notes',
      body: {
        query: {
          bool: {
            must: [
              { term: { userId } },
              {
                match_phrase_prefix: {
                  title: { query: prefix, max_expansions: 10 }
                }
              }
            ]
          }
        },
        size: 5
      }
    });
    
    return result.hits.hits.map(hit => hit._source.title);
  }
}

// 5. Auto-sync on note changes (apps/backend/src/routes/notes.ts)
const searchService = new SearchService();

router.post('/notes', async (req, res) => {
  const note = await prisma.note.create({ data: noteData });
  await searchService.indexNote(note); // Index immediately
  res.json({ note });
});

router.put('/notes/:id', async (req, res) => {
  const note = await prisma.note.update({ where: { id }, data: noteData });
  await searchService.indexNote(note); // Re-index
  res.json({ note });
});

router.delete('/notes/:id', async (req, res) => {
  await prisma.note.delete({ where: { id } });
  await esClient.delete({ index: 'notes', id }); // Remove from index
  res.json({ message: 'Deleted' });
});
```

**Docker Compose Update:**
```yaml
# docker-compose.yml
services:
  elasticsearch:
    image: docker.elastic.co/elasticsearch/elasticsearch:8.11.0
    environment:
      - discovery.type=single-node
      - xpack.security.enabled=false
      - "ES_JAVA_OPTS=-Xms512m -Xmx512m"
    ports:
      - "9200:9200"
    volumes:
      - es-data:/usr/share/elasticsearch/data

volumes:
  postgres-data:
  redis-data:
  es-data:
```

---

### Phase 3: S3 File Attachments (Q2 2026)

**Purpose:** Support file uploads (images, PDFs, documents)

**Features:**
- Image attachments in notes
- File preview and download
- Image optimization and thumbnails
- Secure signed URLs
- File size limits and validation

**Implementation:**

```typescript
// 1. Install dependencies
pnpm add @aws-sdk/client-s3 @aws-sdk/s3-request-presigner multer multer-s3 sharp

// 2. S3 client (apps/backend/src/lib/s3.ts)
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import sharp from 'sharp';

export const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!
  }
});

const BUCKET_NAME = process.env.S3_BUCKET_NAME!;

export class FileService {
  async uploadImage(file: Buffer, userId: string): Promise<string> {
    // Optimize image
    const optimized = await sharp(file)
      .resize(1920, 1080, { fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: 85, progressive: true })
      .toBuffer();
    
    // Generate unique filename
    const fileKey = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2)}.jpg`;
    
    // Upload to S3
    await s3Client.send(new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: fileKey,
      Body: optimized,
      ContentType: 'image/jpeg',
      CacheControl: 'max-age=31536000',
      Metadata: { userId }
    }));
    
    return fileKey;
  }
  
  async generateThumbnail(file: Buffer): Promise<Buffer> {
    return sharp(file)
      .resize(300, 300, { fit: 'cover' })
      .jpeg({ quality: 80 })
      .toBuffer();
  }
  
  async getSignedDownloadUrl(fileKey: string, expiresIn = 3600): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: fileKey
    });
    
    return getSignedUrl(s3Client, command, { expiresIn });
  }
}

// 3. Upload endpoint (apps/backend/src/routes/uploads.ts)
import multer from 'multer';

const upload = multer({
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type'));
    }
  }
});

const router = Router();
const fileService = new FileService();

router.post('/upload', requireAuth, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file provided' });
    }
    
    const fileKey = await fileService.uploadImage(req.file.buffer, req.session.userId!);
    const url = await fileService.getSignedDownloadUrl(fileKey);
    
    // Store file metadata in database
    const attachment = await prisma.attachment.create({
      data: {
        fileKey,
        fileName: req.file.originalname,
        fileSize: req.file.size,
        mimeType: req.file.mimetype,
        userId: req.session.userId!
      }
    });
    
    res.json({ attachment, url });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Upload failed' });
  }
});

// 4. Database schema update (prisma/schema.prisma)
model Attachment {
  id        String   @id @default(cuid())
  fileKey   String   // S3 object key
  fileName  String
  fileSize  Int
  mimeType  String
  userId    String
  noteId    String?
  
  user      User     @relation(fields: [userId], references: [id])
  note      Note?    @relation(fields: [noteId], references: [id])
  
  createdAt DateTime @default(now())
  
  @@index([userId])
  @@index([noteId])
}

model Note {
  // ... existing fields
  attachments Attachment[]
}
```

**Environment Variables:**
```env
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
S3_BUCKET_NAME=notes-app-attachments
```

---

### Phase 4: GraphQL API (Q3 2026)

**Purpose:** Flexible querying, reduce over-fetching, better mobile support

**Implementation:**

```typescript
// 1. Install dependencies
pnpm add apollo-server-express graphql type-graphql reflect-metadata

// 2. GraphQL schema (apps/backend/src/graphql/schema.ts)
import { buildSchema, Field, ObjectType, Query, Mutation, Arg, Ctx } from 'type-graphql';

@ObjectType()
class Note {
  @Field()
  id: string;
  
  @Field()
  title: string;
  
  @Field()
  content: string;
  
  @Field(() => [String])
  tags: string[];
  
  @Field({ nullable: true })
  color?: string;
  
  @Field()
  isPinned: boolean;
  
  @Field()
  isFavorite: boolean;
  
  @Field()
  createdAt: Date;
  
  @Field()
  updatedAt: Date;
}

@ObjectType()
class User {
  @Field()
  id: string;
  
  @Field()
  email: string;
  
  @Field(() => [Note])
  notes: Note[];
}

class NoteResolver {
  @Query(() => [Note])
  async notes(
    @Ctx() context: Context,
    @Arg('favorite', { nullable: true }) favorite?: boolean,
    @Arg('search', { nullable: true }) search?: string
  ): Promise<Note[]> {
    const userId = context.req.session.userId;
    if (!userId) throw new Error('Not authenticated');
    
    return prisma.note.findMany({
      where: {
        userId,
        ...(favorite !== undefined && { isFavorite: favorite }),
        ...(search && {
          OR: [
            { title: { contains: search, mode: 'insensitive' } },
            { content: { contains: search, mode: 'insensitive' } }
          ]
        })
      },
      orderBy: { updatedAt: 'desc' }
    });
  }
  
  @Mutation(() => Note)
  async createNote(
    @Ctx() context: Context,
    @Arg('title') title: string,
    @Arg('content') content: string
  ): Promise<Note> {
    const userId = context.req.session.userId;
    if (!userId) throw new Error('Not authenticated');
    
    return prisma.note.create({
      data: { title, content, userId }
    });
  }
}

export const schema = await buildSchema({
  resolvers: [NoteResolver],
  validate: false
});

// 3. Apollo Server setup (apps/backend/src/server.ts)
import { ApolloServer } from 'apollo-server-express';

const apolloServer = new ApolloServer({
  schema,
  context: ({ req, res }) => ({ req, res, prisma }),
  introspection: process.env.NODE_ENV !== 'production',
  playground: process.env.NODE_ENV !== 'production'
});

await apolloServer.start();
apolloServer.applyMiddleware({ 
  app, 
  path: '/graphql',
  cors: false // Use existing CORS middleware
});

// 4. Frontend integration (apps/frontend/src/lib/apollo.ts)
import { ApolloClient, InMemoryCache, createHttpLink } from '@apollo/client';

const httpLink = createHttpLink({
  uri: `${process.env.NEXT_PUBLIC_API_URL}/graphql`,
  credentials: 'include'
});

export const apolloClient = new ApolloClient({
  link: httpLink,
  cache: new InMemoryCache()
});

// 5. Example query (apps/frontend/src/hooks/useNotes.ts)
import { gql, useQuery } from '@apollo/client';

const GET_NOTES = gql`
  query GetNotes($favorite: Boolean, $search: String) {
    notes(favorite: $favorite, search: $search) {
      id
      title
      content
      tags
      color
      isPinned
      isFavorite
      createdAt
      updatedAt
    }
  }
`;

export function useNotes(filters?: { favorite?: boolean; search?: string }) {
  return useQuery(GET_NOTES, { variables: filters });
}
```

---

### Phase 4: AI Microservices (Q4 2026)

**Features:**
- Smart note summarization
- Auto-tagging based on content
- Content suggestions
- Sentiment analysis
- Smart search with NLP

**Architecture:**
```
┌──────────────┐         ┌──────────────┐         ┌──────────────┐
│   Express    │ ────────→ │  AI Service  │ ────────→ │   OpenAI     │
│  (Backend)   │   REST    │   (Python)   │    API    │    API       │
└──────────────┘          └──────────────┘          └──────────────┘
                                 │
                                 ↓
                          ┌──────────────┐
                          │    Redis     │
                          │  (Queue)     │
                          └──────────────┘
```

**Implementation:**

```python
# apps/ai-service/main.py (FastAPI microservice)
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import openai
from transformers import pipeline
import redis

app = FastAPI()
redis_client = redis.Redis(host='localhost', port=6379, decode_responses=True)
openai.api_key = os.getenv('OPENAI_API_KEY')

class Note(BaseModel):
    id: str
    title: str
    content: str

@app.post("/api/summarize")
async def summarize_note(note: Note):
    """Generate concise summary of note content"""
    try:
        response = openai.ChatCompletion.create(
            model="gpt-4-turbo",
            messages=[{
                "role": "system",
                "content": "Summarize the following note in 2-3 sentences."
            }, {
                "role": "user",
                "content": note.content
            }],
            max_tokens=150
        )
        
        summary = response.choices[0].message.content
        
        # Cache result
        redis_client.setex(f"summary:{note.id}", 3600, summary)
        
        return {"summary": summary}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/auto-tag")
async def auto_tag_note(note: Note):
    """Generate relevant tags based on content"""
    try:
        response = openai.ChatCompletion.create(
            model="gpt-4-turbo",
            messages=[{
                "role": "system",
                "content": "Generate 3-5 relevant tags for this note. Return only comma-separated tags."
            }, {
                "role": "user",
                "content": f"Title: {note.title}\nContent: {note.content}"
            }],
            max_tokens=50
        )
        
        tags = response.choices[0].message.content.split(',')
        tags = [tag.strip() for tag in tags]
        
        return {"tags": tags}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/sentiment")
async def analyze_sentiment(note: Note):
    """Analyze sentiment of note content"""
    classifier = pipeline("sentiment-analysis")
    result = classifier(note.content[:512])  # Limit to 512 chars
    
    return {
        "sentiment": result[0]['label'],
        "confidence": result[0]['score']
    }

# Express integration (apps/backend/src/services/ai.ts)
import axios from 'axios';

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';

export class AIService {
  async summarizeNote(note: Note): Promise<string> {
    const response = await axios.post(`${AI_SERVICE_URL}/api/summarize`, {
      id: note.id,
      title: note.title,
      content: note.content
    });
    
    return response.data.summary;
  }
  
  async autoTag(note: Note): Promise<string[]> {
    const response = await axios.post(`${AI_SERVICE_URL}/api/auto-tag`, {
      id: note.id,
      title: note.title,
      content: note.content
    });
    
    return response.data.tags;
  }
  
  async analyzeSentiment(note: Note) {
    const response = await axios.post(`${AI_SERVICE_URL}/api/sentiment`, {
      id: note.id,
      title: note.title,
      content: note.content
    });
    
    return response.data;
  }
}

// API endpoint (apps/backend/src/routes/ai.ts)
const aiService = new AIService();

router.post('/notes/:id/summarize', requireAuth, async (req, res) => {
  const note = await prisma.note.findFirst({
    where: { id: req.params.id, userId: req.session.userId }
  });
  
  if (!note) return res.status(404).json({ error: 'Note not found' });
  
  const summary = await aiService.summarizeNote(note);
  res.json({ summary });
});

router.post('/notes/:id/auto-tag', requireAuth, async (req, res) => {
  const note = await prisma.note.findFirst({
    where: { id: req.params.id, userId: req.session.userId }
  });
  
  if (!note) return res.status(404).json({ error: 'Note not found' });
  
  const tags = await aiService.autoTag(note);
  
  // Update note with suggested tags
  await prisma.note.update({
    where: { id: note.id },
    data: { tags: [...new Set([...note.tags, ...tags])] }
  });
  
  res.json({ tags });
});
```

**Docker Compose for AI Service:**
```yaml
# docker-compose.yml
services:
  ai-service:
    build: ./apps/ai-service
    ports:
      - "8000:8000"
    environment:
      - OPENAI_API_KEY=${OPENAI_API_KEY}
      - REDIS_URL=redis://redis:6379
    depends_on:
      - redis
```

---

**Next**: See [Technology Stack](./TECH_STACK.md) for detailed technology info
