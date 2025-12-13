# Accessibility Guide

**Purpose**: Ensure the notes application is accessible to all users, including those with disabilities.

**Target**: WCAG 2.1 Level AA compliance

**Last Updated**: December 13, 2025

---

## Table of Contents

1. [Accessibility Principles](#accessibility-principles)
2. [Semantic HTML](#semantic-html)
3. [Keyboard Navigation](#keyboard-navigation)
4. [Screen Readers](#screen-readers)
5. [Color and Contrast](#color-and-contrast)
6. [Focus Management](#focus-management)
7. [Forms and Inputs](#forms-and-inputs)
8. [ARIA Attributes](#aria-attributes)
9. [Testing](#testing)
10. [Common Patterns](#common-patterns)

---

## Accessibility Principles

### WCAG 2.1 Four Principles (POUR)

1. **Perceivable**: Information must be presentable to users in ways they can perceive
2. **Operable**: Interface components must be operable
3. **Understandable**: Information and interface must be understandable
4. **Robust**: Content must be robust enough for assistive technologies

### Our Standards

✅ WCAG 2.1 Level AA compliance  
✅ Keyboard-only navigation support  
✅ Screen reader compatibility (NVDA, JAWS, VoiceOver)  
✅ 4.5:1 color contrast ratio minimum  
✅ Touch target size minimum 44x44px  
✅ No content flash faster than 3 times per second  

---

## Semantic HTML

### Use Semantic Elements

```tsx
// ✅ Good: Semantic HTML
<header>
  <nav>
    <ul>
      <li><a href="/notes">Notes</a></li>
    </ul>
  </nav>
</header>

<main>
  <article>
    <h1>Note Title</h1>
    <p>Note content...</p>
  </article>
</main>

<footer>
  <p>&copy; 2025 Notes App</p>
</footer>

// ❌ Bad: Only divs
<div className="header">
  <div className="nav">
    <div className="link">Notes</div>
  </div>
</div>
```

### Heading Hierarchy

```tsx
// ✅ Good: Proper heading order
<h1>Dashboard</h1>
  <h2>My Notes</h2>
    <h3>Work Notes</h3>
    <h3>Personal Notes</h3>
  <h2>Recent Activity</h2>

// ❌ Bad: Skipping levels
<h1>Dashboard</h1>
  <h4>My Notes</h4> // Skips h2, h3
```

### Lists

```tsx
// ✅ Good: Semantic lists
<ul>
  <li>Note 1</li>
  <li>Note 2</li>
  <li>Note 3</li>
</ul>

// Ordered lists for sequences
<ol>
  <li>First step</li>
  <li>Second step</li>
  <li>Third step</li>
</ol>

// ❌ Bad: Divs instead of lists
<div>
  <div>Note 1</div>
  <div>Note 2</div>
</div>
```

---

## Keyboard Navigation

### Tab Order

```tsx
// ✅ Natural tab order (top to bottom, left to right)
<form>
  <input type="text" /> {/* Tab 1 */}
  <input type="email" /> {/* Tab 2 */}
  <button type="submit">Submit</button> {/* Tab 3 */}
</form>

// Use tabIndex only when necessary
<div tabIndex={0}>Focusable div</div> // tabIndex=0 adds to natural order
<div tabIndex={-1}>Not in tab order</div> // tabIndex=-1 excludes from tab
```

### Keyboard Shortcuts

```tsx
const NoteEditor = () => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd+S / Ctrl+S to save
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        handleSave();
      }
      
      // Escape to close
      if (e.key === 'Escape') {
        handleClose();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);
  
  return (
    <div>
      <button 
        onClick={handleSave}
        title="Save (Cmd+S)"
      >
        Save
      </button>
    </div>
  );
};
```

### Interactive Elements

```tsx
// ✅ Button for actions
<button onClick={handleClick}>Click me</button>

// ✅ Link for navigation
<a href="/notes">Go to notes</a>

// ✅ Custom interactive element with keyboard support
<div
  role="button"
  tabIndex={0}
  onClick={handleClick}
  onKeyDown={(e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick();
    }
  }}
>
  Custom button
</div>

// ❌ Bad: Div with only onClick
<div onClick={handleClick}>
  Click me {/* Not keyboard accessible */}
</div>
```

---

## Screen Readers

### Alt Text for Images

```tsx
// ✅ Descriptive alt text
<img src="/logo.png" alt="Notes App logo" />

// ✅ Empty alt for decorative images
<img src="/decoration.png" alt="" />

// ✅ Icons with aria-label
<button aria-label="Delete note">
  <TrashIcon aria-hidden="true" />
</button>
```

### Screen Reader Only Text

```tsx
// Utility class from Tailwind
<span className="sr-only">
  This text is only for screen readers
</span>

// Or custom CSS
<span className="screen-reader-only">
  Additional context for screen readers
</span>

// Example
<button>
  <TrashIcon />
  <span className="sr-only">Delete note</span>
</button>
```

### Live Regions

```tsx
// Announce dynamic content changes
<div 
  role="status" 
  aria-live="polite" 
  aria-atomic="true"
>
  {message}
</div>

// Urgent announcements
<div 
  role="alert" 
  aria-live="assertive"
>
  {errorMessage}
</div>

// Example: Toast notifications
const Toast = ({ message }: { message: string }) => {
  return (
    <div 
      role="status" 
      aria-live="polite"
      className="toast"
    >
      {message}
    </div>
  );
};
```

---

## Color and Contrast

### Contrast Requirements

**WCAG 2.1 Level AA**:
- Normal text: 4.5:1 minimum
- Large text (18pt+): 3:1 minimum
- Interactive elements: 3:1 minimum

### Color Palette (Accessible)

```tsx
// ✅ High contrast colors
const colors = {
  // Text on white background
  text: {
    primary: '#1F2937',   // Contrast: 13.1:1 ✅
    secondary: '#6B7280', // Contrast: 4.6:1 ✅
  },
  
  // Text on dark background
  textDark: {
    primary: '#F9FAFB',   // Contrast: 16.5:1 ✅
    secondary: '#D1D5DB', // Contrast: 9.8:1 ✅
  },
  
  // Interactive elements
  primary: '#2563EB',   // Contrast: 5.1:1 ✅
  danger: '#DC2626',    // Contrast: 5.4:1 ✅
  success: '#059669',   // Contrast: 4.9:1 ✅
};
```

### Don't Rely on Color Alone

```tsx
// ❌ Bad: Color only
<span className="text-red-500">Error</span>

// ✅ Good: Color + icon + text
<span className="text-red-500 flex items-center gap-2">
  <AlertIcon />
  <span>Error: Invalid input</span>
</span>

// ✅ Good: Form validation with multiple indicators
<input 
  type="email"
  aria-invalid={hasError}
  aria-describedby={hasError ? 'email-error' : undefined}
  className={hasError ? 'border-red-500' : ''}
/>
{hasError && (
  <p id="email-error" className="text-red-500 flex items-center gap-1">
    <AlertIcon />
    <span>Please enter a valid email</span>
  </p>
)}
```

### Dark Mode Considerations

```tsx
// Maintain contrast ratios in dark mode
<div className="
  bg-white dark:bg-gray-900
  text-gray-900 dark:text-gray-100
  border-gray-300 dark:border-gray-700
">
  Content with accessible contrast in both themes
</div>
```

---

## Focus Management

### Visible Focus Indicators

```tsx
// ✅ Always show focus outline
<button className="
  focus:outline-none 
  focus:ring-2 
  focus:ring-blue-500 
  focus:ring-offset-2
">
  Click me
</button>

// ✅ Custom focus styles
<a 
  href="/notes"
  className="
    focus:underline
    focus:outline-none
    focus:ring-2
    focus:ring-blue-500
  "
>
  Notes
</a>

// ❌ Bad: Remove focus without replacement
<button className="focus:outline-none">
  Click me {/* No visible focus indicator */}
</button>
```

### Focus Trapping in Modals

```tsx
import { useEffect, useRef } from 'react';

const Modal = ({ isOpen, onClose, children }: ModalProps) => {
  const modalRef = useRef<HTMLDivElement>(null);
  
  // Trap focus inside modal
  useEffect(() => {
    if (!isOpen) return;
    
    const modal = modalRef.current;
    if (!modal) return;
    
    const focusableElements = modal.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;
    
    const handleTab = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;
      
      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    };
    
    modal.addEventListener('keydown', handleTab);
    firstElement?.focus();
    
    return () => modal.removeEventListener('keydown', handleTab);
  }, [isOpen]);
  
  if (!isOpen) return null;
  
  return (
    <div 
      ref={modalRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <h2 id="modal-title">Modal Title</h2>
      {children}
      <button onClick={onClose}>Close</button>
    </div>
  );
};
```

### Return Focus After Modal

```tsx
const Component = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  
  const handleOpenModal = () => {
    setIsModalOpen(true);
  };
  
  const handleCloseModal = () => {
    setIsModalOpen(false);
    // Return focus to trigger button
    triggerRef.current?.focus();
  };
  
  return (
    <>
      <button ref={triggerRef} onClick={handleOpenModal}>
        Open Modal
      </button>
      <Modal isOpen={isModalOpen} onClose={handleCloseModal} />
    </>
  );
};
```

---

## Forms and Inputs

### Labels

```tsx
// ✅ Good: Explicit label
<div>
  <label htmlFor="email">Email</label>
  <input type="email" id="email" name="email" />
</div>

// ✅ Good: Wrapped label
<label>
  Email
  <input type="email" name="email" />
</label>

// ✅ Good: aria-label for icon-only buttons
<button aria-label="Search">
  <SearchIcon />
</button>

// ❌ Bad: No label
<input type="email" placeholder="Email" /> // Placeholder is not a label
```

### Error Messages

```tsx
const Input = ({ label, error, ...props }: InputProps) => {
  const inputId = useId();
  const errorId = `${inputId}-error`;
  
  return (
    <div>
      <label htmlFor={inputId}>{label}</label>
      <input
        id={inputId}
        aria-invalid={!!error}
        aria-describedby={error ? errorId : undefined}
        {...props}
      />
      {error && (
        <p id={errorId} role="alert" className="text-red-500">
          {error}
        </p>
      )}
    </div>
  );
};
```

### Required Fields

```tsx
// ✅ Good: Multiple indicators
<div>
  <label htmlFor="email">
    Email <span aria-label="required">*</span>
  </label>
  <input
    type="email"
    id="email"
    required
    aria-required="true"
  />
</div>

// ✅ Better: Explicit text
<div>
  <label htmlFor="email">
    Email <span className="text-sm text-gray-500">(required)</span>
  </label>
  <input
    type="email"
    id="email"
    required
    aria-required="true"
  />
</div>
```

---

## ARIA Attributes

### Common ARIA Attributes

```tsx
// Role
<div role="button" onClick={handleClick}>Click</div>

// State
<button aria-pressed={isPressed}>Toggle</button>
<button aria-expanded={isExpanded}>Expand</button>
<input aria-invalid={hasError} />

// Properties
<button aria-label="Close dialog">×</button>
<div aria-describedby="description">Content</div>
<input aria-labelledby="label-id" />

// Live regions
<div aria-live="polite">Status updates</div>
<div role="alert" aria-live="assertive">Urgent!</div>

// Hidden
<div aria-hidden="true">Decorative content</div>
```

### Dropdown Menu

```tsx
const Dropdown = () => {
  const [isOpen, setIsOpen] = useState(false);
  
  return (
    <div>
      <button
        aria-haspopup="true"
        aria-expanded={isOpen}
        onClick={() => setIsOpen(!isOpen)}
      >
        Menu
      </button>
      {isOpen && (
        <ul role="menu">
          <li role="menuitem">
            <button onClick={handleOption1}>Option 1</button>
          </li>
          <li role="menuitem">
            <button onClick={handleOption2}>Option 2</button>
          </li>
        </ul>
      )}
    </div>
  );
};
```

### Tabs

```tsx
const Tabs = () => {
  const [activeTab, setActiveTab] = useState(0);
  
  return (
    <div>
      <div role="tablist">
        <button
          role="tab"
          aria-selected={activeTab === 0}
          aria-controls="panel-0"
          id="tab-0"
          onClick={() => setActiveTab(0)}
        >
          Tab 1
        </button>
        <button
          role="tab"
          aria-selected={activeTab === 1}
          aria-controls="panel-1"
          id="tab-1"
          onClick={() => setActiveTab(1)}
        >
          Tab 2
        </button>
      </div>
      
      <div
        role="tabpanel"
        id="panel-0"
        aria-labelledby="tab-0"
        hidden={activeTab !== 0}
      >
        Panel 1 content
      </div>
      <div
        role="tabpanel"
        id="panel-1"
        aria-labelledby="tab-1"
        hidden={activeTab !== 1}
      >
        Panel 2 content
      </div>
    </div>
  );
};
```

---

## Testing

### Automated Testing

```bash
# Jest + jest-axe
pnpm add -D jest-axe
```

```tsx
import { axe, toHaveNoViolations } from 'jest-axe';
import { render } from '@testing-library/react';

expect.extend(toHaveNoViolations);

test('should not have accessibility violations', async () => {
  const { container } = render(<MyComponent />);
  const results = await axe(container);
  expect(results).toHaveNoViolations();
});
```

### Manual Testing

**Keyboard Testing**:
1. Unplug mouse
2. Navigate using Tab/Shift+Tab
3. Activate using Enter/Space
4. Verify all functionality accessible

**Screen Reader Testing**:
- macOS: VoiceOver (Cmd+F5)
- Windows: NVDA (free) or JAWS
- Check: Proper announcement of content, labels, state changes

**Color Contrast**:
- Tool: Chrome DevTools → Lighthouse → Accessibility
- Tool: [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)

### Tools

| Tool | Purpose | URL |
|------|---------|-----|
| axe DevTools | Browser extension | chrome.google.com/webstore |
| Lighthouse | Automated audit | Chrome DevTools |
| WAVE | Visual feedback | wave.webaim.org |
| Color Contrast Analyzer | Check contrast | paciellogroup.com/resources/contrastanalyser |
| NVDA | Screen reader | nvaccess.org |

---

## Common Patterns

### Skip Links

```tsx
// Allow keyboard users to skip navigation
<a 
  href="#main-content"
  className="sr-only focus:not-sr-only focus:absolute focus:top-0 focus:left-0"
>
  Skip to main content
</a>

<nav>{/* Navigation */}</nav>

<main id="main-content">
  {/* Main content */}
</main>
```

### Loading States

```tsx
// Announce loading state to screen readers
<div role="status" aria-live="polite">
  {isLoading && <span>Loading notes...</span>}
</div>

// Or use aria-busy
<div aria-busy={isLoading}>
  {isLoading ? <LoadingSpinner /> : <Content />}
</div>
```

### Toast Notifications

```tsx
const Toast = ({ message, type = 'info' }: ToastProps) => {
  return (
    <div
      role={type === 'error' ? 'alert' : 'status'}
      aria-live={type === 'error' ? 'assertive' : 'polite'}
      className="toast"
    >
      {message}
    </div>
  );
};
```

---

## Checklist

Before deploying:

- [ ] All images have alt text
- [ ] Form inputs have labels
- [ ] Focus indicators visible
- [ ] Keyboard navigation works
- [ ] Color contrast meets 4.5:1
- [ ] Heading hierarchy correct
- [ ] ARIA attributes appropriate
- [ ] Screen reader tested
- [ ] Lighthouse accessibility score >90
- [ ] jest-axe tests passing

---

**Resources**:
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [A11y Project Checklist](https://www.a11yproject.com/checklist/)
- [MDN Accessibility](https://developer.mozilla.org/en-US/docs/Web/Accessibility)
- [WebAIM](https://webaim.org/)

**See Also**:
- [Component Guidelines](./component-guidelines.md)
- [Testing Guide](./testing.md)
