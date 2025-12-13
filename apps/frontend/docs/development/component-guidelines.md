# Component Guidelines

**Purpose**: Standards and best practices for building React components in the notes application.

**Last Updated**: December 13, 2025

---

## Table of Contents

1. [Component Structure](#component-structure)
2. [Naming Conventions](#naming-conventions)
3. [Component Types](#component-types)
4. [Props and TypeScript](#props-and-typescript)
5. [State Management](#state-management)
6. [Styling Guidelines](#styling-guidelines)
7. [Performance](#performance)
8. [Accessibility](#accessibility)
9. [Testing](#testing)
10. [Common Patterns](#common-patterns)

---

## Component Structure

### File Organization

```
src/components/
├── NoteEditor/
│   ├── index.ts           # Public API exports
│   ├── NoteEditor.tsx     # Main component
│   ├── NoteEditor.test.tsx
│   ├── NoteEditorHeader.tsx  # Sub-components
│   └── NoteEditorToolbar.tsx
└── shared/
    ├── Button.tsx         # Reusable primitives
    └── Input.tsx
```

### Component Template

```tsx
'use client'; // Only if client-side features needed

import { useState } from 'react';
import { ComponentProps } from './types';

/**
 * ComponentName - Brief description
 * 
 * @param {Object} props - Component props
 * @param {string} props.title - Prop description
 * @returns {JSX.Element} Rendered component
 * 
 * @example
 * <ComponentName title="Example" onAction={handleAction} />
 */
export const ComponentName = ({ title, onAction }: ComponentProps) => {
  // 1. Hooks (state, effects, context)
  const [state, setState] = useState(initialState);
  
  // 2. Event handlers
  const handleClick = () => {
    // Logic here
    onAction?.();
  };
  
  // 3. Derived values
  const isDisabled = !title;
  
  // 4. Early returns
  if (!title) {
    return null;
  }
  
  // 5. Render
  return (
    <div className="component-wrapper">
      <h2>{title}</h2>
      <button onClick={handleClick} disabled={isDisabled}>
        Action
      </button>
    </div>
  );
};

// Default props (if needed)
ComponentName.defaultProps = {
  title: 'Default Title',
};
```

---

## Naming Conventions

### Components
```tsx
// ✅ PascalCase for components
export const NoteEditor = () => {};
export const NoteList = () => {};

// ✅ Descriptive names
export const NoteEditorToolbar = () => {};

// ❌ Avoid generic names
export const Component1 = () => {}; // Bad
```

### Props and Variables
```tsx
// ✅ camelCase for props/variables
const { userId, isActive, onSubmit } = props;

// ✅ Boolean props start with is/has/should
isLoading, hasError, shouldRender

// ✅ Event handlers start with handle/on
handleClick, onSubmit, handleInputChange
```

### Files
```tsx
// ✅ Match component name
NoteEditor.tsx    → export const NoteEditor
Button.tsx        → export const Button

// ✅ Test files
NoteEditor.test.tsx
NoteEditor.spec.tsx
```

---

## Component Types

### 1. Server Components (Default)

Use for static content, data fetching without user interaction.

```tsx
// ✅ No 'use client' directive
export const NotesList = async () => {
  const notes = await fetchNotes(); // Can use async/await
  
  return (
    <ul>
      {notes.map(note => (
        <li key={note.id}>{note.title}</li>
      ))}
    </ul>
  );
};
```

**When to use**:
- Fetching data from API
- Static content rendering
- No useState, useEffect, or browser APIs

### 2. Client Components

Use for interactivity, browser APIs, hooks.

```tsx
'use client'; // Required

import { useState } from 'react';

export const NoteEditor = () => {
  const [title, setTitle] = useState('');
  
  return (
    <input 
      value={title} 
      onChange={(e) => setTitle(e.target.value)}
    />
  );
};
```

**When to use**:
- useState, useEffect, useContext
- Event handlers (onClick, onChange)
- Browser APIs (localStorage, window)
- Third-party libraries requiring client-side

### 3. Compound Components

For complex components with sub-components.

```tsx
// Parent component
export const Tabs = ({ children }: { children: React.ReactNode }) => {
  const [activeTab, setActiveTab] = useState(0);
  
  return (
    <TabsContext.Provider value={{ activeTab, setActiveTab }}>
      <div className="tabs">{children}</div>
    </TabsContext.Provider>
  );
};

// Sub-components
Tabs.List = ({ children }: { children: React.ReactNode }) => (
  <div className="tabs-list">{children}</div>
);

Tabs.Tab = ({ index, children }: { index: number; children: React.ReactNode }) => {
  const { activeTab, setActiveTab } = useTabsContext();
  return (
    <button 
      className={activeTab === index ? 'active' : ''}
      onClick={() => setActiveTab(index)}
    >
      {children}
    </button>
  );
};

// Usage
<Tabs>
  <Tabs.List>
    <Tabs.Tab index={0}>Tab 1</Tabs.Tab>
    <Tabs.Tab index={1}>Tab 2</Tabs.Tab>
  </Tabs.List>
</Tabs>
```

---

## Props and TypeScript

### Prop Types

```tsx
// ✅ Interface for component props
interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
}

export const Button = ({
  variant = 'primary',
  size = 'md',
  children,
  onClick,
  disabled = false,
  className = '',
}: ButtonProps) => {
  // Implementation
};
```

### Extending HTML Elements

```tsx
// ✅ Extend native element props
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = ({ label, error, ...props }: InputProps) => {
  return (
    <div>
      {label && <label>{label}</label>}
      <input {...props} />
      {error && <span className="error">{error}</span>}
    </div>
  );
};
```

### Generic Components

```tsx
interface ListProps<T> {
  items: T[];
  renderItem: (item: T) => React.ReactNode;
  keyExtractor: (item: T) => string;
}

export const List = <T,>({ items, renderItem, keyExtractor }: ListProps<T>) => {
  return (
    <ul>
      {items.map(item => (
        <li key={keyExtractor(item)}>
          {renderItem(item)}
        </li>
      ))}
    </ul>
  );
};

// Usage
<List<Note>
  items={notes}
  renderItem={(note) => <div>{note.title}</div>}
  keyExtractor={(note) => note.id}
/>
```

---

## State Management

### Local State (useState)

```tsx
// ✅ Use for component-specific state
const [isOpen, setIsOpen] = useState(false);
const [inputValue, setInputValue] = useState('');
```

### Context (useContext)

```tsx
// ✅ Use for shared state across subtree
const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  
  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

// Custom hook
export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};
```

### Server State (TanStack Query)

```tsx
// ✅ Use for API data
const { data, isLoading, error } = useQuery({
  queryKey: ['notes'],
  queryFn: fetchNotes,
});

// Mutations
const createMutation = useMutation({
  mutationFn: createNote,
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['notes'] });
  },
});
```

---

## Styling Guidelines

### Tailwind CSS

```tsx
// ✅ Use Tailwind utility classes
<button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
  Submit
</button>

// ✅ Conditional classes
<div className={`base-class ${isActive ? 'active-class' : 'inactive-class'}`}>

// ✅ clsx for complex conditions
import clsx from 'clsx';

<div className={clsx(
  'base-class',
  isActive && 'active-class',
  error && 'error-class'
)}>
```

### Dark Mode

```tsx
// ✅ Always provide dark mode variant
<div className="bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">
  Content
</div>
```

---

## Performance

### Memoization

```tsx
// ✅ Memoize expensive calculations
const sortedNotes = useMemo(() => {
  return notes.sort((a, b) => b.updatedAt - a.updatedAt);
}, [notes]);

// ✅ Memoize callbacks
const handleClick = useCallback(() => {
  // Handler logic
}, [dependency]);

// ✅ Memoize components
const MemoizedComponent = memo(({ data }: Props) => {
  return <div>{data}</div>;
});
```

### Code Splitting

```tsx
// ✅ Lazy load heavy components
const HeavyComponent = lazy(() => import('./HeavyComponent'));

<Suspense fallback={<Loading />}>
  <HeavyComponent />
</Suspense>
```

### Avoid Prop Drilling

```tsx
// ❌ Bad: Prop drilling
<Parent>
  <Child userId={userId}>
    <GrandChild userId={userId}>
      <GreatGrandChild userId={userId} />

// ✅ Good: Use context
const UserContext = createContext<string | undefined>(undefined);

<UserContext.Provider value={userId}>
  <Parent>
    <Child>
      <GrandChild>
        <GreatGrandChild /> {/* Access via useContext */}
```

---

## Accessibility

### Semantic HTML

```tsx
// ✅ Use semantic elements
<button onClick={handleClick}>Submit</button>
<nav>...</nav>
<main>...</main>

// ❌ Avoid divs for interactive elements
<div onClick={handleClick}>Submit</div> // Bad
```

### ARIA Attributes

```tsx
// ✅ Add aria labels for screen readers
<button 
  aria-label="Close dialog"
  aria-pressed={isActive}
  aria-disabled={isDisabled}
>
  <X />
</button>

// ✅ Hide decorative elements
<div aria-hidden="true">
  <Icon />
</div>
```

### Keyboard Navigation

```tsx
// ✅ Support keyboard events
<div
  role="button"
  tabIndex={0}
  onClick={handleClick}
  onKeyDown={(e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      handleClick();
    }
  }}
>
  Clickable div
</div>
```

### Focus Management

```tsx
// ✅ Visible focus states
<button className="focus:ring-2 focus:ring-blue-500 focus:outline-none">
  Click me
</button>

// ✅ Focus trapping in modals
import { useTrapFocus } from '@/hooks/useTrapFocus';

const Modal = () => {
  const ref = useTrapFocus();
  return <dialog ref={ref}>...</dialog>;
};
```

---

## Testing

### Unit Tests

```tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from './Button';

describe('Button', () => {
  it('renders children', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });
  
  it('calls onClick when clicked', () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Click</Button>);
    fireEvent.click(screen.getByText('Click'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
```

---

## Common Patterns

### Loading States

```tsx
if (isLoading) {
  return <LoadingSpinner />;
}

if (error) {
  return <ErrorMessage error={error} />;
}

return <Content data={data} />;
```

### Empty States

```tsx
if (notes.length === 0) {
  return (
    <EmptyState
      title="No notes yet"
      description="Create your first note to get started"
      action={<Button onClick={handleCreate}>Create Note</Button>}
    />
  );
}
```

### Error Boundaries

```tsx
'use client';

import { Component, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  state = { hasError: false };
  
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  
  render() {
    if (this.state.hasError) {
      return this.props.fallback || <div>Something went wrong</div>;
    }
    return this.props.children;
  }
}
```

---

## Checklist

Before committing a new component:

- [ ] TypeScript types defined
- [ ] Props documented with JSDoc
- [ ] Dark mode styles included
- [ ] Accessibility attributes added
- [ ] Unit tests written (>80% coverage)
- [ ] Error states handled
- [ ] Loading states handled
- [ ] Responsive design tested
- [ ] Performance optimized (memoization if needed)
- [ ] Follows naming conventions

---

**See Also**:
- [Accessibility Guide](./accessibility.md)
- [Testing Guide](./testing.md)
- [Performance Guide](../system/performance.md)
