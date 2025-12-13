# Frontend Architecture

**Notes Application Frontend Architecture**  
**Last Updated**: December 13, 2025

---

## System Overview

```
┌─────────────────────────────────────────────────────────┐
│                    Browser (Client)                      │
│                                                          │
│  ┌────────────────────────────────────────────────────┐ │
│  │  Next.js Application (Port 3000)                   │ │
│  │                                                     │ │
│  │  React Components + Server Components              │ │
│  │  App Router (app/) + Client Components             │ │
│  └────────────────────────────────────────────────────┘ │
│                         ↓                                │
│  ┌────────────────────────────────────────────────────┐ │
│  │  State Management Layer                            │ │
│  │  • TanStack Query (Server State)                   │ │
│  │  • React Context (Theme, Auth)                     │ │
│  │  • Optimistic Updates                              │ │
│  └────────────────────────────────────────────────────┘ │
│                         ↓                                │
│  ┌────────────────────────────────────────────────────┐ │
│  │  Offline Storage (IndexedDB via Dexie)             │ │
│  │  • Local cache of all notes                        │ │
│  │  • Offline-first operations                        │ │
│  │  • Auto-sync when online                           │ │
│  └────────────────────────────────────────────────────┘ │
└────────────────────────┬────────────────────────────────┘
                         │ HTTP/HTTPS
                         │ API Calls via Axios
                         ↓
┌─────────────────────────────────────────────────────────┐
│            Backend API (Express - Port 3001)             │
│                    PostgreSQL Database                   │
└─────────────────────────────────────────────────────────┘
```

---

## Technology Stack

### Core Technologies
- **Runtime**: Next.js 15 (React 18)
- **Language**: TypeScript 5.3
- **Build Tool**: Turbopack (dev), Webpack (prod)
- **Styling**: Tailwind CSS 3.4

### Key Libraries
- **State Management**: TanStack Query 5.17, React Context
- **Offline Storage**: Dexie 4 (IndexedDB)
- **HTTP Client**: Axios 1.6
- **Rich Text**: TipTap 3, Lowlight 3
- **Testing**: Jest 30, React Testing Library 16, Playwright 1.41, jest-axe 10
- **PWA**: next-pwa 5.6
- **i18n**: next-intl 4.6

---

## Project Structure

```
apps/frontend/
├── src/
│   ├── app/                        # Next.js App Router
│   │   ├── layout.tsx              # Root layout + metadata
│   │   ├── page.tsx                # Landing page
│   │   ├── providers.tsx           # Context providers
│   │   ├── login/                  # Login page
│   │   ├── register/               # Register page
│   │   ├── notes/                  # Notes dashboard
│   │   ├── templates/              # Templates page
│   │   └── globals.css             # Global styles
│   │
│   ├── components/                 # React Components
│   │   ├── NoteEditor.tsx          # TipTap rich text editor
│   │   ├── NotesList.tsx           # Notes grid display
│   │   ├── SearchBar.tsx           # Search & filters
│   │   ├── NoteCard.tsx            # Individual note card
│   │   ├── Navbar.tsx              # Navigation bar
│   │   ├── ThemeSwitcher.tsx       # Dark/light mode
│   │   └── PerformanceMonitor.tsx  # Web Vitals display
│   │
│   ├── context/                    # React Context
│   │   └── ThemeContext.tsx        # Theme state management
│   │
│   ├── lib/                        # Utility libraries
│   │   ├── api.ts                  # Axios HTTP client
│   │   ├── db.ts                   # Dexie IndexedDB setup
│   │   ├── monitoring.ts           # Web Vitals tracking
│   │   └── errorTracking.ts        # Error handling
│   │
│   ├── i18n/                       # Internationalization
│   │   ├── request.ts              # i18n configuration
│   │   └── messages/               # Translation files
│   │       ├── en.json
│   │       ├── es.json
│   │       └── fr.json
│   │
│   └── __tests__/                  # Jest tests
│       ├── Button.test.tsx
│       ├── SearchBar.test.tsx
│       └── accessibility.test.tsx
│
├── public/                         # Static assets
│   ├── manifest.json               # PWA manifest
│   └── icons/                      # App icons
│
├── e2e/                           # Playwright E2E tests
│   └── notes.spec.ts
│
├── docs/                          # Documentation
│   ├── README.md
│   ├── ARCHITECTURE.md            # This file
│   ├── PERFORMANCE.md
│   ├── SECURITY.md
│   └── TESTING.md
│
└── Configuration Files
    ├── next.config.ts             # Next.js config
    ├── tailwind.config.js         # Tailwind config
    ├── jest.config.ts             # Jest config
    ├── playwright.config.ts       # Playwright config
    └── tsconfig.json              # TypeScript config
```

---

## Architecture Layers

### 1. Presentation Layer (React Components)

**Responsibilities:**
- Render UI based on state
- Handle user interactions
- Display loading/error states
- Optimistic UI updates

**Key Components:**

**NoteEditor** (`components/NoteEditor.tsx`):
```typescript
- TipTap rich text editor
- Markdown and HTML support
- Code syntax highlighting
- Auto-save functionality
- Toolbar with formatting options
```

**NotesList** (`components/NotesList.tsx`):
```typescript
- Grid/list view of notes
- Filtering (pinned, favorites, archived)
- Search integration
- Infinite scroll
- Skeleton loaders
```

**SearchBar** (`components/SearchBar.tsx`):
```typescript
- Real-time search
- Tag filtering
- Sort options
- View mode toggle
```

---

### 2. State Management Layer

#### TanStack Query (Server State)

**Purpose**: Manage server-synchronized data with caching, background updates, and optimistic updates.

**Configuration** (`app/providers.tsx`):
```typescript
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,      // 5 minutes
      gcTime: 10 * 60 * 1000,         // 10 minutes
      retry: 3,
      refetchOnWindowFocus: false
    }
  }
});
```

**Key Queries:**

1. **Notes Query**:
```typescript
useQuery({
  queryKey: ['notes'],
  queryFn: async () => {
    const response = await api.get('/api/notes');
    return response.data.data.notes;
  }
});
```

2. **Mutations with Optimistic Updates**:
```typescript
useMutation({
  mutationFn: createNote,
  onMutate: async (newNote) => {
    // Cancel outgoing refetches
    await queryClient.cancelQueries({ queryKey: ['notes'] });
    
    // Snapshot previous value
    const previousNotes = queryClient.getQueryData(['notes']);
    
    // Optimistically update
    queryClient.setQueryData(['notes'], (old) => [...old, newNote]);
    
    return { previousNotes };
  },
  onError: (err, newNote, context) => {
    // Rollback on error
    queryClient.setQueryData(['notes'], context.previousNotes);
  },
  onSettled: () => {
    // Refetch to sync
    queryClient.invalidateQueries({ queryKey: ['notes'] });
  }
});
```

#### React Context (Global State)

**ThemeContext** (`context/ThemeContext.tsx`):
- Light/dark mode toggle
- Persists to localStorage
- CSS variable updates
- System preference detection

---

### 3. Offline Storage Layer (IndexedDB)

**Implementation** (`lib/db.ts`):

```typescript
import Dexie from 'dexie';

export class NotesDatabase extends Dexie {
  notes!: Dexie.Table<Note, string>;
  
  constructor() {
    super('NotesDB');
    this.version(1).stores({
      notes: 'id, title, userId, isPinned, isFavorite, isArchived, createdAt, updatedAt'
    });
  }
}

export const db = new NotesDatabase();
```

**Sync Strategy**:

1. **Read**: Check IndexedDB first, then API
2. **Create**: Write to IndexedDB immediately, sync to API in background
3. **Update**: Update IndexedDB first, then API
4. **Delete**: Mark as deleted in IndexedDB, sync to API

**Benefits**:
- ⚡ Instant UI updates (< 10ms)
- 📡 Works offline
- 🔄 Auto-sync when connection restored
- 💾 Data persists across sessions

---

### 4. API Integration Layer

**HTTP Client** (`lib/api.ts`):

```typescript
import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    // Add request timing
    config.metadata = { startTime: Date.now() };
    return config;
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    // Calculate request duration
    const duration = Date.now() - response.config.metadata.startTime;
    logApiRequest(response.config.method, response.config.url, response.status, duration);
    return response;
  },
  (error) => {
    // Handle errors
    handleApiError(error);
    return Promise.reject(error);
  }
);
```

**Error Handling**:
- Network errors → Show offline banner
- 401 Unauthorized → Redirect to login
- 500 Server errors → Show error toast
- Automatic retry for transient failures

---

## Data Flow Patterns

### 1. Optimistic Create Flow

```
User Action (Create Note)
    ↓
Generate Temp ID
    ↓
Update UI Immediately (< 10ms)
    ↓
Save to IndexedDB (< 50ms)
    ↓
API Call in Background
    ↓
Replace Temp ID with Server ID
    ↓
Update IndexedDB with Real ID
    ↓
Success ✓
```

### 2. Offline-to-Online Sync Flow

```
User Creates Note (Offline)
    ↓
Save to IndexedDB with sync_pending = true
    ↓
Show "Pending Sync" indicator
    ↓
Network Restored
    ↓
Detect Online Event
    ↓
Query IndexedDB for Pending Items
    ↓
Batch Upload to API
    ↓
Update IndexedDB on Success
    ↓
Clear "Pending" indicators
```

### 3. Real-time Search Flow

```
User Types in SearchBar
    ↓
Debounce Input (300ms)
    ↓
Query IndexedDB (Client-side Filter)
    ↓
Display Results (< 50ms)
    ↓
(Optional) Server-side Search for Advanced Queries
```

---

## Performance Optimizations

### Code Splitting
- Automatic route-based splitting by Next.js
- Dynamic imports for heavy components
- Lazy loading for editor (TipTap)

### Caching Strategy
- TanStack Query: 5-minute stale time
- Service Worker: Cache static assets (PWA)
- IndexedDB: Persistent client-side cache

### Image Optimization
- Next.js Image component
- Automatic WebP conversion
- Lazy loading with blur placeholder

### Bundle Size
- Tree shaking with Webpack
- Bundle analyzer for monitoring
- Dynamic imports for non-critical code

---

## Security Architecture

### Authentication Flow
```
1. Login → Server sets httpOnly cookie
2. Cookie sent automatically with every request
3. Server validates session
4. Frontend never handles tokens directly
```

### XSS Prevention
- React auto-escapes by default
- DOMPurify for user-generated HTML
- Content Security Policy headers

### CSRF Protection
- SameSite cookies
- Origin validation
- Custom headers for API calls

---

## Testing Architecture

### Unit Tests (Jest + React Testing Library)
```typescript
test('NoteCard renders correctly', () => {
  render(<NoteCard note={mockNote} />);
  expect(screen.getByText(mockNote.title)).toBeInTheDocument();
});
```

### Integration Tests
```typescript
test('Creating a note updates the list', async () => {
  // Test optimistic update + API sync
});
```

### E2E Tests (Playwright)
```typescript
test('User can create and edit notes', async ({ page }) => {
  await page.goto('/notes');
  await page.click('button:has-text("New Note")');
  await page.fill('input[name="title"]', 'Test Note');
  await page.click('button:has-text("Save")');
  await expect(page.locator('text=Test Note')).toBeVisible();
});
```

### Accessibility Tests (jest-axe)
```typescript
test('NoteCard has no accessibility violations', async () => {
  const { container } = render(<NoteCard note={mockNote} />);
  const results = await axe(container);
  expect(results).toHaveNoViolations();
});
```

---

## Design Patterns

### 1. Custom Hooks Pattern
```typescript
// useNotes hook encapsulates all notes logic
export function useNotes() {
  const query = useQuery(['notes'], fetchNotes);
  const createMutation = useMutation(createNote);
  const updateMutation = useMutation(updateNote);
  const deleteMutation = useMutation(deleteNote);
  
  return {
    notes: query.data,
    isLoading: query.isLoading,
    createNote: createMutation.mutate,
    updateNote: updateMutation.mutate,
    deleteNote: deleteMutation.mutate
  };
}
```

### 2. Provider Pattern
```typescript
// Wrap app with multiple providers
<QueryClientProvider client={queryClient}>
  <ThemeProvider>
    <App />
  </ThemeProvider>
</QueryClientProvider>
```

### 3. Compound Component Pattern
```typescript
<NoteCard>
  <NoteCard.Header />
  <NoteCard.Content />
  <NoteCard.Footer />
</NoteCard>
```

### 4. Render Props Pattern (TanStack Query)
```typescript
<Query query={notesQuery}>
  {({ data, isLoading, error }) => {
    if (isLoading) return <Spinner />;
    if (error) return <Error />;
    return <NotesList notes={data} />;
  }}
</Query>
```

---

## Monitoring & Observability

### Web Vitals Tracking
- LCP (Largest Contentful Paint)
- FID (First Input Delay)
- CLS (Cumulative Layout Shift)
- TTFB (Time to First Byte)

### Custom Metrics
- API request duration
- IndexedDB operation time
- Component render time
- User interaction events

### Error Tracking
- Unhandled exceptions
- API errors
- Network failures
- Console errors (in production)

---

## Future Architecture Improvements

### Planned Enhancements
1. **WebSocket Integration** - Real-time collaborative editing
2. **Service Worker** - Enhanced offline capabilities
3. **Web Workers** - Heavy computation off main thread
4. **React Server Components** - Better performance for static content
5. **Suspense Boundaries** - Better loading states
6. **Code Streaming** - Progressive hydration

### Scalability Considerations
- Virtual scrolling for large lists
- Pagination for API queries
- Lazy loading for images
- Route prefetching

---

## Best Practices

### Component Guidelines
- Keep components small and focused
- Use TypeScript for type safety
- Extract custom hooks for reusable logic
- Implement error boundaries
- Add loading and error states

### Performance Guidelines
- Memoize expensive computations (useMemo)
- Prevent unnecessary re-renders (React.memo)
- Debounce user input
- Lazy load heavy components
- Optimize images with Next.js Image

### Accessibility Guidelines
- Semantic HTML
- ARIA labels where needed
- Keyboard navigation
- Focus management
- Screen reader support

---

## Conclusion

The frontend architecture is designed for:
- ⚡ **Performance** - Offline-first with optimistic updates
- 🔒 **Security** - Cookie-based auth, XSS prevention
- 📱 **PWA** - Installable, works offline
- 🌐 **i18n** - Multi-language support
- ♿ **Accessibility** - WCAG 2.1 compliant
- 🧪 **Testable** - Unit, integration, E2E, and a11y tests

This architecture supports rapid development while maintaining production-grade quality.
