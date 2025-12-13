# Technology Stack

Complete technology stack with versions, purpose, and documentation links.

## Frontend Technologies

### Core Framework
| Technology | Version | Purpose | Documentation |
|------------|---------|---------|---------------|
| **Next.js** | 15.5.9 | React framework with App Router | [docs](https://nextjs.org/docs) |
| **React** | 18.3.1 | UI library | [docs](https://react.dev) |
| **TypeScript** | 5.3.3 | Type safety | [docs](https://www.typescriptlang.org/docs/) |

### Styling & UI
| Technology | Version | Purpose | Documentation |
|------------|---------|---------|---------------|
| **Tailwind CSS** | 3.4.1 | Utility-first CSS framework | [docs](https://tailwindcss.com/docs) |
| **@notes/ui-lib** | 1.0.0 | Shared component library | Internal package |

### State Management & Data
| Technology | Version | Purpose | Documentation |
|------------|---------|---------|---------------|
| **TanStack Query** | 5.17.19 | Server state management | [docs](https://tanstack.com/query/latest) |
| **Dexie** | 3.2.4 | IndexedDB wrapper (offline storage) | [docs](https://dexie.org/) |
| **Axios** | 1.6.5 | HTTP client | [docs](https://axios-http.com/docs/intro) |

### Markdown & Content
| Technology | Version | Purpose | Documentation |
|------------|---------|---------|---------------|
| **react-markdown** | 10.1.0 | Markdown rendering | [docs](https://github.com/remarkjs/react-markdown) |
| **remark-gfm** | 4.0.0 | GitHub Flavored Markdown | [docs](https://github.com/remarkjs/remark-gfm) |
| **rehype-highlight** | 7.0.0 | Code syntax highlighting | [docs](https://github.com/rehypejs/rehype-highlight) |

### Build Tools
| Technology | Version | Purpose | Documentation |
|------------|---------|---------|---------------|
| **Turbopack** | Built-in | Next.js bundler (dev) | [docs](https://turbo.build/pack) |
| **PostCSS** | 8.4.32 | CSS processing | [docs](https://postcss.org/) |
| **ESLint** | 8.56.0 | Linting | [docs](https://eslint.org/docs/latest/) |

### Testing
| Technology | Version | Purpose | Documentation |
|------------|---------|---------|---------------|
| **Playwright** | 1.41.2 | E2E testing | [docs](https://playwright.dev/) |

## Backend Technologies

### Core Framework
| Technology | Version | Purpose | Documentation |
|------------|---------|---------|---------------|
| **Node.js** | 20.19.5 | JavaScript runtime | [docs](https://nodejs.org/docs/latest/api/) |
| **Express** | 4.22.1 | Web framework | [docs](https://expressjs.com/) |
| **TypeScript** | 5.3.3 | Type safety | [docs](https://www.typescriptlang.org/docs/) |
| **tsx** | 4.21.0 | TypeScript execution | [docs](https://github.com/privatenumber/tsx) |

### Database & ORM
| Technology | Version | Purpose | Documentation |
|------------|---------|---------|---------------|
| **PostgreSQL** | 16.0 | Relational database | [docs](https://www.postgresql.org/docs/) |
| **Prisma** | 5.22.0 | Database ORM | [docs](https://www.prisma.io/docs) |

### Security
| Technology | Version | Purpose | Documentation |
|------------|---------|---------|---------------|
| **bcrypt** | 6.0.0 | Password hashing | [docs](https://github.com/kelektiv/node.bcrypt.js) |
| **helmet** | 8.0.0 | Security headers | [docs](https://helmetjs.github.io/) |
| **express-rate-limit** | 7.1.5 | Rate limiting | [docs](https://github.com/express-rate-limit/express-rate-limit) |
| **express-mongo-sanitize** | 2.2.0 | NoSQL injection prevention | [docs](https://github.com/fiznool/express-mongo-sanitize) |
| **xss** | 1.0.15 | XSS sanitization | [docs](https://github.com/leizongmin/js-xss) |
| **validator** | 13.15.23 | Input validation | [docs](https://github.com/validatorjs/validator.js) |

### Session & Auth
| Technology | Version | Purpose | Documentation |
|------------|---------|---------|---------------|
| **express-session** | 1.18.1 | Session management | [docs](https://github.com/expressjs/session) |
| **cors** | 2.8.5 | CORS middleware | [docs](https://github.com/expressjs/cors) |

### Validation
| Technology | Version | Purpose | Documentation |
|------------|---------|---------|---------------|
| **Zod** | 3.22.4 | Schema validation | [docs](https://zod.dev/) |

### Testing
| Technology | Version | Purpose | Documentation |
|------------|---------|---------|---------------|
| **Vitest** | 1.2.0 | Unit testing | [docs](https://vitest.dev/) |

## Shared Packages

### Type System
| Package | Version | Purpose | Location |
|---------|---------|---------|----------|
| **@notes/types** | 1.0.0 | Shared TypeScript types & Zod schemas | `packages/types` |

### UI Components
| Package | Version | Purpose | Location |
|---------|---------|---------|----------|
| **@notes/ui-lib** | 1.0.0 | Reusable React components | `packages/ui-lib` |

## Development Tools

### Package Management
| Technology | Version | Purpose | Documentation |
|------------|---------|---------|---------------|
| **pnpm** | 9.15.9 | Fast package manager | [docs](https://pnpm.io/) |
| **pnpm workspaces** | Built-in | Monorepo management | [docs](https://pnpm.io/workspaces) |

### Development
| Technology | Version | Purpose | Documentation |
|------------|---------|---------|---------------|
| **concurrently** | 8.2.2 | Run multiple commands | [docs](https://github.com/open-cli-tools/concurrently) |
| **dotenv** | 16.3.1 | Environment variables | [docs](https://github.com/motdotla/dotenv) |

### Code Quality
| Technology | Version | Purpose | Documentation |
|------------|---------|---------|---------------|
| **ESLint** | 8.56.0 | Code linting | [docs](https://eslint.org/) |
| **Prettier** | (via ESLint) | Code formatting | [docs](https://prettier.io/) |

## Infrastructure

### Containerization
| Technology | Version | Purpose | Documentation |
|------------|---------|---------|---------------|
| **Docker** | 24+ | Container platform | [docs](https://docs.docker.com/) |
| **Docker Compose** | 2.0+ | Multi-container orchestration | [docs](https://docs.docker.com/compose/) |

### CI/CD
| Technology | Purpose | Documentation |
|------------|---------|---------------|
| **GitHub Actions** | Automated testing & deployment | [docs](https://docs.github.com/en/actions) |

## Browser Support

### Minimum Versions
- **Chrome**: 90+
- **Firefox**: 88+
- **Safari**: 14+
- **Edge**: 90+

### Required Browser APIs
- **IndexedDB** - Offline storage
- **Fetch API** - HTTP requests
- **LocalStorage** - Theme persistence
- **ES2020+** - Modern JavaScript features

## Node.js Requirements

### Versions
- **Minimum**: Node.js 18.0.0
- **Recommended**: Node.js 20.19.5 (LTS)
- **Maximum**: Node.js 22.x

### Required Features
- **ESM Support** - ES Modules
- **Crypto** - Built-in crypto for security
- **Worker Threads** - (Future) Background processing

## Database Requirements

### PostgreSQL
- **Version**: 16.0+
- **Extensions**: None required
- **Collation**: UTF-8
- **Timezone**: UTC recommended

### IndexedDB
- **Browser Support**: All modern browsers
- **Storage Quota**: Up to browser limit (~50% of disk space)
- **Version**: v3 (Dexie schema)

## Environment Variables

### Required
```env
DATABASE_URL="postgresql://..."    # PostgreSQL connection
SESSION_SECRET="random-string"      # Session encryption (32+ chars)
```

### Optional
```env
BACKEND_PORT=3001                   # Backend port (default: 3001)
NODE_ENV=development                # Environment (development|production)
CORS_ORIGIN="http://localhost:3000" # Allowed CORS origin
REDIS_URL="redis://..."            # Redis for sessions (production)
NEXT_PUBLIC_API_URL="http://..."   # Frontend API endpoint
```

## Performance Characteristics

### Frontend
- **Initial Load**: ~500ms (with cache)
- **Time to Interactive**: <1s
- **Bundle Size**: ~250KB (gzipped)
- **Offline Capability**: Full functionality

### Backend
- **Average Response**: <100ms
- **Database Queries**: <50ms
- **Authentication**: <200ms (bcrypt)
- **Concurrent Users**: 1000+ (single instance)

## Security Standards

### Compliance
- **OWASP Top 10**: Addressed
- **Password Hashing**: bcrypt (12 rounds)
- **Session Security**: HttpOnly, SameSite, Secure
- **HTTPS**: Required for production
- **HSTS**: Enabled (1 year)

### Encryption
- **Passwords**: bcrypt with salt
- **Sessions**: Encrypted cookies
- **Transport**: TLS 1.2+ (HTTPS)
- **Database**: PostgreSQL native encryption supported

## Future Technology Additions

### Planned (Phase 2+)
- **Redis** - Session store & caching
- **WebSockets** - Real-time collaboration
- **Elasticsearch** - Advanced search
- **S3/MinIO** - File attachments
- **GraphQL** - Alternative API
- **Kubernetes** - Container orchestration
- **Prometheus** - Monitoring
- **Grafana** - Dashboards

---

**Next**: See [Database Schema](./DATABASE.md) for data model details
