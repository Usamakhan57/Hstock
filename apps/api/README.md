# HStock API — Commerce Core

Production-ready **Node.js + Express + MongoDB** backend for the HStock multi-vendor digital marketplace.

> Phase 1 foundation and Phase 2 (Auth, Users, Catalog, Products) remain intact.  
> **Commerce Core adds** Orders, Cryptomus Payments, Escrow, Seller Wallet, Double-Entry Ledger, Withdrawals, Disputes, Refunds, and background jobs.

Frontend is untouched — all work is inside `apps/api`.

## Stack

| Layer | Technology |
|-------|------------|
| Runtime | Node.js 20+ |
| Framework | Express.js |
| ODM | Mongoose |
| Validation | Zod |
| Auth | JWT access + refresh, bcrypt, httpOnly cookies |
| Payments | Cryptomus only |
| Logging | Winston + Morgan |
| Jobs | node-cron |
| Process manager | PM2 |
| Reverse proxy | Nginx |
| Target host | Hostinger VPS — Ubuntu |

## Quick start

```bash
cd apps/api
cp .env.example .env
# set MONGODB_URI, JWT_ACCESS_SECRET, JWT_REFRESH_SECRET
# set CRYPTOMUS_* for live payments
npm install
npm run seed
npm run dev
```

## Business rules

1. Seller registration fee default **0** (`SystemConfig`)
2. Default commission **10%** (`CommissionConfig`) — MongoDB configurable, never hardcoded
3. Buy Now — **one order = one product** (no cart)
4. Escrow auto-release after **24 hours** if no dispute
5. Withdrawals are **manual** — admin marks Paid after external payout
6. Cryptomus is the **only** payment gateway

## API surface (`/api/v1`)

| Area | Prefix |
|------|--------|
| Auth | `/api/v1/auth` |
| Users | `/api/v1/users` |
| Config | `/api/v1/config` |
| Catalog | `/api/v1/categories\|brands\|collections\|tags` |
| Products | `/api/v1/products` |
| Orders | `/api/v1/orders` |
| Payments | `/api/v1/payments` |
| Escrow | `/api/v1/escrow` |
| Wallet / Ledger | `/api/v1/wallet` |
| Withdrawals | `/api/v1/withdrawals` |
| Disputes | `/api/v1/disputes` |
| Refunds | `/api/v1/refunds` |

Health: `/health`, `/health/live`, `/health/ready`.

Full commerce docs: [`docs/COMMERCE_CORE.md`](docs/COMMERCE_CORE.md)

## Scripts

```bash
npm install
npm run lint
npm run build
npm test
npm audit
npm run seed
npm run dev
```

## Documentation

- [`docs/COMMERCE_CORE.md`](docs/COMMERCE_CORE.md)
- [`docs/API.md`](docs/API.md)
- [`docs/FOLDER_STRUCTURE.md`](docs/FOLDER_STRUCTURE.md)
- [`docs/ENVIRONMENT.md`](docs/ENVIRONMENT.md)
