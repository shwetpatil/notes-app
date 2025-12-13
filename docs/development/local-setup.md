# Development Guide

Complete guide for local development setup and workflows.

## Quick Start

```bash
# Clone repository
git clone <repository-url>
cd notes-application

# Install dependencies
pnpm install

# Setup database
docker compose up -d
pnpm --filter @notes/database prisma:generate
pnpm --filter @notes/database prisma:push

# Start development servers
pnpm dev  # Starts both frontend and backend
```

**Servers:**
- Frontend: http://localhost:3000
- Backend: http://localhost:3001
- Database: postgresql://localhost:5432

---

## Prerequisites

### Required Software

| Tool | Version | Purpose |
|------|---------|---------|
| **Node.js** | 18.x or 20.x | JavaScript runtime |
| **pnpm** | 8.x or 9.x | Package manager |
| **Docker** | Latest | PostgreSQL container |
| **Git** | Latest | Version control |

### Installation

**macOS:**
```bash
# Install Homebrew (if not installed)
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Install Node.js
brew install node@20

# Install pnpm
npm install -g pnpm

# Install Docker Desktop
brew install --cask docker
```

**Windows:**
```powershell
# Install Node.js from https://nodejs.org
# Or use winget:
winget install OpenJS.NodeJS.LTS

# Install pnpm
npm install -g pnpm

# Install Docker Desktop from https://docker.com
```

**Linux:**
```bash
# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install pnpm
npm install -g pnpm

# Install Docker
curl -fsSL https://get.docker.com | sudo sh
```

---

## Project Setup

### 1. Clone Repository

```bash
git clone <repository-url>
cd notes-application
```

### 2. Install Dependencies

```bash
pnpm install
```

This installs all dependencies for:
- Root workspace
- Frontend (Next.js)
- Backend (Express)
- Shared types package
- Database package (Prisma)

### 3. Environment Configuration

Create `.env` files for each application:

**Backend** - `apps/backend/.env`:
```env
# Database
DATABASE_URL="postgresql://postgres:password@localhost:5432/notesdb?schema=public"

# Session
SESSION_SECRET="generate-with-openssl-rand-base64-32"

# Server
PORT=3001
NODE_ENV=development

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:3000
```

**Frontend** - `apps/frontend/.env.local`:
```env
# Backend API
NEXT_PUBLIC_API_URL=http://localhost:3001

# Environment
NODE_ENV=development
```

**Generate secure session secret:**
```bash
openssl rand -base64 32
```

### 4. Database Setup

**Start PostgreSQL container:**
```bash
docker compose up -d
```

**Verify container running:**
```bash
docker ps
# Should see "notes-postgres" container
```

**Generate Prisma client:**
```bash
pnpm --filter @notes/database prisma:generate
```

**Push schema to database:**
```bash
pnpm --filter @notes/database prisma:push
```

**Verify database:**
```bash
pnpm --filter @notes/database prisma:studio
# Opens Prisma Studio at http://localhost:5555
```

### 5. Build Shared Packages

```bash
# Build types package
pnpm --filter @notes/types build

# Build database package
pnpm --filter @notes/database build
```

### 6. Start Development Servers

**Start everything:**
```bash
pnpm dev
```

**Or start individually:**
```bash
# Terminal 1: Backend
pnpm --filter @notes/backend dev

# Terminal 2: Frontend
pnpm --filter @notes/frontend dev
```

---

## Development Workflows

### Adding a New Feature

1. **Create feature branch:**
   ```bash
   git checkout -b feature/my-new-feature
   ```

2. **Update database schema** (if needed):
   ```bash
   # Edit prisma/schema.prisma
   pnpm --filter @notes/database prisma:push
   ```

3. **Update shared types** (if needed):
   ```bash
   # Edit packages/types/src/index.ts
   pnpm --filter @notes/types build
   ```

4. **Implement backend changes:**
   ```bash
   # Edit files in apps/backend/src/
   # Server auto-reloads on save (nodemon)
   ```

5. **Implement frontend changes:**
   ```bash
   # Edit files in apps/frontend/src/
   # Next.js hot-reloads automatically
   ```

6. **Test changes:**
   ```bash
   # Manual testing in browser
   # Check console for errors
   ```

7. **Commit and push:**
   ```bash
   git add .
   git commit -m "feat: add new feature"
   git push origin feature/my-new-feature
   ```

---

### Making API Changes

1. **Update route handler** (`apps/backend/src/routes/`):
   ```typescript
   router.post('/new-endpoint', async (req, res) => {
     // Implementation
   });
   ```

2. **Update validation schema** (`packages/types/src/index.ts`):
   ```typescript
   export const newSchema = z.object({
     field: z.string().min(1)
   });
   ```

3. **Rebuild types:**
   ```bash
   pnpm --filter @notes/types build
   ```

4. **Update frontend API calls** (`apps/frontend/src/`):
   ```typescript
   const response = await fetch(`${API_URL}/new-endpoint`, {
     method: 'POST',
     body: JSON.stringify({ field: 'value' })
   });
   ```

5. **Test with cURL or Postman:**
   ```bash
   curl -X POST http://localhost:3001/new-endpoint \
     -H "Content-Type: application/json" \
     -d '{"field":"value"}'
   ```

---

### Database Changes

#### Schema Migration Workflow

1. **Edit schema:**
   ```prisma
   // prisma/schema.prisma
   model User {
     id    String @id @default(cuid())
     email String @unique
     newField String? // Add new field
   }
   ```

2. **Push to database:**
   ```bash
   pnpm --filter @notes/database prisma:push
   ```

3. **Regenerate client:**
   ```bash
   pnpm --filter @notes/database prisma:generate
   ```

4. **Restart backend:**
   ```bash
   # Stop backend (Ctrl+C)
   pnpm --filter @notes/backend dev
   ```

#### View Database

**Prisma Studio** (GUI):
```bash
pnpm --filter @notes/database prisma:studio
```

**psql** (CLI):
```bash
docker exec -it notes-postgres psql -U postgres -d notesdb
```

**Common queries:**
```sql
-- View all users
SELECT * FROM "User";

-- View all notes
SELECT * FROM "Note";

-- Count notes by user
SELECT "userId", COUNT(*) FROM "Note" GROUP BY "userId";
```

---

### Frontend Development

#### Component Structure

```
apps/frontend/src/
├── app/                    # Next.js App Router
│   ├── layout.tsx         # Root layout
│   ├── page.tsx           # Homepage
│   ├── login/             # Login page
│   ├── register/          # Register page
│   └── dashboard/         # Dashboard page
├── components/             # React components
│   ├── ui/                # UI components (shadcn)
│   ├── NotesList.tsx      # Notes list
│   ├── NoteEditor.tsx     # Note editor
│   └── Sidebar.tsx        # Sidebar navigation
├── lib/                    # Utilities
│   ├── utils.ts           # Helper functions
│   └── store.ts           # Zustand store (if used)
└── styles/                 # Global styles
    └── globals.css        # Tailwind imports
```

#### Adding a Component

1. **Create component file:**
   ```typescript
   // components/MyComponent.tsx
   interface MyComponentProps {
     title: string;
   }

   export function MyComponent({ title }: MyComponentProps) {
     return <div>{title}</div>;
   }
   ```

2. **Import and use:**
   ```typescript
   import { MyComponent } from '@/components/MyComponent';

   <MyComponent title="Hello" />
   ```

#### Using shadcn/ui Components

```bash
# Add new UI component
npx shadcn@latest add button
npx shadcn@latest add input
npx shadcn@latest add dialog
```

Components added to `components/ui/`.

---

### Backend Development

#### Project Structure

```
apps/backend/src/
├── server.ts              # Express app setup
├── routes/                # Route handlers
│   ├── auth.ts           # Auth endpoints
│   └── notes.ts          # Notes endpoints
├── middleware/            # Custom middleware
│   ├── auth.ts           # Auth middleware
│   └── sanitize.ts       # Input sanitization
└── types/                 # TypeScript types
    └── express.d.ts      # Type augmentation
```

#### Adding a Route

1. **Create route file** (`routes/myroute.ts`):
   ```typescript
   import { Router } from 'express';
   import { requireAuth } from '../middleware/auth';

   const router = Router();

   router.get('/myroute', requireAuth, async (req, res) => {
     try {
       // Implementation
       res.json({ data: 'result' });
     } catch (error) {
       res.status(500).json({ error: 'Server error' });
     }
   });

   export default router;
   ```

2. **Register in server.ts:**
   ```typescript
   import myRoute from './routes/myroute';
   app.use('/myroute', myRoute);
   ```

#### Adding Middleware

1. **Create middleware file** (`middleware/mymiddleware.ts`):
   ```typescript
   import { Request, Response, NextFunction } from 'express';

   export function myMiddleware(req: Request, res: Response, next: NextFunction) {
     // Logic
     next();
   }
   ```

2. **Use in routes:**
   ```typescript
   import { myMiddleware } from '../middleware/mymiddleware';
   router.get('/endpoint', myMiddleware, handler);
   ```

---

## Debugging

### Frontend Debugging

**Browser DevTools:**
- Open: `Cmd+Opt+I` (Mac) or `F12` (Windows/Linux)
- **Console**: View logs and errors
- **Network**: Inspect API calls
- **React DevTools**: Install extension for React inspection

**VS Code Debugging:**
```json
// .vscode/launch.json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Next.js: debug",
      "type": "node-terminal",
      "request": "launch",
      "command": "pnpm --filter @notes/frontend dev"
    }
  ]
}
```

**Console Logging:**
```typescript
console.log('Debug:', variable);
console.error('Error:', error);
console.table(arrayOfObjects);
```

---

### Backend Debugging

**VS Code Debugging:**
```json
// .vscode/launch.json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Debug Backend",
      "type": "node",
      "request": "launch",
      "runtimeExecutable": "pnpm",
      "runtimeArgs": ["--filter", "@notes/backend", "dev"],
      "skipFiles": ["<node_internals>/**"],
      "console": "integratedTerminal"
    }
  ]
}
```

**Server Logs:**
```typescript
// Add detailed logging
console.log('[AUTH] Login attempt:', req.body.email);
console.log('[DB] Query result:', notes);
```

**Test API with cURL:**
```bash
# Save cookies
curl -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"test1234"}' \
  -c cookies.txt -v

# Use cookies
curl http://localhost:3001/notes -b cookies.txt -v
```

---

## Common Tasks

### Reset Database

```bash
# Stop containers
docker compose down -v

# Start fresh
docker compose up -d
pnpm --filter @notes/database prisma:push
```

### Clear Node Modules

```bash
# Remove all node_modules
rm -rf node_modules apps/*/node_modules packages/*/node_modules

# Reinstall
pnpm install
```

### Update Dependencies

```bash
# Check outdated packages
pnpm outdated

# Update specific package
pnpm update package-name

# Update all packages
pnpm update --latest
```

### Format Code

```bash
# Format all files
pnpm format

# Or manually
npx prettier --write "**/*.{ts,tsx,js,jsx,json,css,md}"
```

### Lint Code

```bash
# Lint frontend
pnpm --filter @notes/frontend lint

# Lint backend
pnpm --filter @notes/backend lint

# Lint all
pnpm lint
```

---

## Port Reference

| Service | Port | URL |
|---------|------|-----|
| Frontend (Next.js) | 3000 | http://localhost:3000 |
| Backend (Express) | 3001 | http://localhost:3001 |
| PostgreSQL | 5432 | postgresql://localhost:5432 |
| Prisma Studio | 5555 | http://localhost:5555 |

### Port Conflicts

If ports are in use:

```bash
# Find process using port
lsof -ti:3000,3001,5432

# Kill process
lsof -ti:3000,3001 | xargs kill -9

# Or change port in .env
# Backend: PORT=3002
# Frontend: starts on next available port
```

---

## Git Workflow

### Branch Strategy

```
main                 # Production-ready code
├── develop         # Integration branch
├── feature/*       # New features
├── fix/*           # Bug fixes
└── docs/*          # Documentation updates
```

### Commit Convention

Use conventional commits:

```bash
# Features
git commit -m "feat: add dark mode toggle"
git commit -m "feat(notes): add markdown support"

# Fixes
git commit -m "fix: resolve login redirect issue"
git commit -m "fix(api): handle null note content"

# Docs
git commit -m "docs: update API reference"

# Refactor
git commit -m "refactor: simplify note editor logic"

# Tests
git commit -m "test: add auth endpoint tests"

# Chores
git commit -m "chore: update dependencies"
```

### Pull Request Workflow

1. Create feature branch
2. Make changes and commit
3. Push to remote
4. Create pull request
5. Request code review
6. Address feedback
7. Merge to develop
8. Deploy to staging
9. Merge to main
10. Deploy to production

---

## Performance Optimization

### Frontend Optimization

**Code Splitting:**
```typescript
// Lazy load components
const HeavyComponent = dynamic(() => import('./HeavyComponent'), {
  loading: () => <Spinner />
});
```

**Memoization:**
```typescript
import { useMemo, useCallback } from 'react';

const sortedNotes = useMemo(() => {
  return notes.sort((a, b) => ...);
}, [notes]);

const handleClick = useCallback(() => {
  // Handler logic
}, [dependencies]);
```

**Image Optimization:**
```typescript
import Image from 'next/image';

<Image
  src="/image.jpg"
  alt="Description"
  width={500}
  height={300}
  loading="lazy"
/>
```

### Backend Optimization

**Database Indexes:**
```prisma
model Note {
  userId String
  
  @@index([userId])
  @@index([userId, isDeleted])
}
```

**Query Optimization:**
```typescript
// Select only needed fields
const notes = await prisma.note.findMany({
  select: {
    id: true,
    title: true,
    updatedAt: true
  }
});

// Use pagination
const notes = await prisma.note.findMany({
  skip: page * pageSize,
  take: pageSize
});
```

**Caching** (future):
```typescript
import NodeCache from 'node-cache';
const cache = new NodeCache({ stdTTL: 600 });

// Cache user notes
const cacheKey = `notes:${userId}`;
const cached = cache.get(cacheKey);
if (cached) return cached;
```

---

## Troubleshooting

### Database Issues

**Connection refused:**
```bash
# Check container status
docker ps

# Restart container
docker compose restart

# Check logs
docker compose logs postgres
```

**Schema out of sync:**
```bash
pnpm --filter @notes/database prisma:push
pnpm --filter @notes/database prisma:generate
```

### Build Issues

**Type errors:**
```bash
# Rebuild types package
pnpm --filter @notes/types build

# Check for errors
pnpm --filter @notes/backend tsc --noEmit
pnpm --filter @notes/frontend tsc --noEmit
```

**Module not found:**
```bash
# Clear cache and reinstall
rm -rf node_modules apps/*/node_modules packages/*/node_modules
pnpm install
```

### Runtime Issues

**Session not persisting:**
- Check SESSION_SECRET is set
- Verify cookies enabled in browser
- Check CORS configuration

**CORS errors:**
- Verify FRONTEND_URL in backend .env
- Check origin in CORS middleware
- Ensure credentials: 'include' in fetch

**Authentication failing:**
- Clear browser cookies
- Check database has users
- Verify session middleware order

---

**Next**: See [Testing Guide](./TESTING.md) for test strategies
