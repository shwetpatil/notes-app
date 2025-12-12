#!/bin/bash

# Docker PostgreSQL Setup Script for Notes Application
set -e

echo "🐳 Setting up PostgreSQL with Docker..."
echo ""

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first:"
    echo "   https://docs.docker.com/get-docker/"
    exit 1
fi

echo "✅ Docker is installed"
echo ""

# Stop and remove existing container if it exists
echo "🧹 Cleaning up old container..."
docker rm -f notes-postgres 2>/dev/null || true
echo ""

# Start fresh PostgreSQL container
echo "🚀 Starting PostgreSQL container..."
docker run --name notes-postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_DB=notes_db \
  -p 5432:5432 \
  -d postgres:16

echo ""
echo "⏳ Waiting for PostgreSQL to be ready..."
sleep 5

# Wait for PostgreSQL to be healthy
max_attempts=30
attempt=0
while [ $attempt -lt $max_attempts ]; do
    if docker exec notes-postgres pg_isready -U postgres > /dev/null 2>&1; then
        echo "✅ PostgreSQL is ready!"
        break
    fi
    attempt=$((attempt + 1))
    echo "   Attempt $attempt/$max_attempts..."
    sleep 1
done

if [ $attempt -eq $max_attempts ]; then
    echo "❌ PostgreSQL failed to start"
    exit 1
fi

echo ""
echo "🔍 Verifying database connection..."
docker exec notes-postgres psql -U postgres -d notes_db -c "SELECT version();" > /dev/null
echo "✅ Database connection verified!"

echo ""
echo "📊 PostgreSQL Info:"
echo "   Host: localhost"
echo "   Port: 5432"
echo "   Database: notes_db"
echo "   User: postgres"
echo "   Password: postgres"

echo ""
echo "✨ PostgreSQL is ready!"
echo ""
echo "Next steps:"
echo "   1. Run migrations: pnpm prisma:migrate"
echo "   2. Start backend: pnpm dev"
echo ""
echo "Useful commands:"
echo "   Stop:    docker stop notes-postgres"
echo "   Start:   docker start notes-postgres"
echo "   Logs:    docker logs notes-postgres"
echo "   Shell:   docker exec -it notes-postgres psql -U postgres -d notes_db"
echo ""
