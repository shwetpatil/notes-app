# Database Security

Comprehensive guide to database security implementation in the notes application.

**Last Updated**: December 13, 2025  
**Database**: PostgreSQL + Prisma ORM

---

## Table of Contents

1. [Security Overview](#security-overview)
2. [Connection Security](#connection-security)
3. [SQL Injection Prevention](#sql-injection-prevention)
4. [Access Control & Data Isolation](#access-control--data-isolation)
5. [Password Storage](#password-storage)
6. [Data Validation & Constraints](#data-validation--constraints)
7. [Cascade Deletion & GDPR](#cascade-deletion--gdpr)
8. [Indexing for Security](#indexing-for-security)
9. [Soft Deletes](#soft-deletes)
10. [Audit Trail](#audit-trail)
11. [Best Practices](#best-practices)

---

## Security Overview

The database implements **multiple layers of security** to protect user data:

```
┌─────────────────────────────────────────────────────────┐
│  Network Layer                                          │
│  - SSL/TLS connections                                  │
│  - Firewall rules                                       │
│  - VPC isolation (production)                           │
└─────────────────────────────────────────────────────────┘
            ↓
┌─────────────────────────────────────────────────────────┐
│  Application Layer                                      │
│  - Prisma ORM (prevents SQL injection)                 │
│  - Row-level security (userId filtering)               │
│  - Input validation (Zod schemas)                      │
└─────────────────────────────────────────────────────────┘
            ↓
┌─────────────────────────────────────────────────────────┐
│  Database Layer                                         │
│  - Foreign key constraints                              │
│  - Unique constraints                                   │
│  - Field validation                                     │
│  - Cascade deletion                                     │
└─────────────────────────────────────────────────────────┘
            ↓
┌─────────────────────────────────────────────────────────┐
│  Storage Layer                                          │
│  - Encrypted at rest (hosting provider)                │
│  - Automated backups                                    │
│  - Point-in-time recovery                               │
└─────────────────────────────────────────────────────────┘
```

---

## Connection Security

### Development Configuration

**File**: `.env`

```bash
# Local development
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/notes_db"
```

**Security considerations**:
- ✅ Only accessible from localhost
- ✅ No external network exposure
- ⚠️ Default password acceptable for development only

### Production Configuration

```bash
# Production with SSL
DATABASE_URL="postgresql://user:password@host.region.rds.amazonaws.com:5432/notes_db?sslmode=require"
```

**SSL Mode Options**:

| Mode | Description | Use Case |
|------|-------------|----------|
| `disable` | No SSL | ❌ Never use in production |
| `allow` | SSL if available | ❌ Not recommended |
| `prefer` | Try SSL, fallback to plain | ⚠️ Development only |
| `require` | SSL required | ✅ **Production standard** |
| `verify-ca` | SSL + verify certificate | ✅ High security |
| `verify-full` | SSL + verify certificate + hostname | ✅ Maximum security |

**Recommended production**:
```bash
DATABASE_URL="postgresql://user:password@host:5432/db?sslmode=require&sslcert=/path/to/cert.pem&sslkey=/path/to/key.pem"
```

### Connection Pool Security

**File**: `apps/backend/src/config/database.config.ts`

```typescript
import { PrismaClient } from '@prisma/client';

export const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  },
  log: process.env.NODE_ENV === 'development' 
    ? ['query', 'error', 'warn'] 
    : ['error'],
});

// Connection pool limits (prevents connection exhaustion)
// Configured in Prisma schema
```

**Schema configuration**:
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

## SQL Injection Prevention

### How Prisma Prevents SQL Injection

**Traditional vulnerable approach** (you DON'T do this):
```typescript
// ❌ NEVER DO THIS - Vulnerable to SQL injection
const email = req.body.email;  // User input: admin@test.com' OR '1'='1
const query = `SELECT * FROM users WHERE email = '${email}'`;
await db.raw(query);

// Executed query:
// SELECT * FROM users WHERE email = 'admin@test.com' OR '1'='1'
// Returns ALL users!

// Worse attack:
// User input: '; DROP TABLE users; --
// Executed: SELECT * FROM users WHERE email = ''; DROP TABLE users; --'
// YOUR DATABASE IS DESTROYED!
```

### ✅ Prisma's Safe Approach (Your Implementation)

**All queries are parameterized automatically**:

```typescript
// Safe - User input is parameterized
const email = req.body.email;  // User input: admin@test.com' OR '1'='1

const user = await prisma.user.findUnique({
  where: { email }
});

// Actual database query (PostgreSQL prepared statement):
// SELECT * FROM "User" WHERE "email" = $1
// Parameters: ["admin@test.com' OR '1'='1"]
// 
// The single quotes are escaped automatically
// Treated as literal string, not SQL code
// Result: No user found (not a real email)
```

**Complex queries are also safe**:

```typescript
// Search functionality with user input
const search = req.query.search;  // User input: "'; DROP TABLE Note; --"

const notes = await prisma.note.findMany({
  where: {
    userId,
    OR: [
      { title: { contains: search, mode: "insensitive" } },
      { content: { contains: search, mode: "insensitive" } }
    ]
  }
});

// Generated query:
// SELECT * FROM "Note" WHERE "userId" = $1 AND 
// ("title" ILIKE '%' || $2 || '%' OR "content" ILIKE '%' || $2 || '%')
// Parameters: ["user-id-123", "'; DROP TABLE Note; --"]
//
// Just searches for that literal string in content!
// Database is completely safe
```

### Why Prisma is Safe

1. **Prepared Statements**: SQL structure is fixed, user input is passed as data
2. **Type Safety**: TypeScript ensures correct data types
3. **Query Builder**: No string concatenation
4. **Automatic Escaping**: Special characters are escaped

**You literally cannot do SQL injection with Prisma** unless you explicitly use `$queryRaw` with unescaped input (which you don't).

---

## Access Control & Data Isolation

### Row-Level Security Implementation

Every database query includes **user-based filtering**:

```typescript
// Pattern used throughout the application
const userId = req.session.user!.id;  // From authenticated session

// Get notes - only user's notes
const notes = await prisma.note.findMany({
  where: { userId }  // Automatic filtering
});

// Get single note - verify ownership
const note = await prisma.note.findFirst({
  where: { 
    id: noteId,
    userId  // Must belong to this user
  }
});

// Update note - verify ownership first
const note = await prisma.note.update({
  where: { id: noteId },
  data: { title: newTitle }
});
// ⚠️ This would update ANY note with that ID

// ✅ Correct approach:
const note = await prisma.note.updateMany({
  where: { 
    id: noteId,
    userId  // Only updates if user owns it
  },
  data: { title: newTitle }
});
```

### Database Schema Enforcement

**File**: `apps/backend/prisma/schema.prisma`

```prisma
model User {
  id                  String    @id @default(cuid())
  email               String    @unique
  password            String
  
  // Relationships - all data owned by user
  notes               Note[]
  folders             Folder[]
  templates           Template[]
  sharedNotes         NoteShare[] @relation("SharedBy")
  receivedShares      NoteShare[] @relation("SharedWith")
  
  createdAt           DateTime  @default(now())
  updatedAt           DateTime  @updatedAt
  
  @@index([email])
}

model Note {
  id        String   @id @default(cuid())
  userId    String   // Foreign key - required
  title     String   @db.VarChar(255)
  content   String   @db.Text
  
  // Relationship with user
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  // Index for fast user-specific queries
  @@index([userId])
  @@index([userId, createdAt])
  @@index([userId, updatedAt])
}
```

### How Foreign Keys Protect Data

**Foreign key constraint ensures**:
1. Cannot create note without valid userId
2. Cannot set userId to non-existent user
3. Referential integrity maintained

**Example**:
```typescript
// ❌ This will FAIL
await prisma.note.create({
  data: {
    title: "Test Note",
    userId: "non-existent-user-id"
  }
});
// Error: Foreign key constraint failed
// Cannot create note for user that doesn't exist

// ✅ This works
await prisma.note.create({
  data: {
    title: "Test Note",
    userId: req.session.user!.id  // Valid, authenticated user
  }
});
```

### Sharing Security Model

**File**: `prisma/schema.prisma`

```prisma
model NoteShare {
  id               String    @id @default(cuid())
  noteId           String
  sharedByUserId   String    // Owner
  sharedWithUserId String    // Recipient
  permission       String    @default("view")  // view | edit
  expiresAt        DateTime?
  createdAt        DateTime  @default(now())
  
  note             Note      @relation(fields: [noteId], references: [id], onDelete: Cascade)
  sharedBy         User      @relation("SharedBy", fields: [sharedByUserId], references: [id])
  sharedWith       User      @relation("SharedWith", fields: [sharedWithUserId], references: [id])
  
  // Prevent duplicate shares
  @@unique([noteId, sharedWithUserId])
  @@index([sharedWithUserId])
  @@index([noteId])
}
```

**Query for notes user can access**:
```typescript
const accessibleNotes = await prisma.note.findMany({
  where: {
    OR: [
      // Notes I own
      { userId },
      
      // Notes shared with me
      {
        shares: {
          some: {
            sharedWithUserId: userId,
            expiresAt: { gt: new Date() }  // Not expired
          }
        }
      }
    ]
  },
  include: {
    user: {
      select: { name: true, email: true }  // Owner info
    },
    shares: {
      where: { sharedWithUserId: userId }  // My share record
    }
  }
});
```

---

## Password Storage

### bcrypt Implementation

**NEVER store plain-text passwords**:

```typescript
// ❌ NEVER DO THIS
await prisma.user.create({
  data: {
    email: "user@example.com",
    password: "mypassword123"  // Plain text - EXTREMELY DANGEROUS
  }
});
```

**✅ Always hash with bcrypt**:

```typescript
import bcrypt from "bcrypt";

const SALT_ROUNDS = 12;

// Registration
const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
await prisma.user.create({
  data: {
    email,
    password: hashedPassword  // Hashed: "$2b$12$xyz...abc"
  }
});

// Login verification
const user = await prisma.user.findUnique({ where: { email } });
const isValid = await bcrypt.compare(password, user.password);
```

### Why bcrypt?

**Comparison with other methods**:

| Method | Speed | Security | Use Case |
|--------|-------|----------|----------|
| Plain text | Instant | ❌ None | Never |
| MD5 | Very fast | ❌ Broken | Never |
| SHA-256 | Fast | ⚠️ Too fast | Checksums only |
| **bcrypt** | **Slow** | ✅ **Excellent** | **Passwords** ✅ |
| Argon2 | Slow | ✅ Excellent | Passwords (newer) |

**Why slow is good for passwords**:
```
Fast algorithm (SHA-256):
- 1 billion hashes per second
- Attacker can try 1 billion passwords per second
- Your password cracked in minutes

Slow algorithm (bcrypt, 12 rounds):
- ~3 hashes per second
- Attacker can try 3 passwords per second
- Your password takes years to crack
```

### Hash Structure

```
$2b$12$N9qo8uLOickgx2ZMRZoMye7v.YhZ1bWLKL8l9S3XVZLMB0rJlzxdC
│  │  │                                                   │
│  │  └─ Salt (22 characters)                            └─ Hash (31 chars)
│  └─ Cost factor (2^12 = 4,096 iterations)
└─ Algorithm (2b = bcrypt version)
```

**Salt uniqueness**:
```typescript
// Same password, different users
await bcrypt.hash("hello123", 12);  
// Result: "$2b$12$salt1...hash1"

await bcrypt.hash("hello123", 12);  
// Result: "$2b$12$salt2...hash2"  // Different!

// Prevents rainbow table attacks
// Attackers can't use precomputed hash databases
```

---

## Data Validation & Constraints

### Database-Level Constraints

**File**: `prisma/schema.prisma`

```prisma
model User {
  email     String    @unique  // Ensures no duplicate emails
  password  String             // Required (cannot be null)
  
  @@index([email])  // Fast lookup + uniqueness enforcement
}

model Note {
  title     String   @db.VarChar(255)  // Max 255 characters
  content   String   @db.Text          // Unlimited (within reason)
  tags      String[] @db.VarChar(50)[] // Array of strings, each max 50
  userId    String                     // Required (cannot be null)
  
  @@index([userId])
}
```

**What happens when constraints are violated**:

```typescript
// ❌ Duplicate email
await prisma.user.create({
  data: { email: "existing@example.com", password: "hash" }
});
// Error: Unique constraint failed on the fields: (`email`)

// ❌ Title too long
await prisma.note.create({
  data: {
    title: "a".repeat(300),  // 300 characters
    userId: "user-id"
  }
});
// Error: Value too long for VARCHAR(255)

// ❌ Missing required field
await prisma.note.create({
  data: {
    title: "Test"
    // Missing userId
  }
});
// Error: Field userId is required
```

### Application-Level Validation

**Validation happens in layers**:

```typescript
// Layer 1: TypeScript types (compile-time)
const email: string = req.body.email;

// Layer 2: Format validation
import validator from "validator";
if (!validator.isEmail(email)) {
  return res.status(400).json({ error: "Invalid email" });
}

// Layer 3: Zod schema validation
import { createNoteSchema } from "@notes/types";
const result = createNoteSchema.safeParse(req.body);
if (!result.success) {
  return res.status(400).json({ error: result.error });
}

// Layer 4: Database constraints (as backup)
await prisma.note.create({ data: result.data });
```

---

## Cascade Deletion & GDPR

### onDelete: Cascade

**Schema configuration**:

```prisma
model Note {
  userId String
  user   User   @relation(fields: [userId], references: [id], onDelete: Cascade)
  //                                                           ^^^^^^^^^^^^^^^^
  //                                                           Cascade deletion
}

model Folder {
  userId String
  user   User   @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model Template {
  userId String
  user   User   @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model NoteShare {
  sharedByUserId String
  sharedBy       User   @relation("SharedBy", fields: [sharedByUserId], references: [id], onDelete: Cascade)
}

model NoteVersion {
  noteId String
  note   Note   @relation(fields: [noteId], references: [id], onDelete: Cascade)
}
```

### How It Works

**Without Cascade**:
```typescript
// ❌ Manual cleanup required (error-prone)
await prisma.note.deleteMany({ where: { userId } });
await prisma.folder.deleteMany({ where: { userId } });
await prisma.template.deleteMany({ where: { userId } });
await prisma.noteShare.deleteMany({ where: { sharedByUserId: userId } });
await prisma.noteShare.deleteMany({ where: { sharedWithUserId: userId } });
await prisma.user.delete({ where: { id: userId } });

// Easy to miss something → orphaned data
// Not GDPR compliant
```

**With Cascade (your implementation)**:
```typescript
// ✅ One command deletes everything
await prisma.user.delete({ where: { id: userId } });

// Automatically deletes:
// - All notes owned by user
// - All folders owned by user
// - All templates owned by user
// - All shares created by user
// - All versions of notes owned by user
//
// NO orphaned data left behind
// GDPR compliant (Right to be forgotten)
```

### GDPR Compliance

**Right to Erasure (Right to be Forgotten)**:

```typescript
// DELETE /api/user/account
router.delete("/account", requireAuth, async (req, res) => {
  const userId = req.session.user!.id;
  
  // Delete user + all related data (cascade)
  await prisma.user.delete({ where: { id: userId } });
  
  // Destroy session
  req.session.destroy();
  
  res.json({ 
    success: true, 
    message: "Account and all data permanently deleted" 
  });
});
```

**Data deleted**:
- ✅ User account
- ✅ All notes
- ✅ All folders
- ✅ All templates
- ✅ All shares (sent and received)
- ✅ All note versions
- ✅ Session data

**Irreversible**: Once deleted, cannot be recovered (as required by GDPR).

---

## Indexing for Security

### Performance = Security

**Slow queries can be exploited**:
- Timeout attacks
- Resource exhaustion
- Denial of Service

**Fast queries prevent attacks**:
- Quick response times
- Efficient resource usage
- Better rate limiting effectiveness

### Security-Critical Indexes

**File**: `prisma/schema.prisma`

```prisma
model User {
  email String @unique
  
  @@index([email])  // Fast login lookups
}

model Note {
  userId String
  
  @@index([userId])              // Fast "my notes" query
  @@index([userId, updatedAt])   // Fast sorted queries
  @@index([userId, isTrashed])   // Fast trash filtering
}

model NoteShare {
  sharedWithUserId String
  
  @@index([sharedWithUserId])  // Fast "shared with me" query
}
```

### Query Performance Impact

**Without index**:
```typescript
// Query: Get all notes for user
const notes = await prisma.note.findMany({
  where: { userId }
});

// Without index on userId:
// - Full table scan: O(n) where n = total notes in database
// - 1,000,000 notes → 5000ms query time
// - Easy to trigger timeout attacks
```

**With index** (your implementation):
```typescript
// Same query with index:
// - Index lookup: O(log n)
// - 1,000,000 notes → 5ms query time
// - 1000x faster!
// - Prevents timeout exploitation
```

### Indexes in Your Database

From [DATABASE.md](DATABASE.md):

| Index | Purpose | Security Benefit |
|-------|---------|------------------|
| `User.email` | Fast login lookups | Prevents timing attacks on login |
| `Note.userId` | Fast user note queries | Prevents DoS on note listing |
| `Note(userId, createdAt)` | Sorted queries | Fast pagination |
| `Note(userId, updatedAt)` | Recent notes | Fast dashboard loading |
| `Note(userId, isTrashed)` | Trash filtering | Fast trash operations |
| `NoteShare.sharedWithUserId` | Shared notes | Fast share queries |

---

## Soft Deletes

### Implementation

**Schema**:
```prisma
model Note {
  isTrashed Boolean   @default(false)
  trashedAt DateTime?
  
  @@index([userId, isTrashed])  // Fast trash queries
}
```

**Move to trash** (not permanent delete):
```typescript
// PUT /api/notes/:id/trash
await prisma.note.update({
  where: { id: noteId },
  data: {
    isTrashed: true,
    trashedAt: new Date()
  }
});
```

**Restore from trash**:
```typescript
// PUT /api/notes/:id/restore
await prisma.note.update({
  where: { id: noteId },
  data: {
    isTrashed: false,
    trashedAt: null
  }
});
```

**Permanent delete** (admin/scheduled):
```typescript
// DELETE /api/notes/:id/permanent
await prisma.note.delete({
  where: { id: noteId }
});
```

### Security Benefits

1. **Accidental deletion protection**: Users can recover accidentally deleted notes
2. **Audit trail**: Know when notes were deleted
3. **Compliance**: Retain data for legal requirements
4. **Attack recovery**: Recover if attacker deletes data

### Auto-Cleanup (Recommended)

```typescript
// Cron job: Delete notes in trash > 30 days
async function cleanupTrash() {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  const deleted = await prisma.note.deleteMany({
    where: {
      isTrashed: true,
      trashedAt: { lt: thirtyDaysAgo }
    }
  });
  
  console.log(`Cleaned up ${deleted.count} old trashed notes`);
}

// Run daily
setInterval(cleanupTrash, 24 * 60 * 60 * 1000);
```

---

## Audit Trail

### Timestamps

**Every model has automatic timestamps**:

```prisma
model Note {
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

**Automatically maintained by Prisma**:
```typescript
// Create note
const note = await prisma.note.create({ data: { title, userId } });
// note.createdAt = "2025-12-13T10:00:00.000Z"
// note.updatedAt = "2025-12-13T10:00:00.000Z"

// Update note
const updated = await prisma.note.update({
  where: { id: note.id },
  data: { title: "New Title" }
});
// updated.createdAt = "2025-12-13T10:00:00.000Z" (unchanged)
// updated.updatedAt = "2025-12-13T10:05:00.000Z" (automatic!)
```

### Version History

**Schema**:
```prisma
model NoteVersion {
  id        String   @id @default(cuid())
  noteId    String
  title     String   @db.VarChar(255)
  content   String   @db.Text
  version   Int
  createdAt DateTime @default(now())
  
  note      Note     @relation(fields: [noteId], references: [id], onDelete: Cascade)
  
  @@index([noteId])
  @@index([noteId, version])
}
```

**Create version on update**:
```typescript
// Before updating note, save current version
await prisma.noteVersion.create({
  data: {
    noteId: note.id,
    title: note.title,
    content: note.content,
    version: note.version
  }
});

// Then update note
await prisma.note.update({
  where: { id: note.id },
  data: {
    title: newTitle,
    content: newContent,
    version: { increment: 1 }
  }
});
```

**Security benefits**:
- Track all changes to sensitive data
- Detect unauthorized modifications
- Recover from data corruption
- Forensic analysis if breach occurs

---

## Best Practices

### ✅ DO

1. **Always filter by userId**
   ```typescript
   const notes = await prisma.note.findMany({ where: { userId } });
   ```

2. **Use transactions for related operations**
   ```typescript
   await prisma.$transaction([
     prisma.note.update({ where: { id }, data: { title } }),
     prisma.noteVersion.create({ data: { noteId: id, ... } })
   ]);
   ```

3. **Validate before database operations**
   ```typescript
   const result = schema.safeParse(data);
   if (!result.success) return error;
   await prisma.note.create({ data: result.data });
   ```

4. **Use indexes for frequently queried fields**
   ```prisma
   @@index([userId])
   @@index([userId, createdAt])
   ```

5. **Enable cascading deletes**
   ```prisma
   user User @relation(fields: [userId], references: [id], onDelete: Cascade)
   ```

6. **Use SSL in production**
   ```bash
   DATABASE_URL="...?sslmode=require"
   ```

7. **Hash sensitive data**
   ```typescript
   const hash = await bcrypt.hash(password, 12);
   ```

8. **Keep audit trails**
   ```prisma
   createdAt DateTime @default(now())
   updatedAt DateTime @updatedAt
   ```

### ❌ DON'T

1. **Never use raw SQL with user input**
   ```typescript
   // ❌ NEVER DO THIS
   await prisma.$queryRaw`SELECT * FROM users WHERE email = ${email}`;
   ```

2. **Never store plain-text passwords**
   ```typescript
   // ❌ NEVER
   data: { password: userInput }
   ```

3. **Never skip userId filtering**
   ```typescript
   // ❌ Allows access to other users' data
   await prisma.note.findUnique({ where: { id } });
   ```

4. **Never expose database errors to users**
   ```typescript
   // ❌ Leaks database structure
   res.json({ error: prismaError.message });
   
   // ✅ Generic message
   res.json({ error: "An error occurred" });
   ```

5. **Never use weak SSL modes in production**
   ```bash
   # ❌ NEVER in production
   DATABASE_URL="...?sslmode=disable"
   ```

6. **Never delete related data without cascade**
   ```typescript
   // ❌ Leaves orphaned records
   await prisma.user.delete({ where: { id } });
   // Notes, folders, etc. still exist → data leak
   ```

---

## Security Checklist

### Pre-Deployment

- [ ] `DATABASE_URL` uses SSL (`sslmode=require`)
- [ ] Strong database password (16+ characters)
- [ ] All queries filter by `userId`
- [ ] Foreign key constraints defined
- [ ] Cascade deletes configured
- [ ] Indexes on security-critical fields
- [ ] Passwords hashed with bcrypt (12+ rounds)
- [ ] No raw SQL queries with user input
- [ ] Input validation with Zod schemas
- [ ] Database backups configured
- [ ] Connection pool limits set

### Runtime Monitoring

- [ ] Query performance monitored
- [ ] Slow query alerts configured
- [ ] Failed login attempts logged
- [ ] Database connection errors logged
- [ ] Regular security audits scheduled

### GDPR Compliance

- [ ] User can delete all their data
- [ ] Cascade deletes remove all related data
- [ ] Data retention policy documented
- [ ] Audit trail for sensitive operations

---

**Last Review**: December 13, 2025  
**Next Review**: March 13, 2026

**Related Documentation**:
- [Backend Security](../apps/backend/docs/SECURITY.md)
- [Database Design](DATABASE.md)
- [API Documentation](../apps/backend/docs/API.md)
