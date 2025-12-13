# Frontend Documentation

**Notes Application Frontend - Next.js 15 + React 18 + TypeScript**

Modern, production-ready frontend with offline-first architecture, real-time features, and accessibility.

---

## 📂 Documentation Structure

### 🏗️ [System Architecture](./system/)
Core technical architecture and design
- [Architecture](./system/architecture.md) - Frontend design and patterns
- [Performance](./system/performance.md) - Optimization strategies
- [Security](./system/security.md) - Security implementation
- [Features](./system/features.md) - Frontend features *(to be created)*
- [State Management](./system/state-management.md) - Data flow patterns *(to be created)*

### 📝 [Architecture Decision Records](./adr/)
Key technical decisions and rationale
- [ADR-0001: Next.js App Router](./adr/0001-app-router.md) *(to be created)*
- [ADR-0002: Offline-First Strategy](./adr/0002-offline-first.md) *(to be created)*
- [ADR-0003: TanStack Query](./adr/0003-tanstack-query.md) *(to be created)*
- [ADR-0004: IndexedDB Choice](./adr/0004-indexeddb.md) *(to be created)*
- [ADR-0005: Tailwind CSS](./adr/0005-tailwind.md) *(to be created)*

### 💻 [Development](./development/)
Developer guides and workflows
- [Testing](./development/testing.md) - Testing strategy and practices
- [Advanced Features](./development/advanced-features.md) - PWA, i18n, bundle analysis
- [Component Guidelines](./development/component-guidelines.md) - Component patterns *(to be created)*
- [Debugging](./development/debugging.md) - Debugging techniques *(to be created)*
- [Accessibility](./development/accessibility.md) - A11y best practices *(to be created)*

### ⚙️ [Operations](./operations/)
Deployment and production operations
- [Deployment](./operations/deployment.md) - Deployment strategies *(to be created)*
- [Performance Monitoring](./operations/performance-monitoring.md) - Web Vitals tracking *(to be created)*
- [Roadmap](./operations/roadmap.md) - Feature roadmap *(to be created)*

---

## 🚀 Quick Start

```bash
# Install dependencies
cd apps/frontend
pnpm install

# Start development server (with Turbopack)
pnpm dev
# → http://localhost:3000

# Build for production
pnpm build
pnpm start

# Run E2E tests
pnpm test

# Lint code
pnpm lint
```

---

## 📦 Technology Stack

**Framework & Core:**
- **Next.js 15** - React framework with App Router, Server Components, Turbopack
- **React 18** - UI library with concurrent features
- **TypeScript 5.3** - Static type checking

**Styling:**
- **Tailwind CSS 3.4** - Utility-first CSS
- **PostCSS** - CSS processing

**State & Data:**
- **TanStack Query 5** - Server state management with caching
- **Dexie 4** - IndexedDB wrapper for offline storage
- **React Context** - Theme and global state

**HTTP & Rich Text:**
- **Axios 1.6** - HTTP client with interceptors
- **TipTap 3** - Rich text editor with extensions
- **Lowlight 3** - Code syntax highlighting

**Testing:**
- **Playwright** - End-to-end testing

---

## 🚀 Quick Links

### For New Developers
1. [Architecture Overview](./system/architecture.md)
2. [Testing Guide](./development/testing.md)
3. [Advanced Features](./development/advanced-features.md)

### For Frontend Engineers
1. [System Architecture](./system/architecture.md)
2. [Performance Optimization](./system/performance.md)
3. [Security Implementation](./system/security.md)

### For DevOps
1. [Deployment Guide](./operations/deployment.md) *(to be created)*
2. [Performance Monitoring](./operations/performance-monitoring.md) *(to be created)*

---

## 🛠️ Technology Stack

**Framework & Core:**
- **Next.js 15** - React framework with App Router, Server Components, Turbopack
- **React 18** - UI library with concurrent features
- **TypeScript 5.3** - Static type checking

**State & Data:**
- **TanStack Query 5** - Server state management
- **Dexie 4** - IndexedDB wrapper for offline storage
- **Zod 3** - Schema validation

**UI & Styling:**
- **Tailwind CSS 3** - Utility-first CSS
- **Radix UI** - Accessible component primitives
- **Lucide React** - Icon library

**Performance & Monitoring:**
- **Consola 3** - Structured logging
- **Web Vitals** - Performance monitoring
- **@next/bundle-analyzer** - Bundle analysis

**Advanced Features:**
- **next-pwa 5** - Progressive Web App
- **next-intl 4** - Internationalization

---

## 🔗 Related Documentation

- [System Documentation](../../../docs/README.md) - Overall system architecture
- [Backend Documentation](../../backend/docs/README.md) - API server and database
- [Packages Documentation](../../../packages/docs/README.md) - Shared types and UI components

---

## 🏗️ Architecture Overview

### Offline-First Data Flow

```
User Action → Optimistic Update → IndexedDB → API Call → Sync
    ↓              ↓                  ↓           ↓        ↓
< 10ms         Instant UI         < 50ms     Background  Success
```

**Key Features:**
- ⚡ **Instant Feedback** - UI updates in < 10ms
- 📡 **Offline Support** - Full CRUD operations without network
- 🔄 **Auto-Sync** - Automatic synchronization when online
- 💾 **Persistence** - Data survives page refresh
- 🎯 **Consistency** - Server is source of truth

### App Router Structure

```
app/
├── layout.tsx                 # Root layout with providers
├── page.tsx                   # Landing page (/)
├── providers.tsx              # Query Client, Theme providers
├── login/
│   └── page.tsx              # Login (/login)
├── register/
│   └── page.tsx              # Register (/register)
├── notes/
│   └── page.tsx              # Notes dashboard (/notes)
└── templates/
    └── page.tsx              # Templates (/templates)

src/
├── components/               # React components
│   ├── NoteEditor.tsx       # Rich text editor with TipTap
│   ├── NotesList.tsx        # Notes grid with filters
│   ├── SearchBar.tsx        # Search and filter UI
│   ├── Sidebar.tsx          # Navigation sidebar
│   ├── ColorPicker.tsx      # Note color selector
│   ├── TemplateManager.tsx  # Template management
│   ├── MetricsDashboard.tsx # Performance metrics
│   └── MonitoringProvider.tsx # Web Vitals tracking
├── lib/
│   ├── api.ts               # Axios client + API methods
│   ├── db.ts                # Dexie IndexedDB setup
│   ├── logger.ts            # Consola logging
│   ├── monitoring.ts        # Performance tracking
│   └── errorTracking.ts     # Error handling
└── context/
    └── ThemeContext.tsx     # Dark/light theme
```

---

## 🔄 State Management

### 1. Server State (TanStack Query)

Manages API data with intelligent caching:

```typescript
import { useQuery, useMutation } from '@tanstack/react-query';

// Fetch notes with caching
const { data, isLoading, error } = useQuery({
  queryKey: ['notes'],
  queryFn: () => notesApi.getAll(),
  staleTime: 5 * 60 * 1000,  // Fresh for 5 minutes
});

// Create note with optimistic update
const createNote = useMutation({
  mutationFn: notesApi.create,
  onMutate: async (newNote) => {
    // Instant UI update
    await queryClient.cancelQueries({ queryKey: ['notes'] });
    queryClient.setQueryData(['notes'], (old) => [...old, newNote]);
  },
  onSuccess: () => {
    // Sync with server
    queryClient.invalidateQueries({ queryKey: ['notes'] });
  },
});
```

**Configuration:**
- Automatic retries (3x with exponential backoff)
- Refetch on window focus and reconnect
- 5-minute cache timeout
- Optimistic updates for instant UI

### 2. IndexedDB (Offline Storage)

Persistent local database using Dexie:

```typescript
import { db } from '@/lib/db';

// Store notes offline
await db.notes.bulkPut(notes);

// Query notes
const notes = await db.notes
  .where('userId').equals(userId)
  .and(note => !note.isTrashed)
  .sortBy('updatedAt');

// Full-text search
const results = await db.notes
  .filter(note => note.title.includes(query))
  .toArray();
```

**Tables:**
- `notes` - All user notes with indexes
- `users` - Current user profile
- `syncQueue` - Pending offline changes

### 3. Local State (React)

Component-specific UI state:

```typescript
const [title, setTitle] = useState('');
const [isEditing, setIsEditing] = useState(false);
const [selectedTags, setSelectedTags] = useState<string[]>([]);
```

### 4. Global State (Context)

Theme and user preferences:

```typescript
const { theme, toggleTheme } = useContext(ThemeContext);
// theme: 'light' | 'dark'
```

---

## 📝 Logging

Structured logging with Consola for debugging and monitoring:

```typescript
import { logger, logApiRequest, logError } from '@/lib/logger';

// General logging
logger.info('User logged in');
logger.success('Note saved successfully');
logger.warn('Slow network detected');
logger.error('Failed to save note', error);

// API request logging (automatic)
logApiRequest('POST', '/api/notes', 201, 150);
// → [api] POST /api/notes 201 (150ms)

// Component lifecycle
useEffect(() => {
  logger.debug('NoteEditor mounted');
  return () => logger.debug('NoteEditor unmounted');
}, []);

// Performance tracking
const startTime = performance.now();
// ... operation ...
logPerformance('data-processing', performance.now() - startTime);

// Error logging (production-safe)
try {
  await saveNote(note);
} catch (error) {
  logError('Failed to save note', error, { noteId: note.id });
}
```

**Features:**
- Color-coded output by log level
- Module-specific tagged loggers
- Automatic slow operation detection (>100ms)
- Production-safe error sanitization
- TypeScript support

**Log Levels:**
- `trace` - Very detailed debugging (dev only)
- `debug` - Development debugging (dev only)
- `info` - General information
- `success` - Successful operations
- `warn` - Warnings and deprecations
- `error` - Errors requiring attention
- `fatal` - Critical failures

---

## ⚡ Performance

### Optimizations Implemented

**1. Code Splitting:**
```typescript
import dynamic from 'next/dynamic';

const MetricsDashboard = dynamic(() => import('@/components/MetricsDashboard'), {
  loading: () => <Spinner />,
  ssr: false  // Client-side only
});
```

**2. Memoization:**
```typescript
const filteredNotes = useMemo(() => {
  return notes.filter(note => 
    note.title.includes(search) && !note.isTrashed
  );
}, [notes, search]);

const handleSearch = useCallback((value: string) => {
  setSearch(value);
}, []);
```

**3. IndexedDB First:**
```typescript
// Load from IndexedDB immediately (< 50ms)
const cachedNotes = await db.notes.toArray();
setNotes(cachedNotes);

// Fetch from API in background
const apiNotes = await notesApi.getAll();
await db.notes.bulkPut(apiNotes);
setNotes(apiNotes);
```

**4. TanStack Query Caching:**
- 5-minute stale time for notes
- 10-minute garbage collection
- Background refetching on focus/reconnect

### Performance Monitoring

Web Vitals tracking with Core Web Vitals:

```typescript
import { onCLS, onFCP, onLCP, onTTFB, onINP } from 'web-vitals';

// Automatic tracking in MonitoringProvider
onLCP(metric => trackMetric('LCP', metric));
onFCP(metric => trackMetric('FCP', metric));
onCLS(metric => trackMetric('CLS', metric));
```

**Tracked Metrics:**
- **LCP** (Largest Contentful Paint) - Loading performance
- **FID** (First Input Delay) - Interactivity
- **CLS** (Cumulative Layout Shift) - Visual stability
- **FCP** (First Contentful Paint) - Initial render
- **TTFB** (Time to First Byte) - Server response

View metrics in development: MetricsDashboard component

---

## 🧪 Testing

### E2E Tests (Playwright)

Located in `e2e/notes.spec.ts`:

```typescript
// Run tests
pnpm test

// Run with UI
pnpm test:ui

// Run specific test
pnpm test:ui -- notes.spec.ts
```

**Test Coverage:**
- User authentication flow
- Note CRUD operations
- Search and filtering
- Offline functionality
- Error handling

---

## 🎨 Styling

### Tailwind CSS

Utility-first CSS with custom configuration:

```typescript
// tailwind.config.js
module.exports = {
  darkMode: 'class',  // Enable dark mode
  theme: {
    extend: {
      colors: {
        // Custom colors
      },
    },
  },
};
```

**Usage:**
```tsx
<div className="bg-white dark:bg-gray-900 rounded-lg shadow-md p-4">
  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
    Hello World
  </h2>
</div>
```

### Dark Mode

Implemented with Theme Context:

```typescript
const { theme, toggleTheme } = useContext(ThemeContext);

<button onClick={toggleTheme}>
  {theme === 'light' ? '🌙 Dark' : '☀️ Light'}
</button>
```

---

## 🔒 Security

### Authentication

Session-based authentication with HTTP-only cookies:

```typescript
// Login
await authApi.login({ email, password });
// Sets HTTP-only cookie

// Logout
await authApi.logout();
// Clears cookie

// Auto-redirect
useEffect(() => {
  if (!user && !isLoading) {
    router.push('/login');
  }
}, [user, isLoading]);
```

### API Security

- **CORS**: Configured for specific origins
- **Credentials**: Automatic cookie inclusion
- **Error Handling**: No sensitive data leaks
- **CSP**: Content Security Policy headers

---

## 📱 Offline Support

### Features

- ✅ View and edit notes offline
- ✅ Create new notes offline
- ✅ Delete notes offline
- ✅ Full-text search works offline
- ✅ Auto-sync when back online

### Implementation

```typescript
// Check online status
const [isOnline, setIsOnline] = useState(navigator.onLine);

useEffect(() => {
  const handleOnline = () => {
    setIsOnline(true);
    // Trigger sync
    queryClient.invalidateQueries();
  };
  
  const handleOffline = () => {
    setIsOnline(false);
  };
  
  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);
  
  return () => {
    window.removeEventListener('online', handleOnline);
    window.removeEventListener('offline', handleOffline);
  };
}, []);
```

---

## 🌐 Environment Variables

Create `.env.local`:

```bash
# API endpoint
NEXT_PUBLIC_API_URL=http://localhost:3001

# Feature flags (optional)
NEXT_PUBLIC_ENABLE_METRICS=true
```

---

## 📚 API Integration

All API calls go through centralized API client:

```typescript
// lib/api.ts
export const notesApi = {
  getAll: () => apiClient.get('/api/notes').then(res => res.data.data),
  getById: (id) => apiClient.get(`/api/notes/${id}`).then(res => res.data.data),
  create: (data) => apiClient.post('/api/notes', data).then(res => res.data.data),
  update: (id, data) => apiClient.put(`/api/notes/${id}`, data).then(res => res.data.data),
  delete: (id) => apiClient.delete(`/api/notes/${id}`).then(res => res.data),
};

export const authApi = {
  login: (data) => apiClient.post('/api/auth/login', data).then(res => res.data),
  register: (data) => apiClient.post('/api/auth/register', data).then(res => res.data),
  logout: () => apiClient.post('/api/auth/logout').then(res => res.data),
  me: () => apiClient.get('/api/auth/me').then(res => res.data.data),
};
```

**Features:**
- Automatic retry with exponential backoff
- Request/response interceptors
- Error handling and logging
- Performance tracking
- TypeScript types from `@notes/types`

---

## 🚀 Quick Commands

```bash
# Development
pnpm dev                    # Start dev server (http://localhost:3000)
pnpm dev:turbo              # Start with Turbopack

# Testing
pnpm test                   # Run E2E tests with Playwright
pnpm test:ui                # Run tests with UI

# Build
pnpm build                  # Production build
pnpm start                  # Start production server

# Code Quality
pnpm lint                   # Lint code
pnpm format                 # Format code

# Advanced Features
pnpm analyze                # Bundle analysis (requires ANALYZE=true)
```

---

**Last Updated**: December 13, 2025  
**Frontend Version**: 1.0.0  
**Documentation Version**: 3.0
  try {
    await notesApi.create(data);
  } catch (error) {
    logError('Save failed', error);
  }
};
```

---

## 📖 Additional Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [TanStack Query](https://tanstack.com/query/latest)
- [Dexie.js](https://dexie.org/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Playwright](https://playwright.dev/)

---

**Last Updated**: December 13, 2025  
**Version**: 1.0.0
