# Deployment Checklist — HStock v1.0 RC

## Pre-flight

- [ ] Ubuntu 22.04+ VPS provisioned (Hostinger)
- [ ] Node.js 20+ installed
- [ ] MongoDB 7+ installed, bound to `127.0.0.1`
- [ ] Optional Redis installed if planning multi-instance later
- [ ] Domain DNS → VPS (`hstock.store`, `www`)
- [ ] Cryptomus production merchant + webhook URL ready
- [ ] SMTP credentials ready
- [ ] Secrets generated (≥32 chars) for JWT + credentials encryption

## Application

- [ ] Clone release tag/branch to `/var/www/hstock`
- [ ] Configure `apps/api/.env` from `.env.example`
- [ ] `NODE_ENV=production`, `ENABLE_JOBS=true`
- [ ] `CRYPTOMUS_MODE=production`, `CRYPTOMUS_ENFORCE_IP_WHITELIST=true`
- [ ] `CORS_ORIGINS` = exact frontend origins
- [ ] `npm ci` in `apps/api` and `apps/web`
- [ ] `npm run lint && npm test && npm audit` (API + web)
- [ ] `npm run build` (web) → sync `dist/` to `/var/www/hstock/web`
- [ ] Seed admin user if needed (`npm run seed`)

## Process & proxy

- [ ] PM2 start `ecosystem.config.js --env production`
- [ ] `pm2 save && pm2 startup`
- [ ] Nginx site from `deploy/nginx/hstock.conf`
- [ ] Certbot SSL issued and HTTP→HTTPS redirect active
- [ ] Socket.io proxied at `/socket.io/`
- [ ] Logrotate installed from `deploy/logrotate/hstock`
- [ ] Daily cron: `deploy/scripts/backup.sh`
- [ ] Restore drill documented (`deploy/scripts/restore.sh`)

## Verification

- [ ] `curl -fsS https://hstock.store/health`
- [ ] `curl -fsS https://hstock.store/health/ready`
- [ ] Buyer register/login/verify
- [ ] Seller product create → admin approve → buy now (sandbox/prod Cryptomus)
- [ ] Webhook received + payment → escrow
- [ ] Withdrawal request → admin approve/pay
- [ ] Dispute open → chat → OCR flag path
- [ ] Admin system health shows SMTP/socket OK
- [ ] Browser Network shows authenticated WebSocket

## Monitoring

- [ ] `pm2 monit` / `pm2 logs hstock-api`
- [ ] Disk / memory / CPU alerts configured (Hostinger or Node exporter)
- [ ] Backup archive appears under `/var/backups/hstock`
