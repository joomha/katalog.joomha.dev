# Environment Variables Reference

> Agent 10 · Integration & QA Documentation  
> **NEVER commit real values to this file or any file tracked by git.**

## How to Use

1. Copy `.env.example` to `.env.local` for local development
2. Set production values via your hosting platform's secret manager (Vercel, Railway, etc.)
3. Never hardcode secrets in source code

---

## Core / Database

| Variable | Required | Scope | Description |
|----------|----------|-------|-------------|
| `DATABASE_URL` | ✅ Required | Server | Full PostgreSQL connection string. Format: `postgresql://user:password@host:port/dbname?schema=public` |
| `DIRECT_URL` | ⚠️ Prod only | Server | Direct (non-pooled) connection URL for Prisma migrations. Required when `DATABASE_URL` points to a connection pooler (PgBouncer, Supabase pooler). |

---

## Authentication (NextAuth.js v5 Beta)

| Variable | Required | Scope | Description |
|----------|----------|-------|-------------|
| `NEXTAUTH_SECRET` | ✅ Required | Server | Random secret for JWT signing. Min 32 chars. Generate: `openssl rand -base64 32` |
| `NEXTAUTH_URL` | ✅ Required | Server | Canonical URL of the app. E.g. `https://katalog.joomha.dev` or `http://localhost:3000` |
| `AUTH_GOOGLE_ID` | Optional | Server | Google OAuth Client ID (if enabling Google login) |
| `AUTH_GOOGLE_SECRET` | Optional | Server | Google OAuth Client Secret |

---

## Payments (Midtrans — Agent 04)

| Variable | Required | Scope | Description |
|----------|----------|-------|-------------|
| `MIDTRANS_SERVER_KEY` | ✅ Required | Server | Midtrans server key. Starts with `SB-Mid-server-` (sandbox) or `Mid-server-` (production) |
| `MIDTRANS_CLIENT_KEY` | ✅ Required | Client | Midtrans client key for Snap.js. Starts with `SB-Mid-client-` or `Mid-client-` |
| `MIDTRANS_IS_PRODUCTION` | Optional | Server | `true` for production Midtrans environment. Default: `false` (sandbox) |
| `MIDTRANS_NOTIFICATION_URL` | Optional | Server | Override for Midtrans payment notification webhook URL. Usually set to `https://your-domain.com/api/payments/midtrans/notification` |

> See [`payment-provider-activation.md`](./payment-provider-activation.md) for activation checklist.

---

## AI / LLM (Agent 08 — AI Consultation)

| Variable | Required | Scope | Description |
|----------|----------|-------|-------------|
| `OPENROUTER_API_KEY` | ✅ Required for AI | Server | OpenRouter API key. Get at [openrouter.ai](https://openrouter.ai) |
| `OPENROUTER_BASE_URL` | Optional | Server | OpenRouter API base URL. Default: `https://openrouter.ai/api/v1` |
| `OPENROUTER_DEFAULT_MODEL` | Optional | Server | Default LLM model for general queries. Default: `meta-llama/llama-3.1-8b-instruct:free` |
| `OPENROUTER_EMBEDDING_MODEL` | Optional | Server | Embedding model for RAG. See [`openrouter-embedding-setup.md`](./openrouter-embedding-setup.md) |

---

## Email (Notifications — Agent 09)

| Variable | Required | Scope | Description |
|----------|----------|-------|-------------|
| `EMAIL_PROVIDER` | Optional | Server | Email provider. Options: `resend`, `nodemailer-smtp`. Default: `console` (dev) |
| `RESEND_API_KEY` | Cond. required | Server | Required if `EMAIL_PROVIDER=resend`. Get at [resend.com](https://resend.com) |
| `EMAIL_FROM` | Optional | Server | Sender address. E.g. `noreply@katalog.joomha.dev` |
| `SMTP_HOST` | Cond. required | Server | Required if `EMAIL_PROVIDER=nodemailer-smtp` |
| `SMTP_PORT` | Optional | Server | SMTP port. Default: `587` |
| `SMTP_USER` | Cond. required | Server | SMTP username |
| `SMTP_PASSWORD` | Cond. required | Server | SMTP password |
| `SMTP_SECURE` | Optional | Server | `true` for TLS on port 465. Default: `false` |

> See [`email-provider-setup.md`](./email-provider-setup.md) for provider-specific setup.

---

## File Storage

| Variable | Required | Scope | Description |
|----------|----------|-------|-------------|
| `STORAGE_PROVIDER` | Optional | Server | Storage backend. Options: `local`, `s3`, `gcs`. Default: `local` (dev only) |
| `S3_BUCKET` | Cond. required | Server | S3 bucket name. Required if `STORAGE_PROVIDER=s3` |
| `S3_REGION` | Cond. required | Server | AWS region. E.g. `ap-southeast-1` |
| `S3_ACCESS_KEY_ID` | Cond. required | Server | AWS access key ID |
| `S3_SECRET_ACCESS_KEY` | Cond. required | Server | AWS secret access key |
| `S3_ENDPOINT` | Optional | Server | Custom S3-compatible endpoint (e.g. Cloudflare R2, MinIO) |
| `UPLOAD_MAX_SIZE_MB` | Optional | Server | Max file upload size in MB. Default: `10` |

---

## Application Settings

| Variable | Required | Scope | Description |
|----------|----------|-------|-------------|
| `NEXT_PUBLIC_APP_URL` | Optional | Client | Public base URL for client-side absolute links. E.g. `https://katalog.joomha.dev` |
| `NEXT_PUBLIC_APP_NAME` | Optional | Client | App display name. Default: `katalog.joomha.dev` |
| `NODE_ENV` | Auto-set | Both | `development`, `test`, or `production`. Set automatically by Next.js/Vercel |
| `LOG_LEVEL` | Optional | Server | Logging verbosity. Options: `debug`, `info`, `warn`, `error`. Default: `info` |

---

## Notes

- **Scope "Server"**: Only accessible server-side (API routes, Server Actions, Server Components). **Never** expose to client.
- **Scope "Client"**: Must be prefixed `NEXT_PUBLIC_` to be accessible in client-side code.
- **Scope "Both"**: Accessible everywhere.
- Variables not prefixed with `NEXT_PUBLIC_` are automatically excluded from the client bundle by Next.js.
- When using Vercel: set server-only variables in **Environment Variables** (not Vercel Edge Config).
- When using Railway: set via Railway's variable injection — values are injected at build/runtime automatically.
