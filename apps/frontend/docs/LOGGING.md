# Frontend Logging Guide

## Overview

The frontend uses **Consola** for elegant, structured logging with support for both client-side and server-side (Next.js).

### Features

- 🎨 **Color-coded output** by log level
- 📊 **Structured logging** with context
- 🚀 **High performance** - minimal overhead
- 🏷️ **Tagged loggers** for modules
- 🔍 **TypeScript support**
- 🌐 **Universal** - works in browser and Node.js

## Installation

Already installed! Consola is configured in `@/lib/logger.ts`

## Basic Usage

```typescript
import { logger } from '@/lib/logger';

// Info level (general information)
logger.info('User logged in');

// Success level (positive actions)
logger.success('Note saved successfully');

// Debug level (development debugging)
logger.debug({ noteId: '123', userId: 'abc' }, 'Loading note');

// Warning level (non-critical issues)
logger.warn('Slow network detected');

// Error level (errors that need attention)
logger.error('Failed to save note', error);

// Fatal level (critical failures)
logger.fatal('Application crashed', error);
```

## Tagged Loggers

Create module-specific loggers:

```typescript
import { createLogger } from '@/lib/logger';

// Component-specific logger
const logger = createLogger('NoteEditor');

logger.info('Component mounted');
logger.debug({ noteId: '123' }, 'Loaded note data');
logger.success('Note saved');
```

## Pre-configured Loggers

```typescript
import { 
  apiLogger,      // API requests
  componentLogger, // Component lifecycle
  stateLogger,    // State management
  perfLogger      // Performance tracking
} from '@/lib/logger';

// API logging
apiLogger.info('Fetching notes');

// Component logging
componentLogger.debug('NoteEditor mounted');

// State logging
stateLogger.debug({ notes: 5 }, 'Notes updated');

// Performance logging
perfLogger.warn('Slow render detected', { duration: '150ms' });
```

## Helper Functions

### API Request Logging

```typescript
import { logApiRequest } from '@/lib/logger';

const startTime = Date.now();
try {
  const response = await fetch('/api/notes');
  logApiRequest('GET', '/api/notes', response.status, Date.now() - startTime);
} catch (error) {
  logApiRequest('GET', '/api/notes', 500, Date.now() - startTime, error);
}
```

**Automatic behavior:**
- ✅ Success (2xx): `DEBUG` level
- ⚠️ Client errors (4xx): `WARN` level
- ❌ Server errors (5xx): `ERROR` level
- 🐌 Slow requests (>1s): `WARN` level

### Component Lifecycle Logging

```typescript
import { logComponentLifecycle } from '@/lib/logger';

function MyComponent() {
  useEffect(() => {
    logComponentLifecycle('MyComponent', 'mounted');
    
    return () => {
      logComponentLifecycle('MyComponent', 'unmounted');
    };
  }, []);
  
  return <div>Hello</div>;
}
```

### Performance Logging

```typescript
import { logPerformance } from '@/lib/logger';

function ExpensiveOperation() {
  const startTime = performance.now();
  
  // ... do work
  
  logPerformance('data-processing', performance.now() - startTime);
}
```

**Automatic warnings for slow operations (>100ms)**

### Error Logging

```typescript
import { logError } from '@/lib/logger';

try {
  await saveNote(note);
} catch (error) {
  // Production-safe error logging
  logError('Failed to save note', error, { 
    noteId: note.id,
    userId: user.id 
  });
}
```

**Development vs Production:**
- **Development**: Full error details with stack traces
- **Production**: Sanitized error info (no sensitive data)

## React Component Examples

### Basic Component

```tsx
'use client';

import { useEffect } from 'react';
import { createLogger } from '@/lib/logger';

const logger = createLogger('MyComponent');

export function MyComponent() {
  useEffect(() => {
    logger.info('Component mounted');
    
    return () => {
      logger.debug('Component unmounted');
    };
  }, []);
  
  const handleClick = () => {
    logger.debug('Button clicked');
    // ... handle click
  };
  
  return <button onClick={handleClick}>Click me</button>;
}
```

### API Interaction

```tsx
'use client';

import { useState } from 'react';
import { apiLogger, logError } from '@/lib/logger';

export function NotesList() {
  const [notes, setNotes] = useState([]);
  
  const fetchNotes = async () => {
    apiLogger.info('Fetching notes list');
    
    try {
      const response = await fetch('/api/notes');
      const data = await response.json();
      
      setNotes(data);
      apiLogger.success(`Loaded ${data.length} notes`);
    } catch (error) {
      logError('Failed to fetch notes', error);
    }
  };
  
  return <div>{/* ... */}</div>;
}
```

### Form Submission

```tsx
'use client';

import { useState } from 'react';
import { createLogger, logError } from '@/lib/logger';

const logger = createLogger('LoginForm');

export function LoginForm() {
  const [email, setEmail] = useState('');
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    logger.info('Login attempt', { email });
    
    try {
      const response = await authApi.login({ email, password });
      logger.success('Login successful');
      router.push('/notes');
    } catch (error) {
      logError('Login failed', error, { email });
      setError('Invalid credentials');
    }
  };
  
  return <form onSubmit={handleSubmit}>{/* ... */}</form>;
}
```

## Log Levels

| Level | Method | Color | Usage |
|-------|--------|-------|-------|
| **Trace** | `logger.trace()` | Gray | Very detailed debugging |
| **Debug** | `logger.debug()` | Blue | Development debugging |
| **Info** | `logger.info()` | Cyan | General information |
| **Success** | `logger.success()` | Green | Successful operations |
| **Warn** | `logger.warn()` | Yellow | Warnings |
| **Error** | `logger.error()` | Red | Errors |
| **Fatal** | `logger.fatal()` | Red Bold | Critical failures |

## Environment-Specific Behavior

### Development
```typescript
// Logs everything (level 4 = debug and above)
// Colorized output
// Timestamps included
// Full error details
```

### Production
```typescript
// Logs info and above (level 3)
// Compact format
// No colors (for log aggregation)
// Sanitized error messages
```

## Integration Examples

### With React Query

```tsx
import { useMutation } from '@tanstack/react-query';
import { apiLogger, logError } from '@/lib/logger';

const createNoteMutation = useMutation({
  mutationFn: notesApi.create,
  onMutate: (variables) => {
    apiLogger.info('Creating note', { title: variables.title });
  },
  onSuccess: (data) => {
    apiLogger.success('Note created', { id: data.id });
  },
  onError: (error) => {
    logError('Failed to create note', error);
  },
});
```

### With State Management

```tsx
import { stateLogger } from '@/lib/logger';

// Zustand store
const useStore = create((set) => ({
  notes: [],
  addNote: (note) => {
    stateLogger.debug('Adding note to store', { id: note.id });
    set((state) => ({ notes: [...state.notes, note] }));
    stateLogger.success('Note added to store');
  },
}));
```

### With Next.js Server Components

```tsx
// app/notes/page.tsx
import { logger } from '@/lib/logger';

export default async function NotesPage() {
  logger.info('Rendering notes page (server)');
  
  try {
    const notes = await fetchNotes();
    logger.debug(`Fetched ${notes.length} notes`);
    
    return <div>{/* ... */}</div>;
  } catch (error) {
    logger.error('Failed to fetch notes', error);
    return <ErrorPage />;
  }
}
```

## Best Practices

### ✅ Good

```typescript
// Structured logging with context
logger.info('User action completed', { 
  action: 'delete-note',
  noteId: note.id,
  userId: user.id 
});

// Use appropriate log levels
logger.success('Operation succeeded');
logger.warn('Deprecated API used');
logger.error('Operation failed', error);

// Use tagged loggers for clarity
const logger = createLogger('auth');
logger.info('Login attempt');
```

### ❌ Avoid

```typescript
// String concatenation
logger.info(`User ${user.id} deleted note ${note.id}`);

// console.log
console.log('Something happened'); // Use logger instead

// Wrong log level
logger.error('User clicked button'); // Use info or debug

// No context
logger.info('Failed'); // What failed? Add context!
```

## Configuration

Logging behavior is controlled in `src/lib/logger.ts`:

```typescript
export const logger = createConsola({
  level: isDevelopment ? 4 : 3, // 4 = debug, 3 = info
  formatOptions: {
    colors: isDevelopment,        // Colors in dev only
    date: isDevelopment,          // Timestamps in dev only
    compact: isProduction,        // Compact in production
  },
});
```

## Console Output Examples

### Development
```
[12:34:56] ℹ [api] Fetching notes
[12:34:56] ✔ [api] Loaded 10 notes
[12:34:57] ⚠ [perf] Slow operation: data-processing
           duration: "150.25ms"
[12:34:58] ✖ [component] Failed to mount
           error: TypeError: Cannot read property...
```

### Production
```
[api] Fetching notes
[api] Loaded 10 notes
[perf] Slow operation: data-processing
```

## Migration from console.log

```typescript
// Before
console.log('User logged in');
console.error('Error:', error);
console.warn('Slow response');

// After
logger.info('User logged in');
logError('Operation failed', error);
logger.warn('Slow response detected');
```

## Viewing Logs

### Browser DevTools
```
F12 → Console tab
```

### Next.js Server Logs
```bash
pnpm dev
# Server-side logs appear in terminal
```

### Filtering
```javascript
// In browser console:
// Filter by tag
localStorage.setItem('consola', 'api,component');

// Reset filters
localStorage.removeItem('consola');
```

## Integration with Monitoring Services

```typescript
// Add to logger.ts for production monitoring:

if (process.env.NODE_ENV === 'production') {
  // Send to Sentry, LogRocket, etc.
  logger.addReporter({
    log: (logObj) => {
      if (logObj.level >= 3) { // Error and above
        // Sentry.captureMessage(logObj.message, logObj.level);
      }
    }
  });
}
```
