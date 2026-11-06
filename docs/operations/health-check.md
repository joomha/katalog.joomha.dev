# Health Check

> Agent 10 · Integration & QA Documentation

## Overview

Health check endpoints allow load balancers, monitoring tools, and deployment platforms to verify the application is running correctly.

---

## Endpoints

### Application Health

```
GET /api/health
```

**Response (healthy):**
```json
{
  "status": "ok",
  "version": "1.0.0",
  "timestamp": "2026-11-06T15:30:00.000Z",
  "environment": "production"
}
```

**Response (unhealthy):** `503 Service Unavailable`

### Database Health

```
GET /api/health/db
```

**Response (healthy):**
```json
{
  "status": "ok",
  "latencyMs": 12,
  "timestamp": "2026-11-06T15:30:00.000Z"
}
```

**Response (unhealthy):** `503 Service Unavailable`
```json
{
  "status": "error",
  "error": "Cannot reach database",
  "timestamp": "2026-11-06T15:30:00.000Z"
}
```

---

## Monitoring Setup

### Uptime Monitoring (Recommended Services)

| Service | Free Tier | Features |
|---------|-----------|---------|
| [Better Uptime](https://betteruptime.com) | 10 monitors, 3min interval | Alerts, incident pages |
| [UptimeRobot](https://uptimerobot.com) | 50 monitors, 5min interval | Simple, reliable |
| [Freshping](https://freshping.io) | 50 monitors, 1min interval | Detailed analytics |

**Configure monitoring for:**
- `https://katalog.joomha.dev/api/health` — Every 1-5 minutes
- `https://katalog.joomha.dev/api/health/db` — Every 5 minutes

### Alert Channels

Configure alerts to notify via:
- Email (immediate for P0/P1)
- Telegram / WhatsApp group (team notification)

---

## Deployment Platform Health Checks

### Vercel

Vercel automatically monitors deployments. For custom health checks in `vercel.json`:

```json
{
  "functions": {
    "api/health.ts": {
      "maxDuration": 10
    }
  }
}
```

### Railway

In Railway service settings:
- **Health Check Path:** `/api/health`
- **Health Check Timeout:** `10s`
- **Health Check Interval:** `30s`

---

## Manual Health Verification

After every production deployment:

```bash
# Check app health
curl -f https://katalog.joomha.dev/api/health

# Check DB health
curl -f https://katalog.joomha.dev/api/health/db

# Check a sample page loads
curl -f -s -o /dev/null -w "%{http_code}" https://katalog.joomha.dev/

# Check admin routes require auth (should redirect to login)
curl -s -o /dev/null -w "%{http_code}" https://katalog.joomha.dev/admin
# Expected: 302 (redirect to login)
```

---

## Key Metrics to Monitor

| Metric | Warning | Critical |
|--------|---------|---------|
| Response time (p95) | > 2s | > 5s |
| Error rate (5xx) | > 1% | > 5% |
| DB query latency (p95) | > 500ms | > 2s |
| DB connection pool usage | > 70% | > 90% |
| Memory usage | > 70% | > 90% |

---

## See Also

- [Rollback & Incident Notes](./rollback-incident-notes.md)
- [Environment Variables](./environment-variables.md)
- [Local Development](./local-development.md)
