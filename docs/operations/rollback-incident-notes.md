# Rollback & Incident Response Notes

> Agent 10 · Integration & QA Documentation

## Overview

This document defines rollback procedures and incident response steps for `katalog.joomha.dev` production incidents.

---

## Deployment Rollback

### Application Rollback (Vercel / Railway)

**Vercel:**
1. Dashboard → Deployments
2. Find the last known-good deployment
3. Click **...** → **Promote to Production**
4. Verify health check passes

**Railway:**
1. Dashboard → Deployments
2. Click the previous deployment
3. Click **Redeploy**

### Git Rollback

```bash
# Identify the last good commit
git log --oneline -20

# Revert to a specific commit (creates a new commit)
git revert HEAD...<bad-commit-sha> --no-commit
git commit -m "revert: rollback to <good-commit-sha> due to <incident>"
git push naonwe main

# Or if you need to hard reset (use with caution — rewrites history)
# git reset --hard <good-commit-sha>
# git push --force-with-lease naonwe main
```

---

## Database Migration Rollback

> [!CAUTION]
> Prisma Migrate does not support automatic down-migrations. All rollbacks are manual SQL operations.

### Step 1: Assess the Damage

```bash
# Check which migration caused issues
npx prisma migrate status --schema=prisma

# Check recent DB changes
psql "$DIRECT_URL" -c "SELECT * FROM \"_prisma_migrations\" ORDER BY finished_at DESC LIMIT 5;"
```

### Step 2: Restore from Pre-Migration Backup

If the migration caused data loss or corruption:

```bash
# Restore from the pre-migration backup (see backup-restore-guide.md)
pg_restore \
  --dbname="$DIRECT_URL" \
  --clean \
  --no-acl \
  --no-owner \
  pre-migration-<commit>-<timestamp>.dump
```

### Step 3: Mark Migration as Reverted

After restoring, tell Prisma the migration was rolled back:

```bash
npx prisma migrate resolve --rolled-back <migration-name> --schema=prisma
```

### Step 4: Deploy Fixed Migration

Fix the migration file, re-deploy, and re-apply.

---

## Incident Severity Levels

| Level | Description | Response Time | Examples |
|-------|-------------|--------------|---------|
| P0 | Complete outage | Immediate (< 15 min) | Site down, DB unreachable, all payments failing |
| P1 | Critical degradation | < 1 hour | Payment failures for some users, auth broken |
| P2 | Partial degradation | < 4 hours | AI consultant down, file uploads failing |
| P3 | Minor issues | Next business day | UI glitches, non-critical feature broken |

---

## Incident Response Checklist

### P0 — Site Down

- [ ] 1. Verify the issue (is it real? check from multiple locations)
- [ ] 2. Check server/hosting status page (Vercel/Railway status)
- [ ] 3. Check database connection (ping DB, check connection pool)
- [ ] 4. Roll back last deployment if issue started after deploy
- [ ] 5. Post incident update to team
- [ ] 6. Identify root cause
- [ ] 7. Document in this file (Incident Log section below)

### P1 — Payment Failures

- [ ] 1. Check Midtrans dashboard for service status
- [ ] 2. Check webhook endpoint logs
- [ ] 3. Verify `MIDTRANS_SERVER_KEY` and `MIDTRANS_IS_PRODUCTION` are correct
- [ ] 4. Check if affected transactions can be manually reconciled in Midtrans dashboard
- [ ] 5. Notify affected users if data was lost

### P1 — Auth Broken

- [ ] 1. Verify `NEXTAUTH_SECRET` is set and hasn't changed
- [ ] 2. Verify `NEXTAUTH_URL` matches the actual domain
- [ ] 3. Check NextAuth logs for specific error
- [ ] 4. If JWT invalid, existing sessions will need to be re-established (acceptable for auth incidents)

---

## Health Check Endpoints

| Endpoint | Expected Response | Checks |
|----------|-------------------|--------|
| `GET /api/health` | `200 { status: "ok" }` | App is running |
| `GET /api/health/db` | `200 { status: "ok", latencyMs: N }` | DB connection |

> See [`health-check.md`](./health-check.md) for health check implementation details.

---

## Incident Log

### Template

```
## Incident — YYYY-MM-DD HH:MM WIB

**Severity:** P0 / P1 / P2 / P3
**Duration:** X minutes / hours
**Impact:** Description of user-facing impact
**Root Cause:** What caused the incident
**Resolution:** What fixed it
**Prevention:** Changes to prevent recurrence
```

---

### Past Incidents

_No production incidents recorded yet. This is a pre-launch project._

---

## See Also

- [Backup & Restore Guide](./backup-restore-guide.md)
- [Migration Deployment](./migration-deployment.md)
- [Health Check](./health-check.md)
