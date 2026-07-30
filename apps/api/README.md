# HStock API (Phase 2 — Auth, Users, Catalog, Product Foundation)

Production-ready **Node.js + Express + MongoDB** backend for the HStock multi-vendor digital marketplace.

> **Phase 1 foundation** (bootstrap, security stack, logging, health, job scaffolds) remains intact.  
> **Phase 2 adds** Authentication, Authorization/RBAC, User Management, System/Platform/Commission configuration, Categories, Brands, Collections, Tags, and Product/DigitalProduct models + REST APIs.

Frontend (`apps/web`) is untouched.

## Stack

| Layer | Technology |
|-------|------------|
| Runtime | Node.js 20+ |
| Framework | Express.js |
| ODM | Mongoose |
| Validation | Zod |
| Auth | JWT access + refresh, bcrypt password hashing, httpOnly cookies |
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
npm run seed          # SystemConfig / PlatformConfig / CommissionConfig (+ local admin)
npm run dev
```

## Business rules encoded in Phase 2

1. Seller registration is **FREE** by default (`SystemConfig.sellerRegistrationFee = 0`)
2. Default product commission is **10%** (`CommissionConfig.defaultPercent`) — stored in MongoDB, never hardcoded
3. `PlatformConfig.maintenanceMode` defaults to `false`
4. No Cryptomus / escrow / order / wallet / withdrawal business logic

## API surface (`/api/v1`)

| Area | Prefix |
|------|--------|
| Auth | `/api/v1/auth` |
| Users | `/api/v1/users` |
| Config | `/api/v1/config` |
| Categories | `/api/v1/categories` |
| Brands | `/api/v1/brands` |
| Collections | `/api/v1/collections` |
| Tags | `/api/v1/tags` |
| Products | `/api/v1/products` |

Health probes from Phase 1 remain at `/health`, `/health/live`, `/health/ready`.

Full endpoint list: [`docs/API.md`](docs/API.md)

## Response format

```json
{
  "success": true,
  "message": "Success",
  "data": {},
  "errors": null,
  "meta": null
}
```

## Scripts

```bash
npm install
npm run dev
npm start
npm run seed
npm run lint
npm run build
npm test
```

## Documentation

- [`docs/API.md`](docs/API.md)
- [`docs/FOLDER_STRUCTURE.md`](docs/FOLDER_STRUCTURE.md)
- [`docs/ENVIRONMENT.md`](docs/ENVIRONMENT.md)
- [`docs/PHASE2_DELIVERABLES.md`](docs/PHASE2_DELIVERABLES.md)

## Phase gate

Do not start Phase 3 (payments / escrow / wallets / orders) until this phase is reviewed and approved.
