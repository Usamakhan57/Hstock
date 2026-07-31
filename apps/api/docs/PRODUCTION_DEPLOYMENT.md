# HStock Production Deployment (Hostinger VPS)

## Stack

- Ubuntu 22.04+
- Node.js 20+
- PM2
- Nginx (+ Certbot SSL)
- MongoDB (bind `127.0.0.1`)
- Redis (optional — multi-instance Socket.io / queues)
- Cryptomus webhooks → `https://hstock.store/api/v1/payments/cryptomus/webhook`

## Checklist

1. Clone repo to `/var/www/hstock`
2. Copy `apps/api/.env.example` → `apps/api/.env` and fill secrets
3. Set `NODE_ENV=production`, strong JWT secrets, SMTP, Cryptomus, `CORS_ORIGINS`, `FRONTEND_URL`
4. Set `ENABLE_JOBS=true`
5. `npm ci` in `apps/api` and `apps/web`
6. `npm run build` for web; sync `apps/web/dist` → `/var/www/hstock/web`
7. Install Nginx site from `deploy/nginx/hstock.conf`
8. `certbot --nginx -d hstock.store -d www.hstock.store`
9. Start API: `pm2 start deploy/pm2/ecosystem.config.cjs --env production`
10. `pm2 save && pm2 startup`
11. Install logrotate config from `deploy/logrotate/hstock`
12. Cron daily backup: `deploy/scripts/backup.sh`
13. Verify:
    - `curl https://hstock.store/health`
    - `curl https://hstock.store/health/ready`
    - Admin login + Socket.io (browser Network → WS)
    - Cryptomus sandbox/live webhook

## Monitoring

- PM2: `pm2 status`, `pm2 logs hstock-api`
- Health: `/health`, `/health/live`, `/health/ready`
- Admin System Health page: `/admin/system-health`
- Nginx access/error logs

## Security

- JWT access + refresh rotation
- Helmet + CSP (Nginx + API)
- Rate limiting, CORS allowlist
- Mongo sanitize, Zod validators
- Cryptomus webhook signature (+ optional IP allowlist)
- Secrets only in `.env` (never commit)
- XSS: React escaping + sanitize middleware

## Performance

- Nginx gzip + static asset caching
- Express compression
- Vite production bundle + lazy routes where applicable
- Mongo indexes on commerce collections
- In-process queues (single instance); Redis optional for scale
