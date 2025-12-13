# Notes Application - System Documentation

**Complete system-level documentation for the Notes Application**

This documentation covers the entire system architecture, deployment strategies, security model, and operational concerns. For component-specific documentation, see:
- [Backend Documentation](../apps/backend/docs/README.md)
- [Frontend Documentation](../apps/frontend/docs/README.md)

---

## 📚 Documentation Index

### 🏗️ System Architecture

**[ARCHITECTURE.md](./ARCHITECTURE.md)** - Overall system design
- Frontend-Backend interaction patterns
- Monorepo structure and organization
- Communication protocols (REST API)
- Data flow across the stack
- Component relationships
- System boundaries and interfaces

---

### 🚀 Deployment & Operations

**[DEPLOYMENT.md](./DEPLOYMENT.md)** - Production deployment guide
- Docker containerization
- Cloud deployment (AWS, GCP, Azure)
- Kubernetes configuration
- CI/CD pipelines
- Environment management
- Scaling strategies (horizontal & vertical)

---

### 🔒 Security Model

**[SECURITY.md](./SECURITY.md)** - System-wide security architecture
- End-to-end security overview
- Authentication flow (frontend → backend → database)
- Authorization model
- Network security (HTTPS, CORS, CSP)
- Data encryption (in-transit, at-rest)
- Security policies and compliance

---

### 📊 Performance & Observability

**[PERFORMANCE.md](./PERFORMANCE.md)** - System performance (Coming soon)
- Performance benchmarks (throughput, latency)
- Load testing results
- Bottleneck analysis
- Optimization strategies
- Caching strategies (client, server, database)

---

### 📈 Data Flow & Design

**[DATA_FLOW.md](./DATA_FLOW.md)** - End-to-end data flow (Coming soon)
- User action → Frontend → Backend → Database
- Offline-first synchronization
- Real-time updates (future: WebSockets)
- Data consistency guarantees
- Error propagation and recovery

---

### 📖 Quick References

**[QUICKSTART.md](./QUICKSTART.md)** - Get started in 5 minutes
**[DEVELOPMENT.md](./DEVELOPMENT.md)** - Development workflows
**[ROADMAP.md](./ROADMAP.md)** - Product roadmap
**[TECH_STACK.md](./TECH_STACK.md)** - Full technology stack
**[FEATURES.md](./FEATURES.md)** - Complete feature list

---

## 🎯 Quick Start Commands

```bash
# Install all dependencies (root level)
pnpm install

# Start all services in development mode
pnpm dev
# Frontend: http://localhost:3000
# Backend: http://localhost:3001
# Database: PostgreSQL on localhost:5432

# Run all tests
pnpm test

# Build for production
pnpm build
```

## 🏗️ System Overview

```
┌──────────────────────────────────────────────────────────┐
│                   Client (Browser)                       │
│  • React 18 + Next.js 15 (App Router)                   │
│  • IndexedDB (Offline storage)                           │
│  • TanStack Query (Server state)                         │
└────────────────────┬─────────────────────────────────────┘
                     │ HTTPS/HTTP
                     │ REST API
                     ↓
┌──────────────────────────────────────────────────────────┐
│                Backend API (Express.js)                  │
│  • RESTful endpoints (/api/auth, /api/notes)            │
│  • Session-based authentication                          │
│  • Rate limiting & security middleware                   │
└────────────────────┬─────────────────────────────────────┘
                     │ Prisma ORM
                     │ SQL Queries
                     ↓
┌──────────────────────────────────────────────────────────┐
│              PostgreSQL Database (16+)                   │
│  • User authentication data                              │
│  • Notes & metadata                                      │
│  • Session storage                                       │
└──────────────────────────────────────────────────────────┘
```

**Key Characteristics:**
- **Monorepo**: Shared types and UI components across frontend/backend
- **TypeScript**: End-to-end type safety
- **Offline-first**: Frontend works without network (IndexedDB)
- **Session-based auth**: HttpOnly cookies, 24h/30d expiry
- **PostgreSQL**: Relational data with JSON support
- **Containerized**: Docker for local dev and production

---

## 📂 Documentation Structure

```
docs/                           # System-level documentation
├── README.md                   # This file (navigation)
├── ARCHITECTURE.md             # Overall architecture
├── DEPLOYMENT.md               # Production deployment
├── SECURITY.md                 # System security
├── QUICKSTART.md               # Quick start guide
├── DEVELOPMENT.md              # Development workflow
├── ROADMAP.md                  # Product roadmap
├── TECH_STACK.md               # Technology stack
└── FEATURES.md                 # Feature list

apps/backend/docs/              # Backend-specific docs
├── README.md                   # Backend navigation
├── ARCHITECTURE.md             # Backend architecture
├── SECURITY.md                 # Backend security
├── DATABASE.md                 # Database design
├── API.md                      # API documentation
├── PERFORMANCE.md              # Backend performance
├── DEPLOYMENT.md               # Backend deployment
├── CONFIGURATION.md            # Backend config
├── AUTH.md                     # Authentication/Authorization
├── TESTING.md                  # Backend testing
├── FEATURES.md                 # Backend features
├── QUICKSTART.md               # Backend quick start
├── ROADMAP.md                  # Backend roadmap
└── TECH_STACK.md               # Backend tech stack

apps/frontend/docs/             # Frontend-specific docs
├── README.md                   # Frontend navigation
├── ARCHITECTURE.md             # Frontend architecture
├── SECURITY.md                 # Frontend security
├── STATE_MANAGEMENT.md         # State management
├── API_INTEGRATION.md          # API integration
├── PERFORMANCE.md              # Frontend performance
├── DEPLOYMENT.md               # Frontend deployment
├── ACCESSIBILITY.md            # Accessibility (a11y)
├── FEATURES.md                 # Frontend features
├── QUICKSTART.md               # Frontend quick start
├── ROADMAP.md                  # Frontend roadmap
└── TECH_STACK.md               # Frontend tech stack
```

---

## 🔗 Component Documentation Links

### Backend Documentation
Detailed backend architecture, API endpoints, database design, security, and deployment:
- [Backend README](../apps/backend/docs/README.md)
- [Backend Architecture](../apps/backend/docs/ARCHITECTURE.md)
- [API Reference](../apps/backend/docs/API.md)
- [Database Schema](../apps/backend/docs/DATABASE.md)
- [Backend Testing](../apps/backend/docs/TESTING.md)

### Frontend Documentation
Detailed frontend architecture, state management, UI components, and performance:
- [Frontend README](../apps/frontend/docs/README.md)
- [Frontend Architecture](../apps/frontend/docs/ARCHITECTURE.md)
- [State Management](../apps/frontend/docs/STATE_MANAGEMENT.md)
- [API Integration](../apps/frontend/docs/API_INTEGRATION.md)

---

## 🏗️ Project Structure

```
notes-application/
├── apps/
│   ├── frontend/     # Next.js 15 application
│   └── backend/      # Express API server
├── packages/
│   ├── types/        # Shared TypeScript types
│   └── ui-lib/       # Shared UI components
└── docs/            # This documentation
```

## 🔑 Key Features

- ✅ Secure authentication with bcrypt
- ✅ Account lockout protection
- ✅ Rich note editor with markdown
- ✅ Favorites, pinning, archiving
- ✅ Color coding and tagging
- ✅ Dark mode support
- ✅ Offline-first with IndexedDB
- ✅ Real-time search and sorting
- ✅ "Remember Me" sessions

## 📖 Reading Guide

**For New Developers:**
1. Start with [Quickstart](./QUICKSTART.md)
2. Read [Architecture](./ARCHITECTURE.md)
3. Review [Features](./FEATURES.md)
4. Check [Development Guide](./DEVELOPMENT.md)

**For DevOps/Deployment:**
1. Read [Security Guide](./SECURITY.md)
2. Review [Deployment Guide](./DEPLOYMENT.md)
3. Check [Database Schema](./DATABASE.md)

**For API Integration:**
1. Review [API Reference](./API.md)
2. Check [Technology Stack](./TECH_STACK.md)

## 🤝 Contributing

When contributing:
1. Follow TypeScript strict mode
2. Write tests for new features
3. Update relevant documentation
4. Follow security best practices
5. Use conventional commit messages

## 📄 License

MIT License - See root LICENSE file for details

---

**Last Updated:** December 12, 2025  
**Version:** 2.0.0  
**Status:** Production Ready
