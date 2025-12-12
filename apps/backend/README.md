# Backend - Notes Application

Express backend with TypeScript, Prisma, and PostgreSQL.

## Quick Start with Docker

```bash
# Setup PostgreSQL with Docker
pnpm docker:setup

# Run migrations
pnpm prisma:migrate

# Start development server
pnpm dev
```

## Docker Commands

```bash
# Setup (first time)
pnpm docker:setup          # Create and start PostgreSQL container

# Daily use
pnpm docker:start          # Start existing container
pnpm docker:stop           # Stop container
pnpm docker:logs           # View logs
pnpm docker:shell          # Open psql shell

# Using docker-compose (alternative)
pnpm docker:compose        # Start with docker-compose
pnpm docker:compose:down   # Stop and remove containers
```

## Manual Docker Setup

```bash
# Run the setup script
./docker-setup.sh

# Or use docker-compose
docker-compose up -d

# Check status
docker ps
```

## Database Commands

```bash
# Generate Prisma client
pnpm prisma:generate

# Create/apply migrations
pnpm prisma:migrate

# Open Prisma Studio (GUI)
pnpm prisma:studio
```

## Development

```bash
# Start dev server with watch mode
pnpm dev

# Build for production
pnpm build

# Start production server
pnpm start
```

## Environment Variables

Create `.env` file:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/notes_db?schema=public"
```

## PostgreSQL Connection Info

When using Docker setup:
- **Host**: localhost
- **Port**: 5432
- **Database**: notes_db
- **User**: postgres
- **Password**: postgres

## Testing

```bash
# Run tests
pnpm test

# Run tests in watch mode
pnpm test -- --watch
```

## Troubleshooting

### Port 5432 already in use
```bash
# Stop existing PostgreSQL
docker stop notes-postgres

# Or kill the process
lsof -ti:5432 | xargs kill -9
```

### Container already exists
```bash
# Remove and recreate
docker rm -f notes-postgres
pnpm docker:setup
```

### Database connection issues
```bash
# Check if container is running
docker ps | grep postgres

# View logs
pnpm docker:logs

# Test connection
docker exec notes-postgres pg_isready -U postgres
```

## API Endpoints

- `GET /api/health` - Health check
- `POST /api/auth/login` - Login
- `POST /api/auth/logout` - Logout
- `GET /api/auth/me` - Current user
- `GET /api/notes` - List notes
- `GET /api/notes/:id` - Get note
- `POST /api/notes` - Create note
- `PATCH /api/notes/:id` - Update note
- `DELETE /api/notes/:id` - Delete note
