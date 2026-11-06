# Backup & Restore Guide

> Agent 10 · Integration & QA Documentation

## Overview

This guide covers database backup and restore procedures for `katalog.joomha.dev`. All database backups should be automated and tested regularly in staging.

---

## Database Backup

### Manual Backup (pg_dump)

```bash
# Full database backup (custom format, compressed)
pg_dump \
  --format=custom \
  --compress=9 \
  --no-acl \
  --no-owner \
  --dbname="$DATABASE_URL" \
  --file="backup-$(date +%Y%m%d-%H%M%S).dump"

# Verify backup file
pg_restore --list backup-*.dump | head -20
```

### Schema-only Backup

```bash
pg_dump \
  --schema-only \
  --no-acl \
  --no-owner \
  --dbname="$DATABASE_URL" \
  --file="schema-$(date +%Y%m%d).sql"
```

### Data-only Backup

```bash
pg_dump \
  --data-only \
  --no-acl \
  --no-owner \
  --dbname="$DATABASE_URL" \
  --file="data-$(date +%Y%m%d-%H%M%S).dump"
```

---

## Automated Backup Schedule (Recommended)

For production, set up automated daily backups:

### Using Cron + pg_dump

```bash
# /etc/cron.d/katalog-backup
0 2 * * * postgres pg_dump \
  --format=custom \
  --compress=9 \
  --dbname="postgresql://..." \
  --file="/backups/katalog-$(date +\%Y\%m\%d).dump" \
  && find /backups -name "katalog-*.dump" -mtime +30 -delete
```

### Backup Retention Policy (Recommended)

| Frequency | Retention |
|-----------|-----------|
| Daily | 7 days |
| Weekly | 4 weeks |
| Monthly | 12 months |
| Pre-migration | Indefinitely (tagged) |

---

## Restore Procedures

### Full Restore from Custom Dump

```bash
# 1. Create a fresh database (if restoring to new instance)
createdb --owner=postgres katalog_restored

# 2. Restore
pg_restore \
  --dbname="postgresql://postgres:password@localhost:5432/katalog_restored" \
  --no-acl \
  --no-owner \
  --verbose \
  backup-20261106.dump

# 3. Verify row counts
psql "$DATABASE_URL" -c "SELECT schemaname, tablename, n_live_tup FROM pg_stat_user_tables ORDER BY n_live_tup DESC LIMIT 20;"
```

### Point-in-Time Recovery (PITR)

If using Supabase, Railway PostgreSQL, or Neon, PITR is available via the platform dashboard:
- **Supabase**: Dashboard → Database → Backups → Restore
- **Railway**: Dashboard → Database → Backups
- **Neon**: Dashboard → Branches → Restore from point in time

---

## Pre-Migration Backup Checklist

> [!IMPORTANT]
> Always take a backup BEFORE running migrations in production.

```bash
# Tag the backup with the migration name
pg_dump \
  --format=custom \
  --compress=9 \
  --dbname="$DIRECT_URL" \
  --file="pre-migration-$(git rev-parse --short HEAD)-$(date +%Y%m%d-%H%M%S).dump"
```

Store this backup in a location independent of the application server (S3, GCS, etc.).

---

## File/Asset Backup

If using local file storage (`STORAGE_PROVIDER=local`):

```bash
# Backup upload directory
tar -czf uploads-backup-$(date +%Y%m%d).tar.gz ./public/uploads/
```

For S3/GCS storage, assets are managed by the cloud provider — enable versioning and cross-region replication.

---

## Restore Testing

> Backups are only useful if they work. Test restores monthly.

```bash
# Monthly restore test procedure:
# 1. Spin up a temporary test database
# 2. Restore latest backup
# 3. Run smoke tests against restored DB
# 4. Verify row counts match production
# 5. Destroy test database

# Minimum verification query
psql "$TEST_DATABASE_URL" -c "
SELECT
  (SELECT COUNT(*) FROM \"CatalogItem\") as catalog_items,
  (SELECT COUNT(*) FROM \"Order\") as orders,
  (SELECT COUNT(*) FROM \"Course\") as courses;
"
```

---

## See Also

- [Rollback & Incident Notes](./rollback-incident-notes.md)
- [Migration Deployment](./migration-deployment.md)
- [Environment Variables](./environment-variables.md)
