# Email Provider Setup

> Agent 10 · Integration & QA Documentation

## Overview

The notification system (Agent 09) sends transactional emails for:
- Order confirmation & payment receipts
- Course enrollment confirmation
- Password reset links
- Project/proposal status updates
- Payment due date reminders

By default in development, emails are logged to the console (no actual sending). Configure a provider for staging/production.

---

## Provider Options

| Provider | Best For | Notes |
|----------|----------|-------|
| `console` | Local dev | Logs email content to stdout. Default. |
| `resend` | Production | Modern developer-friendly API, generous free tier |
| `nodemailer-smtp` | Custom SMTP | Flexible, works with any SMTP server |

---

## Option 1: Console (Default — Dev)

No configuration needed. Emails are printed to the terminal.

```env
EMAIL_PROVIDER=console
EMAIL_FROM=noreply@katalog.joomha.dev
```

---

## Option 2: Resend (Recommended for Production)

### Setup

1. Register at [https://resend.com](https://resend.com)
2. Add and verify your domain (DNS verification required)
3. Create an API key: **API Keys** → **Create API Key**

### Configure

```env
EMAIL_PROVIDER=resend
RESEND_API_KEY=re_YOUR_API_KEY_HERE
EMAIL_FROM=noreply@katalog.joomha.dev
```

### DNS Records Required

Add these records to your domain DNS:

| Type | Host | Value |
|------|------|-------|
| TXT | `resend._domainkey.katalog.joomha.dev` | `p=MIGf...` (from Resend dashboard) |
| MX | `send.katalog.joomha.dev` | `feedback-smtp.ap-southeast-1.amazonses.com` |
| TXT | `send.katalog.joomha.dev` | `v=spf1 include:amazonses.com ~all` |

> Copy exact values from Resend dashboard → **Domains** → your domain → **DNS Records**.

### Free Tier Limits

| Limit | Value |
|-------|-------|
| Emails/month | 3,000 |
| Emails/day | 100 |
| Domains | 1 (free) |

---

## Option 3: Custom SMTP

Suitable for self-hosted mail servers, Gmail SMTP, Zoho Mail, etc.

```env
EMAIL_PROVIDER=nodemailer-smtp
EMAIL_FROM=noreply@katalog.joomha.dev
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
```

### Gmail SMTP Notes

- Enable **2-Step Verification** on your Google account
- Generate an **App Password**: Google Account → Security → App Passwords
- Use the app password (16 chars, no spaces) as `SMTP_PASSWORD`
- Use port `587` with `SMTP_SECURE=false` (STARTTLS) or port `465` with `SMTP_SECURE=true`

---

## Email Templates

Email templates are defined in `src/modules/platform/services/email.service.ts`. Templates are:
- **Order confirmation**: Triggered after payment `PAID` status
- **Enrollment confirmation**: Triggered after course enrollment
- **Password reset**: Triggered by forgot-password flow
- **Project update**: Triggered by proposal status changes
- **Payment reminder**: Triggered by scheduled job (3 days before due date)

Templates are plain HTML strings. Future improvement: use a templating library (React Email, MJML).

---

## Production Checklist

- [ ] Choose and configure a provider (Resend recommended)
- [ ] `EMAIL_FROM` set to a verified sender address
- [ ] DNS records verified for the sender domain
- [ ] Send a test email and verify delivery
- [ ] Check spam score (use [mail-tester.com](https://mail-tester.com))
- [ ] Unsubscribe link present in marketing emails (CAN-SPAM / Indonesian law compliance)

---

## See Also

- [Environment Variables](./environment-variables.md)
- [Resend Documentation](https://resend.com/docs)
