# Backend Documentation

**Notes Application Backend - Express.js + Prisma + PostgreSQL + TypeScript**

This documentation covers all backend-specific concerns. For system-level documentation, see [System Documentation](../../../docs/README.md).

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

## 📚 Documentation Index

### 🏗️ Architecture & Design

**[ARCHITECTURE.md](./ARCHITECTURE.md)** - Backend architecture
- Backend technology stack (Express + TypeScript + Prisma)
- Layer architecture (4-layer pattern)
- Request lifecycle (detailed)
- Middleware chain visualization
- Core middleware explained
- Performance monitoring
- Cluster mode architecture
- Design patterns and best practices

**[DATABASE.md](./DATABASE.md)** - Database design
- PostgreSQL schema (User, Note, Session tables)
- Entity relationship diagrams
- Indexing strategy
- Query optimization
- Data types & constraints
- Migrations
- Backup & recovery

---

### 🔒 Security

**[SECURITY.md](./SECURITY.md)** - Security implementation
- Multi-layer security architecture
- Password hashing (bcrypt)
- Session management
- Rate limiting
- Attack prevention (XSS, CSRF, SQL injection)
- Security headers (Helmet)
- Security checklist

**[AUTH.md](./AUTH.md)** - Authentication & Authorization
- Session-based authentication
- Registration flow
- Login flow with account lockout
- Session verification
- Row-level security
- Authorization patterns
- TypeScript type safety
- Testing authentication

---

### 📡 API & Integration

**[API.md](./API.md)** - API documentation
- RESTful endpoints
- Request/response formats
- Authentication endpoints
- Notes CRUD operations
- Health & metrics endpoints
- Error handling
- API examples

**[CONFIGURATION.md](./CONFIGURATION.md)** - Backend configuration
- Environment variables
- Configuration files (.env, tsconfig.json, prisma/schema.prisma)
- Loading configuration
- Development vs Production config
- Docker configuration
- Troubleshooting configuration

---

### ⚡ Performance & Operations

**[PERFORMANCE.md](./PERFORMANCE.md)** - Performance optimization
- Database indexing & query optimization
- Cluster mode (multi-core utilization)
- Connection pooling
- Query performance analysis
- Caching strategies
- Monitoring & profiling

**[DEPLOYMENT.md](./DEPLOYMENT.md)** - Backend deployment
- Docker containerization
- Cloud deployment (AWS ECS, GCP Cloud Run, Azure)
- Environment configuration
- Database migrations in production
- Health checks & load balancing
- Scaling strategies

---

### 🧪 Testing & Quality

**[TESTING.md](./TESTING.md)** - Testing guide
- Test setup & configuration
- Running tests (vitest)
- Test structure & organization
- Writing tests (auth, notes API, middleware, health)
- Test helpers & utilities
- Coverage reports
- CI/CD integration
- Troubleshooting tests

---

### 📖 Features & Reference

**[FEATURES.md](./FEATURES.md)** - Backend features
- Authentication system
- Notes CRUD operations
- Search & filtering
- Tags & organization
- Soft delete (trash)
- Rate limiting
- Security features

**[QUICKSTART.md](./QUICKSTART.md)** - Quick start guide
- Prerequisites
- Installation steps
- Database setup
- Running the server
- Verify setup
- Common commands

**[ROADMAP.md](./ROADMAP.md)** - Backend roadmap
- Current features (v1.0)
- Q1 2026: Real-time collaboration (WebSockets)
- Q2 2026: File attachments (S3), Search (Elasticsearch)
- Q3 2026: GraphQL API
- Q4 2026: AI features (summarization, auto-tagging)

**[TECH_STACK.md](./TECH_STACK.md)** - Backend technology stack
- Express.js 4.18 - Web framework
- Prisma ORM 5.7 - Database ORM
- PostgreSQL 16 - Database
- bcrypt 6.0 - Password hashing
- Zod 3.22 - Schema validation
- Full stack details with versions

---

## 🔗 Related Documentation

### System Documentation
- [System Architecture](../../../docs/ARCHITECTURE.md) - Overall system design
- [Deployment](../../../docs/DEPLOYMENT.md) - Full-stack deployment
- [Security Model](../../../docs/SECURITY.md) - System-wide security
- [Development Workflow](../../../docs/DEVELOPMENT.md) - Git workflow & practices

### Frontend Documentation
- [Frontend README](../../frontend/docs/README.md) - Frontend documentation
- [Frontend Architecture](../../frontend/docs/ARCHITECTURE.md) - Frontend design
- [API Integration](../../frontend/docs/API_INTEGRATION.md) - How frontend consumes backend API

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
**Documentation Version**: 2.0

🧪 **[TESTING.md](./TESTING.md)** - Testing guide
- Test setup & configuration
- Running tests & coverage
- Writing tests & best practices
- Test helpers & utilities
- Troubleshooting
- Cluster mode (multi-process)
- Memory management
- Monitoring & metrics
- Load testing

### Deployment & Operations

🚀 **[DEPLOYMENT.md](./DEPLOYMENT.md)** - Deployment guide
- Local development
- Docker deployment
- Production setup
- Environment configuration

☁️ **[CLOUD_DEPLOYMENT.md](./CLOUD_DEPLOYMENT.md)** - Cloud platforms
- AWS (ECS, Fargate)
- Google Cloud (Cloud Run)
- Azure (Container Instances)
- CI/CD with GitHub Actions

📊 **[MONITORING.md](./MONITORING.md)** - Monitoring & metrics
- Health checks
- Performance metrics
- Core Web Vitals tracking
- Error monitoring

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