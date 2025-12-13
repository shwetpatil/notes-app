# Features Guide

Complete guide to all features in the notes application.

## Core Features

### 1. Authentication & Security

#### User Registration
- **Email validation** - Valid email format required
- **Password strength** - Minimum 8 characters
- **Bcrypt hashing** - Passwords hashed with 12 salt rounds
- **Unique emails** - Duplicate prevention

**How to use:**
1. Navigate to /register
2. Enter email and password
3. Account created with automatic login

#### User Login
- **Credential verification** - Email and password
- **Remember Me** - Optional 30-day session
- **Account lockout** - 5 failed attempts = 15-minute lockout
- **Session management** - Secure HttpOnly cookies

**How to use:**
1. Navigate to /login
2. Enter credentials
3. Check "Remember me" for extended session
4. Access notes dashboard

#### Security Features
- ✅ Password hashing (bcrypt)
- ✅ Account lockout protection
- ✅ Rate limiting (5 auth attempts/15 min)
- ✅ XSS protection
- ✅ SQL injection prevention
- ✅ CSRF protection via SameSite cookies
- ✅ Secure headers (Helmet)

---

### 2. Note Management

#### Create Notes
- **Title** - Up to 255 characters
- **Content** - Unlimited rich text or markdown
- **Auto-save** - Changes saved automatically
- **Validation** - Zod schema validation

**How to use:**
1. Click "+ New Note"
2. Enter title and content
3. Changes save automatically

#### Edit Notes
- **Real-time editing** - Updates as you type
- **Optimistic updates** - Instant UI feedback
- **Content sanitization** - XSS protection
- **Version safety** - Ownership verification

**How to use:**
1. Click any note to open editor
2. Modify title or content
3. Changes sync automatically

#### Delete Notes
- **Soft delete** - Moves to trash first
- **Trash bin** - Recoverable for 30 days
- **Permanent delete** - From trash only
- **Ownership check** - Only delete your notes

**How to use:**
1. Open note in editor
2. Click "Delete" → Moves to trash
3. View trash, click "Delete Forever" for permanent removal

---

### 3. Organization Features

#### Favorites ⭐
Mark important notes for quick access.

**Features:**
- Toggle favorite status with star icon
- Favorites appear at top of list
- Filter to show only favorites
- Favorite count visible

**How to use:**
1. Open note or hover in list
2. Click star icon (⭐)
3. Note moves to top of list
4. Toggle search bar filter for favorites-only view

#### Pinning 📌
Keep specific notes at the top.

**Features:**
- Pin multiple notes
- Pinned notes stay at top
- Works with favorites (favorites → pinned → others)
- Visual pin indicator

**How to use:**
1. Open note in editor
2. Click pin button (📌)
3. Note stays at top until unpinned

#### Color Coding 🎨
Organize notes by color.

**Features:**
- 8 color options: None, Red, Orange, Yellow, Green, Blue, Purple, Pink
- Colored backgrounds in list view
- Color accent borders
- Dark mode compatible colors

**How to use:**
1. Open note in editor
2. Select color from color picker
3. Note background updates in list

#### Tags 🏷️
Categorize with custom tags.

**Features:**
- Multiple tags per note
- Tag filtering
- Quick tag removal
- Autocomplete (future)

**How to use:**
1. Open note in editor
2. Type tag name, click "Add Tag"
3. Tags appear as badges
4. Click × to remove tag

#### Archive 📦
Hide completed or inactive notes.

**Features:**
- Archive/unarchive toggle
- Archived notes hidden from main view
- Separate archive view
- Maintains all note properties

**How to use:**
1. Open note in editor
2. Click "Archive" button (📦)
3. Note hidden from main view
4. Toggle archive filter to view

#### Trash Bin 🗑️
Safely delete with recovery option.

**Features:**
- Soft delete (data preserved)
- 30-day retention (configurable)
- Restore capability
- Permanent delete option

**How to use:**
1. Click "Delete" on note → Moves to trash
2. Toggle trash view to see deleted notes
3. Click "Restore" to recover
4. Click "Delete Forever" for permanent removal

---

### 4. Search & Filtering

#### Text Search
- **Real-time search** - Updates as you type
- **Searches**: Title and content
- **Case insensitive** - Flexible matching
- **Instant results** - No delay

**How to use:**
1. Type in search bar
2. Results filter automatically
3. Clear to show all notes

#### Tag Filtering
- **Filter by tags** - Show notes with specific tags
- **Multiple tags** - Support for tag combinations (future)
- **Quick filter** - Click tag to filter

**How to use:**
1. Enter tag names in filter
2. Notes with matching tags shown
3. Clear to reset

#### Status Filters
- **Favorites only** - ⭐ button
- **Archived notes** - 📦 button
- **Trash bin** - 🗑️ button
- **Toggle on/off** - Independent filters

**How to use:**
1. Click filter button in search bar
2. View updates to show filtered notes
3. Click again to disable filter

---

### 5. Sorting Options

#### Sort Methods
- **Recent** - Last updated first (default)
- **Newest** - Creation date, newest first
- **Oldest** - Creation date, oldest first
- **A-Z** - Alphabetical by title
- **Z-A** - Reverse alphabetical

#### Sort Priority
```
1. Favorites (always first)
2. Pinned notes
3. User-selected sort
```

**How to use:**
1. Click sort dropdown in search bar
2. Select sort method
3. Notes reorder automatically

---

### 6. Content Features

#### Markdown Support
- **Per-note toggle** - Enable/disable markdown rendering
- **GitHub Flavored Markdown** - Full GFM support
- **Code highlighting** - Syntax highlighting for code blocks
- **Safe rendering** - XSS protection

**Supported syntax:**
- **Headers** - # ## ###
- **Bold/Italic** - **bold** *italic*
- **Lists** - Ordered and unordered
- **Links** - [text](url)
- **Images** - ![alt](url)
- **Code blocks** - ``` with language
- **Tables** - GFM tables
- **Blockquotes** - > quote

**How to use:**
1. Check "Enable Markdown" in note editor
2. Write markdown syntax in content
3. Preview shows rendered markdown

#### Rich Text
- **Plain text editing** - Default mode
- **Multi-line support** - Paragraphs and line breaks
- **Special characters** - Full Unicode support
- **Emoji support** - Native emoji rendering

---

### 7. UI/UX Features

#### Dark Mode 🌙
- **System preference** - Detects OS theme on first load
- **Manual toggle** - Switch anytime
- **Persistence** - Saves preference to localStorage
- **Full coverage** - All components styled

**How to use:**
1. Click moon/sun icon in sidebar
2. Theme switches immediately
3. Preference saved automatically

#### Offline Mode
- **IndexedDB storage** - Local data cache
- **Offline capable** - Full functionality without internet
- **Auto-sync** - Syncs when connection restored
- **Optimistic updates** - Instant UI response

**How it works:**
1. All notes cached in browser
2. Changes saved locally first
3. API calls in background
4. Auto-sync on connection restore

#### Responsive Design
- **Mobile friendly** - Works on all screen sizes
- **Touch optimized** - Touch targets sized appropriately
- **Adaptive layout** - Layout adjusts to screen
- **Accessible** - WCAG 2.1 compliant

---

### 8. Session Management

#### Remember Me
- **Extended sessions** - 30 days vs. 24 hours
- **Checkbox on login** - Opt-in feature
- **Secure cookies** - HttpOnly, SameSite, Secure
- **Auto-refresh** - Session extends with activity

**How to use:**
1. Check "Remember me" on login
2. Stay logged in for 30 days
3. Manual logout still available

#### Auto Logout
- **Session expiry** - 24 hours (default) or 30 days
- **Secure cleanup** - Session destroyed on logout
- **Redirect** - Auto-redirect to login on expiry

---

## Feature Combinations

### Workflow Examples

#### **Organize by Project**
1. Create notes for project
2. Tag all with project name
3. Assign project color
4. Pin active tasks
5. Archive when complete

#### **Important Notes**
1. Favorite critical notes
2. Pin to keep at top
3. Use red/orange color
4. Review favorites view daily

#### **Clean Workspace**
1. Archive completed notes
2. Delete unnecessary notes
3. Use trash for recovery
4. Keep active notes visible

#### **Focus Mode**
1. Filter by specific tag
2. Show only favorites
3. Sort by recent
4. Hide archived notes

---

## Keyboard Shortcuts

### Navigation
- **Tab** - Move between fields
- **Enter** - Submit forms
- **Esc** - Close modals (future)

### Editing
- **Ctrl/Cmd + S** - Manual save (auto-saves already)
- **Ctrl/Cmd + B** - Bold (markdown mode)
- **Ctrl/Cmd + I** - Italic (markdown mode)

*(More shortcuts planned for future releases)*

---

## Performance Features

### Speed Optimizations
- **Instant load** - IndexedDB cache
- **Optimistic updates** - UI updates immediately
- **Lazy loading** - Components load as needed
- **Code splitting** - Smaller bundle sizes
- **Image optimization** - Next.js automatic optimization

### Data Efficiency
- **Selective sync** - Only changed data
- **Compression** - gzip responses
- **Query optimization** - Database indexes
- **Connection pooling** - Database efficiency

---

## Future Features (Planned)

### Phase 2
- [ ] Folder organization
- [ ] Note sharing with other users
- [ ] Collaboration (real-time editing)
- [ ] File attachments
- [ ] Note templates
- [ ] Export notes (PDF, Markdown)

### Phase 3
- [ ] Advanced search (full-text)
- [ ] Note version history
- [ ] Reminders/notifications
- [ ] Mobile apps (iOS/Android)
- [ ] Browser extensions
- [ ] API access/webhooks

### Phase 4
- [ ] AI-powered suggestions
- [ ] Smart tagging
- [ ] Note summaries
- [ ] Voice notes
- [ ] Handwriting recognition
- [ ] Multi-language support

---

**Next**: See [API Reference](./API.md) for backend endpoints
