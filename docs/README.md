# Notes Application - System Documentation

**Complete system-level documentation for the Notes Application**

This documentation covers overall system architecture, deployment strategies, security model, and operational concerns.

---

## 📂 Documentation Structure

### 🏗️ [System Architecture](./system/)
High-level system design and technical architecture
- [Overview](./system/overview.md) - System overview and features
- [Architecture](./system/architecture.md) - System design and components  
- [Security Model](./system/security-model.md) - End-to-end security
- [Performance](./system/performance.md) - System-wide performance
- [Deployment](./system/deployment.md) - Deployment strategies
- [Observability](./system/observability.md) - Logging and monitoring
- [Features](./system/features.md) - Complete feature list
- [Logging](./system/logging.md) - Logging infrastructure

### 📝 [Architecture Decision Records](./adr/)
Important architectural decisions and their rationale
- [ADR-0001: Technology Stack](./adr/0001-tech-stack.md)
- [ADR-0002: Architecture Style](./adr/0002-architecture-style.md)
- [ADR-0003: Authentication Model](./adr/0003-authentication-model.md)
- [ADR-0004: Database Choice](./adr/0004-database-choice.md)
- [ADR-0005: Deployment Strategy](./adr/0005-deployment-strategy.md)

### 💻 [Development](./development/)
Developer guides and workflows
- [Onboarding](./development/onboarding.md) - Getting started guide
- [Local Setup](./development/local-setup.md) - Development environment
- [Conventions](./development/conventions.md) - Code standards and documentation structure
- [Branching & Release](./development/branching-release.md) - Git workflow
- [Debugging](./development/debugging.md) - Debugging techniques

### ⚙️ [Operations](./operations/)
Production operations and incident management
- [Runbooks](./operations/runbooks.md) - Operational procedures
- [Monitoring & Alerts](./operations/monitoring-alerts.md) - System monitoring
- [Incident Management](./operations/incident-management.md) - Incident response
- [Roadmap](./operations/roadmap.md) - Feature roadmap

---

## 📚 Component Documentation

### Backend
**[Backend Documentation](../apps/backend/docs/README.md)**  
API server, database, authentication, and backend services

### Frontend
**[Frontend Documentation](../apps/frontend/docs/README.md)**  
UI, state management, offline-first architecture

### Packages
**[Packages Documentation](../packages/docs/README.md)**  
Shared types, UI components, and utilities

---

## 🚀 Quick Links

### For New Developers
1. [Onboarding Guide](./development/onboarding.md)
2. [Local Setup](./development/local-setup.md)
3. [System Overview](./system/overview.md)

### For Architects
1. [System Architecture](./system/architecture.md)
2. [ADRs](./adr/)
3. [Security Model](./system/security-model.md)

### For DevOps
1. [Deployment Guide](./system/deployment.md)
2. [Operations Runbooks](./operations/runbooks.md)
3. [Monitoring](./operations/monitoring-alerts.md)

---

## 🛠️ Technology Stack

**Frontend:** Next.js 15, React 18, TypeScript, Tailwind CSS, TanStack Query, Dexie  
**Backend:** Express, Node.js, Prisma, PostgreSQL, Redis, TypeScript  
**Infrastructure:** Docker, AWS/GCP/Azure, GitHub Actions  
**Monitoring:** Pino (logging), Web Vitals, Custom metrics

---

## 📄 License

MIT License - See LICENSE file for details

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
