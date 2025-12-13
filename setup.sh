#!/bin/bash

# Notes Application Setup Script
# This script helps set up the development environment

set -e

echo "🚀 Setting up Notes Application..."
echo ""

# Check for pnpmy
if ! command -v pnpm &> /dev/null; then
    echo "❌ pnpm is not installed. Please install it first:"
    echo "   npm install -g pnpm"
    exit 1
fi

echo "✅ pnpm is installed"

# Check for PostgreSQL
if ! command -v psql &> /dev/null; then
    echo "⚠️  PostgreSQL CLI (psql) not found. Make sure PostgreSQL is installed."
    echo "   You can also use Docker: docker run --name notes-postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=notes_db -p 5432:5432 -d postgres:16"
fi

# Install dependencies
echo ""
echo "📦 Installing dependencies..."
pnpm install

# Create .env if it doesn't exist
if [ ! -f .env ]; then
    echo ""
    echo "📝 Creating .env file from .env.example..."
    cp .env.example .env
    echo "⚠️  Please edit .env and configure your DATABASE_URL"
else
    echo ""
    echo "✅ .env file already exists"
fi

# Build shared packages
echo ""
echo "🔨 Building shared packages..."
pnpm --filter @notes/types build
pnpm --filter @notes/ui-lib build

# Prompt for database setup
echo ""
read -p "Do you want to run database migrations now? (y/n) " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "🗄️  Running Prisma migrations..."
    cd apps/backend
    pnpm prisma:generate
    pnpm prisma:migrate
    cd ../..
    echo "✅ Database setup complete"
else
    echo "⚠️  Remember to run migrations later:"
    echo "   cd apps/backend && pnpm prisma:migrate"
fi

echo ""
echo "✨ Setup complete!"
echo ""
echo "To start the application:"
echo "   pnpm dev"
echo ""
echo "Then open http://localhost:3000"
echo ""
echo "📚 Documentation available in the docs/ folder"
echo "   See docs/INDEX.md for a complete guide"
echo ""
