# Environment Setup

## 1. Prerequisites

- Node.js 20+
- MongoDB 7+ (local or Hostinger VPS)
- npm 10+

## 2. Configure

```bash
cd apps/api
cp .env.example .env
```

Edit `.env`:

| Variable | Required | Purpose |
|----------|----------|---------|
| `MONGODB_URI` | Yes | MongoDB connection string |
| `MONGODB_DB_NAME` | Yes | Database name |
| `JWT_ACCESS_SECRET` | Yes | ≥32 chars |
| `JWT_REFRESH_SECRET` | Yes | ≥32 chars |
| `PORT` | No | Default `4000` |
| `CORS_ORIGINS` | No | Comma-separated allowed origins |
| `ENABLE_JOBS` | No | Keep `false` in Phase 1 |
| `CRYPTOMUS_*` | No | Reserved for Phase 2+ |
| `SMTP_*` | No | Reserved for later email phase |

Never hardcode credentials in source files.

## 3. Install & run

```bash
npm install
npm run dev
```

## 4. Health checks

```bash
curl http://localhost:4000/health
curl http://localhost:4000/health/live
curl http://localhost:4000/health/ready
```

`/health/ready` returns `503` until MongoDB is connected.

## 5. Production (Hostinger VPS overview)

1. Install Node 20, MongoDB, Nginx, PM2 on Ubuntu 24.04
2. Bind MongoDB to `127.0.0.1` with auth
3. Deploy API under `/var/www/hstock/api` (or similar)
4. Copy `.env` with production secrets
5. `pm2 start ecosystem.config.cjs --env production`
6. Configure Nginx from `deploy/nginx/hstock.conf`
7. Enable TLS (Certbot)

See `README.md` for full Phase 1 scope.
