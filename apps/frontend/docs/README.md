# Frontend Documentation

**Notes Application Frontend - Next.js 15 + React 18 + TypeScript**

This documentation covers all frontend-specific concerns. For system-level documentation, see [System Documentation](../../../docs/README.md).

---

## 🚀 Quick Start

```bash
# Install dependencies
cd apps/frontend
pnpm install

# Start development server
pnpm dev
# Open http://localhost:3000

# Run tests
pnpm test

# Build for production
pnpm build
```

---

## 📚 Documentation Index

### 🏗️ Architecture & Design

**[ARCHITECTURE.md](./ARCHITECTURE.md)** - Frontend architecture
- Next.js App Router structure
- Component architecture
- Offline-first strategy (IndexedDB)
- State management patterns
- Data flow (user action → API → IndexedDB)
- Routing & navigation
- Code organization

**[STATE_MANAGEMENT.md](./STATE_MANAGEMENT.md)** - State management
- Server state (TanStack Query)
- Local state (React useState/useReducer)
- Theme state (Context API)
- IndexedDB (Dexie) for offline storage
- Optimistic updates
- Cache invalidation
- State synchronization

---

### 🔒 Security

**[SECURITY.md](./SECURITY.md)** - Frontend security
- Client-side security measures
- XSS prevention
- CSRF protection (SameSite cookies)
- Secure cookie handling
- Input validation
- Content Security Policy (CSP)
- Secure dependencies

---

### 📡 API & Integration

**[API_INTEGRATION.md](./API_INTEGRATION.md)** - Backend API integration
- Axios configuration
- API client setup
- TanStack Query integration
- Error handling
- Request/response interceptors
- Authentication headers (cookies)
- API retry logic

---

### ⚡ Performance

**[PERFORMANCE.md](./PERFORMANCE.md)** - Performance optimization
- Next.js optimizations (Turbopack, Image optimization)
- Code splitting & lazy loading
- IndexedDB caching
- React Query caching strategies
- Bundle size optimization
- Lighthouse scores
- Performance monitoring

**[ACCESSIBILITY.md](./ACCESSIBILITY.md)** - Accessibility (a11y)
- WCAG 2.1 compliance
- Semantic HTML
- ARIA attributes
- Keyboard navigation
- Screen reader support
- Color contrast
- Focus management

---

### 🚀 Deployment

**[DEPLOYMENT.md](./DEPLOYMENT.md)** - Frontend deployment
- Vercel deployment
- Netlify deployment
- Docker containerization
- Environment variables
- Build optimization
- Static export considerations
- CDN configuration

---

### 📖 Features & Reference

**[FEATURES.md](./FEATURES.md)** - Frontend features
- User authentication (login/register)
- Notes CRUD interface
- Real-time search & filtering
- Tag management
- Color picker
- Markdown support
- Offline mode
- Dark/light theme

**[QUICKSTART.md](./QUICKSTART.md)** - Quick start guide
- Prerequisites
- Installation
- Running dev server
- Building for production
- Common commands

**[ROADMAP.md](./ROADMAP.md)** - Frontend roadmap
- Current features (v1.0)
- Q1 2026: Real-time collaboration UI
- Q2 2026: File upload/preview, Rich text editor
- Q3 2026: Mobile app (React Native)
- Q4 2026: AI-powered features UI

**[TECH_STACK.md](./TECH_STACK.md)** - Frontend technology stack
- Next.js 15 - React framework
- React 18 - UI library
- TypeScript 5.3 - Type safety
- Tailwind CSS 3.4 - Styling
- TanStack Query 5 - Server state
- Dexie 4 - IndexedDB wrapper
- Full stack details

---

## 🔗 Related Documentation

### System Documentation
- [System Architecture](../../../docs/ARCHITECTURE.md) - Overall system design
- [Data Flow](../../../docs/DATA_FLOW.md) - End-to-end data flow
- [Security Model](../../../docs/SECURITY.md) - System-wide security

### Backend Documentation
- [Backend README](../../backend/docs/README.md) - Backend documentation
- [API Reference](../../backend/docs/API.md) - API endpoints
- [Authentication](../../backend/docs/AUTH.md) - Auth implementation

---

## 🎯 Quick Commands Reference

```bash
# Development
pnpm dev                    # Start dev server (port 3000)
pnpm dev:turbo              # Dev with Turbopack

# Testing
pnpm test                   # Run unit tests
pnpm test:e2e               # Run Playwright E2E tests
pnpm test:watch             # Watch mode

# Build & Deploy
pnpm build                  # Build for production
pnpm start                  # Start production server
pnpm export                 # Static export

# Code Quality
pnpm lint                   # Lint code
pnpm lint:fix               # Fix lint issues
pnpm format                 # Format code

# Type Checking
pnpm type-check             # TypeScript type check
```

---

## 📂 Frontend Structure

```
apps/frontend/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── layout.tsx          # Root layout
│   │   ├── page.tsx            # Home page
│   │   ├── providers.tsx       # Client providers (Query, Theme)
│   │   ├── globals.css         # Global styles
│   │   ├── login/
│   │   │   └── page.tsx        # Login page
│   │   ├── register/
│   │   │   └── page.tsx        # Register page
│   │   └── notes/
│   │       └── page.tsx        # Notes dashboard
│   ├── components/             # React components
│   │   ├── NotesList.tsx       # List of notes
│   │   ├── NoteEditor.tsx      # Note editing interface
│   │   ├── SearchBar.tsx       # Search & filter controls
│   │   ├── Sidebar.tsx         # Navigation sidebar
│   │   ├── ColorPicker.tsx     # Color selection
│   │   ├── MetricsDashboard.tsx # Metrics display
│   │   └── MonitoringProvider.tsx # Performance monitoring
│   ├── context/                # React contexts
│   │   └── ThemeContext.tsx    # Theme (dark/light) context
│   ├── lib/                    # Utilities
│   │   ├── api.ts              # Axios API client
│   │   ├── db.ts               # Dexie (IndexedDB) setup
│   │   ├── errorTracking.ts    # Error tracking utilities
│   │   └── monitoring.ts       # Performance monitoring
│   └── hooks/                  # Custom React hooks (future)
├── e2e/                        # Playwright E2E tests
│   └── notes.spec.ts           # Notes flow tests
├── public/                     # Static assets
│   ├── favicon.ico
│   └── images/
├── docs/                       # This documentation
├── next.config.ts              # Next.js configuration
├── tailwind.config.js          # Tailwind CSS config
├── postcss.config.js           # PostCSS config
├── playwright.config.ts        # Playwright config
├── tsconfig.json               # TypeScript config
└── package.json                # Dependencies & scripts
```

---

## 🎨 Component Architecture

### Page Components (App Router)
```
app/
├── layout.tsx                  # Root layout (Theme, Query Provider)
├── page.tsx                    # Home/landing page
├── login/page.tsx              # Login form
├── register/page.tsx           # Registration form
└── notes/page.tsx              # Notes dashboard (main app)
```

### Feature Components
```
components/
├── NotesList.tsx               # Display notes grid/list
├── NoteEditor.tsx              # Create/edit note
├── SearchBar.tsx               # Search, filter, sort controls
├── Sidebar.tsx                 # User info, theme toggle, filters
├── ColorPicker.tsx             # Note color selection
└── MetricsDashboard.tsx        # Performance metrics
```

### Shared Components (from packages/ui-lib)
```
packages/ui-lib/src/components/
├── Button.tsx                  # Reusable button
├── Input.tsx                   # Form input
├── Card.tsx                    # Card container
└── Spinner.tsx                 # Loading spinner
```

---

## 🔄 Data Flow

```
User Action (e.g., Create Note)
    ↓
Component Handler (onClick)
    ↓
├─→ Optimistic Update
│   ├─ Update IndexedDB immediately
│   └─ UI reflects change instantly
│
└─→ API Call (via TanStack Query mutation)
    ├─ POST /api/notes
    ├─ Backend processes request
    └─ Response received
        ↓
    Sync with IndexedDB
        ↓
    React Query refetch/invalidate
        ↓
    UI updates with server data
```

**Key Benefits:**
- Instant UI feedback (optimistic updates)
- Works offline (IndexedDB)
- Auto-sync when online
- Consistent state across tabs

---

## 🌐 Environment Variables

### Required
```env
NEXT_PUBLIC_API_URL="http://localhost:3001"
```

### Optional
```env
NEXT_PUBLIC_SENTRY_DSN="https://..."          # Error tracking
NEXT_PUBLIC_ENABLE_MONITORING="true"          # Performance monitoring
NEXT_PUBLIC_ENABLE_ANALYTICS="false"          # Analytics (future)
```

**Full configuration:** [DEPLOYMENT.md](./DEPLOYMENT.md)

---

## 🧪 Testing

### Unit Tests (Vitest)
```bash
pnpm test                      # Run all unit tests
pnpm test:watch                # Watch mode
pnpm test:coverage             # Coverage report
```

### E2E Tests (Playwright)
```bash
pnpm test:e2e                  # Run E2E tests
pnpm test:e2e:ui               # Interactive UI mode
pnpm test:e2e:debug            # Debug mode
```

**Testing guide:** See backend [TESTING.md](../../backend/docs/TESTING.md) for patterns

---

## 🎨 Styling

### Tailwind CSS
- Utility-first CSS framework
- Dark mode support (`dark:` prefix)
- Responsive design (`sm:`, `md:`, `lg:`, `xl:` breakpoints)
- Custom theme in `tailwind.config.js`

### Color Scheme
```css
/* Light mode */
--background: #ffffff
--foreground: #000000
--primary: #3b82f6

/* Dark mode */
--background: #0a0a0a
--foreground: #ffffff
--primary: #60a5fa
```

---

## 🤝 Contributing

See [System Development Guide](../../../docs/DEVELOPMENT.md) for:
- Git workflow
- Code review process
- Component design guidelines
- Testing requirements

---

## 📞 Support

- **Frontend Issues**: Open an issue with "frontend:" prefix
- **UI/UX Feedback**: See [FEATURES.md](./FEATURES.md)
- **Performance**: See [PERFORMANCE.md](./PERFORMANCE.md)

---

**Last Updated**: December 13, 2025  
**Frontend Version**: 1.0.0  
**Documentation Version**: 2.0
