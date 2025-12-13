# Backend Testing Guide

This document provides comprehensive information about testing the Notes Application backend.

## Table of Contents

- [Overview](#overview)
- [Test Setup](#test-setup)
- [Running Tests](#running-tests)
- [Test Structure](#test-structure)
- [Writing Tests](#writing-tests)
- [Coverage](#coverage)
- [Best Practices](#best-practices)
- [Troubleshooting](#troubleshooting)

## Overview

The backend uses **Vitest** as the testing framework with **Supertest** for API integration testing.

### Test Coverage

- ✅ Authentication API (register, login, logout, /me)
- ✅ Notes API (CRUD operations, filtering, search)
- ✅ Middleware (auth, sanitization, rate limiting, error handling)
- ✅ Health and Metrics endpoints
- ✅ Security features (XSS prevention, account lockout, rate limiting)

### Testing Stack

- **Vitest**: Fast unit test framework
- **Supertest**: HTTP assertion library
- **@vitest/coverage-v8**: Code coverage reporting
- **Prisma**: Database testing with isolated test database

## Test Setup

### 1. Create Test Database

```bash
# Create a separate PostgreSQL database for testing
createdb notes_test

# Or using psql
psql -U postgres -c "CREATE DATABASE notes_test;"
```

### 2. Configure Test Environment

Create `.env.test` file:

```bash
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/notes_test?schema=public"
SESSION_SECRET="test-secret-key"
CORS_ORIGIN="http://localhost:3000"
NODE_ENV="test"
CLUSTER_MODE="false"
PORT="3001"
```

**Important**: Always use a separate test database. Tests will delete all data before each test!

### 3. Run Migrations

```bash
# Apply database migrations to test database
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/notes_test?schema=public" pnpm prisma migrate deploy
```

### 4. Install Dependencies

```bash
pnpm install
```

## Running Tests

### Basic Commands

```bash
# Run all tests once
pnpm test

# Run tests in watch mode (auto-rerun on changes)
pnpm test:watch

# Run tests with coverage report
pnpm test:coverage

# Run tests with UI
pnpm test:ui
```

### Run Specific Test Files

```bash
# Run only auth tests
pnpm vitest run src/__tests__/auth.test.ts

# Run only notes tests
pnpm vitest run src/__tests__/notes.test.ts

# Run tests matching pattern
pnpm vitest run --grep "should create"
```

### Watch Mode Options

```bash
# Run in watch mode
pnpm test:watch

# In watch mode, press:
# a - run all tests
# f - run only failed tests
# p - filter by filename
# t - filter by test name
# q - quit
```

## Test Structure

### Directory Structure

```
src/
  __tests__/
    setup.ts              # Test setup and cleanup
    helpers.ts            # Test utilities and helpers
    auth.test.ts          # Authentication tests
    notes.test.ts         # Notes API tests
    middleware.test.ts    # Middleware tests
    health.test.ts        # Health/metrics tests
```

### Test File Organization

Each test file follows this pattern:

```typescript
import { describe, it, expect } from "vitest";
import { registerUser, loginUser } from "./helpers";

describe("Feature Name", () => {
  describe("Specific Functionality", () => {
    it("should do something specific", async () => {
      // Arrange: Set up test data
      const { cookie } = await registerUser(testUsers.alice);

      // Act: Perform the action
      const response = await authenticatedRequest(cookie).get("/api/notes");

      // Assert: Verify results
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });
});
```

## Writing Tests

### Test Helpers

Located in `src/__tests__/helpers.ts`:

```typescript
// User helpers
await createUser(userData);           // Create user in DB
await registerUser(userData);         // Register via API
await loginUser(userData);            // Login via API

// Note helpers
await createNote(userId, noteData);   // Create note in DB

// Request helpers
authenticatedRequest(cookie);         // Make authenticated request
extractUserId(response);              // Get user ID from response

// Utilities
wait(ms);                             // Wait for specified time
randomEmail();                        // Generate random email
randomString(length);                 // Generate random string
```

### Example: Testing Authentication

```typescript
it("should register a new user", async () => {
  const response = await request(app)
    .post("/api/auth/register")
    .send({
      email: "test@test.com",
      password: "password123",
    });

  expect(response.status).toBe(201);
  expect(response.body.data.user.email).toBe("test@test.com");
  expect(response.headers["set-cookie"]).toBeDefined();
});
```

### Example: Testing Protected Routes

```typescript
it("should access protected route with valid session", async () => {
  const { cookie } = await registerUser({
    email: "test@test.com",
    password: "password123",
  });

  const response = await authenticatedRequest(cookie)
    .get("/api/notes");

  expect(response.status).toBe(200);
});
```

### Example: Testing Validation

```typescript
it("should reject invalid email format", async () => {
  const response = await request(app)
    .post("/api/auth/register")
    .send({
      email: "invalid-email",
      password: "password123",
    });

  expect(response.status).toBe(400);
  expect(response.body.error).toContain("Invalid email");
});
```

### Example: Testing Rate Limiting

```typescript
it("should enforce rate limiting", async () => {
  // Make maximum allowed requests
  for (let i = 0; i < 5; i++) {
    await request(app).post("/api/auth/login").send({
      email: `test${i}@test.com`,
      password: "password123",
    });
  }

  // Next request should be rate limited
  const response = await request(app)
    .post("/api/auth/login")
    .send({
      email: "test@test.com",
      password: "password123",
    });

  expect(response.status).toBe(429);
});
```

## Coverage

### Generating Coverage Reports

```bash
# Run tests with coverage
pnpm test:coverage
```

Coverage reports are generated in multiple formats:
- **Terminal**: Summary in console
- **HTML**: `coverage/index.html` (open in browser)
- **JSON**: `coverage/coverage-final.json`
- **LCOV**: `coverage/lcov.info` (for CI tools)

### Coverage Thresholds

Current thresholds (configured in `vitest.config.ts`):

```typescript
coverage: {
  thresholds: {
    lines: 70,
    functions: 70,
    branches: 70,
    statements: 70,
  },
}
```

### Viewing Coverage Report

```bash
# Generate and open HTML coverage report
pnpm test:coverage
open coverage/index.html
```

### What's Excluded from Coverage

- Test files (`**/*.test.ts`, `**/*.spec.ts`)
- Test utilities (`src/__tests__/**`)
- Cluster logic (`src/cluster.ts`)
- Build outputs (`dist/`, `node_modules/`)

## Best Practices

### 1. Database Isolation

```typescript
// ✅ Good: Each test starts with clean database
beforeEach(async () => {
  await prisma.note.deleteMany();
  await prisma.user.deleteMany();
});

// ❌ Bad: Tests share state
it("test 1", async () => {
  await createUser({ email: "test@test.com" });
});
it("test 2", async () => {
  // This assumes test 1 ran first!
  const user = await findUser("test@test.com");
});
```

### 2. Use Test Helpers

```typescript
// ✅ Good: Use helpers for common operations
const { cookie } = await registerUser(testUsers.alice);
const response = await authenticatedRequest(cookie).get("/api/notes");

// ❌ Bad: Repeat setup in every test
const regResponse = await request(app).post("/api/auth/register")...
const cookie = regResponse.headers["set-cookie"];
const response = await request(app).get("/api/notes").set("Cookie", cookie);
```

### 3. Test One Thing at a Time

```typescript
// ✅ Good: Single, clear assertion
it("should create a note", async () => {
  const response = await createNote();
  expect(response.status).toBe(201);
});

it("should return note with id", async () => {
  const response = await createNote();
  expect(response.body.data.id).toBeDefined();
});

// ❌ Bad: Testing too much
it("should create and update and delete", async () => {
  // Multiple operations = harder to debug
});
```

### 4. Descriptive Test Names

```typescript
// ✅ Good: Clear what's being tested
it("should reject login with wrong password", async () => {});
it("should lock account after 5 failed attempts", async () => {});

// ❌ Bad: Vague names
it("should work", async () => {});
it("test login", async () => {});
```

### 5. Use Appropriate Matchers

```typescript
// ✅ Good: Specific matchers
expect(response.status).toBe(200);
expect(response.body.data).toHaveLength(2);
expect(response.body.data.id).toBeDefined();

// ❌ Bad: Generic checks
expect(response.status == 200).toBe(true);
expect(response.body.data.length > 0).toBe(true);
```

### 6. Test Error Cases

```typescript
// ✅ Good: Test both success and failure
it("should create note with valid data", async () => {});
it("should reject note without title", async () => {});
it("should reject note without authentication", async () => {});

// ❌ Bad: Only testing happy path
it("should create note", async () => {});
```

## Troubleshooting

### Test Database Issues

**Problem**: Tests fail with "Can't reach database server"

```bash
# Solution: Ensure PostgreSQL is running
docker ps  # Check if postgres container is up

# Start PostgreSQL
docker start notes-postgres

# Or start with docker-compose
docker-compose up -d db
```

**Problem**: Tests fail with "relation does not exist"

```bash
# Solution: Run migrations on test database
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/notes_test" pnpm prisma migrate deploy
```

### Rate Limiting in Tests

**Problem**: Tests fail due to rate limiting

```typescript
// Solution: Tests run sequentially, but if you hit limits:

// Option 1: Wait between requests
await wait(100);

// Option 2: Use separate test users
const user1 = await registerUser({ email: randomEmail(), password: "test" });
const user2 = await registerUser({ email: randomEmail(), password: "test" });
```

### Session/Cookie Issues

**Problem**: Authenticated requests return 401

```typescript
// Solution: Ensure cookie is properly set
const { cookie, response } = await registerUser(testUsers.alice);
console.log("Cookie:", cookie); // Should contain connect.sid

// Use cookie in subsequent requests
const notesResponse = await request(app)
  .get("/api/notes")
  .set("Cookie", cookie);
```

### Coverage Not Updating

```bash
# Solution: Clear coverage cache
rm -rf coverage/
pnpm test:coverage
```

### Tests Timing Out

```typescript
// Solution: Increase timeout in vitest.config.ts
export default defineConfig({
  test: {
    testTimeout: 10000,  // 10 seconds
    hookTimeout: 10000,
  },
});

// Or for specific test
it("slow test", async () => {
  // test code
}, { timeout: 15000 });
```

### Port Already in Use

```bash
# Solution: Tests should use a different port
# Check .env.test has PORT="3001"

# Or kill process using the port
lsof -ti:3001 | xargs kill -9
```

## Continuous Integration

### GitHub Actions Example

```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:16
        env:
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: notes_test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'
      
      - name: Install pnpm
        run: npm install -g pnpm
      
      - name: Install dependencies
        run: pnpm install
      
      - name: Run migrations
        run: pnpm prisma migrate deploy
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/notes_test
      
      - name: Run tests
        run: pnpm test:coverage
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/notes_test
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/lcov.info
```

## Test Metrics

After running `pnpm test:coverage`, you should see:

```
Test Files  5 passed (5)
     Tests  80+ passed (80+)
  Duration  ~15s

 % Coverage report from v8
--------------------------
File                   | % Stmts | % Branch | % Funcs | % Lines
--------------------------
All files             |   85.23  |   78.45   |   82.15  |   84.67
 routes/auth.ts       |   95.23  |   85.71   |   90.00  |   94.87
 routes/notes.ts      |   92.15  |   82.35   |   88.23  |   91.45
 middleware/auth.ts   |   100.00 |   100.00  |   100.00 |   100.00
 ...
```

## Next Steps

- Add integration tests for full user workflows
- Add performance/load testing
- Add E2E tests with Playwright (frontend + backend)
- Add database migration tests
- Add security vulnerability scanning

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [Supertest Documentation](https://github.com/ladjs/supertest)
- [Prisma Testing Guide](https://www.prisma.io/docs/guides/testing)
- [Backend API Documentation](./API.md)
