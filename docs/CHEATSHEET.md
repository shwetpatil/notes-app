# 🎯 CHEAT SHEET - Notes Application

## 🚀 Quick Start (Copy & Paste)

```bash
# 1. Install everything
pnpm install

# 2. Setup environment
cp .env.example .env
# Edit .env with your database URL

# 3. Setup database
cd apps/backend
pnpm prisma:migrate
pnpm prisma:generate
cd ../..

# 4. Build shared packages
pnpm --filter @notes/types build
pnpm --filter @notes/ui-lib build

# 5. Start development
pnpm dev

# 6. Open browser
# http://localhost:3000
```

---

## 📋 Essential Commands

### Development
```bash
pnpm dev                    # Start frontend + backend
pnpm dev:frontend          # Start only frontend (port 3000)
pnpm dev:backend           # Start only backend (port 3001)
```

### Building
```bash
pnpm build                 # Build all packages
pnpm build:frontend        # Build frontend
pnpm build:backend         # Build backend
```

### Testing
```bash
pnpm test                              # All tests
pnpm --filter @notes/backend test      # Backend only
pnpm --filter @notes/frontend test     # E2E only
```

### Database
```bash
cd apps/backend
pnpm prisma:migrate         # Run migrations
pnpm prisma:studio         # Open Prisma Studio UI
pnpm prisma:generate       # Generate Prisma client
```

### Cleanup
```bash
pnpm clean                 # Clean build artifacts
rm -rf node_modules        # Remove all dependencies
pnpm install              # Reinstall everything
```

---

## 🔧 Troubleshooting Commands

### Kill Ports
```bash
# Frontend (port 3000)
lsof -ti:3000 | xargs kill -9

# Backend (port 3001)
lsof -ti:3001 | xargs kill -9
```

### Reset Database
```bash
cd apps/backend
pnpm prisma migrate reset
pnpm prisma:generate
```

### Fix TypeScript Errors
```bash
pnpm --filter @notes/types build
pnpm --filter @notes/ui-lib build
```

### Full Reset
```bash
pnpm clean
rm -rf node_modules apps/*/node_modules packages/*/node_modules
pnpm install
pnpm build
```

---

## 📁 File Locations

### Configuration
```
.env                              # Environment variables (create from .env.example)
package.json                      # Root scripts
pnpm-workspace.yaml              # Workspace config
```

### Documentation
```
README.md                        # Main docs
QUICKSTART.md                    # Fast start
ARCHITECTURE.md                  # System design
OVERVIEW.md                      # Project overview
FILE_LIST.md                     # Complete file list
```

### Frontend
```
apps/frontend/src/app/           # Next.js pages
apps/frontend/src/components/    # React components
apps/frontend/src/lib/           # Utilities (API, DB)
```

### Backend
```
apps/backend/src/server.ts       # Express server
apps/backend/src/routes/         # API endpoints
apps/backend/prisma/schema.prisma # Database schema
```

### Shared
```
packages/types/src/index.ts      # Type definitions
packages/ui-lib/src/components/  # UI components
```

---

## 🌐 URLs

| Service | URL | Notes |
|---------|-----|-------|
| Frontend | http://localhost:3000 | Next.js app |
| Backend | http://localhost:3001 | Express API |
| Prisma Studio | http://localhost:5555 | Database UI |
| API Health | http://localhost:3001/api/health | Health check |

---

## 🔑 Environment Variables

```env
# Database
DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/notes_db"

# Backend
BACKEND_PORT=3001
NODE_ENV=development
SESSION_SECRET="your-super-secret-key"
CORS_ORIGIN="http://localhost:3000"

# Frontend
NEXT_PUBLIC_API_URL="http://localhost:3001"
```

---

## 📝 API Endpoints

### Auth
```
POST   /api/auth/login     - Login
POST   /api/auth/logout    - Logout
GET    /api/auth/me        - Current user
```

### Notes (requires auth)
```
GET    /api/notes          - List notes
GET    /api/notes/:id      - Get note
POST   /api/notes          - Create note
PATCH  /api/notes/:id      - Update note
DELETE /api/notes/:id      - Delete note
```

### Test with curl
```bash
# Login
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}' \
  -c cookies.txt

# Get notes
curl http://localhost:3001/api/notes \
  -b cookies.txt

# Create note
curl -X POST http://localhost:3001/api/notes \
  -H "Content-Type: application/json" \
  -d '{"title":"Test","content":"Hello"}' \
  -b cookies.txt
```

---

## 🎨 Adding Features

### New Backend Route
```bash
# 1. Create route file
cd apps/backend/src/routes
touch myroute.ts

# 2. Register in server.ts
# app.use("/api/myroute", myRouter);
```

### New Frontend Page
```bash
# 1. Create page
mkdir -p apps/frontend/src/app/mypage
touch apps/frontend/src/app/mypage/page.tsx

# 2. Navigate to /mypage
```

### New Shared Component
```bash
# 1. Create component
cd packages/ui-lib/src/components
touch MyComponent.tsx

# 2. Export in packages/ui-lib/src/index.ts
# export { MyComponent } from "./components/MyComponent";

# 3. Rebuild
cd ../.. && pnpm build
```

---

## 🧪 Testing Examples

### Backend Test
```typescript
// apps/backend/src/__tests__/mytest.test.ts
import { describe, it, expect } from "vitest";

describe("My Feature", () => {
  it("should work", () => {
    expect(1 + 1).toBe(2);
  });
});
```

### Frontend E2E Test
```typescript
// apps/frontend/e2e/mytest.spec.ts
import { test, expect } from "@playwright/test";

test("should load page", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle(/Notes/);
});
```

---

## 📦 Package Management

### Add Dependency
```bash
# Root
pnpm add <package> -w

# Specific workspace
pnpm add <package> --filter @notes/frontend
pnpm add <package> --filter @notes/backend
pnpm add <package> --filter @notes/types
pnpm add <package> --filter @notes/ui-lib
```

### Remove Dependency
```bash
pnpm remove <package> --filter @notes/frontend
```

### Update Dependencies
```bash
pnpm update                # Update all
pnpm update <package>      # Update specific
```

---

## 🔍 Debugging

### Backend Logs
```bash
cd apps/backend
pnpm dev
# Watch terminal for logs
```

### Frontend Logs
```bash
# Browser DevTools Console
# Or check terminal for server logs
```

### Database Queries
```bash
cd apps/backend
pnpm prisma:studio
# Visual interface to browse data
```

### Check Prisma Client
```bash
cd apps/backend
pnpm prisma:generate
pnpm prisma format
```

---

## 🚢 Production Checklist

- [ ] Set `NODE_ENV=production`
- [ ] Use strong `SESSION_SECRET`
- [ ] Configure production database
- [ ] Enable Redis for sessions
- [ ] Set up error monitoring
- [ ] Configure logging
- [ ] Enable rate limiting
- [ ] Hash passwords (bcrypt)
- [ ] Use HTTPS
- [ ] Set secure cookies
- [ ] Review CORS settings
- [ ] Add health checks
- [ ] Configure backups

---

## 💡 Pro Tips

1. **Keep it running**: `pnpm dev` watches for changes
2. **Use Prisma Studio**: Visual database editor
3. **Check types**: Run `pnpm build` to catch errors
4. **Test offline**: Disconnect network, app still works
5. **Hot reload**: Both frontend and backend auto-reload
6. **Query DevTools**: React Query DevTools in browser
7. **Database first**: Always run migrations before starting

---

## 🎓 Learning Path

1. **Start Here**: QUICKSTART.md
2. **Understand**: ARCHITECTURE.md
3. **Explore**: Check out the code
4. **Modify**: Change a component
5. **Extend**: Add a feature
6. **Deploy**: Ship it!

---

## 📞 Getting Help

1. Check documentation files
2. Read code comments
3. Review TypeScript errors
4. Check browser console
5. Look at terminal logs
6. Use Prisma Studio for DB issues
7. Search GitHub issues

---

## ⚡ Performance Tips

- Use React Query caching effectively
- Keep IndexedDB in sync
- Optimize Tailwind builds
- Use Next.js image optimization
- Enable Prisma query logging in dev
- Monitor bundle sizes
- Use React DevTools Profiler

---

**Happy coding! 🎉**
