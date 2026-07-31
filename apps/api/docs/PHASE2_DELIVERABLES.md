# Phase 2 Deliverables

## Confirmed boundaries

- Phase 1 foundation bootstrap/security/health/job scaffolds were **not rewritten**
- `apps/web` was **not** modified
- No Cryptomus / payment / escrow / order / wallet balance / withdrawal execution
- No Admin Dashboard UI
- No background business jobs

## Implemented

### Authentication

- Buyer / Seller / Admin registration & login portals
- Logout, refresh token rotation, secure httpOnly cookie support
- Forgot / reset password
- Email verification infrastructure (token model + email service hooks)
- bcrypt password hashing
- JWT access + refresh tokens

### RBAC

Roles: `super_admin`, `admin`, `seller`, `buyer`, `editor`, `support`

Middleware: `requireAuth`, `requireRole`, `requirePermission`

### Configuration (MongoDB)

- `SystemConfig` — `sellerRegistrationFee=0`, `currency`, `isEnabled`
- `PlatformConfig` — `maintenanceMode=false`, store identity, escrow/withdrawal hours
- `CommissionConfig` — `defaultPercent=10` (+ rule arrays for later)

### Users

- `User`, `BuyerProfile`, `SellerProfile`, `AdminProfile`
- Avatar, status, verification status, email verified, phone, country, timezone, last login
- `ActivityLog`
- Seller `withdrawalWallets[]` prepared for future wallet phase (no withdrawal logic)

### Catalog & products

- Category, Brand, Collection, Tag
- Product, ProductImage, DigitalProduct, DigitalAssetClaim
- Product types: social accounts, email accounts, Instagram/Facebook/TikTok/Twitter/Telegram/Discord/YouTube, domains, websites, SaaS, apps, source code, AI tools, templates, courses, eBooks, scripts, license keys, digital files
- Global digital asset uniqueness (`assetIdentifier` / `assetIdentifierNormalized`) with normalization, unique indexes, HTTP 409 on duplicates — see `docs/ASSET_UNIQUENESS.md`

### APIs

Versioned under `/api/v1` with centralized validation, error handling, Helmet, rate limiting, sanitization, CORS, env validation.

## Tests

```bash
npm install
npm run lint
npm run build
npm test
```
