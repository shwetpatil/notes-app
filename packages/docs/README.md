# Packages Documentation

This directory contains documentation for all shared packages in the monorepo.

## 📚 Available Documentation

- **[Overview](./OVERVIEW.md)** - Monorepo structure and shared packages overview
- **[Types Package](./TYPES.md)** - Complete @notes/types documentation
- **[Development Guide](./DEVELOPMENT.md)** - How to develop shared packages
- **[Best Practices](./BEST_PRACTICES.md)** - Guidelines for package development

---

## Quick Links

### Package References
- [@notes/types](./TYPES.md) - TypeScript types and Zod schemas
- [@notes/ui-lib](../ui-lib/README.md) - Shared UI components _(coming soon)_

### Guides
- [Creating New Packages](./DEVELOPMENT.md#creating-new-packages)
- [Using Zod Validation](./TYPES.md#validation-schemas)
- [Package Troubleshooting](./DEVELOPMENT.md#troubleshooting)

---

## Package Structure

```
packages/
├── docs/                    # This directory
│   ├── README.md           # This file
│   ├── OVERVIEW.md         # Monorepo overview
│   ├── TYPES.md            # Types package docs
│   ├── DEVELOPMENT.md      # Development guide
│   └── BEST_PRACTICES.md   # Best practices
├── types/                  # Shared TypeScript types
│   ├── src/
│   ├── dist/
│   └── package.json
└── ui-lib/                 # Shared UI components
    ├── src/
    └── package.json
```

---

## Getting Started

1. **Read the [Overview](./OVERVIEW.md)** to understand the monorepo structure
2. **Check [Types Package docs](./TYPES.md)** for available types and schemas
3. **Follow [Development Guide](./DEVELOPMENT.md)** when creating new packages

---

**For more information, see the main [project documentation](../../docs/README.md).**
