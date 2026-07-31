# ApnaStore Production Environment Configuration Guide

Inventory of **every environment variable actually referenced in the codebase**.  
Do not invent additional variables. Placeholders below are safe examples only.

**Sources inspected**

- `apps/api/src/config/env.js` (Zod schema + production guards)
- `apps/api/src/scripts/seed.js`
- `apps/api/tests/helpers/*` (test-only)
- `apps/api/deploy/scripts/*`
- `apps/web/src/lib/apiClient.js`, `constants/index.js`, `lib/socket.js`
- `apps/web/vite.config.js` (optional template build tooling)

**Example files**

1. Backend: [`apps/api/.env.production.example`](../.env.production.example)
2. Frontend: [`apps/web/.env.production.example`](../../web/.env.production.example)
3. Hostinger VPS section: below

---

## 1. Backend API variables

Loaded by `apps/api/src/config/env.js` unless noted.

| Variable | Purpose | Required / Optional | Example (placeholder) | Service |
|----------|---------|---------------------|------------------------|---------|
| `NODE_ENV` | Runtime mode; enables production boot guards | **Required** in production (`production`) | `production` | API |
| `APP_NAME` | Process/log service name | Optional (default `ApnaStore API`) | `ApnaStore API` | API |
| `APP_URL` | Public API origin (webhooks, email verify links, URL allowlist) | Optional schema default; **set in production** | `https://apnastore.org` | API / Cryptomus / Email |
| `API_PREFIX` | Express mount path for v1 routes | Optional (default `/api/v1`) | `/api/v1` | API |
| `FRONTEND_URL` | Storefront origin (password reset, Cryptomus return URLs, email links) | Optional schema default; **set in production** | `https://apnastore.org` | API / Email / Cryptomus |
| `PORT` | HTTP listen port | Optional (default `4000`) | `4000` | API / Socket.io |
| `HOST` | HTTP bind address | Optional (default `0.0.0.0`) | `0.0.0.0` | API / Socket.io |
| `MONGODB_URI` | MongoDB connection string | **Required** | `mongodb://127.0.0.1:27017/apnastore` | MongoDB |
| `MONGODB_DB_NAME` | Database name passed to Mongoose | Optional (default `apnastore`) | `apnastore` | MongoDB |
| `JWT_ACCESS_SECRET` | Access token signing secret (≥32 chars) | **Required** | `replace-with-unique-access-secret-min-32-chars` | API / Auth / Socket.io |
| `JWT_REFRESH_SECRET` | Refresh token signing secret (≥32 chars) | **Required** | `replace-with-unique-refresh-secret-min-32-chars` | API / Auth |
| `JWT_ACCESS_EXPIRES_IN` | Access token TTL | Optional (default `15m`) | `15m` | API / Auth |
| `JWT_REFRESH_EXPIRES_IN` | Refresh token TTL | Optional (default `7d`) | `7d` | API / Auth |
| `CREDENTIALS_ENCRYPTION_KEY` | AES key material for dispute credentials (≥32 chars) | **Required in production** | `replace-with-unique-aes-key-material-min-32` | API / Disputes |
| `DISPUTE_CREDENTIAL_TTL_DAYS` | Credential expiry window (days) | Optional (default `30`) | `30` | API / Disputes |
| `COOKIE_SECURE` | Set `Secure` on auth cookies (`true`/`false` string) | Optional; forced secure when `NODE_ENV=production` | `true` | API / Auth |
| `COOKIE_SAME_SITE` | Cookie SameSite policy | Optional (`lax` \| `strict` \| `none`, default `lax`) | `lax` | API / Auth |
| `COOKIE_DOMAIN` | Cookie Domain attribute | Optional (empty = host-only) | `.apnastore.org` | API / Auth |
| `CORS_ORIGINS` | Comma-separated browser origins for CORS + Socket.io + CSP connect | Optional schema default; **must not include `*` in production** | `https://apnastore.org,https://www.apnastore.org` | API / Socket.io |
| `RATE_LIMIT_WINDOW_MS` | Rate-limit window | Optional (default `900000`) | `900000` | API |
| `RATE_LIMIT_MAX` | Max requests per window | Optional (default `200`) | `200` | API |
| `UPLOAD_DIR` | Upload root directory (relative to API root or absolute) | Optional (default `uploads`) | `uploads` | API |
| `UPLOAD_MAX_FILE_SIZE_MB` | Max upload size (MB) | Optional (default `10`) | `10` | API |
| `LOG_LEVEL` | Winston log level | Optional (default `info`) | `info` | API |
| `LOG_DIR` | Log directory | Optional (default `logs`) | `logs` | API |
| `ENABLE_JOBS` | Enable in-process cron jobs (`true` to enable) | Optional; **set `true` in production** (also set by PM2 `env_production`) | `true` | API / Jobs |
| `ESCROW_AUTO_RELEASE_HOURS` | Env-configured escrow hours default | Optional (default `24`) | `24` | API / Escrow |
| `WITHDRAWAL_ADMIN_SLA_HOURS` | Env-configured withdrawal SLA hours | Optional (default `24`) | `24` | API / Withdrawals |
| `CRYPTOMUS_MERCHANT_ID` | Cryptomus merchant id | **Required in production** | `your-cryptomus-merchant-id` | Cryptomus |
| `CRYPTOMUS_API_KEY` | Cryptomus API key (also used for webhook sign fallback) | **Required in production** | `your-cryptomus-api-key` | Cryptomus |
| `CRYPTOMUS_WEBHOOK_SECRET` | Alternate webhook signing secret | Optional (falls back to API key) | `your-cryptomus-webhook-secret` | Cryptomus |
| `CRYPTOMUS_BASE_URL` | Cryptomus API base URL | Optional (default Cryptomus production API URL) | `https://api.cryptomus.com/v1` | Cryptomus |
| `CRYPTOMUS_MODE` | Gateway mode | Optional schema default `sandbox`; **must be `production` when `NODE_ENV=production`** | `production` | Cryptomus |
| `CRYPTOMUS_URL_RETURN` | Buyer return URL override | Optional (falls back to `${FRONTEND_URL}/orders`) | `https://apnastore.org/orders` | Cryptomus |
| `CRYPTOMUS_URL_SUCCESS` | Buyer success URL override | Optional (falls back to `${FRONTEND_URL}/orders/success`) | `https://apnastore.org/order-success` | Cryptomus |
| `CRYPTOMUS_ENFORCE_IP_WHITELIST` | Enforce Cryptomus webhook IP allowlist | Optional; **must be `true` in production** | `true` | Cryptomus |
| `SMTP_HOST` | SMTP hostname | Optional (email disabled if empty) | `smtp.hostinger.com` | SMTP |
| `SMTP_PORT` | SMTP port | Optional (default `587`) | `587` | SMTP |
| `SMTP_USER` | SMTP username | Optional (email disabled if empty with host) | `noreply@apnastore.org` | SMTP |
| `SMTP_PASS` | SMTP password | Optional | `replace-with-smtp-password` | SMTP |
| `EMAIL_FROM` | From header for transactional mail | Optional (default `noreply@apnastore.org`) | `ApnaStore <noreply@apnastore.org>` | SMTP |
| `REDIS_URL` | Optional Redis URL (health/status note for scaled Socket.io / queues) | Optional | `redis://127.0.0.1:6379` | Redis / Socket.io |

### Seed script only (`apps/api/src/scripts/seed.js`)

Not required for API boot.

| Variable | Purpose | Required / Optional | Example | Service |
|----------|---------|---------------------|---------|---------|
| `SEED_ADMIN` | Allow admin seed when `NODE_ENV=production` | Optional (`true` to enable) | `true` | API seed |
| `SEED_ADMIN_EMAIL` | Seeded admin email | Optional (default `admin@apnastore.org`) | `admin@apnastore.org` | API seed |
| `SEED_ADMIN_PASSWORD` | Seeded admin password | **Required when seeding admin** (min 8) | `replace-with-strong-admin-password` | API seed |

### Test-only (`apps/api/tests/helpers/*`)

Do **not** set on production VPS.

| Variable | Purpose | Required / Optional | Example | Service |
|----------|---------|---------------------|---------|---------|
| `USE_MEMORY_MONGO` | Use mongodb-memory-server in tests | Optional (tests default `true`) | `true` | API tests / MongoDB |

### Deploy / backup shell scripts (`apps/api/deploy/scripts/*`)

| Variable | Purpose | Required / Optional | Example | Service |
|----------|---------|---------------------|---------|---------|
| `MONGODB_URI` | mongodump / mongorestore URI | Optional in scripts (default `mongodb://127.0.0.1:27017`) | `mongodb://127.0.0.1:27017` | MongoDB / Backup |
| `MONGODB_DB_NAME` | Dump/restore DB name | Optional (default `apnastore`) | `apnastore` | MongoDB / Backup |
| `BACKUP_DIR` | Backup output directory | Optional (default `/var/backups/apnastore`) | `/var/backups/apnastore` | Backup |
| `RETENTION_DAYS` | Backup retention | Optional (default `14`) | `14` | Backup |
| `FORCE_RESTORE` | Skip interactive restore confirm (`1`) | Optional (default `0`) | `1` | Backup |
| `WEB_DIST_TARGET` | Nginx static root for web dist sync | Optional (default `/var/www/apnastore/web`) | `/var/www/apnastore/web` | Deploy / Web |
| `PORT` | Local health-check port in `deploy.sh` | Optional (default `4000`) | `4000` | Deploy / API |
| `TMPDIR` | Temp dir for restore extract | Optional (OS default `/tmp`) | `/tmp` | Backup |

---

## 2. Frontend Web variables

Vite embeds `VITE_*` at **build time**.

| Variable | Purpose | Required / Optional | Example | Service |
|----------|---------|---------------------|---------|---------|
| `VITE_API_URL` | Browser API base (`/api/v1`); also used to derive Socket.io origin | Optional with localhost fallback; **set for production builds** | `/api/v1` | Web / API / Socket.io |

Used in:

- `apps/web/src/lib/apiClient.js`
- `apps/web/src/constants/index.js`
- `apps/web/src/lib/socket.js` (strips `/api/v1` to get socket origin)

### Optional Vite build tooling (`apps/web/vite.config.js`)

Emergent/template banner injectors. Not required for ApnaStore production.

| Variable | Purpose | Required / Optional | Example | Service |
|----------|---------|---------------------|---------|---------|
| `TEMPLATE_BANNER_SCRIPT_URL` | External banner script `src` | Optional | `https://example.com/banner.js` | Web build |
| `TEMPLATE_REDIRECT_URL` | Banner redirect attribute | Optional (paired with script URL) | `https://example.com` | Web build |
| `TEMPLATE_BANNER_MAIN_TEXT` | Banner main text attribute | Optional | `Welcome` | Web build |
| `TEMPLATE_BANNER_CTA_TEXT` | Banner CTA text attribute | Optional | `Learn more` | Web build |
| `TEMPLATE_BANNER_THEME` | Banner theme attribute | Optional | `light` | Web build |

---

## 3. Production boot guards (API)

When `NODE_ENV=production`, `env.js` **exits the process** if:

1. `CREDENTIALS_ENCRYPTION_KEY` missing or &lt; 32 characters  
2. `CORS_ORIGINS` contains `*`  
3. `CRYPTOMUS_MERCHANT_ID` or `CRYPTOMUS_API_KEY` missing  
4. `CRYPTOMUS_MODE` is not `production`  
5. `CRYPTOMUS_ENFORCE_IP_WHITELIST` is not `true`  
6. JWT secrets still contain `change-me`

---

## 4. Backend `.env.production.example`

File: `apps/api/.env.production.example`

```bash
cd apps/api
cp .env.production.example .env
# edit secrets, then:
NODE_ENV=production node -e "import('./src/config/env.js')"
```

---

## 5. Frontend `.env.production.example`

File: `apps/web/.env.production.example`

```bash
cd apps/web
cp .env.production.example .env.production
npm ci
npm run build
```

Same-origin Nginx proxy (recommended): `VITE_API_URL=/api/v1`  
Socket.io then connects to the site origin (`https://apnastore.org`).

---

## 6. Hostinger VPS deployment environment guide

### 6.1 Stack

- Ubuntu 22.04+
- Node.js 20+
- PM2 (`apnastore-api`)
- Nginx + Certbot
- MongoDB bound to `127.0.0.1`
- Optional Redis
- Cryptomus webhooks → `https://apnastore.org/api/v1/payments/cryptomus/webhook`
- SMTP (Hostinger mail or external)

### 6.2 Layout

```text
/var/www/apnastore/          # git checkout
  apps/api/.env              # from .env.production.example
  apps/web/.env.production   # from .env.production.example
/var/www/apnastore/web/      # synced Vite dist (WEB_DIST_TARGET)
/var/backups/apnastore/      # mongodump archives
```

### 6.3 Configure API env

```bash
cd /var/www/apnastore/apps/api
cp .env.production.example .env
nano .env
```

Minimum production set:

```bash
NODE_ENV=production
APP_URL=https://apnastore.org
FRONTEND_URL=https://apnastore.org
CORS_ORIGINS=https://apnastore.org,https://www.apnastore.org
MONGODB_URI=mongodb://127.0.0.1:27017/apnastore
MONGODB_DB_NAME=apnastore
JWT_ACCESS_SECRET=<openssl rand -hex 32>
JWT_REFRESH_SECRET=<openssl rand -hex 32>
CREDENTIALS_ENCRYPTION_KEY=<openssl rand -hex 32>
COOKIE_SECURE=true
ENABLE_JOBS=true
CRYPTOMUS_MERCHANT_ID=<from Cryptomus>
CRYPTOMUS_API_KEY=<from Cryptomus>
CRYPTOMUS_MODE=production
CRYPTOMUS_ENFORCE_IP_WHITELIST=true
SMTP_HOST=smtp.hostinger.com
SMTP_PORT=587
SMTP_USER=noreply@apnastore.org
SMTP_PASS=<smtp password>
EMAIL_FROM=ApnaStore <noreply@apnastore.org>
```

Generate secrets:

```bash
openssl rand -hex 32
```

### 6.4 Configure Web env + build

```bash
cd /var/www/apnastore/apps/web
cp .env.production.example .env.production
# ensure: VITE_API_URL=/api/v1
npm ci
npm run build
rsync -a --delete dist/ /var/www/apnastore/web/
```

### 6.5 Start API with PM2

`ecosystem.config.js` `env_production` sets `NODE_ENV=production` and `ENABLE_JOBS=true`.  
Secrets still come from `apps/api/.env` (dotenv).

```bash
cd /var/www/apnastore/apps/api
npm ci --omit=dev
pm2 start ecosystem.config.js --env production
pm2 save
pm2 startup
```

Or: `./deploy/scripts/deploy.sh`

### 6.6 Nginx / SSL / Socket.io

Install `deploy/nginx/apnastore.conf`, then:

```bash
sudo certbot --nginx -d apnastore.org -d www.apnastore.org
```

Ensure `/api/`, `/socket.io/`, and `/health` proxy to `127.0.0.1:4000`, and `/` serves `/var/www/apnastore/web`.

### 6.7 Cryptomus

In Cryptomus dashboard set webhook URL:

`https://apnastore.org/api/v1/payments/cryptomus/webhook`

VPS must allow Cryptomus webhook IPs (`CRYPTOMUS_ENFORCE_IP_WHITELIST=true`).

### 6.8 SMTP

With Hostinger mail, typical values:

- `SMTP_HOST=smtp.hostinger.com`
- `SMTP_PORT=587` (STARTTLS) or `465` (implicit TLS; code sets `secure` when port is 465)

If `SMTP_HOST` or `SMTP_USER` is empty, the API skips sending and logs accordingly.

### 6.9 Optional Redis

Leave `REDIS_URL` empty for single-instance PM2 (current default).  
Set only when you add a Redis adapter / queue backend for multi-instance Socket.io.

### 6.10 Backups

```bash
# crontab example — daily 02:15 UTC
15 2 * * * MONGODB_URI="mongodb://127.0.0.1:27017" MONGODB_DB_NAME="apnastore" \
  /var/www/apnastore/apps/api/deploy/scripts/backup.sh >> /var/log/apnastore-backup.log 2>&1
```

Restore (destructive):

```bash
FORCE_RESTORE=1 MONGODB_URI="mongodb://127.0.0.1:27017" MONGODB_DB_NAME="apnastore" \
  ./deploy/scripts/restore.sh /var/backups/apnastore/<archive>.tar.gz
```

### 6.11 Verify

```bash
curl -fsS https://apnastore.org/health
curl -fsS https://apnastore.org/health/ready
curl -fsS https://apnastore.org/health/live
```

Also verify:

- Browser Network → WebSocket `/socket.io/`
- Admin login + `/admin/system-health`
- Cryptomus sandbox→production webhook delivery
- Registration / password-reset email via SMTP

### 6.12 Seed admin (one-time, optional)

```bash
cd /var/www/apnastore/apps/api
SEED_ADMIN=true \
SEED_ADMIN_EMAIL=admin@apnastore.org \
SEED_ADMIN_PASSWORD='<strong-password>' \
npm run seed
```

Remove `SEED_ADMIN` / password from the shell history afterward. Do not leave seed passwords in `.env` long-term.

---

## 7. Quick reference — production required checklist

| Must be set | Value |
|-------------|--------|
| `NODE_ENV` | `production` |
| `MONGODB_URI` | local Mongo URI |
| `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET` | unique ≥32 chars, no `change-me` |
| `CREDENTIALS_ENCRYPTION_KEY` | ≥32 chars |
| `CORS_ORIGINS` | exact HTTPS origins, no `*` |
| `CRYPTOMUS_MERCHANT_ID` / `CRYPTOMUS_API_KEY` | live credentials |
| `CRYPTOMUS_MODE` | `production` |
| `CRYPTOMUS_ENFORCE_IP_WHITELIST` | `true` |
| `ENABLE_JOBS` | `true` |
| `APP_URL` / `FRONTEND_URL` | `https://apnastore.org` |
| `VITE_API_URL` (web build) | `/api/v1` |
| SMTP pair | `SMTP_HOST` + `SMTP_USER` (+ `SMTP_PASS`) for real email |

See also: [`PRODUCTION_DEPLOYMENT.md`](./PRODUCTION_DEPLOYMENT.md), [`DEPLOYMENT_CHECKLIST.md`](./DEPLOYMENT_CHECKLIST.md).
