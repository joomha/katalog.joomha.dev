# Migration Deployment Guide

> Agent 10 · Integration & QA Documentation

## Overview

This project uses **Prisma Migrate** with a multi-file schema (via `prismaSchemaFolder` preview feature). All migration commands must include `--schema=prisma` to point at the schema folder instead of a single file.

The baseline migration (`0_init`) covers all 8 domain schemas from an empty database.

---

## Migration Files

```
prisma/
├── migrations/
│   ├── 0_init/
│   │   └── migration.sql   # Baseline — full schema from empty DB
│   └── migration_lock.toml # Prisma migration lock (do not edit manually)
└── models/
    ├── identity.prisma
    ├── catalog.prisma
    ├── commerce.prisma
    ├── learning.prisma
    ├── tutoring.prisma
    ├── business-services.prisma
    ├── ai-consultation.prisma
    └── platform.prisma
```

---

## Local Development

### First-time setup

```bash
# 1. Generate Prisma client
pnpm db:generate

# 2. Apply baseline + any subsequent migrations
pnpm db:migrate:dev

# 3. Seed sample data (optional but recommended)
pnpm db:seed
```

### After schema changes (feature development)

```bash
# Create a new migration file from schema changes
pnpm db:migrate:dev --name descriptive-migration-name
```

Prisma will:
1. Diff your current schema against the last applied migration
2. Generate a new SQL migration file
3. Apply it to your local dev database

### Resetting local database (nuke & rebuild)

> ⚠️ Destroys all local data. Dev only.

```bash
npx prisma migrate reset --schema=prisma
```

---

## Staging / Preview Environment

```bash
# 1. Ensure DATABASE_URL and DIRECT_URL point to staging DB
# 2. Apply all pending migrations (no interactive prompts, no data-loss check)
pnpm db:migrate:deploy

# 3. Generate Prisma client for the deployed schema
pnpm db:generate
```

---

## Production Deployment

> [!CAUTION]
> Never run `migrate dev` or `migrate reset` in production. Only use `migrate deploy`.

### Pre-deployment checklist

- [ ] All migration files committed and code-reviewed
- [ ] `DATABASE_URL` and `DIRECT_URL` point to production DB (use direct, non-pooled URL for migrations)
- [ ] DB backup taken before applying migrations
- [ ] New migration reviewed for destructive operations (DROP TABLE, DROP COLUMN)
- [ ] Rollback SQL prepared if migration has destructive changes

### Deployment steps

```bash
# Run as part of your CI/CD pipeline BEFORE starting the app server

# Step 1: Apply pending migrations
DATABASE_URL="$DIRECT_URL" npx prisma migrate deploy --schema=prisma

# Step 2: Generate Prisma client (usually done at build time)
npx prisma generate --schema=prisma --allow-no-models

# Step 3: Start the application
pnpm start
```

> **Why `DIRECT_URL`?** Connection poolers (PgBouncer, Supabase Pooler) don't support all PostgreSQL features needed by Prisma migrations (e.g. advisory locks). Always use a direct connection for `migrate deploy`.

### Vercel deployment

In Vercel, add this to your build command:

```bash
npx prisma generate --schema=prisma --allow-no-models && next build
```

And add a post-build / release phase command:

```bash
DATABASE_URL=$DIRECT_URL npx prisma migrate deploy --schema=prisma
```

### Railway deployment

Railway automatically picks up `Procfile` or build commands. Use:

```
release: DATABASE_URL=$DIRECT_URL pnpm db:migrate:deploy
```

---

## Troubleshooting

### "Migration failed to apply cleanly"

The migration file and actual DB state differ. Usually caused by manual DB changes.

```bash
# Check which migrations have been applied
npx prisma migrate status --schema=prisma
```

**Resolution:** Compare the failed migration SQL against the actual schema; resolve conflicts manually in the DB if safe, then mark as applied:

```bash
npx prisma migrate resolve --applied 0_init --schema=prisma
```

### "Database schema is not in sync"

```bash
# Check drift between schema and DB
npx prisma migrate diff \
  --from-schema-datasource prisma \
  --to-schema-datamodel prisma \
  --script
```

If diff is empty, your schema and DB are in sync.

### Prisma client type mismatch after deployment

Always regenerate the Prisma client after any schema/migration change:

```bash
pnpm db:generate
```

---

## See Also

- [Environment Variables](./environment-variables.md)
- [Seed Process](./seed-process.md)
- [Backup & Restore Guide](./backup-restore-guide.md)
- [Rollback & Incident Notes](./rollback-incident-notes.md)
