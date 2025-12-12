# Notes Application - Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         NOTES APPLICATION                                │
│                    Full-Stack TypeScript Monorepo                        │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│                          CLIENT TIER                                     │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │              Next.js 15 Frontend (Port 3000)                     │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │   │
│  │  │  Login Page  │  │  Notes List  │  │ Note Editor  │          │   │
│  │  └──────────────┘  └──────────────┘  └──────────────┘          │   │
│  │                                                                  │   │
│  │  ┌─────────────────────────────────────────────────────────┐   │   │
│  │  │              React Query (TanStack Query)               │   │   │
│  │  │            - Server state management                    │   │   │
│  │  │            - Caching & sync logic                       │   │   │
│  │  └─────────────────────────────────────────────────────────┘   │   │
│  │                            ↕                                     │   │
│  │  ┌─────────────────────────────────────────────────────────┐   │   │
│  │  │              IndexedDB (Dexie)                          │   │   │
│  │  │            - Offline-first storage                      │   │   │
│  │  │            - Local note caching                         │   │   │
│  │  └─────────────────────────────────────────────────────────┘   │   │
│  └──────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────┘
                                    ↕
                            HTTP/REST API
                       (Axios with credentials)
                                    ↕
┌─────────────────────────────────────────────────────────────────────────┐
│                          SERVER TIER                                     │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │           Express Backend (Port 3001)                            │   │
│  │  ┌──────────────────────────────────────────────────────────┐   │   │
│  │  │              Security Middleware                         │   │   │
│  │  │  • Helmet (security headers)                            │   │   │
│  │  │  • CORS (cross-origin)                                  │   │   │
│  │  │  • Rate Limiting                                        │   │   │
│  │  │  • express-session (cookie auth)                       │   │   │
│  │  └──────────────────────────────────────────────────────────┘   │   │
│  │                            ↕                                     │   │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐               │   │
│  │  │   /auth    │  │  /notes    │  │  /health   │               │   │
│  │  │  routes    │  │  routes    │  │  routes    │               │   │
│  │  └────────────┘  └────────────┘  └────────────┘               │   │
│  │                            ↕                                     │   │
│  │  ┌──────────────────────────────────────────────────────────┐   │   │
│  │  │              Validation Layer (Zod)                      │   │   │
│  │  │            - Input validation                            │   │   │
│  │  │            - Type checking                               │   │   │
│  │  └──────────────────────────────────────────────────────────┘   │   │
│  │                            ↕                                     │   │
│  │  ┌──────────────────────────────────────────────────────────┐   │   │
│  │  │              Prisma ORM                                  │   │   │
│  │  │            - Type-safe queries                           │   │   │
│  │  │            - Migrations                                  │   │   │
│  │  │            - Model generation                            │   │   │
│  │  └──────────────────────────────────────────────────────────┘   │   │
│  └─────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────┘
                                    ↕
┌─────────────────────────────────────────────────────────────────────────┐
│                         DATABASE TIER                                    │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                    PostgreSQL Database                           │   │
│  │  ┌──────────────┐              ┌──────────────┐                 │   │
│  │  │   User       │              │   Note       │                 │   │
│  │  │  - id        │  ────────<   │  - id        │                 │   │
│  │  │  - email     │              │  - title     │                 │   │
│  │  │  - password  │              │  - content   │                 │   │
│  │  │  - name      │              │  - userId    │                 │   │
│  │  └──────────────┘              └──────────────┘                 │   │
│  └─────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│                       SHARED PACKAGES                                    │
│  ┌────────────────────────┐      ┌────────────────────────┐            │
│  │    @notes/types        │      │    @notes/ui-lib       │            │
│  │  - User types          │      │  - Button              │            │
│  │  - Note types          │      │  - Input               │            │
│  │  - API types           │      │  - Card                │            │
│  │  - Zod schemas         │      │  - Spinner             │            │
│  └────────────────────────┘      └────────────────────────┘            │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│                       TESTING & CI/CD                                    │
│  ┌────────────────────────┐      ┌────────────────────────┐            │
│  │    Vitest              │      │    Playwright          │            │
│  │  Backend unit tests    │      │  E2E tests             │            │
│  └────────────────────────┘      └────────────────────────┘            │
│  ┌──────────────────────────────────────────────────────────────┐      │
│  │                 GitHub Actions                                │      │
│  │  - Install dependencies                                       │      │
│  │  - Run tests                                                  │      │
│  │  - Build application                                          │      │
│  └──────────────────────────────────────────────────────────────┘      │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│                     DATA FLOW EXAMPLE                                    │
│                                                                           │
│  User creates note:                                                      │
│  1. User types in NoteEditor component                                   │
│  2. Clicks "Save" button                                                 │
│  3. React Query mutation triggers                                        │
│  4. POST /api/notes with Axios                                           │
│  5. Backend validates with Zod                                           │
│  6. Prisma creates record in PostgreSQL                                  │
│  7. Response returns to client                                           │
│  8. Note saved to IndexedDB                                              │
│  9. UI updates with new note                                             │
│                                                                           │
│  Offline scenario:                                                       │
│  1. User edits note while offline                                        │
│  2. Note saved to IndexedDB (marked as "dirty")                          │
│  3. UI updates immediately                                               │
│  4. When online, React Query refetches                                   │
│  5. Dirty notes sync to server                                           │
│  6. IndexedDB updated with server response                               │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│                     KEY TECHNOLOGIES                                     │
│                                                                           │
│  Frontend:  Next.js 15 | React 18 | TypeScript | Tailwind CSS           │
│  State:     TanStack Query | Dexie (IndexedDB)                          │
│  Backend:   Express | Node.js | TypeScript                              │
│  Database:  PostgreSQL | Prisma ORM                                     │
│  Security:  Helmet | CORS | Rate Limit | express-session               │
│  Validate:  Zod schemas                                                  │
│  Testing:   Vitest | Playwright                                          │
│  CI/CD:     GitHub Actions                                               │
│  Package:   pnpm workspaces                                              │
└─────────────────────────────────────────────────────────────────────────┘
```

## API Endpoints

```
Authentication:
  POST   /api/auth/login     - Login user
  POST   /api/auth/logout    - Logout user
  GET    /api/auth/me        - Get current user

Notes:
  GET    /api/notes          - Get all notes
  GET    /api/notes/:id      - Get single note
  POST   /api/notes          - Create note
  PATCH  /api/notes/:id      - Update note
  DELETE /api/notes/:id      - Delete note

Health:
  GET    /api/health         - Health check
```

## Folder Structure

```
notes-application/
├── apps/
│   ├── frontend/
│   │   ├── src/
│   │   │   ├── app/              # Next.js App Router
│   │   │   │   ├── login/        # Login page
│   │   │   │   ├── notes/        # Notes dashboard
│   │   │   │   ├── layout.tsx    # Root layout
│   │   │   │   └── page.tsx      # Home (redirect)
│   │   │   ├── components/       # React components
│   │   │   └── lib/              # Utilities (API, DB)
│   │   ├── e2e/                  # Playwright tests
│   │   └── package.json
│   └── backend/
│       ├── src/
│       │   ├── routes/           # API routes
│       │   ├── middleware/       # Express middleware
│       │   ├── lib/              # Utilities
│       │   ├── __tests__/        # Unit tests
│       │   └── server.ts         # Express server
│       ├── prisma/
│       │   ├── schema.prisma     # Database schema
│       │   └── migrations/       # SQL migrations
│       └── package.json
├── packages/
│   ├── types/                    # Shared TypeScript types
│   └── ui-lib/                   # Shared UI components
├── .github/workflows/            # CI/CD
├── package.json                  # Root package.json
├── pnpm-workspace.yaml          # Workspace config
└── README.md                    # Documentation
```
