# Logging Quick Reference

## Backend (Pino)

```typescript
import { logger } from './config';

logger.info('Server started');
logger.debug({ userId: '123' }, 'User action');
logger.error({ err: error }, 'Operation failed');
```

**Features:**
- 🚀 High-performance JSON logs
- 🎨 Pretty printing in dev
- 📊 Structured data
- ⚡ Minimal overhead

## Frontend (Consola)

```typescript
import { logger } from '@/lib/logger';

logger.info('Component mounted');
logger.success('Note saved');
logger.error('Failed to save', error);
```

**Features:**
- 🎨 Color-coded output
- 🏷️ Tagged loggers
- 🌐 Browser + Node.js
- 📱 Mobile-friendly

## Log Levels

| Level | Backend | Frontend | Usage |
|-------|---------|----------|-------|
| Trace | `logger.trace()` | `logger.trace()` | Very detailed |
| Debug | `logger.debug()` | `logger.debug()` | Development |
| Info | `logger.info()` | `logger.info()` | General info |
| Success | N/A | `logger.success()` | Success ops |
| Warn | `logger.warn()` | `logger.warn()` | Warnings |
| Error | `logger.error()` | `logger.error()` | Errors |
| Fatal | `logger.fatal()` | `logger.fatal()` | Critical |

## Helper Functions

### Backend

```typescript
import { createChildLogger } from './config';

const authLogger = createChildLogger({ module: 'auth' });
authLogger.info('Login attempt');
```

### Frontend

```typescript
import { 
  logApiRequest,
  logComponentLifecycle,
  logPerformance,
  logError 
} from '@/lib/logger';

// Auto-logs with appropriate level
logApiRequest('GET', '/api/notes', 200, 150);
logComponentLifecycle('MyComponent', 'mounted');
logPerformance('data-processing', 85);
logError('Save failed', error, { noteId: '123' });
```

## Quick Examples

### Backend API Route

```typescript
import { logger } from '../config';

router.post('/api/notes', async (req, res) => {
  logger.info({ userId: req.session.userId }, 'Creating note');
  
  try {
    const note = await createNote(req.body);
    logger.info({ noteId: note.id }, 'Note created');
    res.json({ success: true, note });
  } catch (error) {
    logger.error({ err: error }, 'Failed to create note');
    res.status(500).json({ error: 'Failed to create note' });
  }
});
```

### Frontend Component

```tsx
import { createLogger, logError } from '@/lib/logger';

const logger = createLogger('NoteEditor');

export function NoteEditor() {
  useEffect(() => {
    logger.info('Editor mounted');
    return () => logger.debug('Editor unmounted');
  }, []);
  
  const handleSave = async () => {
    try {
      await saveNote(note);
      logger.success('Note saved');
    } catch (error) {
      logError('Save failed', error, { noteId: note.id });
    }
  };
  
  return <button onClick={handleSave}>Save</button>;
}
```

## Environment Variables

### Backend (.env)
```env
LOG_LEVEL=debug                      # trace|debug|info|warn|error|fatal
ENABLE_PERFORMANCE_LOGGING=true
ENABLE_METRICS_COLLECTION=true
```

### Frontend
No config needed - auto-detects `NODE_ENV`

## Migration Checklist

- [ ] Replace all `console.log` with `logger.info`
- [ ] Replace all `console.error` with `logger.error`
- [ ] Replace all `console.warn` with `logger.warn`
- [ ] Add structured data (objects) to log calls
- [ ] Use appropriate log levels
- [ ] Add context to error logs
- [ ] Create tagged loggers for modules

## Output Examples

### Backend (Development)
```
[12:34:56.789] INFO: ⚡ Backend server running
    port: 3001
    protocol: "http"
[12:34:57.123] DEBUG: 📊 Performance: GET /api/notes
    duration: 45
    rating: "good"
```

### Frontend (Development)
```
[12:34:56] ℹ [api] Fetching notes
[12:34:56] ✔ [api] 🌐 GET /api/notes
           duration: "145ms"
           status: 200
           rating: "good"
[12:34:57] ℹ [component] NoteEditor mounted
```

## Documentation

- **Backend**: `apps/backend/docs/LOGGING.md`
- **Frontend**: `apps/frontend/docs/LOGGING.md`
