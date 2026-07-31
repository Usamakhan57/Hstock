# Environment Setup

## 1. Prerequisites

- Node.js 20+
- MongoDB 7+ (local or Hostinger VPS bound to `127.0.0.1`)
- npm 10+
- Optional: Redis (multi-instance Socket.io later)
- SMTP credentials for production email
- Cryptomus merchant credentials for payments

## 2. Configure

```bash
cd apps/api
cp .env.example .env
```

### Required variables

| Variable | Required | Purpose |
|----------|----------|---------|
| `MONGODB_URI` | Yes | MongoDB connection string |
| `MONGODB_DB_NAME` | Yes | Database name |
| `JWT_ACCESS_SECRET` | Yes | ≥32 chars, unique |
| `JWT_REFRESH_SECRET` | Yes | ≥32 chars, unique |
| `CORS_ORIGINS` | Yes (prod) | Exact frontend origins (no `*`) |
| `FRONTEND_URL` | Yes | Storefront base URL |
| `CREDENTIALS_ENCRYPTION_KEY` | **Required in production** | ≥32 chars AES key for dispute credentials |
| `CRYPTOMUS_MERCHANT_ID` | **Required in production** | Cryptomus merchant |
| `CRYPTOMUS_API_KEY` | **Required in production** | Cryptomus API key |
| `CRYPTOMUS_MODE` | **Must be `production` in prod** | `sandbox` \| `production` |
| `CRYPTOMUS_ENFORCE_IP_WHITELIST` | **Must be `true` in prod** | Webhook IP enforcement |

### Recommended production variables

| Variable | Purpose |
|----------|---------|
| `NODE_ENV=production` | Enables production guards |
| `ENABLE_JOBS=true` | Escrow auto-release, payment sync, cleanup |
| `SMTP_HOST` / `SMTP_USER` / `SMTP_PASS` / `EMAIL_FROM` | Transactional email |
| `COOKIE_SECURE=true` | Secure refresh cookies |
| `COOKIE_SAME_SITE=lax` | CSRF-friendly cookie policy |
| `REDIS_URL` | Optional — reserved for scaled Socket.io / rate-limit store |
| `CRYPTOMUS_WEBHOOK_SECRET` | Webhook signing secret if used by provider config |

Never commit real secrets. Never hardcode credentials in source.

## 3. Install & run (dev)

```bash
npm install
npm run seed
npm run dev
```

Web:

```bash
cd ../web
npm install
export VITE_API_URL=http://localhost:4000/api/v1
npm run dev
```

## 4. Production validation

On boot with `NODE_ENV=production`, the API **exits** if:

- JWT secrets still contain `change-me`
- `CREDENTIALS_ENCRYPTION_KEY` missing
- CORS includes `*`
- Cryptomus credentials / mode / IP whitelist are not production-ready

## 5. Health checks

- `GET /health` — status + DB
- `GET /health/live` — process alive
- `GET /health/ready` — DB ready
- `GET /api/v1/admin/system-health` — admin ops (SMTP, socket, queues, Cryptomus)
