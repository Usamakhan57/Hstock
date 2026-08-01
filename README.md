# ApnaStore Marketplace

Multi-vendor digital marketplace for accounts, licenses, and digital assets.

**Version:** 1.0 Release Candidate  
**Stack:** React (Vite) + Node.js/Express + MongoDB + Cryptomus + Socket.io + PM2/Nginx

## Monorepo layout

```
apps/
  api/    # Production API (auth, catalog, commerce, disputes, admin, notifications)
  web/    # Storefront + seller dashboard + admin panel
```

## Quick start (development)

### API

```bash
cd apps/api
cp .env.example .env
# set MONGODB_URI, JWT_ACCESS_SECRET, JWT_REFRESH_SECRET (≥32 chars)
npm install
npm run seed
npm run dev
```

API: `http://localhost:4000` · Health: `/health`

### Web

```bash
cd apps/web
npm install
# optional: VITE_API_URL=http://localhost:4000/api/v1
npm run dev
```

Web: `http://localhost:3000`

## Quality gate

Run in both `apps/api` and `apps/web`:

```bash
npm install
npm run lint
npm run build
npm test
npm audit
```

## Documentation

| Doc | Path |
|-----|------|
| Environment | [`apps/api/docs/ENVIRONMENT.md`](apps/api/docs/ENVIRONMENT.md) |
| Production deploy | [`apps/api/docs/PRODUCTION_DEPLOYMENT.md`](apps/api/docs/PRODUCTION_DEPLOYMENT.md) |
| API overview | [`apps/api/docs/API.md`](apps/api/docs/API.md) |
| Buyer manual | [`apps/api/docs/BUYER_MANUAL.md`](apps/api/docs/BUYER_MANUAL.md) |
| Seller manual | [`apps/api/docs/SELLER_MANUAL.md`](apps/api/docs/SELLER_MANUAL.md) |
| Admin manual | [`apps/api/docs/ADMIN_MANUAL.md`](apps/api/docs/ADMIN_MANUAL.md) |
| Release notes | [`apps/api/docs/RELEASE_NOTES_v1.0.md`](apps/api/docs/RELEASE_NOTES_v1.0.md) |
| Deployment checklist | [`apps/api/docs/DEPLOYMENT_CHECKLIST.md`](apps/api/docs/DEPLOYMENT_CHECKLIST.md) |
| Rollback plan | [`apps/api/docs/ROLLBACK_PLAN.md`](apps/api/docs/ROLLBACK_PLAN.md) |

## Production host

Target: **Hostinger Ubuntu VPS** with Node.js 20+, PM2, Nginx + Certbot, MongoDB (localhost), optional Redis, Cryptomus webhooks, SMTP, optional Google OAuth, buyer wallet (Cryptomus-funded).

**Payments:** Cryptomus is the only external payment gateway. Buyers may deposit/top-up a prepaid wallet via Cryptomus and optionally pay from wallet at checkout. Stripe/PayPal are not supported.

See [`apps/api/docs/PRODUCTION_DEPLOYMENT.md`](apps/api/docs/PRODUCTION_DEPLOYMENT.md).

## License

Proprietary — ApnaStore.
