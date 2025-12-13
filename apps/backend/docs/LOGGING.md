# Backend Logging Guide

## Overview

The backend now uses **Pino** for high-performance structured logging with the following features:

- 🎨 **Pretty printing** in development with colors
- 📊 **Structured JSON logs** in production
- ⚡ **High performance** - minimal overhead
- 🏷️ **Contextual logging** with child loggers
- 📝 **Multiple log levels** (trace, debug, info, warn, error, fatal)

## Configuration

### Environment Variables

```env
# Set log level (trace, debug, info, warn, error, fatal)
LOG_LEVEL=debug

# Enable performance logging
ENABLE_PERFORMANCE_LOGGING=true

# Enable metrics collection
ENABLE_METRICS_COLLECTION=true
```

## Usage Examples

### Basic Logging

```typescript
import { logger } from './config';

// Info level (general information)
logger.info('Server started successfully');

// Debug level (detailed debugging info)
logger.debug({ userId: '123', action: 'login' }, 'User authentication attempt');

// Warning level (non-critical issues)
logger.warn({ timeout: 5000 }, 'Request timeout threshold reached');

// Error level (errors that need attention)
logger.error({ err: error, userId: '123' }, 'Failed to process request');

// Fatal level (critical errors causing shutdown)
logger.fatal({ err: error }, 'Database connection lost');
```

### Structured Logging

```typescript
// Add context data as first argument
logger.info({
  userId: user.id,
  email: user.email,
  ip: req.ip
}, 'User login successful');

// Output (development):
// [12:34:56.789] INFO: User login successful
//     userId: "user123"
//     email: "user@example.com"
//     ip: "192.168.1.1"
```

### Child Loggers

Create contextual loggers for specific modules:

```typescript
import { createChildLogger } from './config';

// In auth route
const authLogger = createChildLogger({ module: 'auth' });
authLogger.info({ userId: '123' }, 'Login attempt');

// In notes route
const notesLogger = createChildLogger({ module: 'notes' });
notesLogger.debug({ noteId: '456' }, 'Note retrieved');
```

### Error Logging

```typescript
try {
  await someOperation();
} catch (error) {
  // Pino automatically serializes Error objects
  logger.error({ err: error, context: 'additional info' }, 'Operation failed');
}
```

### Route-Specific Logging

```typescript
import { Router } from "express";
import { logger, createChildLogger } from "../config";

const router = Router();
const routeLogger = createChildLogger({ module: 'notes' });

router.post("/api/notes", async (req, res) => {
  routeLogger.info({ userId: req.session.userId }, 'Creating new note');
  
  try {
    // ... business logic
    routeLogger.info({ noteId: note.id }, 'Note created successfully');
    res.json({ success: true, note });
  } catch (error) {
    routeLogger.error({ err: error, userId: req.session.userId }, 'Failed to create note');
    res.status(500).json({ error: 'Failed to create note' });
  }
});
```

## Log Levels

| Level | Usage | Example |
|-------|-------|---------|
| **trace** | Very detailed debugging | Function entry/exit, loop iterations |
| **debug** | Debugging information | Variable values, flow control |
| **info** | General information | Server start, requests, normal operations |
| **warn** | Warning conditions | Deprecated API usage, slow responses |
| **error** | Error conditions | Failed operations, exceptions |
| **fatal** | Critical errors | System crashes, data corruption |

## Production Best Practices

```typescript
// Good: Structured logging with context
logger.info({ 
  userId: user.id, 
  duration: Date.now() - startTime,
  endpoint: '/api/notes'
}, 'Request completed');

// Bad: String concatenation
logger.info(`User ${user.id} completed request in ${duration}ms`);

// Good: Log errors with full context
logger.error({ 
  err: error, 
  userId, 
  noteId,
  operation: 'update'
}, 'Failed to update note');

// Bad: Generic error message
logger.error('Error updating note');
```

## Performance Monitoring

The logger integrates with the performance monitoring middleware:

```typescript
// Automatic logging of:
// - Request duration
// - Status codes
// - Slow requests (>1000ms)
// - Server errors (5xx)

// Example output:
// [12:34:56] DEBUG: 📊 Performance: GET /api/notes
//     method: "GET"
//     path: "/api/notes"
//     statusCode: 200
//     duration: 45
//     rating: "good"
```

## Log Output

### Development (Pretty)
```
[12:34:56.789] INFO: 🚀 Starting cluster
    workers: 4
    cpus: 8
[12:34:56.790] INFO: ⚡ Backend server running
    port: 3002
    pid: 12345
    protocol: "http"
```

### Production (JSON)
```json
{"level":"INFO","time":"2025-12-13T12:34:56.789Z","pid":12345,"msg":"Backend server running","port":3002,"protocol":"http"}
```

## Migration from console.log

```typescript
// Before
console.log('Server started on port', port);
console.error('Error:', error);
console.warn('Slow request:', duration);

// After
logger.info({ port }, 'Server started');
logger.error({ err: error }, 'Request failed');
logger.warn({ duration }, 'Slow request detected');
```

## Viewing Logs

```bash
# Development (automatically formatted)
pnpm dev

# Production (pipe through pino-pretty)
pnpm start | pino-pretty

# Filter by level
pnpm start | pino-pretty --levelFilter info

# Search logs
pnpm start | grep "error"
```
