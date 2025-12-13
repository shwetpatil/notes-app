# Database Design

**PostgreSQL Database Schema & Design for Notes Application Backend**

---

## Database Overview

**Technology:** PostgreSQL 16+  
**ORM:** Prisma 5.7  
**Connection Pooling:** Prisma default (10 connections, configurable)  
**Migration Tool:** Prisma Migrate

---

## Schema Design

### Entity Relationship Diagram

```
┌─────────────────────────────────────┐
│              User                   │
│─────────────────────────────────────│
│ id: String (CUID)       [PK]        │
│ email: String           [UNIQUE]    │
│ password: String        (bcrypt)    │
│ name: String?                       │
│ failedLoginAttempts: Int            │
│ accountLockedUntil: DateTime?       │
│ lastLoginAt: DateTime?              │
│ preferences: Json?                  │
│ createdAt: DateTime                 │
│ updatedAt: DateTime                 │
└────────────┬────────────────────────┘
             │
             │ 1:N
             │
             ↓
┌─────────────────────────────────────┐
│              Note                   │
│─────────────────────────────────────│
│ id: String (CUID)       [PK]        │
│ title: String           (max 255)   │
│ content: Text                       │
│ tags: String[]                      │
│ color: String?                      │
│ isPinned: Boolean       (default: F)│
│ isFavorite: Boolean     (default: F)│
│ isArchived: Boolean     (default: F)│
│ isMarkdown: Boolean     (default: F)│
│ isTrashed: Boolean      (default: F)│
│ trashedAt: DateTime?                │
│ userId: String          [FK]        │
│ createdAt: DateTime                 │
│ updatedAt: DateTime                 │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│            Session                  │
│─────────────────────────────────────│
│ id: String (CUID)       [PK]        │
│ sid: String             [UNIQUE]    │
│ data: String            (JSON)      │
│ expiresAt: DateTime                 │
└─────────────────────────────────────┘
```

---

## Table Definitions

### User Table

```sql
CREATE TABLE "User" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "email" TEXT NOT NULL UNIQUE,
  "password" TEXT NOT NULL,
  "name" TEXT,
  "failedLoginAttempts" INTEGER NOT NULL DEFAULT 0,
  "accountLockedUntil" TIMESTAMP(3),
  "lastLoginAt" TIMESTAMP(3),
  "preferences" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL
);

-- Indexes
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
```

**Fields:**
- `id` - CUID (Collision-resistant Unique Identifier)
- `email` - User's email (unique, used for login)
- `password` - bcrypt hashed password (12 rounds)
- `name` - Optional display name
- `failedLoginAttempts` - Count of failed login attempts (for account lockout)
- `accountLockedUntil` - Timestamp when account unlocks (null if not locked)
- `lastLoginAt` - Last successful login timestamp
- `preferences` - User preferences (JSON: theme, defaultView, etc.)
- `createdAt` - Account creation timestamp
- `updatedAt` - Last account update timestamp

**Constraints:**
- Email must be unique
- Password minimum 8 characters (enforced in application layer)
- failedLoginAttempts ≥ 0

---

### Note Table

```sql
CREATE TABLE "Note" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "title" TEXT NOT NULL,
  "content" TEXT NOT NULL DEFAULT '',
  "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "color" TEXT,
  "isPinned" BOOLEAN NOT NULL DEFAULT false,
  "isFavorite" BOOLEAN NOT NULL DEFAULT false,
  "isArchived" BOOLEAN NOT NULL DEFAULT false,
  "isMarkdown" BOOLEAN NOT NULL DEFAULT false,
  "isTrashed" BOOLEAN NOT NULL DEFAULT false,
  "trashedAt" TIMESTAMP(3),
  "userId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  
  CONSTRAINT "Note_userId_fkey" FOREIGN KEY ("userId") 
    REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Indexes
CREATE INDEX "Note_userId_idx" ON "Note"("userId");
CREATE INDEX "Note_updatedAt_idx" ON "Note"("updatedAt");
CREATE INDEX "Note_isPinned_idx" ON "Note"("isPinned");
CREATE INDEX "Note_isFavorite_idx" ON "Note"("isFavorite");
CREATE INDEX "Note_isArchived_idx" ON "Note"("isArchived");
CREATE INDEX "Note_isTrashed_idx" ON "Note"("isTrashed");
CREATE INDEX "Note_tags_idx" ON "Note" USING GIN("tags");
```

**Fields:**
- `id` - CUID (unique identifier)
- `title` - Note title (max 255 characters, enforced in app)
- `content` - Note content (text, no limit)
- `tags` - Array of tag strings (e.g., ["work", "important"])
- `color` - Optional color (hex code: #FF5733)
- `isPinned` - Pinned notes appear first
- `isFavorite` - Favorite/starred notes
- `isArchived` - Archived notes (hidden from default view)
- `isMarkdown` - Enable markdown rendering
- `isTrashed` - Soft delete (moved to trash)
- `trashedAt` - Timestamp when moved to trash
- `userId` - Foreign key to User table
- `createdAt` - Note creation timestamp
- `updatedAt` - Last modification timestamp

**Constraints:**
- Foreign key: userId → User.id (CASCADE on delete)
- Title cannot be empty (enforced in application)
- If isTrashed = true, trashedAt must be set

---

### Session Table

```sql
CREATE TABLE "Session" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "sid" TEXT NOT NULL UNIQUE,
  "data" TEXT NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL
);

-- Indexes
CREATE UNIQUE INDEX "Session_sid_key" ON "Session"("sid");
CREATE INDEX "Session_expiresAt_idx" ON "Session"("expiresAt");
```

**Fields:**
- `id` - Primary key
- `sid` - Session ID (sent as cookie)
- `data` - Serialized session data (JSON string)
- `expiresAt` - Session expiration timestamp

**Session Data Structure:**
```json
{
  "cookie": {
    "originalMaxAge": 86400000,
    "expires": "2025-12-14T12:00:00.000Z",
    "httpOnly": true,
    "path": "/"
  },
  "user": {
    "id": "clx1234567890",
    "email": "user@example.com",
    "name": "John Doe"
  }
}
```

**Cleanup:**
- Expired sessions auto-deleted by Prisma session store
- Manual cleanup: `DELETE FROM Session WHERE expiresAt < NOW()`

---

## Indexing Strategy

### Performance Indexes

**User Table:**
- `User.email` (UNIQUE) - Fast login lookups

**Note Table:**
- `Note.userId` - User's notes query (most common)
- `Note.updatedAt` - Sorting by modification date
- `Note.isPinned` - Filter pinned notes
- `Note.isFavorite` - Filter favorite notes
- `Note.isArchived` - Filter archived notes
- `Note.isTrashed` - Filter trashed notes
- `Note.tags` (GIN index) - Array containment queries

**Session Table:**
- `Session.sid` (UNIQUE) - Session lookup by cookie
- `Session.expiresAt` - Expired session cleanup

### Query Performance

**Common queries with indexes:**

```sql
-- Get user's active notes (uses userId + isTrashed indexes)
SELECT * FROM "Note" 
WHERE "userId" = ? AND "isTrashed" = false
ORDER BY "isPinned" DESC, "updatedAt" DESC;

-- Search notes by tag (uses userId + tags GIN index)
SELECT * FROM "Note"
WHERE "userId" = ? AND 'work' = ANY("tags");

-- Get pinned notes (uses userId + isPinned indexes)
SELECT * FROM "Note"
WHERE "userId" = ? AND "isPinned" = true;
```

---

## Data Types & Constraints

### CUID (Primary Keys)
- Collision-resistant, URL-safe
- Length: 25 characters
- Format: `clx1234567890abcdefg`
- Generated by: `@default(cuid())` in Prisma

### Timestamps
- Type: `DateTime` (Prisma) → `TIMESTAMP(3)` (PostgreSQL)
- Precision: Milliseconds
- Auto-managed: `@default(now())`, `@updatedAt`

### Arrays
- `tags: String[]` → `TEXT[]` in PostgreSQL
- Default: Empty array `ARRAY[]::TEXT[]`
- Queries: `'tag' = ANY(tags)` or `tags @> ARRAY['tag']`

### JSON
- `preferences: Json` → `JSONB` in PostgreSQL
- Querying: `preferences->>'theme'`, `preferences @> '{"theme":"dark"}'`

---

## Migrations

### Migration Files Location
```
apps/backend/prisma/migrations/
├── migration_lock.toml
├── 20240101000000_init/
│   └── migration.sql
└── 20251212093042_add_note_features/
    └── migration.sql
```

### Running Migrations

```bash
# Development: Create new migration
pnpm prisma migrate dev --name add_new_feature

# Production: Apply pending migrations
pnpm prisma migrate deploy

# Reset database (WARNING: deletes all data)
pnpm prisma migrate reset

# Check migration status
pnpm prisma migrate status
```

### Sample Migration

```sql
-- CreateTable
CREATE TABLE "User" (
  "id" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "password" TEXT NOT NULL,
  "name" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  
  CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
```

---

## Data Relationships

### User ↔ Note (One-to-Many)

```prisma
model User {
  id    String @id @default(cuid())
  email String @unique
  notes Note[] // Relation field
}

model Note {
  id     String @id @default(cuid())
  userId String
  user   User   @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@index([userId])
}
```

**Cascade Behavior:**
- `ON DELETE CASCADE` - Deleting user deletes all their notes
- `ON UPDATE CASCADE` - Updating user.id updates all note.userId

**Query Examples:**

```typescript
// Get user with all notes
const user = await prisma.user.findUnique({
  where: { email: 'user@example.com' },
  include: { notes: true }
});

// Get note with user info
const note = await prisma.note.findUnique({
  where: { id: noteId },
  include: { user: true }
});
```

---

## Query Optimization

### Select Only Needed Fields

```typescript
// ❌ Bad: Fetch all fields (including large content)
const notes = await prisma.note.findMany({ where: { userId } });

// ✅ Good: Select only needed fields
const notes = await prisma.note.findMany({
  where: { userId },
  select: {
    id: true,
    title: true,
    isPinned: true,
    updatedAt: true
  }
});
```

### Use Pagination

```typescript
// ✅ Pagination for large result sets
const notes = await prisma.note.findMany({
  where: { userId },
  take: 20,      // Limit
  skip: page * 20, // Offset
  orderBy: { updatedAt: 'desc' }
});
```

### Batch Operations

```typescript
// ✅ Batch create
await prisma.note.createMany({
  data: [
    { title: 'Note 1', userId },
    { title: 'Note 2', userId }
  ]
});
```

---

## Backup & Recovery

### Manual Backup

```bash
# Backup database
pg_dump -h localhost -U postgres -d notes_app > backup_$(date +%Y%m%d).sql

# Restore database
psql -h localhost -U postgres -d notes_app < backup_20251213.sql
```

### Automated Backups

```bash
# Cron job (daily at 2 AM)
0 2 * * * pg_dump -h localhost -U postgres -d notes_app > /backups/notes_$(date +\%Y\%m\%d).sql
```

---

## Database Configuration

### Connection String Format

```env
# Development
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE?schema=public"

# Example
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/notes_app"

# Production (with connection pooling)
DATABASE_URL="postgresql://user:pass@db.example.com:5432/notes_app?connection_limit=20&pool_timeout=10"
```

### Prisma Configuration

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider        = "prisma-client-js"
  previewFeatures = []
}
```

---

## Security Considerations

### Password Storage
- **Never** store plain-text passwords
- Use bcrypt with 12+ rounds
- Hash on application layer, not database triggers

### SQL Injection Prevention
- Prisma uses parameterized queries (safe by default)
- Never concatenate user input into raw SQL

### Row-Level Security
```typescript
// ✅ Always filter by userId
const notes = await prisma.note.findMany({
  where: { 
    userId: req.session.user.id, // Enforce ownership
    isTrashed: false 
  }
});

// ❌ Never allow unfiltered queries
const notes = await prisma.note.findMany(); // BAD: Returns all users' notes
```

---

## Database Monitoring

### Useful Queries

```sql
-- Table sizes
SELECT 
  relname AS table_name,
  pg_size_pretty(pg_total_relation_size(relid)) AS total_size
FROM pg_catalog.pg_statio_user_tables
ORDER BY pg_total_relation_size(relid) DESC;

-- Active connections
SELECT count(*) FROM pg_stat_activity;

-- Slow queries (PostgreSQL 12+)
SELECT query, mean_exec_time, calls
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 10;

-- Index usage
SELECT 
  schemaname, tablename, indexname, idx_scan
FROM pg_stat_user_indexes
ORDER BY idx_scan ASC;
```

---

## Future Enhancements

### Phase 2: Attachments Table
```prisma
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
```

### Phase 3: Full-Text Search
```sql
-- Add tsvector column for full-text search
ALTER TABLE "Note" ADD COLUMN search_vector tsvector
  GENERATED ALWAYS AS (
    to_tsvector('english', title || ' ' || content)
  ) STORED;

-- GIN index for fast text search
CREATE INDEX note_search_idx ON "Note" USING GIN(search_vector);

-- Search query
SELECT * FROM "Note"
WHERE search_vector @@ to_tsquery('english', 'important & meeting');
```

---

**Last Updated**: December 13, 2025  
**Database Version**: PostgreSQL 16  
**Schema Version**: 1.0
