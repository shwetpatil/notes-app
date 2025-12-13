# Frontend Performance Optimization

**Notes Application Frontend Performance Guide**  
**Last Updated**: December 13, 2025

---

## Performance Goals

### Target Metrics

| Metric | Target | Current | Status |
|--------|--------|---------|--------|
| **First Contentful Paint (FCP)** | < 1.8s | ~1.2s | ✅ Good |
| **Largest Contentful Paint (LCP)** | < 2.5s | ~1.8s | ✅ Good |
| **Time to Interactive (TTI)** | < 3.8s | ~2.5s | ✅ Good |
| **Cumulative Layout Shift (CLS)** | < 0.1 | ~0.05 | ✅ Good |
| **First Input Delay (FID)** | < 100ms | ~50ms | ✅ Good |
| **Total Blocking Time (TBT)** | < 300ms | ~150ms | ✅ Good |

### Performance Budget

| Resource | Budget | Current |
|----------|--------|---------|
| **JavaScript** | < 200KB | ~180KB |
| **CSS** | < 50KB | ~35KB |
| **Images** | < 500KB | ~300KB |
| **Fonts** | < 100KB | ~80KB |
| **Total Page Weight** | < 1MB | ~700KB |

---

## 1. Bundle Optimization

### Bundle Analysis

**View bundle composition:**
```bash
# Analyze production bundle
ANALYZE=true pnpm build

# Opens interactive bundle analyzer at http://localhost:8888
```

### Code Splitting Strategies

#### 1. Route-Based Splitting (Automatic)
```typescript
// Next.js automatically splits by route
app/
├── notes/page.tsx           # Separate chunk
├── templates/page.tsx       # Separate chunk
└── login/page.tsx           # Separate chunk
```

#### 2. Component-Based Splitting (Manual)
```typescript
import dynamic from 'next/dynamic';

// Lazy load heavy components
const NoteEditor = dynamic(() => import('@/components/NoteEditor'), {
  loading: () => <EditorSkeleton />,
  ssr: false // Disable SSR for client-only components
});

// Lazy load with named export
const RichTextEditor = dynamic(
  () => import('@tiptap/react').then(mod => mod.Editor),
  { ssr: false }
);
```

#### 3. Third-Party Library Splitting
```typescript
// Load analytics only when needed
const loadAnalytics = async () => {
  const analytics = await import('./lib/analytics');
  analytics.init();
};

// Load on user interaction
button.addEventListener('click', () => {
  loadAnalytics();
});
```

### Tree Shaking

**Ensure proper imports:**
```typescript
// ❌ Bad - imports entire library
import _ from 'lodash';

// ✅ Good - imports only what's needed
import debounce from 'lodash/debounce';
import throttle from 'lodash/throttle';

// ✅ Better - use ES modules
import { debounce, throttle } from 'lodash-es';
```

### Webpack Configuration

**Optimize production build** (`next.config.ts`):
```typescript
const config = {
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Remove server-only code from client bundle
      config.resolve.alias = {
        ...config.resolve.alias,
        '@prisma/client': false,
        'pg': false
      };
    }
    
    // Enable SWC minification
    config.optimization = {
      ...config.optimization,
      minimize: true,
      splitChunks: {
        chunks: 'all',
        cacheGroups: {
          default: false,
          vendors: false,
          // Framework chunk
          framework: {
            name: 'framework',
            chunks: 'all',
            test: /[\\/]node_modules[\\/](react|react-dom|scheduler|prop-types)[\\/]/,
            priority: 40,
            enforce: true
          },
          // Commons chunk
          commons: {
            name: 'commons',
            minChunks: 2,
            priority: 20
          },
          // Lib chunk
          lib: {
            test: /[\\/]node_modules[\\/]/,
            name: 'lib',
            priority: 30,
            minChunks: 1,
            reuseExistingChunk: true
          }
        }
      }
    };
    
    return config;
  }
};
```

---

## 2. React Performance

### Memoization

#### React.memo for Components
```typescript
// Prevent re-renders when props don't change
const NoteCard = React.memo(({ note, onEdit, onDelete }) => {
  return (
    <div className="note-card">
      <h3>{note.title}</h3>
      <p>{note.content}</p>
    </div>
  );
}, (prevProps, nextProps) => {
  // Custom comparison function
  return prevProps.note.id === nextProps.note.id &&
         prevProps.note.updatedAt === nextProps.note.updatedAt;
});
```

#### useMemo for Expensive Computations
```typescript
const filteredNotes = useMemo(() => {
  return notes.filter(note => {
    const matchesSearch = note.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTag = selectedTags.length === 0 || 
                      note.tags.some(tag => selectedTags.includes(tag));
    return matchesSearch && matchesTag;
  });
}, [notes, searchQuery, selectedTags]);
```

#### useCallback for Function References
```typescript
const handleNoteUpdate = useCallback((noteId: string, updates: Partial<Note>) => {
  updateNoteMutation.mutate({ noteId, updates });
}, [updateNoteMutation]);

// Pass stable reference to child components
<NoteCard note={note} onUpdate={handleNoteUpdate} />
```

### Virtual Scrolling

**For large lists** (using react-window):
```typescript
import { FixedSizeList as List } from 'react-window';

function NotesList({ notes }) {
  const Row = ({ index, style }) => (
    <div style={style}>
      <NoteCard note={notes[index]} />
    </div>
  );

  return (
    <List
      height={600}
      itemCount={notes.length}
      itemSize={120}
      width="100%"
    >
      {Row}
    </List>
  );
}
```

### Debouncing and Throttling

```typescript
import { useDebouncedCallback } from 'use-debounce';

// Debounce search input (wait for user to stop typing)
const debouncedSearch = useDebouncedCallback(
  (query: string) => {
    setSearchQuery(query);
  },
  300 // 300ms delay
);

// Throttle scroll handler (limit frequency)
const throttledScroll = useThrottledCallback(
  () => {
    handleInfiniteScroll();
  },
  200 // Maximum once per 200ms
);
```

### Lazy Loading Images

```typescript
import Image from 'next/image';

// Next.js Image component (automatic optimization)
<Image
  src="/note-thumbnail.jpg"
  alt="Note thumbnail"
  width={300}
  height={200}
  loading="lazy"
  placeholder="blur"
  blurDataURL="data:image/jpeg;base64,..."
/>

// Native lazy loading
<img 
  src="/image.jpg" 
  loading="lazy" 
  decoding="async"
  alt="Description"
/>
```

---

## 3. Network Performance

### API Request Optimization

#### Request Deduplication
```typescript
// TanStack Query automatically deduplicates
const { data } = useQuery({
  queryKey: ['notes'],
  queryFn: fetchNotes,
  staleTime: 5 * 60 * 1000, // Cache for 5 minutes
});

// Multiple components can use same query without duplicate requests
```

#### Parallel Requests
```typescript
// Fetch multiple resources in parallel
const [notesQuery, tagsQuery, foldersQuery] = useQueries({
  queries: [
    { queryKey: ['notes'], queryFn: fetchNotes },
    { queryKey: ['tags'], queryFn: fetchTags },
    { queryKey: ['folders'], queryFn: fetchFolders }
  ]
});
```

#### Request Cancellation
```typescript
useEffect(() => {
  const controller = new AbortController();
  
  api.get('/api/notes', {
    signal: controller.signal
  }).then(handleResponse);
  
  // Cancel on unmount
  return () => controller.abort();
}, []);
```

### Prefetching

#### Link Prefetching
```typescript
import Link from 'next/link';

// Prefetch on hover
<Link href="/notes" prefetch>
  <a>View Notes</a>
</Link>

// Manual prefetch
const router = useRouter();
router.prefetch('/notes');
```

#### Data Prefetching
```typescript
// Prefetch data on hover
const queryClient = useQueryClient();

<div
  onMouseEnter={() => {
    queryClient.prefetchQuery({
      queryKey: ['note', noteId],
      queryFn: () => fetchNote(noteId)
    });
  }}
>
  <Link href={`/notes/${noteId}`}>View Note</Link>
</div>
```

### HTTP/2 Server Push

**Configured in deployment:**
```nginx
# nginx.conf
http2_push /main.css;
http2_push /main.js;
http2_push /fonts/inter.woff2;
```

---

## 4. Caching Strategies

### Service Worker Caching (PWA)

**Cache static assets:**
```typescript
// public/sw.js (generated by next-pwa)
self.addEventListener('fetch', (event) => {
  if (event.request.url.includes('/api/')) {
    // Network-first for API calls
    event.respondWith(
      fetch(event.request).catch(() => caches.match(event.request))
    );
  } else {
    // Cache-first for static assets
    event.respondWith(
      caches.match(event.request).then(response => 
        response || fetch(event.request)
      )
    );
  }
});
```

### IndexedDB Caching

**Offline-first data:**
```typescript
// Read from IndexedDB first
const getCachedNotes = async () => {
  const cachedNotes = await db.notes.toArray();
  
  if (cachedNotes.length > 0) {
    return cachedNotes; // Return immediately
  }
  
  // Fetch from API in background
  const apiNotes = await fetchNotesFromAPI();
  await db.notes.bulkPut(apiNotes);
  return apiNotes;
};
```

### TanStack Query Caching

**Intelligent cache management:**
```typescript
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,      // 5 min before refetch
      gcTime: 10 * 60 * 1000,         // 10 min before garbage collection
      retry: 3,                       // Retry failed requests 3 times
      refetchOnWindowFocus: false,    // Don't refetch on focus
      refetchOnReconnect: true        // Refetch when back online
    }
  }
});
```

---

## 5. Rendering Performance

### Server-Side Rendering (SSR)

**Static pages:**
```typescript
// app/page.tsx - Statically generated at build time
export default function LandingPage() {
  return <LandingContent />;
}
```

**Dynamic pages with ISR:**
```typescript
// Incremental Static Regeneration
export const revalidate = 60; // Revalidate every 60 seconds

export default async function NotesPage() {
  const notes = await fetchNotes();
  return <NotesList notes={notes} />;
}
```

### Streaming SSR

```typescript
import { Suspense } from 'react';

export default function Page() {
  return (
    <div>
      <Header /> {/* Rendered immediately */}
      
      <Suspense fallback={<NotesSkeleton />}>
        <Notes /> {/* Streams when ready */}
      </Suspense>
      
      <Suspense fallback={<SidebarSkeleton />}>
        <Sidebar /> {/* Streams independently */}
      </Suspense>
    </div>
  );
}
```

### Critical CSS

**Inline critical CSS:**
```typescript
// next.config.ts
const config = {
  experimental: {
    optimizeCss: true, // Optimize CSS delivery
  }
};
```

---

## 6. Asset Optimization

### Image Optimization

**Next.js Image component:**
```typescript
import Image from 'next/image';

<Image
  src="/hero.jpg"
  alt="Hero"
  width={1200}
  height={600}
  priority // Load immediately (above fold)
  quality={85}
  formats={['webp', 'avif']}
/>
```

**Image formats:**
- AVIF: Best compression (~50% smaller than JPEG)
- WebP: Good compression (~30% smaller than JPEG)
- JPEG: Fallback for older browsers

### Font Optimization

**Self-hosted fonts with next/font:**
```typescript
import { Inter } from 'next/font/google';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap', // Avoid FOIT (Flash of Invisible Text)
  preload: true,
  fallback: ['system-ui', 'arial']
});

export default function RootLayout({ children }) {
  return (
    <html className={inter.className}>
      <body>{children}</body>
    </html>
  );
}
```

**Font subsetting:**
```typescript
const inter = Inter({
  subsets: ['latin'], // Only load Latin characters
  weight: ['400', '600', '700'], // Only load needed weights
});
```

### Icon Optimization

**Use SVG sprites:**
```typescript
// Create sprite sheet
<svg style={{ display: 'none' }}>
  <symbol id="icon-edit" viewBox="0 0 24 24">
    <path d="..." />
  </symbol>
  <symbol id="icon-delete" viewBox="0 0 24 24">
    <path d="..." />
  </symbol>
</svg>

// Use icons
<svg><use href="#icon-edit" /></svg>
```

---

## 7. JavaScript Performance

### Reduce Main Thread Work

**Offload to Web Workers:**
```typescript
// worker.ts
self.onmessage = (e) => {
  const { notes, query } = e.data;
  
  // Heavy computation in worker
  const results = notes.filter(note => 
    note.content.includes(query)
  );
  
  self.postMessage(results);
};

// main thread
const worker = new Worker('/worker.js');
worker.postMessage({ notes, query });
worker.onmessage = (e) => {
  setSearchResults(e.data);
};
```

### Minimize Re-renders

**React DevTools Profiler:**
```typescript
// Wrap component to profile
<Profiler id="NotesList" onRender={onRenderCallback}>
  <NotesList />
</Profiler>

function onRenderCallback(
  id, phase, actualDuration, baseDuration, startTime, commitTime
) {
  console.log(`${id} took ${actualDuration}ms to render`);
}
```

---

## 8. Monitoring & Measurement

### Web Vitals Tracking

**Real User Monitoring (RUM):**
```typescript
// lib/monitoring.ts
import { getCLS, getFID, getLCP } from 'web-vitals';

export function reportWebVitals() {
  getCLS((metric) => sendToAnalytics(metric));
  getFID((metric) => sendToAnalytics(metric));
  getLCP((metric) => sendToAnalytics(metric));
}

function sendToAnalytics(metric) {
  const body = JSON.stringify(metric);
  const url = '/api/metrics/vitals';
  
  if (navigator.sendBeacon) {
    navigator.sendBeacon(url, body);
  } else {
    fetch(url, { body, method: 'POST', keepalive: true });
  }
}
```

### Custom Performance Marks

```typescript
// Mark important events
performance.mark('notes-fetch-start');
const notes = await fetchNotes();
performance.mark('notes-fetch-end');

// Measure duration
performance.measure(
  'notes-fetch',
  'notes-fetch-start',
  'notes-fetch-end'
);

const measure = performance.getEntriesByName('notes-fetch')[0];
console.log(`Fetch took ${measure.duration}ms`);
```

### Bundle Size Monitoring

```bash
# Check bundle size after each build
pnpm build

# Output example:
# Route (app)                              Size     First Load JS
# ┌ ○ /                                    5.2 kB          87 kB
# ├ ○ /login                               3.1 kB          85 kB
# └ ○ /notes                               12 kB           94 kB
```

---

## 9. Performance Checklist

### Build Time

- [x] Code splitting enabled
- [x] Tree shaking working
- [x] Unused code eliminated
- [x] Bundle size < 200KB
- [x] CSS optimized and purged
- [x] Images compressed
- [x] Fonts subsetted

### Runtime

- [x] Components memoized where needed
- [x] Expensive computations cached
- [x] Virtual scrolling for long lists
- [x] Debounced user inputs
- [x] Lazy loaded heavy components
- [x] Images lazy loaded
- [x] API requests deduplicated

### Network

- [x] HTTP/2 enabled
- [x] Compression enabled (gzip/brotli)
- [x] CDN configured
- [x] Cache headers set
- [x] Prefetching implemented
- [x] Service Worker caching

### Rendering

- [x] Critical CSS inlined
- [x] Fonts optimized
- [x] Above-fold content prioritized
- [x] Layout shifts minimized
- [x] Suspense boundaries added

---

## 10. Performance Budget Enforcement

### CI/CD Integration

**Lighthouse CI:**
```yaml
# .github/workflows/lighthouse.yml
- name: Run Lighthouse CI
  run: |
    npm install -g @lhci/cli
    lhci autorun
```

**Lighthouse config:**
```json
{
  "ci": {
    "assert": {
      "assertions": {
        "first-contentful-paint": ["error", { "maxNumericValue": 1800 }],
        "largest-contentful-paint": ["error", { "maxNumericValue": 2500 }],
        "cumulative-layout-shift": ["error", { "maxNumericValue": 0.1 }],
        "total-blocking-time": ["error", { "maxNumericValue": 300 }]
      }
    }
  }
}
```

---

## Conclusion

### Key Takeaways

1. **Measure First** - Use profiling tools before optimizing
2. **Bundle Size Matters** - Keep JavaScript < 200KB
3. **Cache Aggressively** - IndexedDB + Service Worker + TanStack Query
4. **Optimize Images** - Next.js Image + WebP/AVIF
5. **Lazy Load** - Don't load what you don't need
6. **Memoize** - Prevent unnecessary re-renders
7. **Monitor Always** - Track Web Vitals in production

### Resources

- [Next.js Performance](https://nextjs.org/docs/app/building-your-application/optimizing)
- [React Performance](https://react.dev/learn/render-and-commit)
- [Web Vitals](https://web.dev/vitals/)
- [Lighthouse](https://developers.google.com/web/tools/lighthouse)

Performance is a feature, not an afterthought! 🚀
