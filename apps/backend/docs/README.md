# Backend Documentation

**Notes Application Backend**  
**Stack**: Express.js + Prisma + PostgreSQL + TypeScript

---

## Quick Start

```bash
# Install dependencies
pnpm install

# Setup database
cd apps/backend
pnpm prisma:generate
pnpm prisma:migrate

# Start development server
pnpm dev

# Start with cluster mode (use all CPU cores)
./quick-start.sh
# Select option 2 or 4
```

---

## Documentation Index

### Core Documentation

🏗️ **[ARCHITECTURE.md](./ARCHITECTURE.md)** - System architecture
- System overview & technology stack
- Request flow diagrams
- Cluster mode architecture
- Database design & connection pooling
- Security layers
- Deployment architectures

📖 **[SECURITY.md](./SECURITY.md)** - Security implementation
- Authentication & authorization
- Password security (bcrypt)
- Session management
- Rate limiting
- Attack prevention
- Security checklist

⚡ **[PERFORMANCE.md](./PERFORMANCE.md)** - Performance optimization
- Database indexing & query optimization

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