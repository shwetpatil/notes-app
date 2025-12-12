# Quickstart Guide

Get the notes application running in 5 minutes.

## Prerequisites

- **Node.js** >= 20.0.0
- **pnpm** >= 9.0.0
- **Docker** (for PostgreSQL)
- **Git**

## Installation

### 1. Clone Repository

```bash
git clone https://github.com/shwetpatil/notes-app.git
cd notes-application
```

### 2. Install Dependencies

```bash
pnpm install
```

### 3. Setup Environment

```bash
# Copy environment template
cp .env.example .env

# Edit .env if needed (defaults work for local development)
```

### 4. Start Database

```bash
# Start PostgreSQL in Docker
docker compose up -d

# Verify database is running
docker ps
```

### 5. Initialize Database

```bash
# Push schema to database
cd apps/backend
npx prisma db push
cd ../..
```

### 6. Start Application

```bash
# Start both frontend and backend
pnpm dev
```

**Servers will start:**
- Frontend: http://localhost:3000
- Backend: http://localhost:3001

## First Steps

### 1. Create Account

1. Open http://localhost:3000
2. Click "Sign up"
3. Enter email and password (8+ characters)
4. Click "Create Account"

### 2. Create Your First Note

1. Click "+ New Note"
2. Add a title and content
3. Optional: Add tags, pin, or favorite
4. Content auto-saves

### 3. Explore Features

- **Favorite** ⭐ - Click star to mark important notes
- **Pin** 📌 - Keep notes at the top
- **Color** 🎨 - Assign colors to organize
- **Archive** 📦 - Hide completed notes
- **Trash** 🗑️ - Soft delete with recovery
- **Dark Mode** 🌙 - Toggle in sidebar
- **Sort** - By recent, date, or A-Z
- **Search** - Find notes instantly

## Common Issues

### Port Already in Use

```bash
# Kill processes on ports 3000 and 3001
lsof -ti:3000,3001 | xargs kill -9
```

### Database Connection Failed

```bash
# Check Docker is running
docker ps

# Restart PostgreSQL
docker compose restart

# Check DATABASE_URL in .env matches docker-compose.yml
```

### Prisma Client Not Generated

```bash
cd apps/backend
npx prisma generate
```

### Dependencies Not Found

```bash
# Clean install
rm -rf node_modules
pnpm install
```

## Development Commands

```bash
# Start all services
pnpm dev

# Backend only
pnpm --filter @notes/backend dev

# Frontend only
pnpm --filter @notes/frontend dev

# Build types package
pnpm --filter @notes/types build

# Run tests
pnpm test

# Database operations
cd apps/backend
npx prisma studio        # Open database GUI
npx prisma db push       # Push schema changes
npx prisma migrate dev   # Create migration
```

## Next Steps

- Read [Architecture Overview](./ARCHITECTURE.md) to understand the system
- Check [Features Guide](./FEATURES.md) for detailed feature documentation
- Review [Security Guide](./SECURITY.md) for production deployment
- See [Development Guide](./DEVELOPMENT.md) for workflows

## Quick Tips

💡 **Auto-save:** Notes save automatically as you type  
💡 **Offline:** Works without internet using IndexedDB  
💡 **Markdown:** Enable markdown rendering per note  
💡 **Remember Me:** Check on login for 30-day session  
💡 **Keyboard:** Use Tab to navigate fields quickly  

## Support

For issues or questions:
1. Check [Common Issues](#common-issues) above
2. Review [Development Guide](./DEVELOPMENT.md)
3. Check [Security Guide](./SECURITY.md) for security questions

---

**Ready to build?** Continue to [Architecture Overview](./ARCHITECTURE.md)
