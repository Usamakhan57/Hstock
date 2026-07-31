#!/usr/bin/env bash
# ApnaStore production deploy helper (Hostinger Ubuntu VPS)
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
WEB_ROOT="$(cd "$ROOT/../web" && pwd)"
WEB_DIST_TARGET="${WEB_DIST_TARGET:-/var/www/apnastore/web}"

echo "==> Deploying ApnaStore from $ROOT"

cd "$ROOT"
npm ci --omit=dev
npm run lint
npm run build

cd "$WEB_ROOT"
npm ci
npm run lint
npm run build

if [[ -d "$WEB_DIST_TARGET" ]]; then
  echo "==> Syncing web dist → $WEB_DIST_TARGET"
  rsync -a --delete "$WEB_ROOT/dist/" "$WEB_DIST_TARGET/"
else
  echo "WARN: $WEB_DIST_TARGET missing — skip static sync"
fi

cd "$ROOT"
pm2 startOrReload deploy/pm2/ecosystem.config.cjs --env production
pm2 save

echo "==> Health check"
curl -fsS "http://127.0.0.1:${PORT:-4000}/health/live" | head -c 200 || true
echo
echo "Deploy complete."
