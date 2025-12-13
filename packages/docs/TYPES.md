# @notes/types Documentation

Complete documentation for the shared TypeScript types and Zod validation schemas package.

## 📋 Table of Contents

- [Overview](#overview)
- [Installation](#installation)
- [Core Interfaces](#core-interfaces)
- [Validation Schemas](#validation-schemas)
- [API Response Types](#api-response-types)
- [Usage Examples](#usage-examples)
- [Zod Basics](#zod-basics)

---

## Overview

The `@notes/types` package provides:

- **Type Definitions** - TypeScript interfaces for all data entities
- **Validation Schemas** - Zod schemas for runtime validation
- **Type Inference** - Auto-generated types from Zod schemas
- **API Contracts** - Shared types for requests/responses

**Why this package exists:**
- Single source of truth for data structures
- Type safety across frontend and backend
- Runtime validation with Zod
- Consistent error messages
- No code duplication

---

## Installation

This package is automatically linked in the monorepo:

```json
// apps/backend/package.json or apps/frontend/package.json
{
  "dependencies": {
    "@notes/types": "workspace:*"
  }
}
```

**Import in code:**
```typescript
import { Note, createNoteSchema, ApiResponse } from '@notes/types';
```

---

## Core Interfaces

### User

Represents a user account.

```typescript
interface User {
  id: string;                     // Unique identifier (cuid)
  email: string;                  // User email (unique)
  name: string;                   // Display name
  createdAt: Date;                // Account creation timestamp
  updatedAt: Date;                // Last update timestamp
}
```

**Example:**
```typescript
const user: User = {
  id: "cl9x2j3k40000",
  email: "john@example.com",
  name: "John Doe",
  createdAt: new Date("2024-01-01"),
  updatedAt: new Date("2024-01-15")
};
```

---

### Note

Represents a note/document.

```typescript
interface Note {
  // Identity
  id: string;                     // Unique identifier
  userId: string;                 // Owner user ID
  
  // Content
  title: string;                  // Note title (max 255 chars)
  content: string;                // Note content (unlimited)
  contentFormat: "plaintext" | "markdown" | "html"; // Content format
  
  // Organization
  tags: string[];                 // Array of tag names
  color?: string;                 // Optional color (hex code)
  
  // Status Flags
  isPinned: boolean;              // Pinned to top of list
  isFavorite: boolean;            // Marked as favorite
  isArchived: boolean;            // Hidden from main view
  isTrashed: boolean;             // Soft deleted (in trash)
  isMarkdown: boolean;            // Legacy field (deprecated)
  
  // Timestamps
  createdAt: Date;                // Creation timestamp
  updatedAt: Date;                // Last update timestamp
  trashedAt?: Date;               // When moved to trash
  syncedAt?: Date;                // Last sync timestamp
}
```

**Field Details:**

- **contentFormat**: 
  - `"plaintext"` - Plain text only
  - `"markdown"` - Markdown syntax
  - `"html"` - Rich HTML from TipTap editor

- **isMarkdown**: Legacy boolean, use `contentFormat` instead

- **Status flags**: All boolean flags are mutually compatible except:
  - Trashed notes are typically hidden
  - Archived notes are typically hidden from main view

**Example:**
```typescript
const note: Note = {
  id: "ck1a2b3c4d5e",
  userId: "cl9x2j3k40000",
  title: "Meeting Notes",
  content: "## Discussed\n\n- Project timeline\n- Budget allocation",
  contentFormat: "markdown",
  tags: ["work", "meeting", "important"],
  color: "#3B82F6",
  isPinned: true,
  isFavorite: false,
  isArchived: false,
  isTrashed: false,
  isMarkdown: true,
  createdAt: new Date(),
  updatedAt: new Date()
};
```

---

### Template

Represents a reusable note template.

```typescript
interface Template {
  // Identity
  id: string;                     // Unique identifier
  userId: string;                 // Creator user ID
  
  // Metadata
  name: string;                   // Template name (max 255 chars)
  description?: string;           // Optional description (max 500 chars)
  
  // Content
  content: string;                // Template content
  contentFormat: "plaintext" | "markdown" | "html";
  
  // Defaults
  tags: string[];                 // Default tags for notes
  color?: string;                 // Default color for notes
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}
```

**Example:**
```typescript
const template: Template = {
  id: "tmpl_123",
  userId: "cl9x2j3k40000",
  name: "Daily Standup",
  description: "Template for daily standup meetings",
  content: "## What I did yesterday\n\n## What I'll do today\n\n## Blockers\n\n",
  contentFormat: "markdown",
  tags: ["standup", "meeting"],
  color: "#10B981",
  createdAt: new Date(),
  updatedAt: new Date()
};
```

---

### SessionUser

Minimal user data stored in session.

```typescript
interface SessionUser {
  id: string;       // User ID
  email: string;    // User email
  name: string;     // User name
}
```

**Usage:** Stored in `req.session.user` on the backend.

---

### AuthResponse

Response after successful login/register.

```typescript
interface AuthResponse {
  user: SessionUser;
  message: string;
}
```

**Example:**
```typescript
const response: AuthResponse = {
  user: {
    id: "cl9x2j3k40000",
    email: "user@example.com",
    name: "John Doe"
  },
  message: "Login successful"
};
```

---

## Validation Schemas

All schemas use [Zod](https://zod.dev/) for runtime validation.

### loginSchema

Validates user login credentials.

```typescript
const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  rememberMe: z.boolean().optional()
});

type LoginInput = z.infer<typeof loginSchema>;
// Result: { email: string; password: string; rememberMe?: boolean }
```

**Validation Rules:**
- `email`: Must be valid email format
- `password`: Minimum 6 characters
- `rememberMe`: Optional boolean

**Examples:**
```typescript
// ✅ Valid
loginSchema.parse({
  email: "user@example.com",
  password: "secret123"
});

// ✅ Valid with remember me
loginSchema.parse({
  email: "user@example.com",
  password: "mypassword",
  rememberMe: true
});

// ❌ Invalid email
loginSchema.parse({
  email: "not-an-email",
  password: "secret123"
});
// Throws: "Invalid email address"

// ❌ Password too short
loginSchema.parse({
  email: "user@example.com",
  password: "123"
});
// Throws: "Password must be at least 6 characters"
```

**Safe Parsing:**
```typescript
const result = loginSchema.safeParse(data);

if (result.success) {
  console.log(result.data); // { email: string, password: string, ... }
} else {
  console.error(result.error.flatten());
  /* {
    fieldErrors: {
      email: ["Invalid email address"],
      password: ["Password must be at least 6 characters"]
    }
  } */
}
```

---

### createNoteSchema

Validates note creation data.

```typescript
const createNoteSchema = z.object({
  title: z.string()
    .min(1, "Title is required")
    .max(255, "Title too long"),
  
  content: z.string(),
  
  contentFormat: z.enum(["plaintext", "markdown", "html"])
    .optional()
    .default("plaintext"),
  
  tags: z.array(z.string())
    .optional()
    .default([]),
  
  color: z.string().optional(),
  
  isPinned: z.boolean().optional().default(false),
  isFavorite: z.boolean().optional().default(false),
  isArchived: z.boolean().optional().default(false),
  isMarkdown: z.boolean().optional().default(false),
  isTrashed: z.boolean().optional().default(false)
});

type CreateNoteInput = z.infer<typeof createNoteSchema>;
```

**Validation Rules:**
- `title`: Required, 1-255 characters
- `content`: Required, any length
- `contentFormat`: Optional, defaults to "plaintext"
- `tags`: Optional, defaults to empty array
- `color`: Optional hex color
- Booleans: All optional, default to false

**Examples:**
```typescript
// ✅ Minimal valid input
createNoteSchema.parse({
  title: "My Note",
  content: "Note content"
});
// Result with defaults:
// {
//   title: "My Note",
//   content: "Note content",
//   contentFormat: "plaintext",
//   tags: [],
//   isPinned: false,
//   isFavorite: false,
//   isArchived: false,
//   isMarkdown: false,
//   isTrashed: false
// }

// ✅ With optional fields
createNoteSchema.parse({
  title: "Important Note",
  content: "This is important",
  contentFormat: "markdown",
  tags: ["urgent", "work"],
  color: "#EF4444",
  isPinned: true
});

// ❌ Title missing
createNoteSchema.parse({
  content: "Content"
});
// Throws: "Title is required"

// ❌ Title too long
createNoteSchema.parse({
  title: "a".repeat(256),
  content: "Content"
});
// Throws: "Title too long"
```

---

### updateNoteSchema

Validates note update data (all fields optional for partial updates).

```typescript
const updateNoteSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  content: z.string().optional(),
  contentFormat: z.enum(["plaintext", "markdown", "html"]).optional(),
  tags: z.array(z.string()).optional(),
  color: z.string().optional(),
  isPinned: z.boolean().optional(),
  isFavorite: z.boolean().optional(),
  isArchived: z.boolean().optional(),
  isMarkdown: z.boolean().optional(),
  isTrashed: z.boolean().optional()
});

type UpdateNoteInput = z.infer<typeof updateNoteSchema>;
```

**Validation Rules:**
- All fields optional (for partial updates)
- `title`: If provided, 1-255 characters
- Other rules same as createNoteSchema

**Examples:**
```typescript
// ✅ Update only title
updateNoteSchema.parse({
  title: "Updated Title"
});

// ✅ Update multiple fields
updateNoteSchema.parse({
  title: "New Title",
  isPinned: true,
  tags: ["updated", "modified"]
});

// ✅ Empty update (valid but does nothing)
updateNoteSchema.parse({});

// ❌ Invalid title
updateNoteSchema.parse({
  title: ""  // Empty string not allowed
});
// Throws: Validation error
```

---

### createTemplateSchema

Validates template creation data.

```typescript
const createTemplateSchema = z.object({
  name: z.string()
    .min(1, "Name is required")
    .max(255, "Name too long"),
  
  description: z.string()
    .max(500, "Description too long")
    .optional(),
  
  content: z.string(),
  
  contentFormat: z.enum(["plaintext", "markdown", "html"])
    .optional()
    .default("plaintext"),
  
  tags: z.array(z.string())
    .optional()
    .default([]),
  
  color: z.string().optional()
});

type CreateTemplateInput = z.infer<typeof createTemplateSchema>;
```

**Validation Rules:**
- `name`: Required, 1-255 characters
- `description`: Optional, max 500 characters
- `content`: Required
- `contentFormat`: Optional, defaults to "plaintext"
- `tags`: Optional, defaults to empty array
- `color`: Optional

**Examples:**
```typescript
// ✅ Minimal valid input
createTemplateSchema.parse({
  name: "Meeting Template",
  content: "Template content"
});

// ✅ With all fields
createTemplateSchema.parse({
  name: "Daily Standup",
  description: "For daily standup meetings",
  content: "## Yesterday\n\n## Today\n\n## Blockers",
  contentFormat: "markdown",
  tags: ["meeting", "standup"],
  color: "#3B82F6"
});
```

---

### updateTemplateSchema

Validates template update data (all fields optional).

```typescript
const updateTemplateSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().max(500).optional(),
  content: z.string().optional(),
  contentFormat: z.enum(["plaintext", "markdown", "html"]).optional(),
  tags: z.array(z.string()).optional(),
  color: z.string().optional()
});

type UpdateTemplateInput = z.infer<typeof updateTemplateSchema>;
```

---

## API Response Types

### ApiResponse<T>

Generic wrapper for all API responses.

```typescript
interface ApiResponse<T = unknown> {
  success: boolean;    // Operation success/failure
  data?: T;            // Response data (if successful)
  error?: string;      // Error message (if failed)
  message?: string;    // Additional message
}
```

**Usage Patterns:**

```typescript
// Success with data
const response: ApiResponse<Note> = {
  success: true,
  data: note
};

// Success with message
const response: ApiResponse = {
  success: true,
  message: "Note deleted successfully"
};

// Error response
const response: ApiResponse = {
  success: false,
  error: "Note not found"
};

// Error with details
const response: ApiResponse = {
  success: false,
  error: "Validation failed",
  message: "Title is required"
};
```

---

### PaginatedResponse<T>

Response for paginated list endpoints.

```typescript
interface PaginatedResponse<T> {
  data: T[];           // Array of items
  total: number;       // Total items in database
  page: number;        // Current page number
  limit: number;       // Items per page
}
```

**Example:**
```typescript
const response: PaginatedResponse<Note> = {
  data: [note1, note2, note3],
  total: 150,
  page: 1,
  limit: 20
};

// Calculate total pages
const totalPages = Math.ceil(response.total / response.limit); // 8
```

---

## Usage Examples

### Backend: API Route Validation

```typescript
import { createNoteSchema, ApiResponse, Note } from '@notes/types';
import { Request, Response } from 'express';

app.post('/api/notes', async (req: Request, res: Response) => {
  // Validate request body
  const result = createNoteSchema.safeParse(req.body);
  
  if (!result.success) {
    const errorResponse: ApiResponse = {
      success: false,
      error: "Validation failed",
      message: result.error.message
    };
    return res.status(400).json(errorResponse);
  }
  
  // Type-safe validated data
  const noteData = result.data;
  
  // Create note in database
  const note = await prisma.note.create({
    data: {
      ...noteData,
      userId: req.session.user!.id
    }
  });
  
  // Send response
  const successResponse: ApiResponse<Note> = {
    success: true,
    data: note
  };
  
  res.json(successResponse);
});
```

---

### Backend: Update with Partial Data

```typescript
import { updateNoteSchema, ApiResponse, Note } from '@notes/types';

app.patch('/api/notes/:id', async (req: Request, res: Response) => {
  const result = updateNoteSchema.safeParse(req.body);
  
  if (!result.success) {
    return res.status(400).json({
      success: false,
      error: result.error.message
    });
  }
  
  // Only updates provided fields
  const note = await prisma.note.update({
    where: { id: req.params.id },
    data: result.data  // Can be { title: "..." } or any partial update
  });
  
  const response: ApiResponse<Note> = {
    success: true,
    data: note
  };
  
  res.json(response);
});
```

---

### Frontend: Form Validation

```typescript
import { createNoteSchema, CreateNoteInput, ApiResponse, Note } from '@notes/types';

function NoteForm() {
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    const formData = new FormData(e.currentTarget);
    const data = {
      title: formData.get('title'),
      content: formData.get('content'),
      tags: formData.get('tags')?.toString().split(',') || []
    };
    
    // Validate on client
    const result = createNoteSchema.safeParse(data);
    
    if (!result.success) {
      setErrors(result.error.flatten().fieldErrors);
      return;
    }
    
    // Type-safe validated data
    const noteData: CreateNoteInput = result.data;
    
    try {
      // API call
      const response = await fetch('/api/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(noteData)
      });
      
      const json: ApiResponse<Note> = await response.json();
      
      if (json.success) {
        console.log('Created note:', json.data);
        // Navigate or update UI
      } else {
        console.error(json.error);
      }
    } catch (error) {
      console.error('Network error:', error);
    }
  };
  
  return (
    <form onSubmit={handleSubmit}>
      <input name="title" />
      {errors.title && <p>{errors.title[0]}</p>}
      
      <textarea name="content" />
      {errors.content && <p>{errors.content[0]}</p>}
      
      <button type="submit">Create Note</button>
    </form>
  );
}
```

---

### Frontend: API Client with Types

```typescript
import { Note, CreateNoteInput, UpdateNoteInput, ApiResponse } from '@notes/types';

class NotesAPI {
  private baseUrl = '/api/notes';
  
  async getAll(): Promise<Note[]> {
    const response = await fetch(this.baseUrl);
    const json: ApiResponse<Note[]> = await response.json();
    
    if (!json.success) {
      throw new Error(json.error);
    }
    
    return json.data!;
  }
  
  async create(data: CreateNoteInput): Promise<Note> {
    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    
    const json: ApiResponse<Note> = await response.json();
    
    if (!json.success) {
      throw new Error(json.error);
    }
    
    return json.data!;
  }
  
  async update(id: string, data: UpdateNoteInput): Promise<Note> {
    const response = await fetch(`${this.baseUrl}/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    
    const json: ApiResponse<Note> = await response.json();
    
    if (!json.success) {
      throw new Error(json.error);
    }
    
    return json.data!;
  }
  
  async delete(id: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/${id}`, {
      method: 'DELETE'
    });
    
    const json: ApiResponse = await response.json();
    
    if (!json.success) {
      throw new Error(json.error);
    }
  }
}

export const notesAPI = new NotesAPI();
```

---

## Zod Basics

### What is Zod?

Zod is a TypeScript-first schema validation library that provides:
1. **Runtime validation** - Checks actual values at runtime
2. **Type inference** - Generates TypeScript types automatically
3. **Composable schemas** - Build complex validations from simple ones

### Basic Types

```typescript
import { z } from 'zod';

z.string()    // any string
z.number()    // any number
z.boolean()   // true or false
z.date()      // Date object
z.undefined() // undefined
z.null()      // null
z.any()       // any type
```

### String Validation

```typescript
z.string().min(5)                    // Min 5 characters
z.string().max(100)                  // Max 100 characters
z.string().email()                   // Valid email
z.string().url()                     // Valid URL
z.string().regex(/^\d+$/)           // Must match regex
z.string().startsWith("https://")   // Must start with
z.string().endsWith(".com")         // Must end with
z.string().trim()                    // Trim whitespace
z.string().toLowerCase()             // Convert to lowercase
```

### Number Validation

```typescript
z.number().min(0)           // Minimum value
z.number().max(100)         // Maximum value
z.number().positive()       // Must be > 0
z.number().nonnegative()    // Must be >= 0
z.number().int()            // Must be integer
z.number().multipleOf(5)    // Must be multiple of 5
```

### Optional & Defaults

```typescript
z.string().optional()                // string | undefined
z.string().nullable()                // string | null
z.string().nullish()                 // string | null | undefined
z.string().default("hello")          // string (uses default if undefined)
z.string().optional().default("hi")  // string (optional AND default)
```

### Arrays

```typescript
z.array(z.string())                  // string[]
z.array(z.number()).min(1)           // At least 1 item
z.array(z.number()).max(10)          // At most 10 items
z.array(z.string()).nonempty()       // At least 1 item
```

### Objects

```typescript
const schema = z.object({
  name: z.string(),
  age: z.number().min(0),
  email: z.string().email().optional()
});

type User = z.infer<typeof schema>;
// { name: string; age: number; email?: string }
```

### Enums

```typescript
z.enum(["small", "medium", "large"])
z.enum(["plaintext", "markdown", "html"])

// With error message
z.enum(["a", "b", "c"], {
  errorMap: () => ({ message: "Must be a, b, or c" })
})
```

### Parsing

```typescript
// .parse() - throws on error
try {
  const data = schema.parse(input);
} catch (error) {
  console.error(error);
}

// .safeParse() - returns result object
const result = schema.safeParse(input);

if (result.success) {
  console.log(result.data);  // Validated data
} else {
  console.error(result.error);  // Zod error object
}
```

### Error Handling

```typescript
const result = schema.safeParse(data);

if (!result.success) {
  // Flatten errors for easier handling
  const errors = result.error.flatten();
  
  console.log(errors.fieldErrors);
  // { name: ["Required"], email: ["Invalid email"] }
  
  // Or get full error
  console.log(result.error.format());
}
```

---

## Development

### Building

```bash
cd packages/types
pnpm build
```

### Watch Mode

```bash
pnpm dev
```

### Adding New Types

1. Edit `src/index.ts`
2. Add interface and/or schema
3. Export it
4. Build the package
5. Use in apps

---

## Further Reading

- [Zod Documentation](https://zod.dev/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Package Development Guide](./DEVELOPMENT.md)
- [Best Practices](./BEST_PRACTICES.md)

---

**Need help?** Check the main [documentation](../../docs/README.md) or open an issue.
