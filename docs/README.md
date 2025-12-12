# Notes Application Documentation

Complete documentation for a production-ready full-stack notes application.

## 📚 Documentation Index

### Getting Started
- **[Quickstart Guide](./QUICKSTART.md)** - Setup and run in 5 minutes
- **[Installation](./INSTALLATION.md)** - Detailed installation instructions

### Architecture & Design
- **[Architecture Overview](./ARCHITECTURE.md)** - System design and patterns
- **[Technology Stack](./TECH_STACK.md)** - All technologies and their purpose
- **[Database Schema](./DATABASE.md)** - Data models and relationships

### Features
- **[Features Guide](./FEATURES.md)** - Complete feature documentation
- **[API Reference](./API.md)** - Backend API endpoints

### Development
- **[Development Guide](./DEVELOPMENT.md)** - Workflows and best practices
- **[Testing Guide](./TESTING.md)** - Testing strategies and commands

### Security & Production
- **[Security Guide](./SECURITY.md)** - Security implementations
- **[Deployment Guide](./DEPLOYMENT.md)** - Production deployment

## 🎯 Quick Reference

**Servers:**
- Frontend: http://localhost:3000
- Backend: http://localhost:3001  
- Database: PostgreSQL on port 5432

**Quick Commands:**
```bash
pnpm dev          # Start all services
pnpm test         # Run all tests
pnpm build        # Build for production
```

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
