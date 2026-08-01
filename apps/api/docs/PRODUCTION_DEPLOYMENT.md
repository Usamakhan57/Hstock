# ApnaStore Production Deployment (Hostinger VPS)

## Stack

- Ubuntu 22.04+
- Node.js 20+
- PM2
- Nginx (+ Certbot SSL)
- MongoDB (bind `127.0.0.1`)
- Redis (optional — multi-instance Socket.io / queues)
- Cryptomus webhooks → `https://apnastore.org/api/v1/payments/cryptomus/webhook`
- Telegram webhooks → `https://apnastore.org/api/v1/telegram/webhook` (optional, when enabled)
- SMTP for transactional email

## Checklist

1. Clone repo to `/var/www/apnastore`
2. Copy `apps/api/.env.example` → `apps/api/.env` and fill secrets
3. Set `NODE_ENV=production`, strong JWT secrets, `CREDENTIALS_ENCRYPTION_KEY`, SMTP, Cryptomus production, `CORS_ORIGINS`, `FRONTEND_URL`
4. Set `ENABLE_JOBS=true` and `CRYPTOMUS_ENFORCE_IP_WHITELIST=true`
4b. Optional Telegram: `TELEGRAM_ENABLED=true`, bot token/username, `TELEGRAM_MODE=webhook`, webhook URL + secret (see `docs/TELEGRAM.md`)
5. `npm ci` in `apps/api` and `apps/web`
6. `npm run build` for web; sync `apps/web/dist` → `/var/www/apnastore/web`
7. Install Nginx site from `deploy/nginx/apnastore.conf`
8. `certbot --nginx -d apnastore.org -d www.apnastore.org`
9. Start API: `pm2 start ecosystem.config.js --env production`
10. `pm2 save && pm2 startup`
11. Install logrotate config from `deploy/logrotate/apnastore`
12. Cron daily backup: `deploy/scripts/backup.sh`
13. Practice restore once with `deploy/scripts/restore.sh` on a staging DB
14. Verify:
    - `curl https://apnastore.org/health`
    - `curl https://apnastore.org/health/ready`
    - Admin login + Socket.io (browser Network → WS)
    - Cryptomus production webhook
    - Telegram webhook + connect flow (if enabled)
    - SMTP delivery (registration / password reset)

Automated helper: `deploy/scripts/deploy.sh`

## Monitoring

- PM2: `pm2 status`, `pm2 logs apnastore-api`, `pm2 monit`
- Health: `/health`, `/health/live`, `/health/ready`
- Admin System Health page: `/admin/system-health`
- Nginx access/error logs
- Disk: `df -h` · Memory: `free -m` · CPU: `top` / `pm2 monit`

## Backup & recovery

```bash
# Backup
MONGODB_URI="mongodb://127.0.0.1:27017" ./deploy/scripts/backup.sh

# Restore (destructive)
FORCE_RESTORE=1 MONGODB_URI="mongodb://127.0.0.1:27017" \
  ./deploy/scripts/restore.sh /var/backups/apnastore/<archive>.tar.gz
```

Retention default: 14 days. See also [`ROLLBACK_PLAN.md`](./ROLLBACK_PLAN.md).

## Crash recovery

- PM2 `restart unless-stopped` / `max_memory_restart: 512M`
- After reboot: `pm2 resurrect` via startup hook
- MongoDB systemd enabled
- Nginx systemd enabled

## Security

- JWT access + refresh rotation with reuse detection
- Helmet + CSP (API + Nginx)
- Rate limiting, CORS allowlist (no `*`)
- Mongo sanitize, Zod validators
- Cryptomus webhook signature + IP whitelist (required in prod)
- OCR remote fetch SSRF guards
- Upload MIME allowlist
- Secrets only in `.env`

## Performance

- Nginx gzip + static asset caching; `index.html` no-cache
- Express compression
- Vite code-splitting (admin lazy routes + manual chunks)
- Mongo compound indexes on commerce hot paths
- Single-instance PM2 with in-process queues (add Redis adapter before scaling instances)

## Socket.io

Proxied at `/socket.io/` with `Upgrade` headers. Clients authenticate with JWT access token.
