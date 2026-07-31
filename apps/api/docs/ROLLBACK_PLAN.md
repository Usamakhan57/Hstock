# Rollback Plan — HStock v1.0

## When to rollback

- Critical auth/payment outage after deploy
- Data-corrupting migration/job behavior
- SSL/proxy misconfiguration blocking checkout

## App rollback (code)

1. Identify last known-good commit/tag  
2. On VPS:

```bash
cd /var/www/hstock
git fetch --all
git checkout <known-good-sha>
cd apps/api && npm ci --omit=dev
cd ../web && npm ci && npm run build
rsync -a --delete apps/web/dist/ /var/www/hstock/web/
cd ../api && pm2 restart hstock-api --env production
```

3. Verify `/health/ready` and a smoke Buy Now in Cryptomus sandbox/prod

## Database rollback

Only if a deploy corrupted data:

```bash
# Stop API writes
pm2 stop hstock-api

# Restore last good backup (DESTROYS current DB)
FORCE_RESTORE=1 MONGODB_URI="mongodb://127.0.0.1:27017" \
  ./apps/api/deploy/scripts/restore.sh /var/backups/hstock/<archive>.tar.gz

pm2 start hstock-api --env production
```

## Nginx / SSL rollback

Keep previous site config at `/etc/nginx/sites-available/hstock.bak` before edits.

```bash
sudo cp /etc/nginx/sites-available/hstock.bak /etc/nginx/sites-available/hstock
sudo nginx -t && sudo systemctl reload nginx
```

## Cryptomus

If webhooks break, temporarily point Cryptomus callback to the previous API host/version until fixed. Do not disable signature verification.

## Communication

Notify stakeholders of:

- Outage window
- Orders that may need manual reconciliation (payments received during rollback)
- Whether escrow auto-release jobs were paused (`ENABLE_JOBS`)
