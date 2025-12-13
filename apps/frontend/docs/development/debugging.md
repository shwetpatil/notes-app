# Debugging Guide

**Purpose**: Tools, techniques, and strategies for debugging the notes application frontend.

**Last Updated**: December 13, 2025

---

## Table of Contents

1. [Browser DevTools](#browser-devtools)
2. [React Developer Tools](#react-developer-tools)
3. [Network Debugging](#network-debugging)
4. [State Management](#state-management)
5. [Performance Profiling](#performance-profiling)
6. [IndexedDB Inspection](#indexeddb-inspection)
7. [Service Worker Debugging](#service-worker-debugging)
8. [Common Issues](#common-issues)
9. [Production Debugging](#production-debugging)

---

## Browser DevTools

### Console Debugging

```tsx
// ✅ Structured logging
console.group('User Action');
console.log('Event:', event);
console.log('State:', state);
console.groupEnd();

// ✅ Table format for arrays
console.table(notes);

// ✅ Conditional logging
const DEBUG = process.env.NODE_ENV === 'development';
DEBUG && console.log('Debug info:', data);

// ✅ Performance timing
console.time('fetchNotes');
await fetchNotes();
console.timeEnd('fetchNotes'); // fetchNotes: 145ms
```

### Breakpoints

```tsx
// 1. Add debugger statement
const handleSubmit = () => {
  debugger; // Execution pauses here
  submitForm(data);
};

// 2. Or use Sources panel in DevTools
// - Navigate to file
// - Click line number to add breakpoint
// - Refresh page to trigger
```

### Network Tab

```
1. Open DevTools → Network tab
2. Filter by Fetch/XHR
3. Click request to see:
   - Request headers
   - Response body
   - Timing breakdown
```

---

## React Developer Tools

### Installation

```bash
# Chrome/Edge
https://chrome.google.com/webstore (search "React Developer Tools")

# Firefox
https://addons.mozilla.org/en-US/firefox/ (search "React Developer Tools")
```

### Components Tab

**Inspect Component Tree**:
```
1. Open DevTools → Components tab
2. Select component in tree
3. Right panel shows:
   - Props
   - State
   - Hooks
   - Rendered by
```

**Edit Props/State in Real-Time**:
```tsx
// 1. Select component
// 2. Right panel: double-click prop/state value
// 3. Edit and press Enter
// 4. Component re-renders with new value
```

**Search Components**:
```
1. Click search icon (🔍)
2. Type component name or prop value
3. Results highlight matching components
```

### Profiler Tab

**Record Performance**:
```
1. Open DevTools → Profiler tab
2. Click record button (⚫)
3. Interact with app
4. Click stop button (⬛)
5. View flame graph of renders
```

**Analyze Renders**:
- **Yellow bars**: Slow renders (>12ms)
- **Blue bars**: Fast renders
- **Click bar**: See why component rendered
- **Ranked tab**: Components by render time

---

## Network Debugging

### API Requests

```tsx
// Add request interceptor for debugging
import axios from 'axios';

axios.interceptors.request.use(
  (config) => {
    console.log('→ Request:', config.method?.toUpperCase(), config.url);
    return config;
  },
  (error) => {
    console.error('→ Request Error:', error);
    return Promise.reject(error);
  }
);

axios.interceptors.response.use(
  (response) => {
    console.log('← Response:', response.status, response.config.url);
    return response;
  },
  (error) => {
    console.error('← Response Error:', error.response?.status, error.config.url);
    return Promise.reject(error);
  }
);
```

### Simulate Slow Network

```
Chrome DevTools → Network tab:
1. Click throttling dropdown
2. Select "Slow 3G" or "Fast 3G"
3. Test loading states
```

### Simulate Offline Mode

```
Chrome DevTools → Network tab:
1. Check "Offline" checkbox
2. Test offline functionality
3. Uncheck to go back online
```

---

## State Management

### TanStack Query DevTools

```tsx
// Already included in src/app/providers.tsx
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

<ReactQueryDevtools initialIsOpen={false} />
```

**Features**:
- View all queries and their status
- See cached data
- Manually refetch queries
- Clear cache
- Inspect query keys

**Usage**:
```
1. Open app in development mode
2. Click TanStack Query icon (bottom-left)
3. Explore:
   - Active queries (green)
   - Stale queries (yellow)
   - Inactive queries (gray)
4. Click query to see:
   - Query key
   - Cached data
   - Last updated
   - Stale time remaining
```

### Context Debugging

```tsx
// Add debug logging to context
export const ThemeProvider = ({ children }: Props) => {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  
  // Debug: Log theme changes
  useEffect(() => {
    console.log('Theme changed:', theme);
  }, [theme]);
  
  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};
```

### Redux DevTools (If Using Redux)

```tsx
// Install extension and configure
import { configureStore } from '@reduxjs/toolkit';

const store = configureStore({
  reducer: rootReducer,
  devTools: process.env.NODE_ENV !== 'production',
});
```

---

## Performance Profiling

### React Profiler API

```tsx
import { Profiler } from 'react';

const onRenderCallback = (
  id: string,
  phase: 'mount' | 'update',
  actualDuration: number,
  baseDuration: number,
  startTime: number,
  commitTime: number
) => {
  console.log(`${id} (${phase}) took ${actualDuration}ms`);
};

<Profiler id="NotesList" onRender={onRenderCallback}>
  <NotesList />
</Profiler>
```

### Performance API

```tsx
// Mark start and end of operation
performance.mark('render-start');
renderComponent();
performance.mark('render-end');

// Measure duration
performance.measure('render', 'render-start', 'render-end');

// Get all measures
const measures = performance.getEntriesByType('measure');
console.table(measures);
```

### Chrome Performance Tab

```
1. Open DevTools → Performance tab
2. Click record button (⚫)
3. Interact with app (2-5 seconds)
4. Click stop button (⬛)
5. Analyze:
   - Flame graph (what's taking time)
   - Main thread activity
   - Network requests
   - Screenshots of renders
```

**Look for**:
- Long tasks (>50ms)
- Forced reflows/layouts
- JavaScript execution time
- Idle time

---

## IndexedDB Inspection

### Chrome DevTools

```
1. Open DevTools → Application tab
2. Left sidebar: Storage → IndexedDB
3. Expand "notesDB"
4. Select object store (e.g., "notes")
5. View/edit records
```

### Programmatic Inspection

```tsx
// Add to window for debugging
if (process.env.NODE_ENV === 'development') {
  window.__debugDB = {
    async getNotes() {
      const db = await openDB('notesDB', 1);
      return await db.getAll('notes');
    },
    async clearNotes() {
      const db = await openDB('notesDB', 1);
      await db.clear('notes');
      console.log('Notes cleared');
    },
    async addNote(note: Note) {
      const db = await openDB('notesDB', 1);
      await db.add('notes', note);
      console.log('Note added:', note);
    },
  };
}

// Usage in console:
// await window.__debugDB.getNotes()
// await window.__debugDB.clearNotes()
```

---

## Service Worker Debugging

### Inspect Service Worker

```
Chrome: DevTools → Application tab → Service Workers
1. View registered service workers
2. See status (activated, waiting, installing)
3. Click "Update" to force update
4. Check "Update on reload" for development
5. Click "Unregister" to remove
```

### Console Logs from Service Worker

```tsx
// In service worker file
self.addEventListener('fetch', (event) => {
  console.log('[SW] Fetch:', event.request.url);
});

// View logs:
// DevTools → Console → Filter: "SW"
```

### Bypass Service Worker

```
Chrome: DevTools → Network tab
- Check "Disable cache"
- Reload page
```

---

## Common Issues

### Issue: Infinite Render Loop

**Symptom**: Component keeps re-rendering, browser freezes

**Debug**:
```tsx
// Add render counter
let renderCount = 0;
export const Component = () => {
  console.log('Render count:', ++renderCount);
  if (renderCount > 100) {
    debugger; // Pause execution
  }
  // ...
};
```

**Common Causes**:
- State update in render body
- Missing useEffect dependency
- Incorrectly memoized value

**Fix**:
```tsx
// ❌ Bad: State update in render
const Component = () => {
  const [count, setCount] = useState(0);
  setCount(count + 1); // Infinite loop!
  return <div>{count}</div>;
};

// ✅ Good: State update in effect
const Component = () => {
  const [count, setCount] = useState(0);
  useEffect(() => {
    setCount(count + 1);
  }, []); // Run once
  return <div>{count}</div>;
};
```

---

### Issue: Query Not Refetching

**Symptom**: Data doesn't update after mutation

**Debug**:
```tsx
// Check TanStack Query DevTools
// 1. Find query in list
// 2. Check "Last Updated" timestamp
// 3. Check "Stale Time" remaining
```

**Fix**:
```tsx
// Invalidate query after mutation
const mutation = useMutation({
  mutationFn: createNote,
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['notes'] });
  },
});
```

---

### Issue: Hydration Mismatch

**Symptom**: React warning about server/client mismatch

```
Warning: Text content did not match. Server: "..." Client: "..."
```

**Debug**:
```tsx
// Add suppressHydrationWarning to find element
<div suppressHydrationWarning>
  {/* Content causing mismatch */}
</div>
```

**Common Causes**:
- Date.now() or Math.random() in render
- Browser-only APIs (window, localStorage)
- Different data on server vs client

**Fix**:
```tsx
// ❌ Bad: Different on server vs client
<div>{Date.now()}</div>

// ✅ Good: Only render on client
const [mounted, setMounted] = useState(false);
useEffect(() => setMounted(true), []);
if (!mounted) return null;
return <div>{Date.now()}</div>;
```

---

### Issue: Memory Leak

**Symptom**: Browser slows down over time

**Debug**:
```
Chrome: DevTools → Memory tab
1. Take heap snapshot
2. Interact with app
3. Take another snapshot
4. Compare snapshots
5. Look for growing objects
```

**Common Causes**:
- Event listeners not cleaned up
- Timers (setInterval) not cleared
- Large objects in state

**Fix**:
```tsx
// ✅ Clean up in useEffect
useEffect(() => {
  const intervalId = setInterval(() => {
    // Do something
  }, 1000);
  
  return () => {
    clearInterval(intervalId); // Cleanup
  };
}, []);
```

---

## Production Debugging

### Source Maps

```javascript
// next.config.ts
module.exports = {
  productionBrowserSourceMaps: true, // Enable in production
};
```

**Security**: Don't deploy source maps to public servers

### Error Tracking (Sentry)

```tsx
import * as Sentry from '@sentry/nextjs';

// Errors automatically sent to Sentry
// View in Sentry dashboard

// Add context
Sentry.setContext('user', {
  id: userId,
  email: userEmail,
});

// Manually capture
try {
  riskyOperation();
} catch (error) {
  Sentry.captureException(error);
}
```

### Console Logs in Production

```tsx
// ❌ Don't leave console.logs
console.log('Debug info'); // Stripped in production

// ✅ Use logger with levels
import { logger } from '@/lib/logger';

logger.info('User logged in', { userId });
logger.error('API error', { error, endpoint });
```

### Remote Debugging

```tsx
// Use Chrome DevTools for remote devices
// 1. Connect device via USB
// 2. Enable USB debugging (Android)
// 3. Chrome: chrome://inspect
// 4. Select device
```

---

## Debug Helpers

### Custom Hooks

```tsx
// useWhyDidYouUpdate - Debug prop changes
export const useWhyDidYouUpdate = (name: string, props: any) => {
  const previousProps = useRef(props);
  
  useEffect(() => {
    if (previousProps.current) {
      const allKeys = Object.keys({ ...previousProps.current, ...props });
      const changedProps = allKeys.reduce((acc, key) => {
        if (previousProps.current[key] !== props[key]) {
          acc[key] = {
            from: previousProps.current[key],
            to: props[key],
          };
        }
        return acc;
      }, {} as any);
      
      if (Object.keys(changedProps).length > 0) {
        console.log('[why-did-you-update]', name, changedProps);
      }
    }
    
    previousProps.current = props;
  });
};

// Usage
const Component = (props) => {
  useWhyDidYouUpdate('Component', props);
  // ...
};
```

---

## Tools Summary

| Tool | Purpose | Access |
|------|---------|--------|
| Chrome DevTools | General debugging | F12 |
| React DevTools | Component inspection | Extension |
| TanStack Query DevTools | Query debugging | Bundled |
| Network Tab | API requests | DevTools → Network |
| Performance Tab | Profiling | DevTools → Performance |
| Application Tab | Storage, SW | DevTools → Application |
| Sentry | Error tracking | Dashboard |
| Lighthouse | Performance audit | DevTools → Lighthouse |

---

**See Also**:
- [Performance Guide](../system/performance.md)
- [Testing Guide](./testing.md)
- [Component Guidelines](./component-guidelines.md)
