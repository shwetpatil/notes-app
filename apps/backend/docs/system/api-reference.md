# API Reference

Complete backend API documentation for the notes application.

## Base URL
```
http://localhost:3001
```

## Authentication

All authenticated endpoints require a valid session cookie. Session is established on login/register.

### Rate Limiting

**Auth endpoints**: 5 requests per 15 minutes per IP
**Other endpoints**: 100 requests per 15 minutes per IP

---

## Endpoints

### 🔐 Authentication Endpoints

#### POST /auth/register

Register a new user account.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123"
}
```

**Validation:**
- Email: Valid email format required
- Password: Minimum 8 characters

**Response (201 Created):**
```json
{
  "user": {
    "id": "clx123abc...",
    "email": "user@example.com",
    "createdAt": "2025-12-12T10:30:00.000Z"
  }
}
```

**Error Responses:**
- `400` - Validation error (invalid email/password)
- `409` - Email already exists
- `429` - Too many requests

---

#### POST /auth/login

Authenticate user and create session.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123",
  "rememberMe": true
}
```

**Fields:**
- `email` (required): User email
- `password` (required): User password
- `rememberMe` (optional): Extend session to 30 days

**Response (200 OK):**
```json
{
  "user": {
    "id": "clx123abc...",
    "email": "user@example.com",
    "createdAt": "2025-12-12T10:30:00.000Z",
    "lastLoginAt": "2025-12-12T14:30:00.000Z"
  }
}
```

**Session Duration:**
- Default: 24 hours
- With `rememberMe: true`: 30 days

**Error Responses:**
- `400` - Validation error
- `401` - Invalid credentials
- `403` - Account locked (5 failed attempts)
- `429` - Too many requests

**Security Features:**
- Password hashing (bcrypt, 12 rounds)
- Account lockout after 5 failed attempts (15 min)
- Generic error messages (prevent enumeration)
- Failed attempt tracking

---

#### POST /auth/logout

End user session.

**Request:** No body required (session-based)

**Response (200 OK):**
```json
{
  "message": "Logged out successfully"
}
```

**Error Responses:**
- `401` - Not authenticated

---

#### GET /auth/me

Get current authenticated user.

**Request:** No parameters

**Response (200 OK):**
```json
{
  "user": {
    "id": "clx123abc...",
    "email": "user@example.com",
    "createdAt": "2025-12-12T10:30:00.000Z",
    "lastLoginAt": "2025-12-12T14:30:00.000Z"
  }
}
```

**Error Responses:**
- `401` - Not authenticated

---

### 📝 Notes Endpoints

All notes endpoints require authentication.

#### GET /notes

Get all notes for authenticated user.

**Request:** No parameters

**Response (200 OK):**
```json
{
  "notes": [
    {
      "id": "clx456def...",
      "title": "My First Note",
      "content": "This is the note content.",
      "color": "blue",
      "isFavorite": true,
      "isPinned": false,
      "isArchived": false,
      "isDeleted": false,
      "isMarkdownEnabled": false,
      "tags": ["work", "important"],
      "userId": "clx123abc...",
      "createdAt": "2025-12-12T10:30:00.000Z",
      "updatedAt": "2025-12-12T15:45:00.000Z"
    }
  ]
}
```

**Note Fields:**
- `id` - Unique note identifier (CUID)
- `title` - Note title (max 255 chars)
- `content` - Note content (unlimited)
- `color` - Color code: `null | red | orange | yellow | green | blue | purple | pink`
- `isFavorite` - Favorite status
- `isPinned` - Pinned status
- `isArchived` - Archive status
- `isDeleted` - Soft delete status
- `isMarkdownEnabled` - Markdown rendering enabled
- `tags` - Array of tag strings
- `userId` - Owner user ID
- `createdAt` - Creation timestamp
- `updatedAt` - Last update timestamp

**Error Responses:**
- `401` - Not authenticated
- `500` - Server error

---

#### GET /notes/:id

Get a specific note by ID.

**Request:** 
- Path parameter: `id` (note ID)

**Response (200 OK):**
```json
{
  "note": {
    "id": "clx456def...",
    "title": "My First Note",
    "content": "This is the note content.",
    "color": "blue",
    "isFavorite": true,
    "isPinned": false,
    "isArchived": false,
    "isDeleted": false,
    "isMarkdownEnabled": false,
    "tags": ["work", "important"],
    "userId": "clx123abc...",
    "createdAt": "2025-12-12T10:30:00.000Z",
    "updatedAt": "2025-12-12T15:45:00.000Z"
  }
}
```

**Error Responses:**
- `401` - Not authenticated
- `404` - Note not found or not owned by user
- `500` - Server error

---

#### POST /notes

Create a new note.

**Request:**
```json
{
  "title": "New Note",
  "content": "This is my note content.",
  "color": "blue",
  "isFavorite": false,
  "isPinned": false,
  "isArchived": false,
  "isMarkdownEnabled": false,
  "tags": ["work"]
}
```

**Required Fields:**
- `title` (string, max 255 chars)
- `content` (string)

**Optional Fields:**
- `color` (enum: null, red, orange, yellow, green, blue, purple, pink)
- `isFavorite` (boolean, default: false)
- `isPinned` (boolean, default: false)
- `isArchived` (boolean, default: false)
- `isMarkdownEnabled` (boolean, default: false)
- `tags` (string array, default: [])

**Response (201 Created):**
```json
{
  "note": {
    "id": "clx789ghi...",
    "title": "New Note",
    "content": "This is my note content.",
    "color": "blue",
    "isFavorite": false,
    "isPinned": false,
    "isArchived": false,
    "isDeleted": false,
    "isMarkdownEnabled": false,
    "tags": ["work"],
    "userId": "clx123abc...",
    "createdAt": "2025-12-12T16:00:00.000Z",
    "updatedAt": "2025-12-12T16:00:00.000Z"
  }
}
```

**Security:**
- Content sanitized with XSS protection
- Title length enforced (255 chars)
- Tags sanitized

**Error Responses:**
- `400` - Validation error
- `401` - Not authenticated
- `500` - Server error

---

#### PUT /notes/:id

Update an existing note.

**Request:**
- Path parameter: `id` (note ID)
- Body: Any note fields to update

```json
{
  "title": "Updated Title",
  "content": "Updated content.",
  "color": "red",
  "isFavorite": true,
  "isPinned": true,
  "isArchived": false,
  "isMarkdownEnabled": true,
  "tags": ["work", "urgent"]
}
```

**All fields optional** - only send fields you want to update.

**Response (200 OK):**
```json
{
  "note": {
    "id": "clx456def...",
    "title": "Updated Title",
    "content": "Updated content.",
    "color": "red",
    "isFavorite": true,
    "isPinned": true,
    "isArchived": false,
    "isDeleted": false,
    "isMarkdownEnabled": true,
    "tags": ["work", "urgent"],
    "userId": "clx123abc...",
    "createdAt": "2025-12-12T10:30:00.000Z",
    "updatedAt": "2025-12-12T16:15:00.000Z"
  }
}
```

**Security:**
- Ownership verified (only owner can update)
- Content sanitized with XSS protection
- Title length enforced

**Error Responses:**
- `400` - Validation error
- `401` - Not authenticated
- `404` - Note not found or not owned by user
- `500` - Server error

---

#### DELETE /notes/:id

Delete a note (soft delete - moves to trash).

**Request:**
- Path parameter: `id` (note ID)

**Response (200 OK):**
```json
{
  "message": "Note deleted successfully"
}
```

**Behavior:**
- Sets `isDeleted: true` on note
- Note hidden from main queries
- Recoverable from trash

**Error Responses:**
- `401` - Not authenticated
- `404` - Note not found or not owned by user
- `500` - Server error

---

#### DELETE /notes/:id/permanent

Permanently delete a note (cannot be recovered).

**Request:**
- Path parameter: `id` (note ID)

**Response (200 OK):**
```json
{
  "message": "Note permanently deleted"
}
```

**Behavior:**
- Removes note from database completely
- Cannot be recovered
- Should only be called on notes where `isDeleted: true`

**Error Responses:**
- `401` - Not authenticated
- `404` - Note not found or not owned by user
- `500` - Server error

---

#### POST /notes/:id/restore

Restore a deleted note from trash.

**Request:**
- Path parameter: `id` (note ID)

**Response (200 OK):**
```json
{
  "note": {
    "id": "clx456def...",
    "isDeleted": false,
    ...
  }
}
```

**Behavior:**
- Sets `isDeleted: false`
- Note visible in main queries again

**Error Responses:**
- `401` - Not authenticated
- `404` - Note not found or not owned by user
- `500` - Server error

---

## Request/Response Formats

### Content-Type
All requests with body must use:
```
Content-Type: application/json
```

### Response Format
All responses return JSON with consistent structure:

**Success responses:**
```json
{
  "user": {...},  // or "note": {...}, or "notes": [...]
  "message": "Optional success message"
}
```

**Error responses:**
```json
{
  "error": "Error message",
  "details": "Optional additional details"
}
```

---

## Error Codes

### Standard HTTP Status Codes

| Code | Meaning | Usage |
|------|---------|-------|
| 200 | OK | Successful GET, PUT, DELETE |
| 201 | Created | Successful POST (creation) |
| 400 | Bad Request | Validation error, invalid data |
| 401 | Unauthorized | Not authenticated, invalid session |
| 403 | Forbidden | Account locked, access denied |
| 404 | Not Found | Resource doesn't exist or not owned |
| 409 | Conflict | Duplicate email, resource conflict |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Unexpected server error |

### Rate Limiting Headers
When rate limited, response includes:
```
X-RateLimit-Limit: 5
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 1702394100000
Retry-After: 900
```

---

## Security Headers

All responses include:

```
Strict-Transport-Security: max-age=15552000; includeSubDomains
Content-Security-Policy: default-src 'self'
X-Frame-Options: SAMEORIGIN
X-Content-Type-Options: nosniff
X-XSS-Protection: 1; mode=block
```

---

## Session Management

### Cookie Details
```
Name: notes-session (custom, not "connect.sid")
HttpOnly: true
Secure: true (production)
SameSite: strict
Domain: localhost (dev) / yourdomain.com (prod)
Path: /
```

### Session Duration
- **Default**: 24 hours from last activity
- **Remember Me**: 30 days from login
- **Sliding window**: Session extends with each request

### Session Data Stored
```javascript
{
  userId: "clx123abc...",
  email: "user@example.com",
  cookie: {
    maxAge: 86400000,  // or 2592000000 for remember me
    originalMaxAge: 86400000
  }
}
```

---

## Data Sanitization

### Input Sanitization
All user inputs are sanitized:
- **XSS protection** - HTML tags stripped/escaped
- **NoSQL injection** - Mongo operators sanitized
- **SQL injection** - Parameterized queries (Prisma)

### Allowed HTML in Markdown
When markdown enabled, these tags allowed:
```
p, br, strong, em, u, h1, h2, h3, h4, h5, h6,
ul, ol, li, a, code, pre, blockquote, hr, table,
thead, tbody, tr, th, td
```

All other tags stripped or escaped.

---

## WebSocket Support

**Status**: ✅ Fully Implemented

**Available features:**
- ✅ Real-time note updates
- ✅ Collaborative editing with room-based synchronization
- ✅ User presence indicators
- ✅ Live sync across devices
- ✅ Session-based authentication
- ✅ Event-driven architecture

### Connection

**Endpoint**: `ws://localhost:3001` or `wss://your-domain.com` (production)

**Client library**: socket.io-client

**Authentication**: Session cookies (established via login/register)

### Events

#### Client → Server

**`join-note`** - Join a note room for collaboration
```typescript
socket.emit('join-note', { noteId: string, userId: string });
```

**`leave-note`** - Leave a note room
```typescript
socket.emit('leave-note', { noteId: string, userId: string });
```

**`note-update`** - Broadcast note changes to other users
```typescript
socket.emit('note-update', {
  noteId: string,
  userId: string,
  changes: {
    title?: string,
    content?: string,
    tags?: string[]
  }
});
```

**`cursor-position`** - Share cursor position in collaborative editing
```typescript
socket.emit('cursor-position', {
  noteId: string,
  userId: string,
  position: number
});
```

**`presence`** - Update user presence status
```typescript
socket.emit('presence', {
  noteId: string,
  userId: string,
  status: 'active' | 'idle' | 'away'
});
```

#### Server → Client

**`user-joined`** - Notified when user joins note room
```typescript
socket.on('user-joined', (data: { noteId: string, userId: string, userName: string }) => {
  // Handle user joined
});
```

**`user-left`** - Notified when user leaves note room
```typescript
socket.on('user-left', (data: { noteId: string, userId: string }) => {
  // Handle user left
});
```

**`note-updated`** - Receive real-time note updates
```typescript
socket.on('note-updated', (data: {
  noteId: string,
  userId: string,
  changes: object,
  timestamp: number
}) => {
  // Apply changes to note
});
```

**`cursor-move`** - Receive cursor position updates
```typescript
socket.on('cursor-move', (data: {
  noteId: string,
  userId: string,
  position: number
}) => {
  // Update cursor indicator
});
```

**`presence-update`** - Receive presence status updates
```typescript
socket.on('presence-update', (data: {
  noteId: string,
  userId: string,
  status: string
}) => {
  // Update presence indicator
});
```

**`notification`** - Receive general notifications
```typescript
socket.on('notification', (data: {
  type: string,
  message: string,
  data?: object
}) => {
  // Display notification
});
```

### React Integration Example

```typescript
import { useWebSocket } from '@/context/WebSocketContext';
import { useNoteCollaboration } from '@/hooks/useNoteCollaboration';

function NoteEditor({ noteId, userId }) {
  const { isConnected } = useWebSocket();
  
  const {
    broadcastUpdate,
    broadcastPresence
  } = useNoteCollaboration({
    noteId,
    enabled: isConnected,
    onUserJoined: (data) => console.log('User joined:', data),
    onUserLeft: (data) => console.log('User left:', data),
    onNoteUpdated: (data) => {
      // Apply changes to local state
      updateLocalNote(data.changes);
    }
  });

  const handleChange = (changes) => {
    // Update local state immediately
    setNote(changes);
    
    // Broadcast to other users
    broadcastUpdate(changes);
  };

  return <div>...</div>;
}
```

### Configuration

**Environment Variables**:
```bash
# Backend
CORS_ORIGIN=http://localhost:3000
WEBSOCKET_ENABLED=true

# Frontend
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_ENABLE_WS=true
```

**Backend Setup**: See [websocket.ts](../src/config/websocket.ts)  
**Frontend Setup**: See [WebSocketContext.tsx](../../frontend/src/context/WebSocketContext.tsx)

---

## Testing the API

### Using cURL

**Register:**
```bash
curl -X POST http://localhost:3001/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test1234"}'
```

**Login:**
```bash
curl -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test1234","rememberMe":true}' \
  -c cookies.txt
```

**Get notes:**
```bash
curl http://localhost:3001/notes \
  -b cookies.txt
```

**Create note:**
```bash
curl -X POST http://localhost:3001/notes \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{"title":"Test Note","content":"This is a test."}'
```

### Using Postman

1. **Import collection** - Create collection with all endpoints
2. **Set environment** - Base URL: `http://localhost:3001`
3. **Enable cookies** - Settings → General → Cookies: Enabled
4. **Test flow**:
   - POST /auth/register or /auth/login
   - Postman stores session cookie automatically
   - Make authenticated requests

---

## API Versioning

**Current version**: v1 (implicit, no prefix)

**Future versions** will use URL prefix:
- `/api/v1/notes`
- `/api/v2/notes`

Current endpoints remain unversioned for backward compatibility.

---

## Request Examples

### Complete Note Creation Flow

```javascript
// 1. Register
const registerRes = await fetch('http://localhost:3001/auth/register', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include',
  body: JSON.stringify({
    email: 'user@example.com',
    password: 'SecurePass123'
  })
});
const { user } = await registerRes.json();

// 2. Create note
const createRes = await fetch('http://localhost:3001/notes', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include',
  body: JSON.stringify({
    title: 'My First Note',
    content: 'Hello world!',
    color: 'blue',
    tags: ['personal']
  })
});
const { note } = await createRes.json();

// 3. Update note
const updateRes = await fetch(`http://localhost:3001/notes/${note.id}`, {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include',
  body: JSON.stringify({
    isFavorite: true,
    isPinned: true
  })
});

// 4. Get all notes
const notesRes = await fetch('http://localhost:3001/notes', {
  credentials: 'include'
});
const { notes } = await notesRes.json();
```

---

**Next**: See [Development Guide](./DEVELOPMENT.md) for local setup
