# Package Development Best Practices

Guidelines and best practices for developing shared packages.

## 📋 General Principles

### 1. Single Responsibility
Each package should do one thing well.

**✅ GOOD:**
```
@notes/types      - Type definitions and validation
@notes/ui-lib     - UI components
@notes/utils      - General utilities
```

**❌ BAD:**
```
@notes/everything - Types, UI, utils, config, helpers, etc.
```

---

### 2. Clear API Surface
Export only what users need.

**✅ GOOD:**
```typescript
// Explicit exports
export { User, Note, Template } from './types';
export { createNoteSchema, updateNoteSchema } from './schemas';
export { ApiResponse } from './responses';

// Clear, documented exports
```

**❌ BAD:**
```typescript
// Export everything
export * from './internal-helper';
export * from './private-utils';
export * from './debug';

// Exposes implementation details
```

---

### 3. Semantic Versioning
Use semver for versioning: `MAJOR.MINOR.PATCH`

- **MAJOR** (1.0.0 → 2.0.0): Breaking changes
- **MINOR** (1.0.0 → 1.1.0): New features (backward compatible)
- **PATCH** (1.0.0 → 1.0.1): Bug fixes

---

## 🏗️ Code Organization

### File Structure

```
packages/my-package/
├── src/
│   ├── index.ts           # Main exports
│   ├── types/             # Type definitions
│   │   ├── index.ts
│   │   └── *.ts
│   ├── utils/             # Utility functions
│   │   ├── index.ts
│   │   └── *.ts
│   ├── constants/         # Constants and enums
│   │   └── index.ts
│   └── __tests__/         # Tests
│       └── *.test.ts
├── dist/                  # Compiled output (gitignored)
├── package.json
├── tsconfig.json
└── README.md
```

---

### Barrel Exports (index.ts)

Use index files to create clean import paths.

**✅ GOOD:**
```typescript
// src/index.ts
export * from './types';
export * from './utils';
export * from './constants';

// Users can import from root
import { User, createUser, MAX_USERS } from '@notes/my-package';
```

**❌ BAD:**
```typescript
// No index.ts, users must know internal structure
import { User } from '@notes/my-package/dist/types/user';
import { createUser } from '@notes/my-package/dist/utils/user-utils';
```

---

## 📝 Documentation

### 1. JSDoc Comments

Document all public APIs with JSDoc.

**✅ GOOD:**
```typescript
/**
 * Creates a new note with the given data
 * 
 * @param data - Note creation data
 * @param userId - ID of the user creating the note
 * @returns Created note object
 * @throws {ValidationError} If data is invalid
 * 
 * @example
 * ```typescript
 * const note = createNote({ title: "My Note", content: "..." }, "user123");
 * console.log(note.id);
 * ```
 */
export function createNote(
  data: CreateNoteInput,
  userId: string
): Promise<Note> {
  // ...
}
```

**❌ BAD:**
```typescript
// No documentation
export function createNote(data: CreateNoteInput, userId: string): Promise<Note> {
  // ...
}
```

---

### 2. README Files

Every package should have a README.

```markdown
# @notes/my-package

Brief description of what this package does.

## Installation

\`\`\`bash
# Already linked in monorepo
\`\`\`

## Usage

\`\`\`typescript
import { Something } from '@notes/my-package';

const result = Something.doSomething();
\`\`\`

## API

### `doSomething()`

Description of what it does.

**Parameters:**
- `param1` (string): Description
- `param2` (number, optional): Description

**Returns:** Description of return value

**Example:**
\`\`\`typescript
const result = doSomething("test", 42);
\`\`\`

## Development

\`\`\`bash
pnpm build
pnpm test
\`\`\`
```

---

## 🧪 Testing

### Unit Tests

Every public function should have tests.

**✅ GOOD:**
```typescript
// src/utils/string.test.ts
import { describe, it, expect } from 'vitest';
import { truncate } from './string';

describe('truncate', () => {
  it('should return original if shorter than max', () => {
    expect(truncate('hello', 10)).toBe('hello');
  });
  
  it('should truncate and add ellipsis', () => {
    expect(truncate('hello world', 8)).toBe('hello...');
  });
  
  it('should handle empty string', () => {
    expect(truncate('', 10)).toBe('');
  });
  
  it('should handle exact length', () => {
    expect(truncate('hello', 5)).toBe('hello');
  });
});
```

---

### Test Coverage

Aim for high coverage on critical paths.

```bash
# Run with coverage
pnpm test --coverage

# Check coverage report
cat coverage/index.html
```

---

## 🔒 Type Safety

### 1. Use Strict TypeScript

```json
// tsconfig.json
{
  "compilerOptions": {
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true
  }
}
```

---

### 2. Avoid `any`

**✅ GOOD:**
```typescript
function processData<T>(data: T[]): T[] {
  return data.filter(item => item !== null);
}

function parseJson(text: string): unknown {
  return JSON.parse(text);
}
```

**❌ BAD:**
```typescript
function processData(data: any): any {
  return data.filter((item: any) => item !== null);
}

function parseJson(text: string): any {
  return JSON.parse(text);
}
```

---

### 3. Use Type Guards

```typescript
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

## ⚡ Performance

### 1. Lazy Imports

For large dependencies, use dynamic imports.

**✅ GOOD:**
```typescript
export async function parseMarkdown(text: string): Promise<string> {
  // Only load markdown parser when needed
  const { marked } = await import('marked');
  return marked(text);
}
```

**❌ BAD:**
```typescript
import { marked } from 'marked'; // Loaded even if never used

export function parseMarkdown(text: string): string {
  return marked(text);
}
```

---

### 2. Tree-Shaking Friendly

Export functions individually for tree-shaking.

**✅ GOOD:**
```typescript
// Each function can be imported separately
export function functionA() { /* ... */ }
export function functionB() { /* ... */ }
export function functionC() { /* ... */ }

// User only bundles what they import
import { functionA } from '@notes/utils';
```

**❌ BAD:**
```typescript
// Default export bundles everything
export default {
  functionA() { /* ... */ },
  functionB() { /* ... */ },
  functionC() { /* ... */ }
};

// User gets all functions even if only using one
import utils from '@notes/utils';
utils.functionA();
```

---

## 🔄 Dependencies

### 1. Minimize Dependencies

Only add dependencies you really need.

```bash
# Check package size
pnpm install
du -sh node_modules/@notes/my-package
```

---

### 2. Use Peer Dependencies

For packages that must match app versions (React, etc.)

```json
// package.json
{
  "peerDependencies": {
    "react": "^18.0.0",
    "react-dom": "^18.0.0"
  },
  "devDependencies": {
    "react": "^18.0.0",
    "react-dom": "^18.0.0"
  }
}
```

---

### 3. No Duplicate Dependencies

Avoid duplicating deps already in apps.

**✅ GOOD:**
```json
// Package uses Zod (already in app)
{
  "peerDependencies": {
    "zod": "^3.22.0"
  }
}
```

**❌ BAD:**
```json
// Package bundles Zod (app also has it = 2 copies!)
{
  "dependencies": {
    "zod": "^3.22.0"
  }
}
```

---

## 🚫 What NOT to Include

### 1. Don't Export Mutable State

**❌ BAD:**
```typescript
// Users can modify this!
export const config = {
  apiUrl: 'https://api.example.com'
};

// Later, somewhere in app code:
config.apiUrl = 'https://evil.com'; // 😱
```

**✅ GOOD:**
```typescript
// Immutable constant
export const DEFAULT_API_URL = 'https://api.example.com';

// Or function
export function getConfig() {
  return {
    apiUrl: process.env.API_URL || 'https://api.example.com'
  };
}
```

---

### 2. Don't Include App-Specific Logic

**❌ BAD:**
```typescript
// Too specific to one app
export function getUserFromDatabase(id: string) {
  return prisma.user.findUnique({ where: { id } });
}
```

**✅ GOOD:**
```typescript
// Generic, reusable
export interface User {
  id: string;
  email: string;
  name: string;
}

export function validateUser(user: unknown): user is User {
  return /* validation logic */;
}
```

---

### 3. Don't Import from Apps

Packages should never import from apps.

**❌ BAD:**
```typescript
// packages/my-package/src/index.ts
import { something } from '../../apps/backend/src/utils';
```

**✅ GOOD:**
```typescript
// If you need it in a package, move it to a package!
// packages/shared-utils/src/index.ts
export function something() { /* ... */ }

// Then both package and app can import it
import { something } from '@notes/shared-utils';
```

---

## 🎨 Naming Conventions

### 1. Package Names

- Use `@notes/` scope
- Use kebab-case
- Be descriptive but concise

```
✅ @notes/types
✅ @notes/ui-lib
✅ @notes/api-client
✅ @notes/utils

❌ @notes/stuff
❌ @notes/everything
❌ @notes/thePackage
```

---

### 2. File Names

- Use kebab-case for files
- Use PascalCase for React components
- Use descriptive names

```
✅ user-types.ts
✅ string-utils.ts
✅ Button.tsx
✅ UserProfile.tsx

❌ ut.ts
❌ utils.ts
❌ temp.ts
❌ stuff.tsx
```

---

### 3. Export Names

- Use PascalCase for types/interfaces/classes
- Use camelCase for functions/variables
- Use UPPER_SNAKE_CASE for constants

```typescript
✅ export interface User { }
✅ export type UserId = string;
✅ export class UserService { }
✅ export function createUser() { }
✅ export const MAX_USERS = 1000;

❌ export interface user { }
❌ export type userId = string;
❌ export function CreateUser() { }
❌ export const max_users = 1000;
```

---

## 🔧 Build Configuration

### TypeScript Config

```json
{
  "compilerOptions": {
    // Output
    "outDir": "./dist",
    "rootDir": "./src",
    "declaration": true,          // Generate .d.ts
    "declarationMap": true,       // Source maps for types
    "sourceMap": true,            // Source maps for debugging
    
    // Module
    "target": "ES2020",
    "module": "commonjs",         // For Node.js compatibility
    "moduleResolution": "node",
    
    // Strictness
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    
    // Interop
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "**/*.test.ts"]
}
```

---

### Package.json Scripts

```json
{
  "scripts": {
    "build": "tsc",
    "build:watch": "tsc --watch",
    "dev": "tsc --watch",
    "clean": "rm -rf dist",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:coverage": "vitest run --coverage",
    "lint": "eslint src --ext .ts",
    "typecheck": "tsc --noEmit"
  }
}
```

---

## 📦 Publishing Workflow

### Before Committing

```bash
# 1. Clean
pnpm clean

# 2. Build
pnpm build

# 3. Test
pnpm test

# 4. Type check
pnpm typecheck

# 5. Lint
pnpm lint

# 6. Check all files
ls -la dist/

# 7. Commit
git add .
git commit -m "feat: add new feature"
```

---

## ✅ Package Checklist

Before releasing a package:

- [ ] Package builds without errors
- [ ] All public APIs documented
- [ ] Tests written and passing
- [ ] No TypeScript errors
- [ ] No ESLint warnings
- [ ] README.md complete
- [ ] Used successfully in at least one app
- [ ] No circular dependencies
- [ ] No imports from apps
- [ ] dist/ folder up-to-date

---

## 🎓 Learning Resources

- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Zod Documentation](https://zod.dev/)
- [pnpm Workspaces](https://pnpm.io/workspaces)
- [Vitest Documentation](https://vitest.dev/)
- [JSDoc Reference](https://jsdoc.app/)

---

**Questions?** Check [DEVELOPMENT.md](./DEVELOPMENT.md) or the [main docs](../../docs/README.md).
