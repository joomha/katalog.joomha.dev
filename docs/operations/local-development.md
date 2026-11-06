# Local Development Setup

> Agent 10 · Integration & QA Documentation

## Prerequisites

| Tool | Version | Notes |
|------|---------|-------|
| Node.js | ≥ 20.x LTS | Use [nvm](https://github.com/nvm-sh/nvm) or [fnm](https://github.com/Schniz/fnm) |
| pnpm | ≥ 9.x | `npm install -g pnpm` |
| PostgreSQL | ≥ 15 | Local or Docker |
| Git | any recent | — |

## 1. Clone & Install

```bash
git clone https://github.com/joomha/katalog.joomha.dev.git
cd katalog.joomha.dev
pnpm install
```

## 2. Environment Variables

Copy the example file and fill in your local values:

```bash
cp .env.example .env.local
```

See [`environment-variables.md`](./environment-variables.md) for full reference of every variable.

**Minimum required for local dev:**

```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/katalog_dev"
NEXTAUTH_SECRET="your-random-secret-32-chars-min"
NEXTAUTH_URL="http://localhost:3000"
```

## 3. Database Setup

```bash
# Generate Prisma client
pnpm db:generate

# Apply migrations to your local DB
pnpm db:migrate:dev

# (Optional) Seed with sample data
pnpm db:seed
```

## 4. Run Development Server

```bash
pnpm dev
```

Application will be available at `http://localhost:3000`.

## 5. Available Scripts

| Script | Description |
|--------|-------------|
| `pnpm dev` | Start Next.js dev server with hot reload |
| `pnpm build` | Production build |
| `pnpm start` | Start production server (requires build) |
| `pnpm test` | Run all unit tests (Vitest) |
| `pnpm test:watch` | Run tests in watch mode |
| `pnpm typecheck` | TypeScript type check (no emit) |
| `pnpm lint` | ESLint (errors only fail CI) |
| `pnpm db:generate` | Generate Prisma client from schema |
| `pnpm db:migrate:dev` | Run migrations + create new if schema changed |
| `pnpm db:migrate:deploy` | Apply pending migrations (production-safe) |
| `pnpm db:seed` | Run dev seed orchestrator |

## 6. Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── (admin)/            # Admin panel routes
│   ├── (customer)/         # Customer-facing routes
│   └── api/                # API route handlers
├── modules/                # Domain modules (feature slices)
│   ├── catalog/            # Agent 03 — Product catalog
│   ├── commerce/           # Agent 04 — Payments & orders
│   ├── learning/           # Agent 05 — LMS
│   ├── tutoring/           # Agent 06 — (stub)
│   ├── business-services/  # Agent 07 — Jasa profesional
│   ├── ai-consultation/    # Agent 08 — AI consultant
│   └── platform/           # Agent 09 — Admin platform
├── lib/                    # Shared utilities and clients
└── components/             # Shared UI components

prisma/
├── models/                 # Per-domain Prisma schema files
├── migrations/             # SQL migrations (Agent 10)
├── seeds/                  # Per-domain seed files
└── seed.ts                 # Seed orchestrator (Agent 10)

docs/
├── operations/             # This folder — DevOps & deployment
└── API_CONTRACTS.md        # Inter-module API contracts
```

## 7. Running Tests

```bash
# All tests
pnpm test

# Single domain
pnpm test src/modules/learning

# With coverage
pnpm test --coverage

# Watch mode (TDD)
pnpm test:watch
```

> **Note:** Unit tests run entirely in-memory using Vitest + mock Prisma. No database connection required for tests.

## 8. Common Issues

### `server-only` resolve error in Vitest
Already fixed via `tests/shims/server-only.ts` alias in `vitest.config.ts`. If you see this error, run `pnpm db:generate` first.

### Prisma client not generated
```bash
pnpm db:generate
```

### Port 3000 in use
```bash
# Kill process on port 3000
npx kill-port 3000
```

### Database connection refused
Ensure PostgreSQL is running and `DATABASE_URL` is correct in `.env.local`.
