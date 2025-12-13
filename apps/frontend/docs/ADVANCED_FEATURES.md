# Advanced Features Setup Guide

This guide covers the newly added advanced features for the frontend application.

---

## 📦 Bundle Analysis

Analyze your production bundle size to optimize performance.

### Usage

```bash
# Run bundle analyzer
pnpm analyze

# Build completes and opens browser with interactive bundle visualization
```

**What it shows:**
- Bundle size breakdown by package
- Largest dependencies
- Duplicate packages
- Code splitting effectiveness

**Configuration:** [next.config.ts](next.config.ts)

---

## 📱 Progressive Web App (PWA)

Full offline support with service worker and app installation.

### Features

- ✅ Install app on desktop/mobile
- ✅ Offline functionality
- ✅ Background sync
- ✅ Push notifications (ready)
- ✅ App shortcuts

### Manifest

Located at [public/manifest.json](public/manifest.json)

**Customize:**
- App name and description
- Theme colors
- Icons (add to `/public/`)
- App shortcuts

### Testing PWA

1. Build for production: `pnpm build`
2. Start production server: `pnpm start`
3. Open Chrome DevTools → Lighthouse
4. Run PWA audit

**Service Worker:** Auto-generated during build (disabled in dev)

---

## 🧪 Unit Testing (Jest + React Testing Library)

Write and run unit tests for components and utilities.

### Running Tests

```bash
# Run all tests
pnpm test

# Watch mode (re-run on changes)
pnpm test:watch

# Generate coverage report
pnpm test:coverage
```

### Writing Tests

**Example - Component Test:**
```typescript
// src/__tests__/Button.test.tsx
import { render, screen } from '@testing-library/react';
import { Button } from '@notes/ui-lib';

describe('Button', () => {
  it('renders button with text', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  it('handles clicks', () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Click</Button>);
    screen.getByText('Click').click();
    expect(handleClick).toHaveBeenCalled();
  });
});
```

**Example - Hook Test:**
```typescript
import { renderHook, act } from '@testing-library/react';
import { useCounter } from '@/hooks/useCounter';

describe('useCounter', () => {
  it('increments counter', () => {
    const { result } = renderHook(() => useCounter());
    
    act(() => {
      result.current.increment();
    });
    
    expect(result.current.count).toBe(1);
  });
});
```

### Configuration

- **Jest Config:** [jest.config.ts](jest.config.ts)
- **Setup File:** [jest.setup.ts](jest.setup.ts)
- **Coverage Threshold:** 70% (branches, functions, lines, statements)

**Test Location:** `src/__tests__/` or `*.test.tsx` anywhere

---

## ♿ Accessibility Testing

Automated accessibility testing with jest-axe and ESLint rules.

### Automated Testing

```typescript
// src/__tests__/accessibility.test.tsx
import { render } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';

expect.extend(toHaveNoViolations);

it('should not have accessibility violations', async () => {
  const { container } = render(<MyComponent />);
  const results = await axe(container);
  expect(results).toHaveNoViolations();
});
```

### ESLint Rules

Configured in [.eslintrc.json](.eslintrc.json):

- `jsx-a11y/alt-text` - Images must have alt text
- `jsx-a11y/aria-props` - Valid ARIA properties
- `jsx-a11y/role-has-required-aria-props` - Required ARIA props
- `jsx-a11y/anchor-is-valid` - Valid anchor tags

**Run linter:**
```bash
pnpm lint
```

### Best Practices

**✅ Good:**
```tsx
<button onClick={handleClick} aria-label="Close dialog">
  ×
</button>

<img src="/logo.png" alt="Notes App Logo" />

<label htmlFor="email">Email</label>
<input id="email" type="email" />
```

**❌ Avoid:**
```tsx
<div onClick={handleClick}>Click</div>  // Use button

<img src="/logo.png" />  // Missing alt

<input type="email" />  // Missing label
```

### Manual Testing

1. **Keyboard Navigation:** Tab through all interactive elements
2. **Screen Reader:** Test with NVDA (Windows) or VoiceOver (Mac)
3. **Color Contrast:** Use Chrome DevTools → Lighthouse

---

## 🌍 Internationalization (i18n)

Multi-language support with next-intl.

### Available Languages

- 🇺🇸 English (en) - Default
- 🇪🇸 Spanish (es)
- 🇫🇷 French (fr)

### Usage in Components

```typescript
'use client';
import { useTranslations } from 'next-intl';

export function LoginForm() {
  const t = useTranslations('auth');
  
  return (
    <form>
      <h1>{t('login')}</h1>
      <input placeholder={t('email')} />
      <input placeholder={t('password')} type="password" />
      <button>{t('login')}</button>
    </form>
  );
}
```

### Message Files

Located in `src/i18n/messages/`:
- [en.json](src/i18n/messages/en.json) - English
- [es.json](src/i18n/messages/es.json) - Spanish
- [fr.json](src/i18n/messages/fr.json) - French

**Structure:**
```json
{
  "common": {
    "save": "Save",
    "cancel": "Cancel"
  },
  "auth": {
    "login": "Login",
    "logout": "Logout"
  },
  "notes": {
    "title": "Notes",
    "newNote": "New Note"
  }
}
```

### Adding New Languages

1. Create new message file: `src/i18n/messages/de.json`
2. Copy structure from `en.json`
3. Translate all strings
4. Update `src/i18n/request.ts`:
   ```typescript
   export const locales = ['en', 'es', 'fr', 'de'] as const;
   ```
5. Uncomment i18n config in `next.config.ts`

### Language Switching

```typescript
import { useRouter, usePathname } from 'next/navigation';
import { useLocale } from 'next-intl';

function LanguageSwitcher() {
  const router = useRouter();
  const pathname = usePathname();
  const locale = useLocale();

  const switchLanguage = (newLocale: string) => {
    router.replace(pathname, { locale: newLocale });
  };

  return (
    <select value={locale} onChange={(e) => switchLanguage(e.target.value)}>
      <option value="en">English</option>
      <option value="es">Español</option>
      <option value="fr">Français</option>
    </select>
  );
}
```

---

## 📊 Running All Quality Checks

```bash
# Run all tests
pnpm test

# Run E2E tests
pnpm test:e2e

# Check code quality
pnpm lint

# Analyze bundle
pnpm analyze

# Full quality check
pnpm test && pnpm test:coverage && pnpm lint && pnpm build
```

---

## 🚀 Production Checklist

Before deploying to production:

- [ ] All tests passing (`pnpm test`)
- [ ] E2E tests passing (`pnpm test:e2e`)
- [ ] No ESLint errors (`pnpm lint`)
- [ ] Accessibility tests passing
- [ ] Bundle analyzed and optimized
- [ ] PWA manifest configured
- [ ] Translations complete for all languages
- [ ] Environment variables set
- [ ] Service worker working in production build

---

## 📚 Additional Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro)
- [jest-axe](https://github.com/nickcolley/jest-axe)
- [next-intl](https://next-intl-docs.vercel.app/)
- [next-pwa](https://github.com/shadowwalker/next-pwa)
- [Bundle Analyzer](https://github.com/vercel/next.js/tree/canary/packages/next-bundle-analyzer)

---

**Last Updated**: December 13, 2025
