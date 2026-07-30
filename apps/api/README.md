# HStock API (Phase 1 — Foundation)

Production-ready **Node.js + Express + MongoDB** backend foundation for the HStock multi-vendor digital marketplace.

> **Phase 1 scope:** architecture, configuration, security, logging, health routes, and scaffolds only.  
> **Not in this phase:** auth business logic, Cryptomus payments, escrow, seller wallet, withdrawals, or domain APIs.

Frontend (`apps/web`) is untouched and remains the UI source of truth.

## Stack

| Layer | Technology |
|-------|------------|
| Runtime | Node.js 20+ |
| Framework | Express.js |
| ODM | Mongoose |
| Validation | Zod |
| Logging | Winston + Morgan |
| Process manager | PM2 |
| Reverse proxy | Nginx |
| Containers | Docker / Compose (optional local) |
| Target host | Hostinger VPS — Ubuntu 24.04 |

## Quick start

```bash
cd apps/api
cp .env.example .env
# set MONGODB_URI, JWT_ACCESS_SECRET, JWT_REFRESH_SECRET
npm install
npm run dev
```

## Health endpoints (only public API surface in Phase 1)

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/health` | Service + DB status summary |
| GET | `/health/live` | Liveness probe |
| GET | `/health/ready` | Readiness probe (requires MongoDB) |
| GET | `/api/v1` | Version stub (no business routes) |

## Architecture highlights

- Clean layered folders: config → routes → controllers → (future services/repositories/models)
- Centralized env validation (fail fast on boot)
- Helmet, CORS, compression, cookies, rate limit, Morgan
- Global `AppError`, async handler, 404 + error middleware
- Separate log directories: `logs/app`, `logs/error`, `logs/http`
- Local uploads directories prepared
- Job scaffolds: escrow, notification, cleanup, withdrawal (**no business logic**)
- Email / queue / event bus scaffolds
- API versioning prefix: `/api/v1`
- Docker + PM2 + Nginx templates for Hostinger deployment

## Business rules (prepared, not implemented)

Documented in the approved architecture analysis:

1. Cryptomus-only payments  
2. No buyer USD deposit wallet  
3. Direct crypto checkout → Escrow  
4. Escrow auto-release after 24h if no dispute  
5. Release → Seller Internal Wallet  
6. Withdrawals: Pending → Admin manual payout → Paid  
7. DB-configurable commission (Admin Panel)

These land in Phase 2+.

## Scripts

```bash
npm run dev          # watch mode
npm start            # start once
npm run start:prod   # NODE_ENV=production
npm test             # node:test suite
pm2 start ecosystem.config.cjs --env production
```

## Documentation

- [`docs/FOLDER_STRUCTURE.md`](docs/FOLDER_STRUCTURE.md)
- [`docs/ENVIRONMENT.md`](docs/ENVIRONMENT.md)
- [`deploy/nginx/hstock.conf`](deploy/nginx/hstock.conf)

## Phase gate

Do not start Phase 2 until this foundation is reviewed and approved.
