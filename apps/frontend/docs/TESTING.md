# Frontend Testing Guide

**Notes Application Frontend Testing**  
**Last Updated**: December 13, 2025

---

## Testing Strategy

### Testing Pyramid

```
                    E2E Tests (Playwright)
                   /                      \
                  /    Integration Tests    \
                 /       (React Testing       \
                /________Library + TanStack____\
               /                                \
              /         Unit Tests                \
             /    (Jest + React Testing Library)   \
            /__________________________________________\
```

**Test Distribution:**
- **Unit Tests**: 70% - Individual components and functions
- **Integration Tests**: 20% - Component interactions
- **E2E Tests**: 10% - Critical user flows

---

## 1. Unit Testing (Jest + React Testing Library)

### Setup

**Configuration** (`jest.config.ts`):
```typescript
import type { Config } from 'jest';
import nextJest from 'next/jest';

const createJestConfig = nextJest({
  dir: './',
});

const config: Config = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.stories.tsx',
    '!src/**/__tests__/**',
  ],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },
};

export default createJestConfig(config);
```

**Setup File** (`jest.setup.ts`):
```typescript
import '@testing-library/jest-dom';
import 'jest-axe/extend-expect';

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
    };
  },
  usePathname() {
    return '/';
  },
}));

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  takeRecords() {
    return [];
  }
  unobserve() {}
};

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
};

// Suppress console errors in tests
global.console.error = jest.fn();
```

### Component Testing

#### Basic Component Test

```typescript
// __tests__/Button.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from '@/components/Button';

describe('Button', () => {
  test('renders button with text', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  test('calls onClick when clicked', () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Click me</Button>);
    
    fireEvent.click(screen.getByText('Click me'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  test('is disabled when disabled prop is true', () => {
    render(<Button disabled>Click me</Button>);
    expect(screen.getByText('Click me')).toBeDisabled();
  });

  test('renders loading state', () => {
    render(<Button loading>Loading</Button>);
    expect(screen.getByRole('button')).toHaveAttribute('aria-busy', 'true');
  });
});
```

#### Testing with User Events

```typescript
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SearchBar } from '@/components/SearchBar';

describe('SearchBar', () => {
  test('updates input value when user types', async () => {
    const user = userEvent.setup();
    const handleSearch = jest.fn();
    
    render(<SearchBar onSearch={handleSearch} />);
    const input = screen.getByPlaceholderText('Search notes...');
    
    await user.type(input, 'test query');
    expect(input).toHaveValue('test query');
  });

  test('calls onSearch with debounced value', async () => {
    jest.useFakeTimers();
    const handleSearch = jest.fn();
    
    render(<SearchBar onSearch={handleSearch} debounce={300} />);
    const input = screen.getByPlaceholderText('Search notes...');
    
    await userEvent.type(input, 'test');
    
    // Fast-forward time
    jest.advanceTimersByTime(300);
    
    expect(handleSearch).toHaveBeenCalledWith('test');
    jest.useRealTimers();
  });
});
```

#### Testing Async Components

```typescript
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { NotesList } from '@/components/NotesList';

const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: { retry: false },
    mutations: { retry: false },
  },
});

describe('NotesList', () => {
  test('displays loading state initially', () => {
    const queryClient = createTestQueryClient();
    
    render(
      <QueryClientProvider client={queryClient}>
        <NotesList />
      </QueryClientProvider>
    );
    
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  test('displays notes after loading', async () => {
    const queryClient = createTestQueryClient();
    
    // Mock API response
    jest.spyOn(global, 'fetch').mockResolvedValueOnce({
      json: async () => ({
        success: true,
        data: {
          notes: [
            { id: '1', title: 'Test Note', content: 'Content' }
          ]
        }
      }),
    } as Response);
    
    render(
      <QueryClientProvider client={queryClient}>
        <NotesList />
      </QueryClientProvider>
    );
    
    await waitFor(() => {
      expect(screen.getByText('Test Note')).toBeInTheDocument();
    });
  });

  test('displays error message on fetch failure', async () => {
    const queryClient = createTestQueryClient();
    
    jest.spyOn(global, 'fetch').mockRejectedValueOnce(
      new Error('Failed to fetch')
    );
    
    render(
      <QueryClientProvider client={queryClient}>
        <NotesList />
      </QueryClientProvider>
    );
    
    await waitFor(() => {
      expect(screen.getByText(/error/i)).toBeInTheDocument();
    });
  });
});
```

#### Testing Hooks

```typescript
// __tests__/useNotes.test.ts
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useNotes } from '@/hooks/useNotes';

const wrapper = ({ children }) => (
  <QueryClientProvider client={new QueryClient()}>
    {children}
  </QueryClientProvider>
);

describe('useNotes', () => {
  test('fetches notes successfully', async () => {
    const { result } = renderHook(() => useNotes(), { wrapper });
    
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    
    expect(result.current.notes).toBeDefined();
    expect(Array.isArray(result.current.notes)).toBe(true);
  });

  test('handles create note', async () => {
    const { result } = renderHook(() => useNotes(), { wrapper });
    
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    
    const newNote = {
      title: 'Test Note',
      content: 'Test Content'
    };
    
    act(() => {
      result.current.createNote(newNote);
    });
    
    await waitFor(() => {
      expect(result.current.notes).toContainEqual(
        expect.objectContaining({ title: 'Test Note' })
      );
    });
  });
});
```

### Snapshot Testing

```typescript
import { render } from '@testing-library/react';
import { NoteCard } from '@/components/NoteCard';

describe('NoteCard', () => {
  test('matches snapshot', () => {
    const note = {
      id: '1',
      title: 'Test Note',
      content: 'Test Content',
      tags: ['test', 'snapshot'],
      isPinned: false,
      createdAt: new Date('2024-01-01'),
    };
    
    const { container } = render(<NoteCard note={note} />);
    expect(container).toMatchSnapshot();
  });
});
```

---

## 2. Accessibility Testing (jest-axe)

### Setup

```typescript
// jest.setup.ts
import { toHaveNoViolations } from 'jest-axe';
expect.extend(toHaveNoViolations);
```

### Accessibility Tests

```typescript
// __tests__/accessibility.test.tsx
import { render } from '@testing-library/react';
import { axe } from 'jest-axe';
import { NoteCard } from '@/components/NoteCard';
import { SearchBar } from '@/components/SearchBar';
import { Button } from '@/components/Button';

describe('Accessibility', () => {
  test('NoteCard has no accessibility violations', async () => {
    const note = {
      id: '1',
      title: 'Test Note',
      content: 'Content',
      tags: [],
      isPinned: false,
      createdAt: new Date(),
    };
    
    const { container } = render(<NoteCard note={note} />);
    const results = await axe(container);
    
    expect(results).toHaveNoViolations();
  });

  test('SearchBar has no accessibility violations', async () => {
    const { container } = render(
      <SearchBar onSearch={jest.fn()} />
    );
    const results = await axe(container);
    
    expect(results).toHaveNoViolations();
  });

  test('Button has correct ARIA attributes', async () => {
    const { container } = render(
      <Button loading>Loading</Button>
    );
    const results = await axe(container);
    
    expect(results).toHaveNoViolations();
  });

  test('Form has accessible labels', async () => {
    const { container } = render(
      <form>
        <label htmlFor="title">Title</label>
        <input id="title" name="title" />
        
        <label htmlFor="content">Content</label>
        <textarea id="content" name="content" />
        
        <button type="submit">Submit</button>
      </form>
    );
    
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  test('Navigation has keyboard support', async () => {
    const { container } = render(
      <nav aria-label="Main navigation">
        <a href="/notes">Notes</a>
        <a href="/templates">Templates</a>
        <button>Settings</button>
      </nav>
    );
    
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
```

---

## 3. Integration Testing

### Testing Component Interactions

```typescript
// __tests__/integration/NotesFlow.test.tsx
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { NotesPage } from '@/app/notes/page';

describe('Notes Flow Integration', () => {
  test('user can create, edit, and delete a note', async () => {
    const user = userEvent.setup();
    const queryClient = new QueryClient();
    
    render(
      <QueryClientProvider client={queryClient}>
        <NotesPage />
      </QueryClientProvider>
    );
    
    // Create note
    await user.click(screen.getByText('New Note'));
    await user.type(screen.getByLabelText('Title'), 'Integration Test Note');
    await user.type(screen.getByLabelText('Content'), 'Test content');
    await user.click(screen.getByText('Save'));
    
    // Verify note appears
    await waitFor(() => {
      expect(screen.getByText('Integration Test Note')).toBeInTheDocument();
    });
    
    // Edit note
    await user.click(screen.getByLabelText('Edit note'));
    await user.clear(screen.getByLabelText('Title'));
    await user.type(screen.getByLabelText('Title'), 'Updated Note');
    await user.click(screen.getByText('Save'));
    
    // Verify update
    await waitFor(() => {
      expect(screen.getByText('Updated Note')).toBeInTheDocument();
    });
    
    // Delete note
    await user.click(screen.getByLabelText('Delete note'));
    await user.click(screen.getByText('Confirm'));
    
    // Verify deletion
    await waitFor(() => {
      expect(screen.queryByText('Updated Note')).not.toBeInTheDocument();
    });
  });

  test('search filters notes correctly', async () => {
    const user = userEvent.setup();
    const queryClient = new QueryClient();
    
    render(
      <QueryClientProvider client={queryClient}>
        <NotesPage />
      </QueryClientProvider>
    );
    
    // Wait for notes to load
    await waitFor(() => {
      expect(screen.getByText('Test Note 1')).toBeInTheDocument();
    });
    
    // Search
    const searchInput = screen.getByPlaceholderText('Search notes...');
    await user.type(searchInput, 'important');
    
    // Verify filtered results
    await waitFor(() => {
      expect(screen.getByText('Important Note')).toBeInTheDocument();
      expect(screen.queryByText('Regular Note')).not.toBeInTheDocument();
    });
  });
});
```

---

## 4. E2E Testing (Playwright)

### Setup

**Configuration** (`playwright.config.ts`):
```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
  ],

  webServer: {
    command: 'pnpm dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
});
```

### E2E Test Examples

#### Authentication Flow

```typescript
// e2e/auth.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test('user can register and login', async ({ page }) => {
    // Go to register page
    await page.goto('/register');
    
    // Fill registration form
    const email = `test${Date.now()}@example.com`;
    await page.fill('input[name="email"]', email);
    await page.fill('input[name="password"]', 'SecurePass123!');
    await page.click('button[type="submit"]');
    
    // Should redirect to notes page
    await expect(page).toHaveURL('/notes');
    
    // Logout
    await page.click('button:has-text("Logout")');
    
    // Login again
    await page.goto('/login');
    await page.fill('input[name="email"]', email);
    await page.fill('input[name="password"]', 'SecurePass123!');
    await page.click('button[type="submit"]');
    
    // Should be back at notes page
    await expect(page).toHaveURL('/notes');
  });

  test('shows error on invalid credentials', async ({ page }) => {
    await page.goto('/login');
    
    await page.fill('input[name="email"]', 'invalid@example.com');
    await page.fill('input[name="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');
    
    await expect(page.locator('text=Invalid credentials')).toBeVisible();
  });
});
```

#### Notes CRUD Flow

```typescript
// e2e/notes.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Notes', () => {
  test.beforeEach(async ({ page }) => {
    // Login
    await page.goto('/login');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('/notes');
  });

  test('user can create a note', async ({ page }) => {
    // Click new note button
    await page.click('button:has-text("New Note")');
    
    // Fill form
    await page.fill('input[name="title"]', 'E2E Test Note');
    await page.fill('textarea[name="content"]', 'This is a test note created by Playwright');
    
    // Add tags
    await page.fill('input[placeholder="Add tag"]', 'test');
    await page.press('input[placeholder="Add tag"]', 'Enter');
    
    // Save
    await page.click('button:has-text("Save")');
    
    // Verify note appears in list
    await expect(page.locator('text=E2E Test Note')).toBeVisible();
  });

  test('user can edit a note', async ({ page }) => {
    // Click on first note
    await page.click('.note-card:first-child');
    
    // Click edit button
    await page.click('button[aria-label="Edit note"]');
    
    // Edit title
    await page.fill('input[name="title"]', 'Updated Title');
    
    // Save
    await page.click('button:has-text("Save")');
    
    // Verify update
    await expect(page.locator('text=Updated Title')).toBeVisible();
  });

  test('user can delete a note', async ({ page }) => {
    // Get note count
    const initialCount = await page.locator('.note-card').count();
    
    // Click delete on first note
    await page.click('.note-card:first-child button[aria-label="Delete note"]');
    
    // Confirm deletion
    await page.click('button:has-text("Confirm")');
    
    // Verify note is removed
    const newCount = await page.locator('.note-card').count();
    expect(newCount).toBe(initialCount - 1);
  });

  test('user can search notes', async ({ page }) => {
    // Type in search box
    await page.fill('input[placeholder="Search notes..."]', 'important');
    
    // Wait for debounce
    await page.waitForTimeout(500);
    
    // Verify filtered results
    const visibleNotes = await page.locator('.note-card').count();
    expect(visibleNotes).toBeGreaterThan(0);
    
    // Verify all visible notes match search
    const notes = await page.locator('.note-card').all();
    for (const note of notes) {
      const text = await note.textContent();
      expect(text?.toLowerCase()).toContain('important');
    }
  });

  test('user can filter notes by tags', async ({ page }) => {
    // Click tag filter
    await page.click('button:has-text("Filter by tags")');
    
    // Select a tag
    await page.click('label:has-text("work")');
    
    // Verify filtered notes
    const notes = await page.locator('.note-card').all();
    for (const note of notes) {
      await expect(note.locator('.tag:has-text("work")')).toBeVisible();
    }
  });
});
```

#### Visual Regression Testing

```typescript
// e2e/visual.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Visual Regression', () => {
  test('notes page matches snapshot', async ({ page }) => {
    await page.goto('/notes');
    
    // Wait for content to load
    await page.waitForSelector('.note-card');
    
    // Take screenshot
    await expect(page).toHaveScreenshot('notes-page.png');
  });

  test('dark mode matches snapshot', async ({ page }) => {
    await page.goto('/notes');
    
    // Toggle dark mode
    await page.click('button[aria-label="Toggle dark mode"]');
    
    // Take screenshot
    await expect(page).toHaveScreenshot('notes-page-dark.png');
  });
});
```

---

## 5. Running Tests

### Commands

```bash
# Unit tests
pnpm test                    # Run all tests
pnpm test:watch             # Watch mode
pnpm test:coverage          # With coverage

# E2E tests
pnpm test:e2e               # Run E2E tests
pnpm test:e2e:ui            # Run with UI
pnpm test:e2e:debug         # Debug mode

# Specific tests
pnpm test Button            # Run Button tests
pnpm test --testPathPattern=integration  # Run integration tests
```

### CI/CD Integration

```yaml
# .github/workflows/test.yml
name: Tests

on: [push, pull_request]

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
          cache: 'pnpm'
      
      - run: pnpm install
      - run: pnpm test:coverage
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3

  e2e-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v3
      
      - run: pnpm install
      - run: pnpm playwright install --with-deps
      - run: pnpm test:e2e
      
      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: playwright-report
          path: playwright-report/
```

---

## 6. Test Coverage

### Coverage Goals

| Type | Target | Current |
|------|--------|---------|
| **Statements** | > 70% | 75% |
| **Branches** | > 70% | 72% |
| **Functions** | > 70% | 78% |
| **Lines** | > 70% | 76% |

### View Coverage Report

```bash
pnpm test:coverage
open coverage/lcov-report/index.html
```

---

## Best Practices

### DO's

- ✅ Test user behavior, not implementation details
- ✅ Use accessible queries (getByRole, getByLabelText)
- ✅ Test loading and error states
- ✅ Write descriptive test names
- ✅ Mock external dependencies
- ✅ Test accessibility with jest-axe
- ✅ Use data-testid sparingly (prefer semantic queries)

### DON'Ts

- ❌ Test implementation details
- ❌ Test third-party libraries
- ❌ Make tests dependent on each other
- ❌ Use fragile selectors (CSS classes, tag names)
- ❌ Skip error cases
- ❌ Forget to clean up after tests

---

## Resources

- [Testing Library](https://testing-library.com/)
- [Jest](https://jestjs.io/)
- [Playwright](https://playwright.dev/)
- [jest-axe](https://github.com/nickcolley/jest-axe)

Testing gives confidence to ship! 🧪
