# Notes Application

A full-stack notes application built with Next.js, Express, PostgreSQL, and TypeScript.

## 🚀 Quick Start

```bash
# Install dependencies
pnpm install

# Setup environment
cp .env.example .env
# Edit .env with your database URL

# Setup database
cd apps/backend && pnpm prisma:migrate && cd ../..

# Build and start
pnpm build
pnpm dev
```

Open http://localhost:3000

## 📚 Documentation

All documentation is in the [`docs/`](./docs/) folder:

- **[Quick Start Guide](./docs/QUICKSTART.md)** - Get up and running fast
- **[Complete Documentation](./docs/README.md)** - Full project documentation  
- **[Architecture](./docs/ARCHITECTURE.md)** - System design and diagrams
- **[Backend Documentation](./apps/backend/docs/README.md)** - Backend-specific docs
- **[Frontend Documentation](./apps/frontend/docs/README.md)** - Frontend-specific docs

## 🛠️ Tech Stack

**Frontend:** Next.js 15, React 18, TypeScript, Tailwind CSS, TanStack Query, Dexie, Jest  
**Backend:** Express, Node.js, Prisma, PostgreSQL, TypeScript, Vitest  
**Shared:** pnpm workspaces, Storybook, TypeScript types  
**Tools:** GitHub Actions, Docker, Playwright

## 📁 Project Structure

```
notes-application/
├── apps/
│   ├── frontend/          # Next.js application
│   └── backend/           # Express API
├── packages/
│   ├── types/             # Shared TypeScript types
│   └── ui-lib/            # Shared UI components
└── docs/                  # Documentation
```

## 🎯 Features

- ✅ User authentication (login/logout)
- ✅ Notes CRUD operations
- ✅ Offline-first with IndexedDB
- ✅ Real-time server sync
- ✅ Type-safe end-to-end
- ✅ Security middleware
- ✅ Responsive UI

## 📄 License

MIT
