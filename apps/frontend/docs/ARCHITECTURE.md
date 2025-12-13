# Frontend Architecture

**Next.js 15 + React 18 Architecture for Notes Application**

---

## Technology Stack

**Framework & UI:**
- **Next.js 15** - React framework with App Router, Server Components, Turbopack
- **React 18** - UI library with concurrent features
- **TypeScript 5.3** - Static type checking

**Styling:**
- **Tailwind CSS 3.4** - Utility-first CSS framework
- **PostCSS** - CSS processing

**State Management:**
- **TanStack Query 5** - Server state management (formerly React Query)
- **React Context** - Theme state
- **Dexie 4** - IndexedDB wrapper for offline storage

**HTTP Client:**
- **Axios 1.6** - Promise-based HTTP client with interceptors

**Testing:**
- **Playwright** - E2E testing framework

---

## Architecture Overview

```
┌───────────────────────────────────────────────────────────────┐
│                      Browser (Client)                         │
│                                                               │
│  ┌─────────────────────────────────────────────────────┐    │
│  │         React Application (Next.js)                 │    │
│  │                                                     │    │
│  │  ┌──────────────┐  ┌──────────────┐  ┌───────────┐│    │
│  │  │  UI Layer    │  │ State Layer  │  │Cache Layer││    │
│  │  │              │  │              │  │           ││    │
│  │  │ Components   │←─│ TanStack     │←─│ IndexedDB ││    │
│  │  │ (TSX/JSX)    │  │ Query        │  │ (Dexie)   ││    │
│  │  │              │  │              │  │           ││    │
│  │  │ - NotesList  │  │ - useQuery   │  │ - notes   ││    │
│  │  │ - NoteEditor │  │ - useMutation│  │ - users   ││    │
│  │  │ - SearchBar  │  │ - useContext │  │ - sync    ││    │
│  │  └──────────────┘  └──────────────┘  └───────────┘│    │
│  │         │                  │                │      │    │
│  │         └──────────────────┴────────────────┘      │    │
│  │                          │                         │    │
│  │                          ↓                         │    │
│  │              ┌───────────────────────┐            │    │
│  │              │   API Client (Axios)  │            │    │
│  │              │ - baseURL config      │            │    │
│  │              │ - Interceptors        │            │    │
│  │              │ - Error handling      │            │    │
│  │              └───────────────────────┘            │    │
│  └───────────────────────┬─────────────────────────────┘    │
└────────────────────────────┼────────────────────────────────┘
                             │ HTTP/HTTPS
                             │ REST API
                             ↓
┌───────────────────────────────────────────────────────────────┐
│                  Backend API (Express.js)                     │
│                  See backend/docs/ARCHITECTURE.md             │
└───────────────────────────────────────────────────────────────┘
```

---

## App Router Structure

### Directory-Based Routing

```
app/
├── layout.tsx                 # Root layout (applies to all pages)
│   ├─ <html>, <body> tags
│   ├─ Global styles
│   ├─ Theme Provider
│   ├─ Query Client Provider
│   └─ Metadata
│
├── page.tsx                   # Home page (/)
│   └─ Landing/welcome screen
│
├── login/
│   └── page.tsx               # Login page (/login)
│       ├─ Email/password form
│       ├─ Remember me checkbox
│       └─ Link to register
│
├── register/
│   └── page.tsx               # Register page (/register)
│       ├─ Email/password/name form
│       └─ Link to login
│
└── notes/
    └── page.tsx               # Notes dashboard (/notes)
        ├─ requireAuth check
        ├─ Sidebar
        ├─ SearchBar
        ├─ NotesList
        └─ NoteEditor
```

**Route Mapping:**
- `/` → `app/page.tsx` (Home)
- `/login` → `app/login/page.tsx` (Login)
- `/register` → `app/register/page.tsx` (Register)
- `/notes` → `app/notes/page.tsx` (Notes Dashboard)

---

## Component Architecture

### Layout Hierarchy

```
app/layout.tsx (Root Layout)
├─ Providers (Query Client, Theme)
├─ Global styles
└─ {children} (Page content)
    │
    ├─ app/page.tsx (Home)
    │
    ├─ app/login/page.tsx (Login)
    │   └─ LoginForm component
    │
    ├─ app/register/page.tsx (Register)
    │   └─ RegisterForm component
    │
    └─ app/notes/page.tsx (Notes Dashboard)
        ├─ Sidebar
        │   ├─ User info
        │   ├─ Theme toggle
        │   └─ Filter options
        ├─ SearchBar
        │   ├─ Search input
        │   ├─ Tag filter
        │   └─ Sort dropdown
        ├─ NotesList
        │   └─ NoteCard (multiple)
        │       ├─ Title
        │       ├─ Preview
        │       ├─ Tags
        │       ├─ Timestamp
        │       └─ Actions (pin, favorite, delete)
        └─ NoteEditor
            ├─ Title input
            ├─ Content textarea
            ├─ Color picker
            ├─ Tag input
            └─ Save/Cancel buttons
```

---

## Offline-First Strategy

### Data Flow with IndexedDB

```
User Action (e.g., Create Note)
    ↓
1. Component Event Handler
   └─ onClick, onSubmit, etc.
    ↓
2. Optimistic Update (Instant UI feedback)
   ├─ Update local React state
   ├─ Write to IndexedDB immediately
   │   └─ db.notes.add({ title, content, ... })
   └─ UI reflects change (<100ms)
    ↓
3. API Call (Background sync)
   ├─ TanStack Query mutation
   │   └─ axios.post('/api/notes', data)
   ├─ Request sent to backend
   └─ If offline: Queue for retry
    ↓
4. Backend Processing
   ├─ Validate data
   ├─ Save to PostgreSQL
   └─ Return response
    ↓
5. Response Handling
   ├─ If success:
   │   ├─ Update IndexedDB with server data
   │   │   └─ db.notes.put(serverNote)
   │   └─ React Query invalidates cache
   │       └─ Refetch to ensure consistency
   └─ If error:
       ├─ Revert optimistic update
       ├─ Show error message
       └─ Keep local data for retry
```

**Key Benefits:**
- ⚡ **Instant feedback**: UI updates immediately
- 📡 **Offline support**: Works without network
- 🔄 **Auto-sync**: Syncs when connection restored
- 💾 **Data persistence**: Survives page refresh
- 🎯 **Consistency**: Server is source of truth

---

## State Management

### 1. Server State (TanStack Query)

**Purpose:** Manage API data, caching, and synchronization

```typescript
// lib/api.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// Fetch notes
export function useNotes() {
  return useQuery({
    queryKey: ['notes'],
    queryFn: async () => {
      const response = await api.get('/api/notes');
      return response.data.data;
    },
    staleTime: 5 * 60 * 1000,  // 5 minutes
    gcTime: 10 * 60 * 1000,    // 10 minutes (formerly cacheTime)
  });
}

// Create note
export function useCreateNote() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (noteData) => {
      const response = await api.post('/api/notes', noteData);
      return response.data.data;
    },
    onMutate: async (newNote) => {
      // Optimistic update
      await queryClient.cancelQueries({ queryKey: ['notes'] });
      
      const previousNotes = queryClient.getQueryData(['notes']);
      
      queryClient.setQueryData(['notes'], (old) => [
        ...(old || []),
        { id: 'temp-id', ...newNote, createdAt: new Date() }
      ]);
      
      return { previousNotes };
    },
    onError: (err, newNote, context) => {
      // Revert on error
      queryClient.setQueryData(['notes'], context.previousNotes);
    },
    onSuccess: () => {
      // Refetch to get server data
      queryClient.invalidateQueries({ queryKey: ['notes'] });
    }
  });
}
```

**Query Client Configuration:**
```typescript
// app/providers.tsx
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1 * 60 * 1000,      // Data fresh for 1 minute
      gcTime: 5 * 60 * 1000,          // Cache for 5 minutes
      retry: 3,                        // Retry failed requests 3 times
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      refetchOnWindowFocus: true,     // Refetch on tab focus
      refetchOnReconnect: true,       // Refetch when back online
    },
  },
});
```

---

### 2. Local State (React useState/useReducer)

**Purpose:** Component-specific UI state

```typescript
// components/NoteEditor.tsx
export function NoteEditor() {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [color, setColor] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  
  return (
    <div className="note-editor">
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Note title"
      />
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Note content"
      />
      {/* ... */}
    </div>
  );
}
```

**When to use:**
- Form inputs
- Modal open/close state
- Dropdown expanded state
- Temporary UI state

---

### 3. Theme State (Context API)

**Purpose:** Global theme (dark/light) across app

```typescript
// context/ThemeContext.tsx
export const ThemeContext = createContext({
  theme: 'light',
  toggleTheme: () => {}
});

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    // Load from localStorage
    return localStorage.getItem('theme') || 'light';
  });
  
  const toggleTheme = useCallback(() => {
    setTheme((prev) => {
      const next = prev === 'light' ? 'dark' : 'light';
      localStorage.setItem('theme', next);
      document.documentElement.classList.toggle('dark');
      return next;
    });
  }, []);
  
  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

// Usage in components
function Sidebar() {
  const { theme, toggleTheme } = useContext(ThemeContext);
  
  return (
    <button onClick={toggleTheme}>
      {theme === 'light' ? '🌙' : '☀️'}
    </button>
  );
}
```

---

### 4. IndexedDB Cache (Dexie)

**Purpose:** Persistent offline storage

```typescript
// lib/db.ts
import Dexie, { type Table } from 'dexie';

interface Note {
  id: string;
  title: string;
  content: string;
  tags: string[];
  color?: string;
  isPinned: boolean;
  isFavorite: boolean;
  isArchived: boolean;
  isTrashed: boolean;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

class NotesDatabase extends Dexie {
  notes!: Table<Note>;
  users!: Table<User>;
  
  constructor() {
    super('notesDatabase');
    this.version(1).stores({
      notes: 'id, userId, title, isPinned, isFavorite, isTrashed, updatedAt',
      users: 'id, email'
    });
  }
}

export const db = new NotesDatabase();

// Usage in components
export async function syncNotesToIndexedDB(notes: Note[]) {
  await db.notes.bulkPut(notes);
}

export async function getNotesFromIndexedDB(userId: string) {
  return db.notes
    .where('userId').equals(userId)
    .and(note => !note.isTrashed)
    .sortBy('updatedAt');
}
```

**IndexedDB Tables:**
- `notes` - All user notes (synced from server)
- `users` - Current user info
- `syncQueue` (future) - Pending sync operations

---

## Data Flow Patterns

### Pattern 1: Query → Display

```typescript
// Fetch and display notes
function NotesList() {
  const { data: notes, isLoading, error } = useNotes();
  
  if (isLoading) return <Spinner />;
  if (error) return <ErrorMessage error={error} />;
  
  return (
    <div className="notes-grid">
      {notes.map(note => (
        <NoteCard key={note.id} note={note} />
      ))}
    </div>
  );
}
```

### Pattern 2: Mutation → Invalidate → Refetch

```typescript
// Create note with automatic refetch
function CreateNoteButton() {
  const createNote = useCreateNote();
  
  const handleCreate = async () => {
    await createNote.mutateAsync({
      title: 'New Note',
      content: ''
    });
    // TanStack Query automatically refetches notes
  };
  
  return (
    <button onClick={handleCreate} disabled={createNote.isPending}>
      {createNote.isPending ? 'Creating...' : 'New Note'}
    </button>
  );
}
```

### Pattern 3: Optimistic Update

```typescript
// Update note with optimistic UI
function UpdateNoteButton({ noteId, updates }) {
  const updateNote = useUpdateNote();
  
  const handleUpdate = async () => {
    await updateNote.mutateAsync({ id: noteId, ...updates });
  };
  
  return <button onClick={handleUpdate}>Update</button>;
}

function useUpdateNote() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, ...updates }) => 
      api.put(`/api/notes/${id}`, updates),
    
    onMutate: async ({ id, ...updates }) => {
      await queryClient.cancelQueries({ queryKey: ['notes'] });
      
      const previous = queryClient.getQueryData(['notes']);
      
      // Optimistically update
      queryClient.setQueryData(['notes'], (old) => 
        old.map(note => 
          note.id === id ? { ...note, ...updates } : note
        )
      );
      
      return { previous };
    },
    
    onError: (err, variables, context) => {
      // Rollback on error
      queryClient.setQueryData(['notes'], context.previous);
    },
    
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['notes'] });
    }
  });
}
```

---

## Performance Optimization

### 1. Code Splitting

```typescript
// Lazy load heavy components
import dynamic from 'next/dynamic';

const MetricsDashboard = dynamic(() => import('@/components/MetricsDashboard'), {
  loading: () => <Spinner />,
  ssr: false  // Client-side only
});

const ColorPicker = dynamic(() => import('@/components/ColorPicker'));
```

### 2. React Query Caching

```typescript
// Aggressive caching for rarely-changing data
useQuery({
  queryKey: ['user', 'me'],
  queryFn: fetchCurrentUser,
  staleTime: Infinity,  // Never refetch automatically
  gcTime: Infinity,     // Keep in cache forever
});

// Short-lived cache for frequently-changing data
useQuery({
  queryKey: ['notes'],
  queryFn: fetchNotes,
  staleTime: 1 * 60 * 1000,  // 1 minute
  gcTime: 5 * 60 * 1000,     // 5 minutes
});
```

### 3. IndexedDB Caching

```typescript
// Initial page load: Read from IndexedDB (fast)
useEffect(() => {
  db.notes.toArray().then(setNotes);
}, []);

// Background: Fetch from API (slower)
useQuery({
  queryKey: ['notes'],
  queryFn: fetchNotes,
  onSuccess: (apiNotes) => {
    db.notes.bulkPut(apiNotes);  // Update cache
  }
});
```

### 4. Memoization

```typescript
// Memoize expensive computations
const filteredNotes = useMemo(() => {
  return notes.filter(note => {
    const matchesSearch = note.title.toLowerCase().includes(search.toLowerCase());
    const matchesTags = selectedTags.length === 0 || 
      selectedTags.some(tag => note.tags.includes(tag));
    return matchesSearch && matchesTags && !note.isTrashed;
  });
}, [notes, search, selectedTags]);

// Memoize callbacks
const handleSearch = useCallback((value: string) => {
  setSearch(value);
}, []);
```

---

## Error Handling

### API Error Boundaries

```typescript
// Global error boundary
export function ErrorBoundary({ children }) {
  return (
    <QueryErrorResetBoundary>
      {({ reset }) => (
        <ReactErrorBoundary
          onReset={reset}
          fallbackRender={({ error, resetErrorBoundary }) => (
            <div className="error-container">
              <h2>Something went wrong</h2>
              <p>{error.message}</p>
              <button onClick={resetErrorBoundary}>Try again</button>
            </div>
          )}
        >
          {children}
        </ReactErrorBoundary>
      )}
    </QueryErrorResetBoundary>
  );
}
```

### Query Error Handling

```typescript
const { data, error, isError } = useQuery({
  queryKey: ['notes'],
  queryFn: fetchNotes,
  retry: (failureCount, error) => {
    // Don't retry on 4xx errors
    if (error.response?.status >= 400 && error.response?.status < 500) {
      return false;
    }
    return failureCount < 3;
  },
});

if (isError) {
  return <ErrorMessage error={error} />;
}
```

---

## TypeScript Integration

### Type-Safe API Client

```typescript
// types/api.ts
export interface Note {
  id: string;
  title: string;
  content: string;
  tags: string[];
  color?: string;
  isPinned: boolean;
  isFavorite: boolean;
  isArchived: boolean;
  isTrashed: boolean;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: string;
}

// lib/api.ts
export async function fetchNotes(): Promise<Note[]> {
  const response = await api.get<ApiResponse<Note[]>>('/api/notes');
  return response.data.data;
}
```

---

**Last Updated**: December 13, 2025  
**Architecture Version**: 1.0
