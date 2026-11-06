# Payment Provider Activation — Midtrans

> Agent 10 · Integration & QA Documentation

## Overview

The commerce module (Agent 04) integrates **Midtrans** as the payment gateway. This document covers the activation checklist for both sandbox testing and production go-live.

---

## Sandbox Testing (Development)

### 1. Create Midtrans Account

1. Register at [https://dashboard.midtrans.com](https://dashboard.midtrans.com)
2. Navigate to **Sandbox** environment (top-right toggle)
3. Go to **Settings → Access Keys**
4. Copy **Server Key** (starts with `SB-Mid-server-`) and **Client Key** (starts with `SB-Mid-client-`)

### 2. Configure Environment Variables

```env
MIDTRANS_SERVER_KEY=SB-Mid-server-YOUR_KEY_HERE
MIDTRANS_CLIENT_KEY=SB-Mid-client-YOUR_KEY_HERE
MIDTRANS_IS_PRODUCTION=false
```

### 3. Configure Notification URL (Webhook)

Midtrans sends payment status notifications to your server via webhook.

**For local dev (using ngrok or similar tunnel):**
```bash
# Install ngrok
npx ngrok http 3000

# Your notification URL will be:
# https://<ngrok-id>.ngrok.io/api/payments/midtrans/notification
```

In Midtrans dashboard: **Settings → Configuration → Payment Notification URL**:
```
https://<your-tunnel>.ngrok.io/api/payments/midtrans/notification
```

**For staging/production:**
```
https://katalog.joomha.dev/api/payments/midtrans/notification
```

### 4. Test Cards (Sandbox Only)

| Scenario | Card Number | CVV | Expiry |
|----------|-------------|-----|--------|
| Success | `4811 1111 1111 1114` | `123` | Any future date |
| Failure | `4911 1111 1111 1113` | `123` | Any future date |
| Challenge | `4511 1111 1111 1118` | `123` | Any future date |

---

## Production Activation Checklist

> [!CAUTION]
> Complete ALL items before switching to production. Processing real payments without proper setup can cause irrecoverable issues.

### Business Requirements
- [ ] Midtrans account fully verified (KYC completed)
- [ ] Business documents submitted and approved
- [ ] Bank account linked and verified in Midtrans dashboard
- [ ] Settlement schedule configured

### Technical Requirements
- [ ] Switch environment variables to production keys:
  ```env
  MIDTRANS_SERVER_KEY=Mid-server-YOUR_PRODUCTION_KEY
  MIDTRANS_CLIENT_KEY=Mid-client-YOUR_PRODUCTION_KEY
  MIDTRANS_IS_PRODUCTION=true
  ```
- [ ] Production notification URL configured in Midtrans dashboard
- [ ] HTTPS enforced on all payment pages (required by Midtrans)
- [ ] Webhook signature verification implemented and tested
- [ ] `MIDTRANS_NOTIFICATION_URL` env var points to production endpoint

### Security Requirements
- [ ] Server key NEVER exposed to client-side code
- [ ] Notification endpoint validates Midtrans signature header (`HTTP_X_CALLBACK_TOKEN`)
- [ ] All payment amounts validated server-side (never trust client-sent amounts)
- [ ] Rate limiting on payment initiation endpoint

### Testing in Production
- [ ] Process a real low-value transaction (e.g. IDR 10,000) and verify settlement
- [ ] Test webhook delivery with real transaction
- [ ] Test refund flow end-to-end
- [ ] Test expired payment scenario

---

## Payment Methods Enabled

By default, the integration enables:

| Method | Type | Notes |
|--------|------|-------|
| Credit/Debit Card | Direct | Visa, Mastercard, JCB |
| BCA Virtual Account | Bank Transfer | 24h expiry |
| BNI Virtual Account | Bank Transfer | 24h expiry |
| BRI Virtual Account | Bank Transfer | 24h expiry |
| Mandiri Bill | Bank Transfer | 24h expiry |
| GoPay | E-Wallet | QR Code |
| OVO | E-Wallet | Deep link |
| ShopeePay | E-Wallet | QR Code |
| Indomaret | Convenience Store | 24h expiry |
| Alfamart | Convenience Store | 24h expiry |

To restrict or customize payment methods, modify the `enabledPayments` array in the payment service configuration.

---

## Troubleshooting

### "401 Unauthorized" from Midtrans
- Verify server key is correctly set (no extra spaces/newlines)
- Ensure `MIDTRANS_IS_PRODUCTION=false` for sandbox keys

### Webhook not received
- Check notification URL is publicly accessible
- For local dev, ensure ngrok tunnel is running
- Check Midtrans dashboard → **Settings → Snap Preferences → System Settings** → notification URL

### Payment stuck in PENDING
- Check webhook endpoint logs
- Manually check transaction status in Midtrans dashboard
- Use Midtrans transaction status API to sync state

---

## See Also

- [Midtrans Dashboard](https://dashboard.midtrans.com)
- [Midtrans Snap Documentation](https://docs.midtrans.com/en/snap/overview)
- [Environment Variables](./environment-variables.md)
