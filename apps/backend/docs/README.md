# Backend Documentation

**Notes Application Backend - Express.js + Prisma + PostgreSQL + TypeScript**

Complete technical documentation for the backend API server, database, and authentication services.

---

## 🚀 Quick Start

```bash
# Install dependencies
cd apps/backend
pnpm install

# Setup database
pnpm prisma:generate
pnpm prisma:migrate

# Start development server
pnpm dev

# Start with cluster mode (use all CPU cores)
./quick-start.sh  # Select option 2 or 4
```

---

## � Documentation Structure

### 🏗️ [System Architecture](./system/)
Core technical architecture and design
- [Architecture](./system/architecture.md) - Backend design and organization
- [Database](./system/database.md) - PostgreSQL schema and operations
- [API Reference](./system/api-reference.md) - REST API endpoints
- [Performance](./system/performance.md) - Optimization strategies
- [Security](./system/security.md) - Security architecture
- [Authentication](./system/authentication.md) - JWT authentication system
- [Features](./system/features.md) - Backend features
- [Tech Stack](./system/tech-stack.md) - Technology choices
- [Observability](./system/observability.md) - Logging and monitoring
- [Database Security](./system/database-security.md) - Database security measures

### 📝 [Architecture Decision Records](./adr/)
Key technical decisions and rationale
- [ADR-0001: Express vs Fastify](./adr/0001-express-choice.md) *(to be created)*
- [ADR-0002: Prisma ORM](./adr/0002-prisma-orm.md) *(to be created)*
- [ADR-0003: JWT Strategy](./adr/0003-jwt-strategy.md) *(to be created)*
- [ADR-0004: Logging Framework](./adr/0004-logging-framework.md) *(to be created)*
- [ADR-0005: Error Handling Pattern](./adr/0005-error-handling.md) *(to be created)*

### 💻 [Development](./development/)
Developer guides and workflows
- [Quickstart](./development/quickstart.md) - Getting started with backend
- [Configuration](./development/configuration.md) - Environment configuration
- [Testing](./development/testing.md) - Testing strategy and practices
- [Advanced Features](./development/advanced-features.md) - Advanced capabilities
- [Debugging](./development/debugging.md) - Debugging techniques *(to be created)*
- [Database Migrations](./development/migrations.md) - Managing schema changes *(to be created)*

### ⚙️ [Operations](./operations/)
Deployment and production operations
- [Deployment](./operations/deployment.md) - Deployment strategies
- [Roadmap](./operations/roadmap.md) - Feature roadmap
- [Production Features](./operations/production-features.md) - Production capabilities
- [Monitoring & Alerts](./operations/monitoring-alerts.md) - System monitoring *(to be created)*
- [Runbooks](./operations/runbooks.md) - Operational procedures *(to be created)*
- [Incident Response](./operations/incident-response.md) - Handling incidents *(to be created)*

---

## 🚀 Quick Links

### For New Developers
1. [Quickstart Guide](./development/quickstart.md)
2. [Architecture Overview](./system/architecture.md)
3. [API Reference](./system/api-reference.md)

### For Backend Engineers
1. [System Architecture](./system/architecture.md)
2. [Database Design](./system/database.md)
3. [Authentication System](./system/authentication.md)
4. [Testing Guide](./development/testing.md)

### For DevOps
1. [Deployment Guide](./operations/deployment.md)
2. [Production Features](./operations/production-features.md)
3. [Monitoring](./operations/monitoring-alerts.md) *(to be created)*

---

## 🛠️ Technology Stack

**Runtime:** Node.js 20+ with TypeScript 5.6  
**Framework:** Express 5.0  
**Database:** PostgreSQL 16+ with Prisma 6.8  
**Security:** JWT, bcrypt, Helmet, rate limiting  
**Testing:** Jest 30.2, Supertest, Vitest  
**Logging:** Pino  

---

## 🔗 Related Documentation

- [System Documentation](../../../docs/README.md) - Overall system architecture
- [Frontend Documentation](../../frontend/docs/README.md) - Frontend UI and state management
- [Packages Documentation](../../../packages/docs/README.md) - Shared types and UI components

---

## 🎯 Quick Commands Reference

```bash
# Development
pnpm dev                    # Start dev server (port 3001)
pnpm dev:cluster            # Start with cluster mode

# Database
pnpm prisma:generate        # Generate Prisma client
pnpm prisma:migrate         # Create migration
pnpm prisma:migrate:deploy  # Apply migrations (production)
pnpm prisma:studio          # Database GUI

# Testing
pnpm test                   # Run all tests
pnpm test:watch             # Watch mode
pnpm test:coverage          # Coverage report

# Build & Deploy
pnpm build                  # Build for production
pnpm start                  # Start production server
pnpm start:cluster          # Production with cluster mode

# Code Quality
pnpm lint                   # Lint code
pnpm format                 # Format code
```

---

## 📂 Backend Structure

```
apps/backend/
├── src/
│   ├── index.ts            # Entry point (cluster or single)
│   ├── server.ts           # Express app setup
│   ├── cluster.ts          # Cluster mode implementation
│   ├── routes/             # API route handlers
│   │   ├── auth.ts         # Authentication endpoints
│   │   ├── notes.ts        # Notes CRUD endpoints
│   │   ├── health.ts       # Health check endpoint
│   │   └── metrics.ts      # Metrics endpoint
│   ├── middleware/         # Express middleware
│   │   ├── auth.ts         # requireAuth middleware
│   │   ├── errorHandler.ts # Global error handler
│   │   ├── monitoring.ts   # Performance monitoring
│   │   └── sanitize.ts     # XSS sanitization
│   ├── lib/                # Utilities
│   │   └── prisma.ts       # Prisma client instance
│   └── __tests__/          # Test files
│       ├── setup.ts        # Test lifecycle hooks
│       ├── helpers.ts      # Test utilities
│       ├── auth.test.ts    # Auth tests (16 tests)
│       ├── notes.test.ts   # Notes tests (47 tests)
│       ├── middleware.test.ts # Middleware tests (20 tests)
│       └── health.test.ts  # Health tests (17 tests)
├── prisma/
│   ├── schema.prisma       # Database schema
│   └── migrations/         # Database migrations
├── docs/                   # This documentation
├── infrastructure/         # Cloud deployment templates
│   ├── aws/                # AWS ECS/Fargate
│   ├── gcp/                # GCP Cloud Run
│   └── azure/              # Azure Container Instances
├── docker-compose.yml      # Local development setup
├── Dockerfile              # Production container image
├── vitest.config.ts        # Test configuration
└── package.json            # Dependencies & scripts
```

---

## 🚦 API Endpoints Quick Reference

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login with credentials
- `POST /api/auth/logout` - Logout (clear session)
- `GET /api/auth/me` - Get current user

### Notes
- `GET /api/notes` - List all notes (with filters)
- `GET /api/notes/:id` - Get single note
- `POST /api/notes` - Create note
- `PUT /api/notes/:id` - Update note
- `DELETE /api/notes/:id` - Delete note permanently
- `PATCH /api/notes/:id/favorite` - Toggle favorite
- `PATCH /api/notes/:id/trash` - Move to trash
- `PATCH /api/notes/:id/restore` - Restore from trash
- `PATCH /api/notes/:id/pin` - Toggle pin
- `PATCH /api/notes/:id/archive` - Toggle archive

### Monitoring
- `GET /api/health` - Health check (for load balancers)
- `GET /api/metrics` - Server metrics (memory, CPU, requests)

**Full API documentation:** [API.md](./API.md)

---

## 🔧 Environment Variables

### Required
```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE"
SESSION_SECRET="your-super-secret-key-change-this"
NODE_ENV="development"
PORT=3001
CORS_ORIGIN="http://localhost:3000"
CLUSTER_MODE="false"
```

### Optional
```env
SESSION_MAX_AGE=86400000
BCRYPT_ROUNDS=12
MAX_LOGIN_ATTEMPTS=5
REDIS_URL="redis://localhost:6379"
SENTRY_DSN="https://..."
```

**Full configuration guide:** [CONFIGURATION.md](./CONFIGURATION.md)

---

## 🤝 Contributing

See [System Development Guide](../../../docs/DEVELOPMENT.md) for:
- Git workflow
- Code review process
- Testing requirements
- Pull request guidelines

---

## 📞 Support

- **Backend Issues**: Open an issue with "backend:" prefix
- **API Questions**: See [API.md](./API.md)
- **Security**: See [SECURITY.md](./SECURITY.md) for responsible disclosure

---

**Last Updated**: December 13, 2025  
**Backend Version**: 1.0.0  
**Documentation Version**: 3.0

📏 **[SCALING.md](./SCALING.md)** - Scaling strategies
- Vertical scaling (cluster mode)
- Horizontal scaling (multiple instances)
- Resource allocation
- Performance tuning

---

## Project Structure

```
apps/backend/
├── src/
│   ├── routes/           # API endpoints
│   │   ├── auth.ts       # Authentication (login, register, logout)
│   │   ├── notes.ts      # Notes CRUD operations
│   │   ├── health.ts     # Health check endpoint
│   │   └── metrics.ts    # Performance metrics
│   ├── middleware/       # Express middleware
│   │   ├── auth.ts       # requireAuth middleware
│   │   ├── errorHandler.ts
│   │   ├── monitoring.ts # Performance tracking
│   │   └── sanitize.ts   # Input sanitization
│   ├── lib/
│   │   └── prisma.ts     # Database client
│   ├── cluster.ts        # Cluster mode (multi-process)
│   ├── server.ts         # Express app setup
│   └── index.ts          # Entry point
├── prisma/
│   ├── schema.prisma     # Database schema
│   └── migrations/       # Database migrations
├── docs/                 # This directory
├── .env.example          # Environment variables template
├── package.json
└── tsconfig.json
```

---

## API Endpoints

### Authentication
- `POST /api/auth/register` - Create new user
- `POST /api/auth/login` - Login (creates session)
- `POST /api/auth/logout` - Logout (destroys session)
- `GET /api/auth/me` - Get current user

### Notes
- `GET /api/notes` - Get all user's notes
- `GET /api/notes/:id` - Get specific note
- `POST /api/notes` - Create note
- `PUT /api/notes/:id` - Update note
- `DELETE /api/notes/:id` - Delete note
- `PATCH /api/notes/:id/trash` - Move to trash
- `PATCH /api/notes/:id/restore` - Restore from trash

### Monitoring
- `GET /api/health` - Health check
- `GET /api/metrics` - Performance metrics
- `POST /api/metrics/vitals` - Submit Core Web Vitals (from frontend)

---

## Environment Variables

```dotenv
# Server
BACKEND_PORT=3001
NODE_ENV=development|production

# Database
DATABASE_URL="postgresql://user:pass@localhost:5432/notes_db"

# Security
SESSION_SECRET="your-strong-random-secret"
CORS_ORIGIN="http://localhost:3000"

# Scaling (optional)
CLUSTER_MODE=false|true
MAX_WORKERS=4

# Monitoring (optional)
ENABLE_MEMORY_MONITORING=true
ENABLE_PERFORMANCE_LOGGING=true
```

**Generate strong secret**:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## Development

### Database

```bash
# Generate Prisma client
pnpm prisma:generate

# Create migration
pnpm prisma:migrate:dev

# Reset database (WARNING: deletes all data)
pnpm prisma:migrate:reset

# Open Prisma Studio (database GUI)
pnpm prisma:studio
```

### Testing

```bash
# Run tests
pnpm test

# Run tests with coverage
pnpm test:coverage

# Run specific test file
pnpm test src/__tests__/api.test.ts
```

### Linting & Formatting

```bash
# Lint code
pnpm lint

# Format code
pnpm format
```

---

## Cluster Mode

**What it does**: Runs multiple Node.js processes (one per CPU core) to handle more concurrent requests.

**Enable**:
```dotenv
CLUSTER_MODE=true
MAX_WORKERS=4  # Or leave empty to use all CPU cores
```

**Performance**:
- Single process: ~250 req/s
- Cluster (4 workers): ~900 req/s (**3.6x improvement**)

**When to use**:
- ✅ Production with high traffic
- ✅ Multi-core server (4+ cores)
- ❌ Development (harder to debug)
- ❌ Docker/Kubernetes (they handle scaling)

See [PERFORMANCE.md](./PERFORMANCE.md) for details.

---

## Monitoring

### Health Check

```bash
curl http://localhost:3001/api/health
```

Response:
```json
{
  "status": "ok",
  "timestamp": "2025-12-13T10:00:00.000Z",
  "uptime": 123.456
}
```

### Metrics

```bash
curl http://localhost:3001/api/metrics
```

Returns:
- Request counts (total, success, errors)
- Response times (avg, p50, p95, p99)
- Active connections
- Memory usage
- Uptime

See [MONITORING.md](./MONITORING.md) for details.

---

## Common Commands

```bash
# Development
pnpm dev                    # Start dev server (watch mode)
pnpm dev:cluster            # Start with cluster mode

# Production
pnpm build                  # Compile TypeScript
pnpm start                  # Start production server
pnpm start:cluster          # Start with cluster mode

# Database
pnpm prisma:generate        # Generate Prisma client
pnpm prisma:migrate         # Run migrations
pnpm prisma:studio          # Open database GUI

# Docker
docker-compose up           # Start with Docker
docker-compose up -d        # Start in background
docker-compose logs -f      # View logs
docker-compose down         # Stop and remove containers

# Quick start script
./quick-start.sh            # Interactive menu
```

---

## Troubleshooting

### Database connection failed

```
Error: Can't reach database server at localhost:5432
```

**Solution**: Start PostgreSQL or Docker container:
```bash
docker run --name notes-postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=notes_db \
  -p 5432:5432 \
  -d postgres:16
```

### Port already in use

```
Error: listen EADDRINUSE :::3001
```

**Solution**: Kill process using port:
```bash
lsof -ti:3001 | xargs kill -9
```

### Prisma client not found

```
Error: Cannot find module '@prisma/client'
```

**Solution**: Generate Prisma client:
```bash
cd apps/backend
pnpm prisma:generate
```

### Session/authentication not working

- Check `SESSION_SECRET` is set in `.env`
- Verify `CORS_ORIGIN` matches frontend URL
- Ensure cookies are enabled in browser
- Check `credentials: true` in frontend API calls

---

## Production Checklist

- [ ] Set strong `SESSION_SECRET` (32+ characters)
- [ ] Configure `DATABASE_URL` with SSL
- [ ] Set `NODE_ENV=production`
- [ ] Set `CORS_ORIGIN` to production domain
- [ ] Enable `CLUSTER_MODE` for multi-core servers
- [ ] Configure database connection pool
- [ ] Set up monitoring and logging
- [ ] Run `pnpm audit` and fix vulnerabilities
- [ ] Test with load testing tools
- [ ] Set up automated backups
- [ ] Configure health check endpoint for load balancer

See [SECURITY.md](./SECURITY.md) and [DEPLOYMENT.md](./DEPLOYMENT.md) for complete checklists.

---

## Tech Stack

- **Runtime**: Node.js 20+
- **Framework**: Express.js
- **Database**: PostgreSQL 16+ with Prisma ORM
- **Authentication**: express-session + bcrypt
- **Validation**: Zod (from @notes/types package)
- **Security**: Helmet.js, CORS, rate-limit
- **Language**: TypeScript
- **Process Management**: Native cluster module

---

## Additional Resources

- [Express.js Documentation](https://expressjs.com/)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Node.js Cluster Module](https://nodejs.org/api/cluster.html)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)

---

**Last Updated**: December 13, 2025  
**Questions?** Check individual documentation files or open an issue.