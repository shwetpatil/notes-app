# Package Development Guide

Complete guide for developing shared packages in the monorepo.

## 📚 Table of Contents

- [Getting Started](#getting-started)
- [Creating New Packages](#creating-new-packages)
- [Development Workflow](#development-workflow)
- [Building Packages](#building-packages)
- [Testing Packages](#testing-packages)
- [Troubleshooting](#troubleshooting)
- [Common Patterns](#common-patterns)

---

## Getting Started

### Prerequisites

- Node.js >= 18.0.0
- pnpm >= 8.0.0
- TypeScript knowledge
- Understanding of monorepo concepts

### Workspace Structure

```
notes-application/
├── package.json          # Root config with workspaces
├── pnpm-workspace.yaml   # Workspace configuration
├── apps/
│   ├── backend/          # Backend application
│   └── frontend/         # Frontend application
└── packages/
    ├── types/            # Shared types package
    ├── ui-lib/           # Shared UI components
    └── docs/             # Package documentation
```

---

## Creating New Packages

### Step 1: Create Directory Structure

```bash
cd packages
mkdir my-package
cd my-package
mkdir src
```

### Step 2: Initialize Package

```bash
pnpm init
```

This creates a basic `package.json`. Edit it:

```json
{
  "name": "@notes/my-package",
  "version": "1.0.0",
  "description": "My awesome package",
  "private": true,
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "scripts": {
    "build": "tsc",
    "dev": "tsc --watch",
    "clean": "rm -rf dist"
  },
  "keywords": ["notes", "shared"],
  "author": "Your Name",
  "license": "MIT"
}
```

**Key fields:**
- `name`: Must start with `@notes/`
- `private`: Set to true (not publishing to npm)
- `main`: Entry point for JavaScript
- `types`: Entry point for TypeScript definitions
- `scripts`: Build and development commands

---

### Step 3: Add TypeScript Configuration

Create `tsconfig.json`:

```json
{
  "compilerOptions": {
    // Output
    "outDir": "./dist",
    "rootDir": "./src",
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    
    // Module System
    "target": "ES2020",
    "module": "commonjs",
    "moduleResolution": "node",
    "esModuleInterop": true,
    
    // Strictness
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    
    // Other
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "**/*.test.ts"]
}
```

**Important options:**
- `declaration`: Generate .d.ts files for TypeScript
- `declarationMap`: Source maps for types (better IDE experience)
- `outDir`: Where compiled files go
- `rootDir`: Where source files are

---

### Step 4: Create Source Files

Create `src/index.ts`:

```typescript
/**
 * My awesome package
 * @packageDocumentation
 */

export * from './types';
export * from './utils';
```

Create `src/types.ts`:

```typescript
/**
 * Example interface
 */
export interface MyType {
  id: string;
  name: string;
}
```

Create `src/utils.ts`:

```typescript
import { MyType } from './types';

/**
 * Example utility function
 * @param name - The name to process
 * @returns A MyType object
 */
export function createMyType(name: string): MyType {
  return {
    id: Math.random().toString(36),
    name
  };
}
```

---

### Step 5: Build Package

```bash
pnpm build
```

This creates the `dist/` folder with compiled JavaScript and type definitions:

```
dist/
├── index.js
├── index.d.ts
├── types.js
├── types.d.ts
├── utils.js
└── utils.d.ts
```

---

### Step 6: Add to Apps

Update `apps/backend/package.json` or `apps/frontend/package.json`:

```json
{
  "dependencies": {
    "@notes/my-package": "workspace:*"
  }
}
```

Install dependencies:

```bash
# From project root
pnpm install
```

---

### Step 7: Use in Code

```typescript
// In apps/backend/src/index.ts or apps/frontend/src/index.ts
import { MyType, createMyType } from '@notes/my-package';

const item: MyType = createMyType('Hello');
console.log(item); // { id: '...', name: 'Hello' }
```

---

## Development Workflow

### Method 1: Build After Changes (Simple)

```bash
# Edit package files
cd packages/my-package
# ... make changes ...

# Build
pnpm build

# Test in app
cd ../../apps/backend
pnpm dev
```

---

### Method 2: Watch Mode (Recommended)

```bash
# Terminal 1: Watch package (rebuilds on save)
cd packages/my-package
pnpm dev

# Terminal 2: Run app
cd ../../apps/backend
pnpm dev
```

Changes to package files automatically rebuild and reflect in app!

---

### Method 3: Root Level Commands

```bash
# Build all packages
pnpm -r build

# Build specific package
pnpm --filter @notes/my-package build

# Run dev for all packages
pnpm -r dev

# Clean all packages
pnpm -r clean
```

---

## Building Packages

### Build Process

TypeScript compilation:
1. Reads `src/**/*.ts` files
2. Compiles to JavaScript in `dist/`
3. Generates `.d.ts` type definitions
4. Creates source maps for debugging

### Build Scripts

```json
{
  "scripts": {
    "build": "tsc",
    "build:watch": "tsc --watch",
    "clean": "rm -rf dist"
  }
}
```

### Build Output

```
packages/my-package/
├── src/                    # Source (TypeScript)
│   ├── index.ts
│   └── types.ts
└── dist/                   # Compiled (JavaScript)
    ├── index.js           # Compiled JS
    ├── index.d.ts         # Type definitions
    ├── index.d.ts.map     # Type source map
    ├── index.js.map       # JS source map
    ├── types.js
    ├── types.d.ts
    └── ...
```

---

### Checking Build Success

```bash
# Build
pnpm build

# Check output
ls -la dist/

# Check types are generated
cat dist/index.d.ts
```

---

## Testing Packages

### Method 1: Manual Testing in Apps

```typescript
// In apps/backend/src/test.ts
import { createMyType } from '@notes/my-package';

const result = createMyType('Test');
console.log(result);
```

Run:
```bash
cd apps/backend
node -r ts-node/register src/test.ts
```

---

### Method 2: Unit Tests (Recommended)

Install test dependencies:

```bash
cd packages/my-package
pnpm add -D vitest @vitest/ui
```

Update `package.json`:

```json
{
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest",
    "test:ui": "vitest --ui"
  }
}
```

Create `src/utils.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { createMyType } from './utils';

describe('createMyType', () => {
  it('should create object with given name', () => {
    const result = createMyType('Test');
    
    expect(result).toHaveProperty('id');
    expect(result.name).toBe('Test');
  });
  
  it('should generate unique IDs', () => {
    const result1 = createMyType('A');
    const result2 = createMyType('B');
    
    expect(result1.id).not.toBe(result2.id);
  });
});
```

Run tests:

```bash
pnpm test
```

---

## Troubleshooting

### "Cannot find module '@notes/my-package'"

**Cause:** Package not installed or not linked

**Solution:**
```bash
# From root
pnpm install

# Verify package is linked
ls -la node_modules/@notes/
# Should see my-package symlink
```

---

### "Module has no exported member 'X'"

**Cause:** Package not built or exports missing

**Solution:**
```bash
cd packages/my-package

# Check exports in src/index.ts
cat src/index.ts

# Rebuild
pnpm build

# Check compiled exports
cat dist/index.d.ts
```

---

### "Type definitions are outdated"

**Cause:** Package not rebuilt after changes

**Solution:**
```bash
cd packages/my-package
rm -rf dist
pnpm build

# Restart TypeScript in your editor
# VS Code: Cmd+Shift+P → "TypeScript: Restart TS Server"
```

---

### "Changes not reflecting"

**Cause:** Apps using cached build

**Solution:**
```bash
# Clean and rebuild package
cd packages/my-package
pnpm clean
pnpm build

# Restart app dev server
cd ../../apps/backend
# Ctrl+C to stop
pnpm dev
```

---

### "Circular dependency detected"

**Cause:** Package A imports from Package B which imports from Package A

**Solution:**
```typescript
// ❌ BAD: Circular dependency
// packages/types/src/index.ts
import { something } from '@notes/utils';

// packages/utils/src/index.ts
import { something } from '@notes/types';

// ✅ GOOD: Linear dependency
// packages/utils depends on types
// types doesn't depend on utils
```

---

### "App cannot import from package"

**Solution checklist:**
1. Package is built: `cd packages/my-package && pnpm build`
2. Package is in app dependencies: Check `apps/backend/package.json`
3. Dependencies installed: `pnpm install` from root
4. TypeScript server restarted: Restart your editor

---

## Common Patterns

### Pattern 1: Exporting Everything from Index

```typescript
// packages/my-package/src/index.ts
export * from './types';
export * from './utils';
export * from './constants';
export * from './helpers';

// Users can import from root
import { MyType, createMyType } from '@notes/my-package';
```

---

### Pattern 2: Organizing by Feature

```
packages/my-package/src/
├── index.ts              # Main exports
├── user/
│   ├── index.ts
│   ├── types.ts
│   └── utils.ts
├── note/
│   ├── index.ts
│   ├── types.ts
│   └── utils.ts
└── common/
    ├── index.ts
    └── types.ts
```

```typescript
// src/index.ts
export * from './user';
export * from './note';
export * from './common';

// src/user/index.ts
export * from './types';
export * from './utils';
```

---

### Pattern 3: Validation with Zod

```typescript
// src/schemas.ts
import { z } from 'zod';

export const userSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  age: z.number().min(0).optional()
});

export type User = z.infer<typeof userSchema>;

// Usage
import { userSchema, User } from '@notes/my-package';

const result = userSchema.safeParse(data);
if (result.success) {
  const user: User = result.data;
}
```

---

### Pattern 4: Constants and Enums

```typescript
// src/constants.ts
export const MAX_TITLE_LENGTH = 255;
export const MAX_CONTENT_LENGTH = 10000;

export const NOTE_COLORS = [
  '#EF4444', // red
  '#F59E0B', // amber
  '#10B981', // green
  '#3B82F6', // blue
  '#8B5CF6'  // purple
] as const;

export type NoteColor = typeof NOTE_COLORS[number];

// Usage
import { MAX_TITLE_LENGTH, NOTE_COLORS, NoteColor } from '@notes/my-package';

const color: NoteColor = '#EF4444'; // ✅
const invalid: NoteColor = '#000000'; // ❌ Type error
```

---

### Pattern 5: Utility Functions

```typescript
// src/utils.ts
/**
 * Formats a date to YYYY-MM-DD
 */
export function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

/**
 * Truncates text to max length
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3) + '...';
}

/**
 * Debounces a function
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  
  return function(...args: Parameters<T>) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}
```

---

### Pattern 6: Type Guards

```typescript
// src/guards.ts
import { Note } from './types';

/**
 * Checks if value is a valid Note
 */
export function isNote(value: unknown): value is Note {
  return (
    typeof value === 'object' &&
    value !== null &&
    'id' in value &&
    'title' in value &&
    'content' in value
  );
}

// Usage
if (isNote(data)) {
  // TypeScript knows data is Note
  console.log(data.title);
}
```

---

## Best Practices

### ✅ DO:

1. **Document exports**
   ```typescript
   /**
    * Creates a new user
    * @param name - User's name
    * @param email - User's email
    * @returns User object
    * @throws {Error} If validation fails
    */
   export function createUser(name: string, email: string): User {
     // ...
   }
   ```

2. **Use semantic versioning**
   - 1.0.0 → Initial release
   - 1.0.1 → Bug fixes
   - 1.1.0 → New features (backward compatible)
   - 2.0.0 → Breaking changes

3. **Export types and interfaces**
   ```typescript
   export interface User {
     id: string;
     name: string;
   }
   
   export type UserId = string;
   ```

4. **Keep packages focused**
   - One clear purpose per package
   - Don't mix unrelated functionality

5. **Write tests**
   ```typescript
   describe('MyFunction', () => {
     it('should handle edge case', () => {
       expect(myFunction('')).toBe('default');
     });
   });
   ```

---

### ❌ DON'T:

1. **Don't import from apps**
   ```typescript
   // ❌ BAD: Package importing from app
   import { something } from '../../apps/backend/src/...';
   ```

2. **Don't skip building**
   - Always build before committing
   - Apps need compiled dist/ folder

3. **Don't export mutable state**
   ```typescript
   // ❌ BAD: Mutable export
   export const config = { apiUrl: '' };
   
   // ✅ GOOD: Function or constant
   export const getConfig = () => ({ apiUrl: '' });
   export const API_URL = 'https://api.example.com';
   ```

4. **Don't commit node_modules or dist**
   ```gitignore
   # .gitignore
   node_modules/
   dist/
   *.log
   ```

5. **Don't use relative imports from other packages**
   ```typescript
   // ❌ BAD
   import { something } from '../other-package/src/...';
   
   // ✅ GOOD
   import { something } from '@notes/other-package';
   ```

---

## Package Checklist

Before considering a package "done":

- [ ] TypeScript configuration complete
- [ ] Builds without errors
- [ ] All exports documented
- [ ] Tests written and passing
- [ ] Used successfully in at least one app
- [ ] README.md created
- [ ] No circular dependencies
- [ ] No imports from apps
- [ ] Committed with built dist/

---

## Further Reading

- [TYPES.md](./TYPES.md) - Types package documentation
- [OVERVIEW.md](./OVERVIEW.md) - Monorepo overview
- [BEST_PRACTICES.md](./BEST_PRACTICES.md) - Coding best practices
- [pnpm Workspaces](https://pnpm.io/workspaces)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

---

**Need help?** Check the [main documentation](../../docs/README.md) or open an issue.
