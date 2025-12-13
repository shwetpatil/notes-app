# Backend Architecture Documentation

**Last Updated**: December 13, 2025  
**Version**: 2.0  
**Status**: ✅ Production Ready

---

## Table of Contents

1. [Overview](#overview)
2. [Architecture Pattern](#architecture-pattern)
3. [Directory Structure](#directory-structure)
4. [Layer Responsibilities](#layer-responsibilities)
5. [Design Patterns](#design-patterns)
6. [Code Organization](#code-organization)
7. [Best Practices](#best-practices)
8. [Examples](#examples)

---

## Overview

The backend follows a **layered architecture** pattern with clear separation of concerns. This approach improves:

- **Maintainability**: Easy to locate and modify code
- **Testability**: Each layer can be tested independently
- **Scalability**: Easy to add new features without affecting existing code
- **Reusability**: Business logic can be shared across multiple routes

### Technology Stack

```
┌─────────────────────────────────────────────────────────┐
│  Express.js (Web Framework)                             │
│  + TypeScript (Type Safety)                             │
│  + Prisma ORM (Database)                                │
│  + Pino (Logging)                                       │
│  + Zod (Validation)                                     │
└─────────────────────────────────────────────────────────┘
```

---

## Architecture Pattern

The application uses a **4-layer architecture**:

```
┌─────────────────────────────────────────────────────────┐
│  LAYER 1: Routes (API Endpoints)                        │
│  - HTTP request/response handling                       │
│  - Route definitions                                    │
│  - Request validation                                   │
│  - Response formatting                                  │
└────────────────────┬────────────────────────────────────┘
                     ↓
┌─────────────────────────────────────────────────────────┐
│  LAYER 2: Middleware (Cross-cutting Concerns)           │
│  - Authentication                                       │
│  - Validation                                           │
│  - Error handling                                       │
│  - Logging & monitoring                                 │
└────────────────────┬────────────────────────────────────┘
                     ↓
┌─────────────────────────────────────────────────────────┐
│  LAYER 3: Services (Business Logic)                     │
│  - Core application logic                               │
│  - Data transformation                                  │
│  - Business rules enforcement                           │
│  - Transaction management                               │
└────────────────────┬────────────────────────────────────┘
                     ↓
┌─────────────────────────────────────────────────────────┐
│  LAYER 4: Data Access (Database)                        │
│  - Prisma ORM                                           │
│  - Database queries                                     │
│  - Data models                                          │
└─────────────────────────────────────────────────────────┘
```

### Flow Example: Creating a Note

```
1. Client → POST /api/notes
   ↓
2. Route Handler (routes/notes.ts)
   - Validates request using middleware
   - Extracts userId from session
   ↓
3. Service Layer (services/note.service.ts)
   - Applies business logic
   - Creates note with default values
   - Handles errors
   ↓
4. Data Access (Prisma)
   - Executes database query
   - Returns created note
   ↓
5. Route Handler
   - Formats response
   - Returns JSON to client
```

---

## Directory Structure

```
apps/backend/src/
├── config/                 # Configuration modules
│   ├── index.ts           # Central config export
│   ├── server.config.ts   # Server settings
│   ├── database.config.ts # Database connection
│   ├── security.config.ts # Security settings
│   ├── logger.config.ts   # Logging configuration
│   ├── cluster.config.ts  # Clustering settings
│   └── monitoring.config.ts # Monitoring config
│
├── constants/             # Application constants
│   └── index.ts          # Centralized constants & enums
│
├── middleware/            # Express middleware
│   ├── auth.ts           # Authentication middleware
│   ├── validation.ts     # Request validation
│   ├── sanitize.ts       # Input sanitization
│   ├── errorHandler.ts   # Global error handler
│   └── monitoring.ts     # Performance monitoring
│
├── routes/                # API route definitions
│   ├── auth.ts           # Authentication endpoints
│   ├── notes.ts          # Notes CRUD endpoints
│   ├── folders.ts        # Folders endpoints
│   ├── templates.ts      # Templates endpoints
│   ├── shares.ts         # Sharing endpoints
│   ├── export.ts         # Export endpoints
│   ├── health.ts         # Health check
│   └── metrics.ts        # Metrics endpoint
│
├── services/              # Business logic layer
│   ├── note.service.ts   # Notes business logic
│   ├── auth.service.ts   # Auth business logic
│   ├── folder.service.ts # Folders business logic
│   └── template.service.ts # Templates business logic
│
├── utils/                 # Utility functions
│   └── smartTags.ts      # Tag suggestion utilities
│
├── __tests__/            # Test files
│   ├── setup.ts          # Test configuration
│   ├── helpers.ts        # Test utilities
│   ├── auth.test.ts      # Auth tests
│   ├── notes.test.ts     # Notes tests
│   ├── health.test.ts    # Health check tests
│   └── middleware.test.ts # Middleware tests
│
├── cluster.ts            # Cluster management
├── server.ts             # Express app setup
└── index.ts              # Application entry point
```

---

## Layer Responsibilities

### Layer 1: Routes

**Purpose**: Handle HTTP requests and responses

**Responsibilities**:
- Define API endpoints
- Apply middleware (auth, validation)
- Extract request data
- Call service layer
- Format responses
- Handle HTTP status codes

**What NOT to do**:
- ❌ Direct database queries
- ❌ Business logic
- ❌ Complex data transformations
- ❌ Error handling logic (use error handler)

**Example**:
```typescript
// ✅ GOOD: Thin route handler
router.post("/", 
  requireAuth, 
  validate(createNoteSchema),
  async (req, res) => {
    const userId = req.session.user!.id;
    const note = await NoteService.createNote(userId, req.body);
    
    res.status(201).json({
      success: true,
      data: note
    });
  }
);

// ❌ BAD: Fat route handler with business logic
router.post("/", async (req, res) => {
  const userId = req.session.user!.id;
  
  // Database query in route
  const note = await prisma.note.create({
    data: { ...req.body, userId }
  });
  
  // Business logic in route
  if (note.tags.length > 10) {
    throw new Error("Too many tags");
  }
  
  res.json({ note });
});
```

### Layer 2: Middleware

**Purpose**: Handle cross-cutting concerns

**Responsibilities**:
- Authentication & authorization
- Request validation
- Input sanitization
- Logging & monitoring
- Error handling
- Rate limiting

**Middleware Types**:
1. **Authentication**: Verify user identity
2. **Validation**: Check request data format
3. **Sanitization**: Clean user input
4. **Logging**: Track requests
5. **Error Handling**: Catch and format errors

**Example**:
```typescript
// Authentication middleware
export const requireAuth = (req, res, next) => {
  if (!req.session.user) {
    return res.status(401).json({ error: "Authentication required" });
  }
  next();
};

// Validation middleware
export const validate = (schema: ZodSchema) => {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }
    req.body = result.data;
    next();
  };
};
```

### Layer 3: Services

**Purpose**: Implement business logic

**Responsibilities**:
- Core application logic
- Data validation & transformation
- Business rules enforcement
- Transaction management
- Logging business events
- Error handling

**What Services Should Do**:
- ✅ Validate business rules
- ✅ Transform data
- ✅ Coordinate multiple database operations
- ✅ Handle complex queries
- ✅ Log business events

**What Services Should NOT Do**:
- ❌ HTTP request/response handling
- ❌ Session management
- ❌ Direct middleware concerns

**Example**:
```typescript
// ✅ GOOD: Service with business logic
export class NoteService {
  static async createNote(userId: string, data: CreateNoteData) {
    // Business rule: Limit tags
    if (data.tags && data.tags.length > 10) {
      throw new Error("Cannot have more than 10 tags");
    }
    
    // Business rule: Default values
    const note = await prisma.note.create({
      data: {
        ...data,
        userId,
        content: data.content || "",
      }
    });
    
    // Log business event
    logger.info({ noteId: note.id, userId }, "Note created");
    
    return note;
  }
}

// ❌ BAD: Service handling HTTP concerns
export class NoteService {
  static async createNote(req: Request, res: Response) {
    const userId = req.session.user!.id;  // ❌ Should be passed as parameter
    const note = await prisma.note.create({ data: req.body });
    res.json({ note });  // ❌ Should return data, not send response
  }
}
```

### Layer 4: Data Access

**Purpose**: Database operations

**Handled by**: Prisma ORM

**Responsibilities**:
- Execute database queries
- Handle connections
- Transaction management
- Schema migrations

**Accessed through**: `prisma` instance from config

---

## Design Patterns

### 1. Service Pattern

**Purpose**: Encapsulate business logic

**Implementation**:
```typescript
// services/note.service.ts
export class NoteService {
  static async getNotes(userId: string, filters: NoteFilters) {
    // Business logic here
  }
  
  static async createNote(userId: string, data: CreateNoteData) {
    // Business logic here
  }
}

// Usage in route
const notes = await NoteService.getNotes(userId, filters);
```

**Benefits**:
- Reusable business logic
- Easy to test
- Clear separation of concerns

### 2. Middleware Pattern

**Purpose**: Handle cross-cutting concerns

**Implementation**:
```typescript
// Middleware factory
export const validate = (schema: ZodSchema) => {
  return (req, res, next) => {
    // Validation logic
  };
};

// Usage
router.post("/", validate(createNoteSchema), handler);
```

**Benefits**:
- Reusable across routes
- Easy to compose
- Clear request pipeline

### 3. Repository Pattern (Partial)

**Purpose**: Abstract database access

**Implementation**: Through Prisma ORM
```typescript
// Instead of raw SQL everywhere:
const notes = await prisma.note.findMany({ where: { userId } });

// Prisma acts as a repository layer
```

### 4. Factory Pattern

**Purpose**: Create configured instances

**Implementation**:
```typescript
// config/logger.config.ts
export const logger = pino({
  level: logLevel,
  transport: { /* config */ }
});

// config/index.ts
export { logger } from './logger.config';
```

**Benefits**:
- Centralized configuration
- Easy to modify
- Consistent instances

### 5. Dependency Injection

**Purpose**: Loose coupling

**Implementation**:
```typescript
// Services receive dependencies as parameters
class NoteService {
  static async createNote(userId: string, data: CreateNoteData) {
    // userId is injected from route
  }
}

// Not stored as class property
```

---

## Code Organization

### Naming Conventions

**Files**:
- `kebab-case.ts` for all files
- `.service.ts` for service files
- `.config.ts` for configuration
- `.test.ts` for test files

**Classes**:
- `PascalCase` for class names
- Static methods for services
- Example: `NoteService`, `AuthService`

**Functions**:
- `camelCase` for function names
- Descriptive action verbs
- Example: `createNote`, `validateInput`

**Constants**:
- `UPPER_SNAKE_CASE` for constants
- Grouped in objects
- Example: `AUTH_CONSTANTS.SALT_ROUNDS`

**Interfaces/Types**:
- `PascalCase` for type names
- Descriptive names
- Example: `CreateNoteData`, `NoteFilters`

### File Organization

**Each file should**:
- Have a clear, single purpose
- Start with a documentation comment
- Group related code together
- Export at the bottom

**Example Structure**:
```typescript
/**
 * Note Service
 * Business logic for note operations
 */

// ============================================================================
// Imports
// ============================================================================

import { prisma } from "../config";
import { logger } from "../config";

// ============================================================================
// Types
// ============================================================================

export interface NoteFilters {
  // ...
}

// ============================================================================
// Service Class
// ============================================================================

export class NoteService {
  // Methods grouped by functionality
}

// ============================================================================
// Helper Functions (if needed)
// ============================================================================

function helperFunction() {
  // ...
}
```

### Import Organization

```typescript
// 1. External dependencies
import express from "express";
import { z } from "zod";

// 2. Internal modules (config, services)
import { prisma, logger } from "../config";
import { NoteService } from "../services/note.service";

// 3. Types
import { CreateNoteData } from "../types";

// 4. Constants
import { HTTP_STATUS, ERROR_MESSAGES } from "../constants";
```

---

## Best Practices

### 1. Error Handling

**✅ DO**:
```typescript
// Service layer
try {
  const note = await prisma.note.create({ data });
  return note;
} catch (error) {
  logger.error({ err: error, data }, "Failed to create note");
  throw error; // Re-throw for route handler
}

// Route layer
try {
  const note = await NoteService.createNote(userId, data);
  res.json({ success: true, data: note });
} catch (error) {
  // Let error handler middleware deal with it
  next(error);
}
```

**❌ DON'T**:
```typescript
// Don't catch and ignore errors
try {
  await prisma.note.create({ data });
} catch (error) {
  // Silent failure - bad!
}

// Don't expose error details to client
catch (error) {
  res.json({ error: error.message }); // May leak sensitive info
}
```

### 2. Logging

**✅ DO**:
```typescript
// Log important business events
logger.info({ noteId, userId }, "Note created");

// Log errors with context
logger.error({ err: error, userId, data }, "Failed to create note");

// Use structured logging
logger.warn({ 
  event: "login_failure", 
  email, 
  ip: req.ip 
});
```

**❌ DON'T**:
```typescript
// Don't use console.log in production
console.log("Note created");

// Don't log sensitive data
logger.info({ password }, "Login attempt"); // ❌ Never log passwords

// Don't log without context
logger.error(error); // What was happening?
```

### 3. Validation

**✅ DO**:
```typescript
// Use Zod schemas
const schema = z.object({
  title: z.string().min(1).max(255),
  content: z.string().optional()
});

// Validate in middleware
router.post("/", validate(schema), handler);

// Service validates business rules
if (data.tags.length > 10) {
  throw new Error("Too many tags");
}
```

**❌ DON'T**:
```typescript
// Don't skip validation
router.post("/", async (req, res) => {
  const data = req.body; // Unvalidated!
  await prisma.note.create({ data });
});

// Don't mix validation concerns
// Route should use Zod
// Service should check business rules
```

### 4. Database Queries

**✅ DO**:
```typescript
// Use Prisma for all queries
const notes = await prisma.note.findMany({
  where: { userId },
  include: { folder: true }
});

// Use transactions for related operations
await prisma.$transaction([
  prisma.note.update({ where: { id }, data }),
  prisma.noteVersion.create({ data: versionData })
]);

// Use indexes for frequent queries
@@index([userId])
@@index([userId, createdAt])
```

**❌ DON'T**:
```typescript
// Don't use raw SQL with user input
await prisma.$queryRaw`SELECT * FROM Note WHERE userId = ${userId}`;
// Use parameterized queries instead

// Don't make N+1 queries
for (const note of notes) {
  const folder = await prisma.folder.findUnique({ where: { id: note.folderId } });
}
// Use include instead
```

### 5. Security

**✅ DO**:
```typescript
// Always filter by userId
const notes = await prisma.note.findMany({
  where: { userId, id: noteId }
});

// Hash passwords
const hash = await bcrypt.hash(password, 12);

// Use secure session settings
cookie: {
  httpOnly: true,
  secure: true,
  sameSite: 'strict'
}
```

**❌ DON'T**:
```typescript
// Don't skip ownership checks
const note = await prisma.note.findUnique({ where: { id } });
// Anyone can access any note!

// Don't store plain passwords
await prisma.user.create({ data: { email, password } });

// Don't expose sensitive data
res.json({ user: { id, email, password } }); // ❌ Never send passwords
```

---

## Examples

### Complete Feature Implementation

Let's implement a new feature: **Note Templates**

#### Step 1: Define Constants

```typescript
// constants/index.ts
export const TEMPLATE_CONSTANTS = {
  MAX_TEMPLATES_PER_USER: 50,
  DEFAULT_TEMPLATE_NAME: "Untitled Template"
} as const;
```

#### Step 2: Create Service

```typescript
// services/template.service.ts
export class TemplateService {
  static async getTemplates(userId: string) {
    return await prisma.template.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" }
    });
  }
  
  static async createTemplate(userId: string, data: CreateTemplateData) {
    // Check limit
    const count = await prisma.template.count({ where: { userId } });
    if (count >= TEMPLATE_CONSTANTS.MAX_TEMPLATES_PER_USER) {
      throw new Error("Template limit reached");
    }
    
    const template = await prisma.template.create({
      data: { ...data, userId }
    });
    
    logger.info({ templateId: template.id, userId }, "Template created");
    return template;
  }
}
```

#### Step 3: Create Route

```typescript
// routes/templates.ts
import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import { validate } from "../middleware/validation";
import { TemplateService } from "../services/template.service";
import { createTemplateSchema } from "@notes/types";

const router = Router();

router.use(requireAuth);

router.get("/", async (req, res, next) => {
  try {
    const userId = req.session.user!.id;
    const templates = await TemplateService.getTemplates(userId);
    
    res.json({ success: true, data: templates });
  } catch (error) {
    next(error);
  }
});

router.post("/", validate(createTemplateSchema), async (req, res, next) => {
  try {
    const userId = req.session.user!.id;
    const template = await TemplateService.createTemplate(userId, req.body);
    
    res.status(201).json({ success: true, data: template });
  } catch (error) {
    next(error);
  }
});

export default router;
```

#### Step 4: Register Route

```typescript
// server.ts
import templatesRouter from "./routes/templates";

app.use("/api/templates", templatesRouter);
```

#### Step 5: Write Tests

```typescript
// __tests__/templates.test.ts
describe("Templates API", () => {
  it("should create a template", async () => {
    const response = await request(app)
      .post("/api/templates")
      .set("Cookie", sessionCookie)
      .send({ title: "My Template", content: "Template content" });
      
    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
  });
});
```

---

## Migration Guide

### Converting Old Routes to New Architecture

**Before (old pattern)**:
```typescript
// routes/notes.ts
router.post("/", async (req, res) => {
  const userId = req.session.user!.id;
  
  // Validation in route
  if (!req.body.title) {
    return res.status(400).json({ error: "Title required" });
  }
  
  // Business logic in route
  if (req.body.tags && req.body.tags.length > 10) {
    return res.status(400).json({ error: "Too many tags" });
  }
  
  // Database query in route
  const note = await prisma.note.create({
    data: { ...req.body, userId }
  });
  
  res.json({ note });
});
```

**After (new pattern)**:
```typescript
// routes/notes.ts
router.post("/",
  requireAuth,
  validate(createNoteSchema),
  async (req, res, next) => {
    try {
      const userId = req.session.user!.id;
      const note = await NoteService.createNote(userId, req.body);
      res.status(201).json({ success: true, data: note });
    } catch (error) {
      next(error);
    }
  }
);

// services/note.service.ts
static async createNote(userId: string, data: CreateNoteData) {
  if (data.tags && data.tags.length > 10) {
    throw new Error("Too many tags");
  }
  
  const note = await prisma.note.create({
    data: { ...data, userId }
  });
  
  logger.info({ noteId: note.id, userId }, "Note created");
  return note;
}
```

---

## Performance Considerations

### 1. Database Queries

```typescript
// ✅ Use select to fetch only needed fields
const notes = await prisma.note.findMany({
  select: { id: true, title: true, updatedAt: true }
});

// ✅ Use pagination for large datasets
const notes = await prisma.note.findMany({
  skip: (page - 1) * pageSize,
  take: pageSize
});

// ✅ Use indexes for frequent queries
@@index([userId, createdAt])
```

### 2. Caching Strategy

```typescript
// Cache frequently accessed data
const cachedUser = await redis.get(`user:${userId}`);
if (cachedUser) return JSON.parse(cachedUser);

const user = await prisma.user.findUnique({ where: { id: userId } });
await redis.set(`user:${userId}`, JSON.stringify(user), 'EX', 3600);
```

### 3. Async Operations

```typescript
// ✅ Run independent operations in parallel
const [notes, folders, templates] = await Promise.all([
  NoteService.getNotes(userId),
  FolderService.getFolders(userId),
  TemplateService.getTemplates(userId)
]);

// ❌ Don't run sequentially
const notes = await NoteService.getNotes(userId);
const folders = await FolderService.getFolders(userId);
const templates = await TemplateService.getTemplates(userId);
```

---

**For more information**:
- [API Documentation](API.md)
- [Security Documentation](SECURITY.md)
- [Database Documentation](../../../docs/DATABASE.md)
- [Testing Guide](TESTING.md)

**Last Review**: December 13, 2025  
**Next Review**: March 13, 2026
