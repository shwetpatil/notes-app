# Backend Configuration

**Environment Configuration & Settings for Notes Application Backend**

---

## Environment Variables

### Required Variables

```env
# Database Connection
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE"
# Example: postgresql://postgres:postgres@localhost:5432/notes_app

# Session Secret (Generate with: openssl rand -base64 32)
SESSION_SECRET="your-super-secret-key-change-this-in-production"

# Environment
NODE_ENV="development"  # development | production | test

# Server Port
PORT=3001

# CORS (Frontend URL)
CORS_ORIGIN="http://localhost:3000"

# Cluster Mode
CLUSTER_MODE="false"  # true | false
```

### Optional Variables

```env
# Session Configuration
SESSION_MAX_AGE=86400000          # 24 hours in milliseconds
SESSION_REMEMBER_MAX_AGE=2592000000  # 30 days in milliseconds

# Rate Limiting
RATE_LIMIT_AUTH_MAX=5             # Max auth requests per window
RATE_LIMIT_AUTH_WINDOW=900000     # 15 minutes
RATE_LIMIT_API_MAX=100            # Max API requests per window
RATE_LIMIT_API_WINDOW=900000      # 15 minutes

# Security
BCRYPT_ROUNDS=12                  # Password hashing rounds (8-14)
MAX_LOGIN_ATTEMPTS=5              # Before account lockout
ACCOUNT_LOCKOUT_DURATION=900000   # 15 minutes

# Logging
LOG_LEVEL="info"                  # error | warn | info | debug
LOG_FILE="logs/backend.log"       # Log file path

# Redis (Optional - for production session store)
REDIS_URL="redis://localhost:6379"

# Monitoring (Optional)
SENTRY_DSN="https://..."          # Error tracking
```

---

## Configuration Files

### 1. Environment Files

**Directory Structure:**
```
apps/backend/
├── .env                 # Development (gitignored)
├── .env.example         # Template (committed)
├── .env.test            # Test environment
├── .env.production      # Production (deploy-specific)
└── .env.local           # Local overrides (gitignored)
```

**.env.example (Template):**
```env
# Copy this to .env and fill in your values

# Database
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/notes_app"

# Session
SESSION_SECRET="change-this-to-a-random-string"

# Environment
NODE_ENV="development"
PORT=3001

# CORS
CORS_ORIGIN="http://localhost:3000"

# Cluster
CLUSTER_MODE="false"
```

**.env.test (Testing):**
```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/notes_test"
SESSION_SECRET="test-secret-key"
NODE_ENV="test"
CLUSTER_MODE="false"
PORT=3001
```

**.env.production (Production):**
```env
DATABASE_URL="${DATABASE_URL}"  # From hosting provider
SESSION_SECRET="${SESSION_SECRET}"  # From secrets manager
NODE_ENV="production"
PORT=3001
CORS_ORIGIN="https://your-app.com"
CLUSTER_MODE="true"
REDIS_URL="${REDIS_URL}"
```

---

### 2. TypeScript Configuration (tsconfig.json)

```json
{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "module": "commonjs",
    "target": "ES2022",
    "lib": ["ES2022"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "types": ["node", "express", "jest"]
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "**/*.test.ts"]
}
```

---

### 3. Prisma Configuration (prisma/schema.prisma)

```prisma
generator client {
  provider = "prisma-client-js"
  output   = "../node_modules/.prisma/client"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id                   String    @id @default(cuid())
  email                String    @unique
  password             String
  name                 String?
  failedLoginAttempts  Int       @default(0)
  accountLockedUntil   DateTime?
  lastLoginAt          DateTime?
  preferences          Json?
  notes                Note[]
  createdAt            DateTime  @default(now())
  updatedAt            DateTime  @updatedAt
}

model Note {
  id         String   @id @default(cuid())
  title      String
  content    String   @default("")
  tags       String[] @default([])
  color      String?
  isPinned   Boolean  @default(false)
  isFavorite Boolean  @default(false)
  isArchived Boolean  @default(false)
  isMarkdown Boolean  @default(false)
  isTrashed  Boolean  @default(false)
  trashedAt  DateTime?
  userId     String
  user       User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt

  @@index([userId])
  @@index([updatedAt])
  @@index([isPinned])
  @@index([isFavorite])
  @@index([isArchived])
  @@index([isTrashed])
}

model Session {
  id        String   @id @default(cuid())
  sid       String   @unique
  data      String
  expiresAt DateTime

  @@index([expiresAt])
}
```

---

### 4. Package.json Scripts

```json
{
  "name": "backend",
  "version": "1.0.0",
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "dev:cluster": "NODE_ENV=development CLUSTER_MODE=true tsx src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js",
    "start:cluster": "CLUSTER_MODE=true node dist/index.js",
    "prisma:generate": "prisma generate",
    "prisma:migrate": "prisma migrate dev",
    "prisma:migrate:deploy": "prisma migrate deploy",
    "prisma:studio": "prisma studio",
    "prisma:seed": "tsx prisma/seed.ts",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:coverage": "vitest run --coverage",
    "lint": "eslint src --ext .ts",
    "format": "prettier --write 'src/**/*.ts'"
  }
}
```

---

## Loading Configuration

### Environment Variable Loading

```typescript
// src/config/env.ts
import { config } from 'dotenv';
import { z } from 'zod';

// Load .env file
config();

// Validate environment variables
const envSchema = z.object({
  // Required
  DATABASE_URL: z.string().url(),
  SESSION_SECRET: z.string().min(32),
  NODE_ENV: z.enum(['development', 'production', 'test']),
  PORT: z.string().transform(Number),
  CORS_ORIGIN: z.string().url(),
  
  // Optional with defaults
  CLUSTER_MODE: z.string().transform(val => val === 'true').default('false'),
  SESSION_MAX_AGE: z.string().transform(Number).default('86400000'),
  BCRYPT_ROUNDS: z.string().transform(Number).default('12'),
  MAX_LOGIN_ATTEMPTS: z.string().transform(Number).default('5'),
  ACCOUNT_LOCKOUT_DURATION: z.string().transform(Number).default('900000'),
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
  REDIS_URL: z.string().url().optional(),
  SENTRY_DSN: z.string().url().optional()
});

export const env = envSchema.parse(process.env);

// Type-safe access
export type Env = z.infer<typeof envSchema>;
```

**Usage:**
```typescript
import { env } from './config/env';

// Type-safe, validated access
const port = env.PORT;              // number
const isCluster = env.CLUSTER_MODE; // boolean
const dbUrl = env.DATABASE_URL;     // string (validated URL)
```

---

## Configuration Management

### Development Configuration

```typescript
// src/config/development.ts
export const developmentConfig = {
  server: {
    port: 3001,
    host: 'localhost',
    cluster: false
  },
  database: {
    url: process.env.DATABASE_URL,
    logging: true,
    connectionLimit: 10
  },
  session: {
    secret: process.env.SESSION_SECRET,
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    secure: false, // HTTP in dev
    sameSite: 'lax' as const
  },
  cors: {
    origin: 'http://localhost:3000',
    credentials: true
  },
  rateLimit: {
    auth: { max: 5, windowMs: 15 * 60 * 1000 },
    api: { max: 100, windowMs: 15 * 60 * 1000 }
  },
  logging: {
    level: 'debug',
    console: true,
    file: false
  }
};
```

### Production Configuration

```typescript
// src/config/production.ts
export const productionConfig = {
  server: {
    port: parseInt(process.env.PORT || '3001'),
    host: '0.0.0.0',
    cluster: true
  },
  database: {
    url: process.env.DATABASE_URL,
    logging: false,
    connectionLimit: 20
  },
  session: {
    secret: process.env.SESSION_SECRET!,
    maxAge: 24 * 60 * 60 * 1000,
    secure: true, // HTTPS only
    sameSite: 'strict' as const,
    store: 'redis' // Use Redis in production
  },
  cors: {
    origin: process.env.CORS_ORIGIN,
    credentials: true
  },
  rateLimit: {
    auth: { max: 5, windowMs: 15 * 60 * 1000 },
    api: { max: 1000, windowMs: 15 * 60 * 1000 }
  },
  logging: {
    level: 'warn',
    console: false,
    file: true,
    path: '/var/log/app/backend.log'
  },
  monitoring: {
    sentryDsn: process.env.SENTRY_DSN,
    enableMetrics: true
  }
};
```

### Configuration Factory

```typescript
// src/config/index.ts
import { developmentConfig } from './development';
import { productionConfig } from './production';
import { testConfig } from './test';

export function getConfig() {
  switch (process.env.NODE_ENV) {
    case 'production':
      return productionConfig;
    case 'test':
      return testConfig;
    case 'development':
    default:
      return developmentConfig;
  }
}

export const config = getConfig();
```

---

## Security Best Practices

### 1. Never Commit Secrets

**.gitignore:**
```
.env
.env.local
.env.*.local
*.key
*.pem
secrets.json
```

### 2. Use Environment-Specific Files

```bash
# Development
cp .env.example .env
# Edit .env with local values

# Production
# Use hosting provider's environment variables
# Or secret management service (AWS Secrets Manager, etc.)
```

### 3. Validate All Environment Variables

```typescript
// Fail fast if required variables missing
if (!process.env.SESSION_SECRET) {
  throw new Error('SESSION_SECRET is required');
}

if (process.env.NODE_ENV === 'production' && !process.env.REDIS_URL) {
  console.warn('REDIS_URL not set. Using memory session store.');
}
```

### 4. Rotate Secrets Regularly

```bash
# Generate new session secret
openssl rand -base64 32

# Update in production environment
# Restart all server instances
```

---

## Docker Configuration

### Dockerfile

```dockerfile
FROM node:20-alpine AS base
WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Dependencies
FROM base AS deps
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# Build
FROM base AS build
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN pnpm prisma:generate
RUN pnpm build

# Production
FROM base AS production
ENV NODE_ENV=production

COPY --from=build /app/dist ./dist
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/prisma ./prisma
COPY package.json ./

EXPOSE 3001
CMD ["node", "dist/index.js"]
```

### docker-compose.yml

```yaml
version: '3.8'

services:
  backend:
    build: .
    ports:
      - "3001:3001"
    environment:
      DATABASE_URL: postgresql://postgres:postgres@db:5432/notes_app
      SESSION_SECRET: ${SESSION_SECRET}
      NODE_ENV: production
      CLUSTER_MODE: "true"
      CORS_ORIGIN: http://localhost:3000
    depends_on:
      - db
      - redis
    restart: unless-stopped

  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: notes_app
    volumes:
      - postgres-data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis-data:/data

volumes:
  postgres-data:
  redis-data:
```

---

## Troubleshooting

### Issue: "SESSION_SECRET is not set"
```bash
# Generate a secure secret
openssl rand -base64 32

# Add to .env
echo "SESSION_SECRET=\"your-generated-secret\"" >> .env
```

### Issue: "Cannot connect to database"
```bash
# Check DATABASE_URL format
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE"

# Test connection
psql $DATABASE_URL -c "SELECT 1"

# Check PostgreSQL is running
docker ps | grep postgres
```

### Issue: "Port 3001 already in use"
```bash
# Find process using port
lsof -i :3001

# Kill process
kill -9 <PID>

# Or use different port
PORT=3002 pnpm dev
```

---

## Configuration Checklist

### Development Setup
- [ ] Copy `.env.example` to `.env`
- [ ] Set `DATABASE_URL` to local PostgreSQL
- [ ] Generate `SESSION_SECRET`
- [ ] Set `NODE_ENV=development`
- [ ] Set `CORS_ORIGIN=http://localhost:3000`
- [ ] Run `pnpm prisma:generate`
- [ ] Run `pnpm prisma:migrate`

### Production Deployment
- [ ] Set all required environment variables
- [ ] Use strong `SESSION_SECRET` (32+ characters)
- [ ] Set `NODE_ENV=production`
- [ ] Enable `CLUSTER_MODE=true`
- [ ] Use HTTPS `CORS_ORIGIN`
- [ ] Configure `REDIS_URL` for sessions
- [ ] Set up monitoring (`SENTRY_DSN`)
- [ ] Run `pnpm prisma:migrate:deploy`
- [ ] Enable connection pooling in `DATABASE_URL`

---

**Last Updated**: December 13, 2025  
**Configuration Version**: 1.0
