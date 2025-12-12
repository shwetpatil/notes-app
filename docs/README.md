# Notes Application

A full-stack notes application built with Next.js, Express, PostgreSQL, and TypeScript. Features offline-first capabilities with IndexedDB, real-time sync, and a clean, accessible UI.

## 🏗️ Architecture

This is a monorepo managed with **pnpm workspaces** containing:

```
notes-application/
├── apps/
│   ├── frontend/          # Next.js 15 with App Router
│   └── backend/           # Express + Prisma API
├── packages/
│   ├── types/             # Shared TypeScript types
│   └── ui-lib/            # Shared React UI components
├── .github/
│   └── workflows/         # CI/CD with GitHub Actions
└── pnpm-workspace.yaml    # Workspace configuration
```

### Technology Stack

#### Frontend
- **Next.js 15** with TypeScript and Turbopack
- **Tailwind CSS** for styling
- **TanStack Query** (React Query) for server state management
- **Dexie** (IndexedDB) for offline-first data caching
- **Axios** for API communication
- **Playwright** for E2E testing

#### Backend
- **Node.js + Express** with TypeScript
- **Prisma ORM** with PostgreSQL
- **express-session** for cookie-based authentication
- **Zod** for input validation
- **helmet** for security headers
- **express-rate-limit** for rate limiting
- **Vitest** for unit testing

#### Shared Packages
- `@notes/types` - TypeScript types and Zod schemas
- `@notes/ui-lib` - Reusable React components (Button, Input, Card, Spinner)

## 🚀 Getting Started

### Prerequisites

- **Node.js** >= 18.0.0
- **pnpm** >= 8.0.0
- **PostgreSQL** >= 14 (running locally or accessible)

### Installation

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd notes-application
   ```

2. **Install dependencies:**
   ```bash
   pnpm install
   ```

3. **Set up environment variables:**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` and configure your database connection:
   ```env
   DATABASE_URL="postgresql://postgres:password@localhost:5432/notes_db?schema=public"
   BACKEND_PORT=3001
   SESSION_SECRET="your-super-secret-session-key-change-this"
   CORS_ORIGIN="http://localhost:3000"
   NEXT_PUBLIC_API_URL="http://localhost:3001"
   ```

4. **Set up the database:**
   ```bash
   cd apps/backend
   pnpm prisma:migrate
   pnpm prisma:generate
   cd ../..
   ```

5. **Build shared packages:**
   ```bash
   pnpm build
   ```

### Running the Application

#### Development Mode (Recommended)

Run both frontend and backend concurrently:
```bash
pnpm dev
```

This starts:
- Frontend on http://localhost:3000
- Backend on http://localhost:3001

#### Individual Services

Run frontend only:
```bash
pnpm dev:frontend
```

Run backend only:
```bash
pnpm dev:backend
```

### Production Build

Build all packages:
```bash
pnpm build
```

Start production servers:
```bash
# Backend
cd apps/backend
pnpm start

# Frontend (in another terminal)
cd apps/frontend
pnpm start
```

## 📝 Usage

1. **Open the application:** Navigate to http://localhost:3000

2. **Login:** Use any email and password (minimum 6 characters). The app will auto-create an account for demo purposes.

3. **Create notes:** Click "New Note" to create a note. Notes are automatically synced to the server and cached locally.

4. **Offline mode:** Notes are cached in IndexedDB, allowing you to view and edit them offline. Changes sync when you're back online.

## 🧪 Testing

### Backend Unit Tests
```bash
pnpm --filter @notes/backend test
```

### Frontend E2E Tests
```bash
# Install Playwright browsers (first time only)
pnpm --filter @notes/frontend exec playwright install

# Run tests
pnpm --filter @notes/frontend exec playwright test

# Run tests with UI
pnpm --filter @notes/frontend exec playwright test --ui
```

### Run All Tests
```bash
pnpm test
```

## 📚 API Documentation

### Authentication Endpoints

#### POST /api/auth/login
Login with email and password.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "...",
      "email": "user@example.com",
      "name": "user"
    },
    "message": "Logged in successfully"
  }
}
```

#### POST /api/auth/logout
Logout current user.

#### GET /api/auth/me
Get current user session.

### Notes Endpoints

All notes endpoints require authentication.

#### GET /api/notes
Get all notes for authenticated user.

#### GET /api/notes/:id
Get a specific note by ID.

#### POST /api/notes
Create a new note.

**Request:**
```json
{
  "title": "My Note",
  "content": "Note content here..."
}
```

#### PATCH /api/notes/:id
Update an existing note.

**Request:**
```json
{
  "title": "Updated Title",
  "content": "Updated content..."
}
```

#### DELETE /api/notes/:id
Delete a note.

### Health Check

#### GET /api/health
Check API health status.

## 🗂️ Database Schema

### User Model
```prisma
model User {
  id        String   @id @default(cuid())
  email     String   @unique
  password  String
  name      String
  notes     Note[]
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

### Note Model
```prisma
model Note {
  id        String   @id @default(cuid())
  title     String
  content   String
  userId    String
  user      User     @relation(fields: [userId], references: [id])
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

## 🔧 Development

### Database Migrations

Create a new migration:
```bash
cd apps/backend
pnpm prisma migrate dev --name migration_name
```

Reset database:
```bash
cd apps/backend
pnpm prisma migrate reset
```

Open Prisma Studio:
```bash
cd apps/backend
pnpm prisma:studio
```

### Adding Dependencies

Add to root:
```bash
pnpm add -D <package> -w
```

Add to specific workspace:
```bash
pnpm add <package> --filter @notes/frontend
pnpm add <package> --filter @notes/backend
```

### Code Formatting

Format all files:
```bash
pnpm format
```

Lint all packages:
```bash
pnpm lint
```

## 🏗️ Project Structure Details

### Frontend Structure (`apps/frontend/`)
```
src/
├── app/
│   ├── layout.tsx          # Root layout with providers
│   ├── page.tsx            # Home page (redirects)
│   ├── providers.tsx       # React Query provider
│   ├── login/
│   │   └── page.tsx        # Login page
│   └── notes/
│       └── page.tsx        # Notes dashboard
├── components/
│   ├── Sidebar.tsx         # App sidebar
│   ├── NotesList.tsx       # Notes list component
│   └── NoteEditor.tsx      # Note editor component
├── lib/
│   ├── api.ts              # API client utilities
│   └── db.ts               # IndexedDB (Dexie) setup
└── styles/
    └── globals.css         # Global styles with Tailwind
```

### Backend Structure (`apps/backend/`)
```
src/
├── server.ts               # Express app setup
├── lib/
│   └── prisma.ts          # Prisma client instance
├── middleware/
│   ├── auth.ts            # Authentication middleware
│   └── errorHandler.ts    # Error handling middleware
├── routes/
│   ├── auth.ts            # Auth endpoints
│   ├── notes.ts           # Notes CRUD endpoints
│   └── health.ts          # Health check endpoint
└── __tests__/
    └── api.test.ts        # API tests
```

## 🔐 Security Features

- **Helmet.js** for security headers
- **CORS** configuration for cross-origin requests
- **Rate limiting** to prevent abuse
- **HTTP-only cookies** for session management
- **Input validation** with Zod schemas
- **SQL injection protection** via Prisma ORM

## 🚧 Future Enhancements

- [ ] Real-time collaboration with WebSockets
- [ ] Rich text editor (TipTap integration)
- [ ] Note tags and categories
- [ ] Full-text search
- [ ] Note sharing and permissions
- [ ] File attachments
- [ ] Mobile responsive improvements
- [ ] Dark mode support
- [ ] Export notes (PDF, Markdown)
- [ ] Redis session store for production
- [ ] Docker compose setup
- [ ] Comprehensive test coverage

## 📄 License

MIT License

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## 📞 Support

For issues and questions, please open an issue on GitHub.

---

Built with ❤️ using Next.js, Express, and TypeScript
