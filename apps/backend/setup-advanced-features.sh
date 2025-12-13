#!/bin/bash

# Advanced Features Setup Script
# Sets up Redis, runs migrations, and verifies installations

set -e

echo "🚀 Setting up Advanced Features for Notes Application"
echo "======================================================"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if we're in the backend directory
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ Error: Must run from apps/backend directory${NC}"
    exit 1
fi

echo ""
echo "📦 Step 1: Installing dependencies..."
pnpm install

echo ""
echo "🐳 Step 2: Setting up Redis..."
if docker ps -a | grep -q notes-redis; then
    echo -e "${YELLOW}Redis container already exists${NC}"
    docker start notes-redis 2>/dev/null || echo -e "${YELLOW}Redis already running${NC}"
else
    echo "Creating Redis container..."
    docker run --name notes-redis -p 6379:6379 -d redis:7-alpine
fi

# Test Redis connection
echo "Testing Redis connection..."
sleep 2
if docker exec notes-redis redis-cli ping | grep -q "PONG"; then
    echo -e "${GREEN}✅ Redis is running${NC}"
else
    echo -e "${RED}❌ Redis connection failed${NC}"
    exit 1
fi

echo ""
echo "🗄️  Step 3: Setting up PostgreSQL..."
if docker ps -a | grep -q notes-postgres; then
    echo -e "${YELLOW}PostgreSQL container already exists${NC}"
    docker start notes-postgres 2>/dev/null || echo -e "${YELLOW}PostgreSQL already running${NC}"
else
    echo "Creating PostgreSQL container..."
    docker run --name notes-postgres \
        -e POSTGRES_PASSWORD=postgres \
        -e POSTGRES_DB=notes_db \
        -p 5432:5432 \
        -d postgres:16
fi

# Wait for PostgreSQL to be ready
echo "Waiting for PostgreSQL to be ready..."
sleep 5
if docker exec notes-postgres pg_isready -U postgres | grep -q "accepting connections"; then
    echo -e "${GREEN}✅ PostgreSQL is running${NC}"
else
    echo -e "${RED}❌ PostgreSQL connection failed${NC}"
    exit 1
fi

echo ""
echo "🔄 Step 4: Running database migrations..."
pnpm prisma generate
pnpm prisma migrate deploy

echo ""
echo "🔍 Step 5: Creating full-text search indexes..."
echo "This may take a few moments for large databases..."
# The migration file already handles this
echo -e "${GREEN}✅ Full-text search indexes created${NC}"

echo ""
echo "📋 Step 6: Environment configuration..."
if [ ! -f ".env" ]; then
    echo "Creating .env from .env.example..."
    cp .env.example .env
    echo -e "${YELLOW}⚠️  Please update .env with your configuration${NC}"
else
    echo -e "${GREEN}✅ .env file already exists${NC}"
fi

echo ""
echo "🧪 Step 7: Testing setup..."

# Test Redis
echo -n "Testing Redis... "
if docker exec notes-redis redis-cli ping | grep -q "PONG"; then
    echo -e "${GREEN}✅${NC}"
else
    echo -e "${RED}❌${NC}"
fi

# Test PostgreSQL
echo -n "Testing PostgreSQL... "
if docker exec notes-postgres pg_isready -U postgres | grep -q "accepting connections"; then
    echo -e "${GREEN}✅${NC}"
else
    echo -e "${RED}❌${NC}"
fi

# Check if indexes exist
echo -n "Testing Full-Text Search indexes... "
INDEX_COUNT=$(docker exec notes-postgres psql -U postgres -d notes_db -t -c \
    "SELECT COUNT(*) FROM pg_indexes WHERE tablename = 'Note' AND indexname LIKE '%_gin_%';" | tr -d ' ')
if [ "$INDEX_COUNT" -ge 3 ]; then
    echo -e "${GREEN}✅ ($INDEX_COUNT indexes)${NC}"
else
    echo -e "${YELLOW}⚠️  Some indexes may be missing${NC}"
fi

echo ""
echo "======================================================"
echo -e "${GREEN}✅ Setup Complete!${NC}"
echo ""
echo "📚 Next Steps:"
echo "1. Update .env file with your configuration"
echo "2. Run 'pnpm dev' to start the development server"
echo "3. Check the documentation in docs/ADVANCED_FEATURES.md"
echo ""
echo "🔗 Useful Commands:"
echo "  - Start server:       pnpm dev"
echo "  - Run tests:          pnpm test"
echo "  - Redis CLI:          docker exec -it notes-redis redis-cli"
echo "  - PostgreSQL CLI:     docker exec -it notes-postgres psql -U postgres -d notes_db"
echo "  - View logs:          docker logs notes-redis"
echo "  - Stop services:      docker stop notes-redis notes-postgres"
echo ""
echo "🌐 Service URLs:"
echo "  - API:                http://localhost:4000"
echo "  - API v1:             http://localhost:4000/api/v1"
echo "  - Health Check:       http://localhost:4000/api/health"
echo "  - Redis:              localhost:6379"
echo "  - PostgreSQL:         localhost:5432"
echo ""
