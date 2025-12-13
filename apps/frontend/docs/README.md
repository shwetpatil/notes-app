# Frontend Documentation

**Notes Application Frontend - Next.js 15 + React 18 + TypeScript**

Modern, production-ready frontend with offline-first architecture and real-time features.

This documentation covers all frontend-specific concerns. For system-level documentation, see [System Documentation](../../../docs/README.md).

---

## 📚 Documentation Index

### 🏗️ Architecture & Design

**[ARCHITECTURE.md](./ARCHITECTURE.md)** - Frontend architecture
- Technology stack and layers
- Data flow patterns (offline-first)
- State management (TanStack Query + React Context)
- IndexedDB integration
- Design patterns and best practices

---

### ⚡ Performance

**[PERFORMANCE.md](./PERFORMANCE.md)** - Performance optimization
- Bundle optimization and code splitting
- React performance (memoization, virtual scrolling)
- Network optimization (caching, prefetching)
- Asset optimization (images, fonts, icons)
- Web Vitals monitoring
- Performance budget enforcement

---

### 🔒 Security

**[SECURITY.md](./SECURITY.md)** - Frontend security
- Cookie-based authentication
- XSS prevention (React + DOMPurify + CSP)
- CSRF protection (SameSite cookies)
- Input validation (Zod + server-side)
- Secure data storage (IndexedDB encryption)
- Security headers and testing

---

### 🧪 Testing

**[TESTING.md](./TESTING.md)** - Comprehensive testing guide
- Unit testing (Jest + React Testing Library)
- Accessibility testing (jest-axe)
- Integration testing
- E2E testing (Playwright)
- Visual regression testing
- CI/CD integration

---

### 🚀 Advanced Features

**[ADVANCED_FEATURES.md](./ADVANCED_FEATURES.md)** - Production features
- Bundle Analysis with @next/bundle-analyzer
- PWA (Progressive Web App) with offline support
- Internationalization (i18n) - 3 languages
- Accessibility testing and compliance
- Advanced configurations

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

**Monitoring:**
- **Consola 3** - Structured logging
- **Web Vitals** - Performance monitoring

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

## 🚀 Deployment

### Build for Production

```bash
# Build optimized bundle
pnpm build

# Start production server
pnpm start
```

### Environment Setup

1. Set `NEXT_PUBLIC_API_URL` to production backend
2. Configure domain in backend CORS settings
3. Enable HTTPS for cookies to work

### Deployment Platforms

**Vercel** (Recommended):
```bash
vercel --prod
```

**Other Platforms:**
- Build output is in `.next/` directory
- Requires Node.js runtime
- Serve with `next start`

---

## 🛠️ Development

### Best Practices

1. **Use shared types** from `@notes/types`
2. **Use shared components** from `@notes/ui-lib`
3. **Log with Consola**, not `console.log`
4. **Memoize** expensive computations
5. **Lazy load** heavy components
6. **Test** offline functionality

### Code Style

```typescript
// Use arrow functions
const MyComponent = () => { };

// Use TypeScript types
interface Props {
  title: string;
  onSave: (data: NoteData) => void;
}

// Use async/await
const handleSave = async () => {
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
