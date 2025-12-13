# Shared Packages Overview

## What are Shared Packages?

Shared packages are reusable code libraries that multiple applications in the monorepo can import. They provide a **single source of truth** for common functionality.

## Current Packages

### 1. @notes/types

**Purpose:** Shared TypeScript types and Zod validation schemas

**Exports:**
- Type definitions (User, Note, Template, etc.)
- Validation schemas (loginSchema, createNoteSchema, etc.)
- API response types
- Inferred types from schemas

**Used by:**
- `apps/backend` - API validation and database operations
- `apps/frontend` - Form validation and API client types

**Documentation:** [TYPES.md](./TYPES.md)

---

### 2. @notes/ui-lib _(Planned)_

**Purpose:** Shared React UI components

**Will include:**
- Button, Input, Modal components
- Form components with validation
- Layout components
- Theme provider

**Used by:**
- `apps/frontend` - Primary UI components
- Future admin panel or mobile apps

---

## Why Use Shared Packages?

### 1. Single Source of Truth

```typescript
// ✅ GOOD: Define once in packages/types
export interface Note {
  id: string;
  title: string;
  content: string;
}

// Use everywhere
import { Note } from '@notes/types';
```

```typescript
// ❌ BAD: Duplicate definitions
// In backend:
interface Note { id: string; title: string; }

// In frontend:
interface Note { id: string; title: string; }
// Now you have to maintain two copies!
```

---

### 2. Type Safety Across Applications

```typescript
// Backend API
import { createNoteSchema, ApiResponse, Note } from '@notes/types';

app.post('/api/notes', (req, res) => {
  const result = createNoteSchema.safeParse(req.body);
  
  const response: ApiResponse<Note> = {
    success: true,
    data: createdNote
  };
  
  res.json(response);
});
```

```typescript
// Frontend API Client
import { ApiResponse, Note, CreateNoteInput } from '@notes/types';

async function createNote(data: CreateNoteInput): Promise<Note> {
  const response = await fetch('/api/notes', {
    method: 'POST',
    body: JSON.stringify(data)
  });
  
  const json: ApiResponse<Note> = await response.json();
  return json.data!;
}
```

**Benefits:**
- Frontend knows exact response structure
- Backend knows exact request structure
- No type mismatches or runtime errors
- IDE autocomplete everywhere

---

### 3. DRY (Don't Repeat Yourself)

```typescript
// Define validation ONCE
export const createNoteSchema = z.object({
  title: z.string().min(1).max(255),
  content: z.string()
});

// Frontend validates before sending
const result = createNoteSchema.safeParse(formData);

// Backend validates again (security)
const result = createNoteSchema.safeParse(req.body);

// Same rules, same behavior, zero duplication
```

---

### 4. Consistency

- Same validation rules everywhere
- Same error messages
- Same data structures
- Same business logic

---

## How Monorepo Packages Work

### 1. Workspace Configuration

```json
// Root package.json
{
  "name": "notes-application",
  "private": true,
  "workspaces": [
    "apps/*",
    "packages/*"
  ]
}
```

This tells pnpm to treat `apps/*` and `packages/*` as linked workspaces.

---

### 2. Package Definition

```json
// packages/types/package.json
{
  "name": "@notes/types",
  "version": "1.0.0",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "scripts": {
    "build": "tsc",
    "dev": "tsc --watch"
  }
}
```

Key fields:
- `name`: Package identifier (used in imports)
- `main`: Entry point for JavaScript
- `types`: Entry point for TypeScript definitions
- `scripts`: Build and development commands

---

### 3. Package Linking

```json
// apps/backend/package.json
{
  "dependencies": {
    "@notes/types": "workspace:*"
  }
}
```

```json
// apps/frontend/package.json
{
  "dependencies": {
    "@notes/types": "workspace:*"
  }
}
```

`workspace:*` tells pnpm to link to the local package, not npm registry.

---

### 4. Import in Code

```typescript
// apps/backend/src/routes/notes.ts
import { createNoteSchema, Note } from '@notes/types';

// apps/frontend/src/lib/api.ts
import { ApiResponse, Note } from '@notes/types';
```

**No path manipulation needed** - imports work like any npm package!

---

## Package Dependencies

### Dependency Flow

```
packages/types (no dependencies)
    ↓
apps/backend (depends on @notes/types)
    ↓
apps/frontend (depends on @notes/types)
```

**Rules:**
- ✅ Apps can depend on packages
- ✅ Packages can depend on other packages
- ❌ Packages CANNOT depend on apps
- ❌ Apps should NOT depend on other apps

---

### Installing Dependencies

```bash
# Install for specific package
cd packages/types
pnpm add zod

# Install for all packages
pnpm -r add lodash

# Install dev dependency
cd packages/types
pnpm add -D typescript
```

---

## Development Workflow

### 1. Make Changes to Package

```bash
cd packages/types
# Edit src/index.ts
```

### 2. Build Package

```bash
pnpm build
```

This compiles TypeScript to JavaScript and generates type definitions in `dist/`.

### 3. Changes Reflect in Apps

Apps automatically pick up changes:
- TypeScript sees updated `.d.ts` files
- Runtime uses updated `.js` files
- No reinstall needed!

### 4. For Active Development

```bash
# Terminal 1: Watch package
cd packages/types
pnpm dev

# Terminal 2: Run app
cd apps/backend
pnpm dev
```

Package rebuilds automatically on changes.

---

## Build Process

### TypeScript Configuration

```json
// packages/types/tsconfig.json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "declaration": true,        // Generate .d.ts files
    "declarationMap": true,     // Source maps for types
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

### Build Output

```
packages/types/
├── src/
│   ├── index.ts           # Source
│   └── monitoring.ts      # Source
└── dist/
    ├── index.js           # Compiled JS
    ├── index.d.ts         # Type definitions
    ├── monitoring.js      # Compiled JS
    └── monitoring.d.ts    # Type definitions
```

---

## Package Scripts

### Root Level

```bash
# Build all packages
pnpm -r build

# Build specific package
pnpm --filter @notes/types build

# Install all dependencies
pnpm install

# Clean all packages
pnpm -r clean
```

### Package Level

```bash
cd packages/types

# Build once
pnpm build

# Watch mode (rebuild on changes)
pnpm dev

# Clean dist folder
pnpm clean
```

---

## Troubleshooting

### "Cannot find module '@notes/types'"

**Cause:** Package not installed or not built

**Solution:**
```bash
# From root
pnpm install

# Build package
cd packages/types
pnpm build
```

---

### "Types are outdated"

**Cause:** Package not rebuilt after changes

**Solution:**
```bash
cd packages/types
pnpm build

# Or use watch mode
pnpm dev
```

---

### "Changes not reflecting"

**Cause:** Cache or stale build

**Solution:**
```bash
cd packages/types
rm -rf dist
pnpm build

# Restart app dev server
cd ../../apps/backend
pnpm dev
```

---

## Best Practices

### ✅ DO:

1. **Keep packages focused**
   - Each package should have a single, clear purpose
   - Don't create "kitchen sink" packages

2. **Export everything from index.ts**
   ```typescript
   // packages/types/src/index.ts
   export * from './user';
   export * from './note';
   export * from './monitoring';
   ```

3. **Use TypeScript**
   - All packages should be TypeScript
   - Generate declaration files

4. **Build before committing**
   ```bash
   pnpm -r build
   git add .
   git commit -m "Update types"
   ```

5. **Document exports**
   ```typescript
   /**
    * Validates note creation data
    * @throws {ZodError} If validation fails
    */
   export const createNoteSchema = z.object({...});
   ```

---

### ❌ DON'T:

1. **Don't import from apps**
   ```typescript
   // ❌ BAD: Package importing from app
   import { something } from '../../apps/backend/src/...';
   ```

2. **Don't skip building**
   - Apps consume `dist/`, not `src/`
   - Always build after changes

3. **Don't put app-specific logic in packages**
   - Packages should be generic and reusable
   - App-specific code belongs in apps

4. **Don't export mutable state**
   ```typescript
   // ❌ BAD: Exporting mutable object
   export const config = { apiUrl: '' };
   
   // ✅ GOOD: Export function or constant
   export const getConfig = () => ({ apiUrl: '' });
   ```

5. **Don't commit without building**
   - Dist folder should be up-to-date
   - Other developers need working builds

---

## Adding New Packages

See [DEVELOPMENT.md](./DEVELOPMENT.md#creating-new-packages) for detailed instructions.

---

## Further Reading

- [Types Package Documentation](./TYPES.md)
- [Development Guide](./DEVELOPMENT.md)
- [Best Practices](./BEST_PRACTICES.md)
- [pnpm Workspaces](https://pnpm.io/workspaces)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

---

**Questions?** Check the main [project documentation](../../docs/README.md).
