#!/usr/bin/env bash
# Configure Telegram bot env on the production VPS without printing secrets.
# Usage (on the VPS):
#   export TELEGRAM_BOT_TOKEN='<token from BotFather>'
#   optional: export TELEGRAM_WEBHOOK_SECRET='<long-random>'
#   ./deploy/scripts/configure-telegram.sh
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
ENV_FILE="${ENV_FILE:-$ROOT/.env}"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "ERROR: $ENV_FILE not found. Copy .env.example first." >&2
  exit 1
fi

if [[ -z "${TELEGRAM_BOT_TOKEN:-}" ]]; then
  echo "ERROR: TELEGRAM_BOT_TOKEN must be set in the environment (not written into this script)." >&2
  exit 1
fi

BOT_USERNAME="${TELEGRAM_BOT_USERNAME:-Apnastorenotifications_bot}"
WEBHOOK_URL="${TELEGRAM_WEBHOOK_URL:-https://apnastore.org/api/v1/telegram/webhook}"
WEBHOOK_SECRET="${TELEGRAM_WEBHOOK_SECRET:-}"
if [[ -z "$WEBHOOK_SECRET" ]]; then
  WEBHOOK_SECRET="$(openssl rand -hex 32)"
  echo "==> Generated TELEGRAM_WEBHOOK_SECRET (stored in .env only)"
fi

upsert_env() {
  local key="$1"
  local value="$2"
  if grep -qE "^${key}=" "$ENV_FILE"; then
    # Avoid leaking value via process list / sed backup; use python for safe rewrite.
    KEY="$key" VALUE="$value" ENV_FILE="$ENV_FILE" python3 - <<'PY'
import os
from pathlib import Path
path = Path(os.environ["ENV_FILE"])
key = os.environ["KEY"]
value = os.environ["VALUE"]
lines = path.read_text().splitlines()
out = []
found = False
for line in lines:
    if line.startswith(f"{key}="):
        out.append(f"{key}={value}")
        found = True
    else:
        out.append(line)
if not found:
    out.append(f"{key}={value}")
path.write_text("\n".join(out) + "\n")
PY
  else
    KEY="$key" VALUE="$value" ENV_FILE="$ENV_FILE" python3 - <<'PY'
import os
from pathlib import Path
path = Path(os.environ["ENV_FILE"])
key = os.environ["KEY"]
value = os.environ["VALUE"]
text = path.read_text()
if not text.endswith("\n"):
    text += "\n"
path.write_text(text + f"{key}={value}\n")
PY
  fi
}

echo "==> Updating Telegram settings in $ENV_FILE"
upsert_env TELEGRAM_ENABLED true
upsert_env TELEGRAM_BOT_TOKEN "$TELEGRAM_BOT_TOKEN"
upsert_env TELEGRAM_BOT_USERNAME "$BOT_USERNAME"
upsert_env TELEGRAM_WEBHOOK_SECRET "$WEBHOOK_SECRET"
upsert_env TELEGRAM_WEBHOOK_URL "$WEBHOOK_URL"
upsert_env TELEGRAM_MODE webhook

echo "==> Verifying bot with Telegram getMe (token not printed)"
curl -fsS "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getMe" \
  | python3 -c 'import sys,json; d=json.load(sys.stdin); r=d.get("result") or {}; assert d.get("ok"), d; print("Bot OK:", r.get("username"), "(id=%s)" % r.get("id"))'

if command -v pm2 >/dev/null 2>&1; then
  echo "==> Reloading API process so webhook registers on boot"
  pm2 startOrReload "$ROOT/deploy/pm2/ecosystem.config.cjs" --env production || pm2 restart apnastore-api || true
  pm2 save || true
else
  echo "WARN: pm2 not found — restart the API manually after this script."
fi

echo "Telegram env configured."
echo "Chat IDs: users link their own chat via Profile → Connect Telegram (no global TELEGRAM_CHAT_ID)."
