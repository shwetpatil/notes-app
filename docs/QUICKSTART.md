# Quick Start Guide

## Setup (First Time)

1. **Install pnpm** (if not already installed):
   ```bash
   npm install -g pnpm
   ```

2. **Install dependencies**:
   ```bash
   pnpm install
   ```

3. **Setup PostgreSQL**:
   - Install PostgreSQL on your machine
   - Create a database:
     ```bash
     createdb notes_db
     ```
   - Or use Docker:
     ```bash
     docker run --name notes-postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=notes_db -p 5432:5432 -d postgres:16
     ```

4. **Configure environment**:
   ```bash
   cp .env.example .env
   # Edit .env with your database credentials
   ```

5. **Run migrations**:
   ```bash
   cd apps/backend
   pnpm prisma migrate dev
   cd ../..
   ```

6. **Build shared packages**:
   ```bash
   pnpm --filter @notes/types build
   pnpm --filter @notes/ui-lib build
   ```

## Daily Development

Start everything with one command:
```bash
pnpm dev
```

Then open:
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001

## Common Commands

```bash
# Development
pnpm dev                    # Run frontend + backend
pnpm dev:frontend          # Run only frontend
pnpm dev:backend           # Run only backend

# Building
pnpm build                 # Build all packages

# Testing
pnpm test                  # Run all tests
pnpm --filter @notes/backend test           # Backend tests
pnpm --filter @notes/frontend test          # E2E tests

# Database
cd apps/backend
pnpm prisma:migrate        # Run migrations
pnpm prisma:studio         # Open Prisma Studio
pnpm prisma:generate       # Generate Prisma client

# Formatting
pnpm format                # Format all files
pnpm lint                  # Lint all packages
```

## Troubleshooting

### Port already in use
```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9

# Kill process on port 3001
lsof -ti:3001 | xargs kill -9
```

### Database connection error
- Check PostgreSQL is running
- Verify DATABASE_URL in .env
- Try: `cd apps/backend && pnpm prisma:generate`

### TypeScript errors in frontend
```bash
# Rebuild shared packages
pnpm --filter @notes/types build
pnpm --filter @notes/ui-lib build
```

### Clear everything and start fresh
```bash
pnpm clean
rm -rf node_modules apps/*/node_modules packages/*/node_modules
pnpm install
pnpm build
```

## Testing the App

1. Open http://localhost:3000
2. Login with any email/password (e.g., test@example.com / password123)
3. Create a note
4. Try closing and reopening - notes persist offline!
5. Open DevTools → Application → IndexedDB to see cached data

## Demo Login Credentials

Any email/password combination works (min 6 chars for password).
Example:
- Email: demo@example.com
- Password: demo123

The app auto-creates accounts on first login for demo purposes.
