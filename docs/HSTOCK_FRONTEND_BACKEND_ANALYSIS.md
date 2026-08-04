# HStock Marketplace — Frontend Analysis & Backend Blueprint

**Status:** Architecture revised — awaiting approval before any backend scaffolding  
**Source:** `hstock-marketplace-layout.zip` → `apps/web`  
**Product:** HStock (`hstock.store`) — digital marketplace for social accounts, domains, websites, SaaS, source code, apps, AI tools, templates, courses, eBooks, and scripts  
**Date:** 2026-07-30  
**Revision:** Business rules update — Cryptomus direct pay, no buyer deposit wallet, 24h escrow auto-release, seller internal wallet, admin-manual withdrawals, DB-configurable commission, Hostinger VPS deployment

---

## Executive Summary

The repository contains a **frontend-only React + Vite marketplace UI**. All commerce, auth, wallet, escrow, and admin CMS behavior is simulated with **localStorage mock APIs**. No Node/Express/Mongo backend exists yet.

**Frontend UI remains unchanged** for this phase. The target backend architecture below supersedes earlier assumptions about a buyer USD deposit wallet.

### Approved target commerce model (business rules)

1. **Payment gateway: Cryptomus only**
2. **No buyer USD deposit wallet** — buyers do not pre-fund a platform balance
3. Buyer pays **directly via Cryptomus** (BTC, ETH, USDT, TRX, and all Cryptomus-supported currencies)
4. After successful payment, funds enter **Escrow**
5. Escrow **auto-releases after 24 hours** if there is no dispute
6. Released funds move to the **Seller Internal Wallet**
7. Seller submits a **withdrawal request**
8. Withdrawal status becomes **Pending**
9. **Admin manually reviews** and completes the crypto transfer within 24 hours
10. After payment is sent, withdrawal status becomes **Paid**
11. **Platform commission is NOT hardcoded** — stored in MongoDB, editable from Admin Panel
12. Backend deploys on a **Hostinger VPS** (Ubuntu, self-hosted MongoDB, PM2, Nginx)

This document maps the existing frontend and proposes REST APIs, MongoDB models, and backend structure required to implement the rules above — **without generating backend code**.

---

## 0. Target Money Flow (Authoritative)

```
Buyer clicks Buy Now
        │
        v
Create Order (paymentStatus: awaiting_payment)
        │
        v
Create Cryptomus invoice / payment
        │
        v
Buyer pays on Cryptomus (BTC / ETH / USDT / TRX / …)
        │
        v
Cryptomus webhook → payment confirmed
        │
        v
Funds enter Escrow (escrowStatus: Held)
  escrowAutoReleaseAt = paidAt + 24h
        │
        ├── Buyer opens Dispute before 24h → Escrow frozen (Disputed) → Admin resolves
        │
        └── No dispute after 24h (or early confirm if exposed later)
                    │
                    v
           Escrow Released
                    │
                    v
  Seller Internal Wallet credited
  (gross − configurable commission)
                    │
                    v
  Seller requests Withdrawal → status: Pending
                    │
                    v
  Admin reviews + sends crypto manually (≤ 24h SLA)
                    │
                    v
  Withdrawal status: Paid
```

**Not in scope for buyers:** deposit addresses, buyer available balance funding, buyer crypto withdrawals from a platform wallet.

---

## 1. Project Architecture

### 1.1 Repository layout (current)

```
hstock-marketplace-layout/
├── apps/web/                 # Vite React SPA (entire product UI — keep unchanged)
│   ├── src/
│   │   ├── admin/            # Admin panel (auth, pages, localStorage API)
│   │   ├── app/              # Router + route modules
│   │   ├── components/       # Shared storefront UI
│   │   ├── context/          # StoreContext, SellerAuthContext
│   │   ├── pages/            # Storefront + buyer account + seller portal
│   │   ├── services/         # Mock API + repositories
│   │   ├── constants/        # SITE, API_BASE_URL, ENDPOINTS, filters
│   │   └── …
│   ├── plugins/              # Hostinger Horizons Vite tooling (not product backend)
│   └── package.json
└── vault/
```

### 1.2 Proposed monorepo after backend approval

```
apps/
  web/                        # existing frontend (UI unchanged)
  api/                        # Node.js API (to be scaffolded later)
infra/
  nginx/                      # reverse-proxy configs
  pm2/                        # ecosystem file
  mongodb/                    # optional ops notes
docs/
  HSTOCK_FRONTEND_BACKEND_ANALYSIS.md
```

### 1.3 Tech stack

| Layer | Choice |
|-------|--------|
| Frontend UI | React 18 + Vite 7 + Tailwind + Radix/shadcn (unchanged) |
| Routing | react-router-dom v7 |
| Intended API | Node.js + Express (or Fastify) |
| Database | Self-hosted MongoDB on Hostinger VPS |
| Process manager | PM2 |
| Reverse proxy / TLS | Nginx |
| Payments | **Cryptomus only** |
| Hosting | Hostinger VPS — Ubuntu |

### 1.4 Runtime architecture (current frontend)

```
Browser
  └─ AppRouter
       ├─ StoreProvider          (buyer session, mock wallet/orders)
       ├─ AdminAuthProvider
       └─ SellerAuthProvider
            └─ Routes
                 ├─ Public storefront
                 ├─ Buyer account   (RequireCustomerAuth)
                 ├─ Seller portal   (RequireSellerAuth)
                 └─ Admin panel     (RequireAdminAuth → AdminLayout)
```

### 1.5 Data layer today vs target

| Concern | Today (mock) | Target backend |
|---------|--------------|----------------|
| Catalog | `pm_admin_*` localStorage | MongoDB collections |
| Buyer checkout | Debit mock `hs_wallet` | Cryptomus invoice + webhook |
| Escrow | Instant local flags | EscrowHold + 24h auto-release job |
| Seller earnings | Mock earnings tab | Seller Internal Wallet ledger |
| Withdrawals | Instant buyer withdraw / mock seller | Seller request → Pending → Admin → Paid |
| Commission | Seed `15%` / `2%` constants in UI | **CommissionConfig in DB**, Admin-editable |
| Auth | Three localStorage silos | JWT/session + roles |

`API_BASE_URL = import.meta.env.VITE_API_URL || '/api'`

### 1.6 Frontend UI vs target architecture (important)

**Do not change the existing frontend UI in this phase.**  
Several screens still show a buyer wallet deposit/withdraw experience. Those remain mock UI until a later wiring pass. The **backend must follow the business rules in §0**, not the mock deposit model.

| Frontend surface (unchanged) | Target backend interpretation |
|------------------------------|-------------------------------|
| Buyer `/wallet` deposit/withdraw UI | **Not a funded buyer deposit wallet.** Later wiring may repurpose this page for order payment history / Cryptomus status, or leave it cosmetic until a dedicated UX pass |
| `PurchaseModal` “wallet balance” confirm | Replace behind the scenes with **Create Order → Cryptomus payment redirect/embed** while keeping modal chrome until UI work is approved |
| Seller Earnings / Wallet tab | Maps to **Seller Internal Wallet** + withdrawal requests |
| Seller payout settings | Destination address used when seller requests withdrawal |
| Admin Settings commission fields | Backed by **CommissionConfig** documents (not hardcoded) |

---

## 2. Frontend Pages

> Inventory of existing UI routes. No UI changes in this revision.

### 2.1 Public storefront

| Path | Page | Purpose |
|------|------|---------|
| `/` | HomePage | Hero, categories, featured products, sellers, testimonials, newsletter |
| `/shop` | ShopPage | Product grid, search, sort, grid/list |
| `/product/:id` | ProductDetailPage | Gallery, licenses, specs, FAQ, Buy Now, compare, follow, report |
| `/categories` | CategoriesPage | Category directory |
| `/category/:slug` | CategoryPage | Filtered catalog with FilterSidebar |
| `/collections` | CollectionsPage | Curated collections |
| `/search` | SearchResultsPage | Products + categories + sellers |
| `/compare` | ComparePage | Side-by-side up to 4 products |
| `/blog`, `/blog/:slug` | Blog pages | Content marketing |
| `/about`, `/contact`, `/faq` | Info pages | Marketing / support |
| `/privacy`, `/terms`, `/refund-policy` | Legal | Policy pages |
| `/login`, `/register` | Buyer auth | Mock email/password + Google stub |
| `/become-a-seller` | BecomeASellerPage | Seller acquisition |
| `/seller` | SellerHubPage | Seller entry / redirect |
| `/seller/login`, `/seller/register` | Seller auth | Mock seller auth |
| `/seller/:slug` | SellerProfilePage | Public storefront for a seller |
| `/order-failed` | OrderFailedPage | Failure state |
| `/403`, `/500`, `/network-error`, `/maintenance`, `/coming-soon` | System pages | Error / status surfaces |

### 2.2 Buyer account (guarded)

| Path | Page |
|------|------|
| `/dashboard` | Account dashboard stats |
| `/orders`, `/orders/:id` | Orders + escrow actions + chat |
| `/wallet` | Existing mock wallet UI (see §1.6) |
| `/downloads` | Purchased digital assets |
| `/invoices` | Derived invoices |
| `/coupons` | Coupon codes (UI only) |
| `/reviews` | Buyer reviews |
| `/following` | Followed sellers |
| `/browsing-history` | Recently viewed / recommended |
| `/profile` | Profile details |
| `/security` | Password, 2FA, sessions, delete account |
| `/notifications` | In-app notifications |
| `/addresses` | Billing/shipping “Access Details” |
| `/payment-methods` | Saved crypto wallets (UI) |
| `/settings` | Email preference toggles |
| `/support` | Support tickets + FAQ |

### 2.3 Seller portal (guarded)

| Path | Surface |
|------|---------|
| `/seller/dashboard`, `/seller/overview` | Overview KPIs |
| `/seller/products` | Listing management |
| `/seller/products/new`, `/seller/products/:id/edit` | Product editor |
| `/seller/upload-accounts/:productId` | Credential/account inventory upload |
| `/seller/orders` | Seller orders |
| `/seller/escrow` | Escrow held/disputed |
| `/seller/downloads` | Download activity |
| `/seller/earnings` | Seller Internal Wallet / withdrawals |
| `/seller/analytics` | Charts |
| `/seller/messages` | Order chat replies |
| `/seller/reviews` | Review replies |
| `/seller/notifications` | Seller alerts |
| `/seller/store` | Store + payout settings |
| `/seller/profile` | Seller public profile editor |
| `/seller/settings` | Maps to store tab |

### 2.4 Admin panel (guarded)

| Area | Paths |
|------|-------|
| Auth | `/admin/login` |
| Core | `/admin`, `/admin/analytics` |
| Catalog | products, categories, collections, brands, inventory |
| Sales | orders, customers, sellers, coupons |
| Content | reviews, media, blog (+ categories/tags/authors/comments/trash/settings) |
| CMS | homepage, header, footer, menus, hero, banners, static pages, FAQ, testimonials, newsletter, popups, SEO, email templates, global/social/contact |
| System | settings, users |

---

## 3. User Flows

### 3.1 Buyer discovery → Cryptomus pay → escrow → release

```
Browse / Search / Category filters
  → Product Detail (or Quick View)
  → Buy Now (requires login)
  → Create Order (awaiting_payment)
  → Redirect / open Cryptomus payment (BTC, ETH, USDT, TRX, …)
  → Cryptomus confirms payment (webhook)
  → Escrow Held (auto-release at +24h)
  → Order Detail (chat, optional dispute, delivery)
  → 24h elapsed with no dispute → Escrow Released
       → Seller Internal Wallet credited (minus commission)
  → OR buyer opens Dispute → Admin resolution
  → Downloads when digital delivery ready
```

**Important:** There is **no cart** and **no multi-item checkout**. One product per order.  
**Important:** There is **no buyer deposit step** before purchase.

### 3.2 Seller onboarding → listing → earnings → withdrawal

```
/become-a-seller → /seller/register
  → Seller dashboard
  → Create product → submit for review → live
  → UploadAccountsPage (credential inventory)
  → Buyer pays via Cryptomus → Escrow
  → Auto-release (24h) or dispute path
  → Seller Internal Wallet balance increases
  → Seller requests withdrawal (destination from payout settings)
  → Status: Pending
  → Admin reviews + sends crypto ≤ 24h
  → Status: Paid
```

### 3.3 Admin moderation & finance ops

```
Sellers: approve/reject/suspend
Products: publish/moderate
Orders / Escrow / Disputes: monitor + resolve
Commission: edit CommissionConfig in Admin Panel
Withdrawals queue:
  Pending → review seller + amount + address
  → manually send crypto
  → mark Paid (store tx hash / note)
  → or Reject (return funds to seller wallet)
```

### 3.4 Auth flows (current mock UI)

| Role | Entry | Guard redirect |
|------|-------|----------------|
| Buyer | `/login`, `/register` | `/login` |
| Seller | `/seller/login`, `/seller/register` | `/seller/login` |
| Admin | `/admin/login` | `/admin/login` |
| Google | Button → `/auth/google` | Stub only (UI unchanged) |

---

## 4. Missing Backend Functionality

### 4.1 Cross-cutting

- Real authentication (JWT/session), password hashing, email verification, password reset
- Role-based access control (buyer / seller / admin staff)
- Persistent MongoDB on VPS
- File/media storage with signed download URLs
- Email delivery (order paid, escrow release, dispute, withdrawal Pending/Paid)
- Rate limiting, audit logs
- **Cryptomus webhook signature verification + idempotency**

### 4.2 Catalog & search

- Product CRUD with seller ownership + admin moderation
- Category tree, collections, brands
- Faceted search matching FilterSidebar
- Inventory decrement + ProductAccount allocation on paid order
- Product approval workflow (`draft` → `pending` → `live` / `rejected`)

### 4.3 Commerce (per business rules)

- Create order + Cryptomus invoice
- Webhook-driven payment confirmation
- Escrow hold on payment success
- **24-hour auto-release job** (skip/cancel if dispute open)
- Early release path only if product later exposes “confirm receipt” (UI already has it — backend may support both: confirm OR 24h timer, whichever comes first without dispute)
- Credit **Seller Internal Wallet** on release (gross − commission from DB config)
- Seller withdrawal request lifecycle: Pending → Paid (admin manual)
- Configurable commission engine (global / category / per-seller overrides)
- Order messaging, invoices, signed downloads
- Dispute freeze + admin resolve (release to seller or refund via Cryptomus/admin process)

### 4.4 Marketplace ops

- Seller verification flags
- Admin dispute console
- Admin withdrawal queue (Pending → Paid / Rejected)
- Support tickets, notifications, analytics, newsletter, reports

### 4.5 Explicitly out of backend scope

| Do NOT build | Reason |
|--------------|--------|
| Buyer USD deposit wallet | Business rule §2–3 |
| Buyer deposit addresses / on-chain watchers for wallet top-up | Cryptomus handles checkout payment |
| Buyer platform withdrawals | No buyer funded wallet |
| Automated seller payout broadcast | Admin sends crypto manually |
| Alternate gateways (Stripe, PayPal, Coinbase Commerce, etc.) | Cryptomus only |
| Hardcoded 15% / 2% fee constants in backend logic | Commission from DB |

### 4.6 Frontend mock gaps (documented only; UI unchanged)

| Mock issue | Target |
|------------|--------|
| Checkout debits `hs_wallet` | Cryptomus payment |
| Instant deposit/withdraw on buyer WalletPage | Not part of money model |
| Escrow release does not credit seller | Credit Seller Internal Wallet |
| Commission shown as constants in seed/UI | Admin-editable CommissionConfig |
| Admin orders use Card/PayPal | `paymentMethod: 'cryptomus'` |
| Seller withdrawal mock uses PayPal label | Crypto payout address + Pending/Paid |

---

## 5. Required REST APIs

Base: `/api`. Auth via `Authorization: Bearer <accessToken>` (or httpOnly cookie).

### 5.1 Auth

| Method | Endpoint | Notes |
|--------|----------|-------|
| POST | `/auth/register` | Buyer register |
| POST | `/auth/login` | Buyer login |
| POST | `/auth/seller/register` | Create seller + user |
| POST | `/auth/seller/login` | Seller login |
| POST | `/auth/admin/login` | Staff login |
| POST | `/auth/google` | Optional later; UI stub exists |
| GET | `/auth/google/callback` | Optional later |
| POST | `/auth/logout` | Invalidate refresh token |
| POST | `/auth/refresh` | Refresh access token |
| POST | `/auth/forgot-password` | Email reset link |
| POST | `/auth/reset-password` | Set new password |
| GET | `/auth/me` | Current user + roles |
| POST | `/auth/verify-email` | Email verification |

### 5.2 Users / profiles

| Method | Endpoint |
|--------|----------|
| GET/PATCH | `/users/me` |
| GET/PATCH | `/users/me/profile` |
| GET/PATCH | `/users/me/security` |
| POST | `/users/me/change-password` |
| POST | `/users/me/2fa/enable` / `disable` |
| GET | `/users/me/sessions` |
| DELETE | `/users/me/sessions/:id` |
| DELETE | `/users/me` |

### 5.3 Catalog (public)

| Method | Endpoint |
|--------|----------|
| GET | `/products` |
| GET | `/products/:idOrSlug` |
| GET | `/categories` |
| GET | `/categories/:slug/products` |
| GET | `/collections` |
| GET | `/collections/:slug` |
| GET | `/brands` |
| GET | `/sellers` |
| GET | `/sellers/:slug` |
| GET | `/search?q=&filters…` |
| GET | `/blog` / `/blog/:slug` |

### 5.4 Buyer commerce & Cryptomus checkout

| Method | Endpoint | Notes |
|--------|----------|-------|
| POST | `/orders` | Create order + Cryptomus payment session; returns `paymentUrl` / invoice payload |
| GET | `/orders` | Buyer order list |
| GET | `/orders/:id` | Order detail + payment/escrow status |
| GET | `/orders/:id/payment` | Refresh Cryptomus payment status |
| POST | `/orders/:id/confirm-receipt` | Optional early escrow release (if no dispute) |
| POST | `/orders/:id/dispute` | Open dispute (blocks auto-release) |
| GET/POST | `/orders/:id/messages` | Order chat |
| GET | `/downloads` | Purchased files/accounts |
| GET | `/downloads/:id/url` | Signed download |
| GET | `/invoices` | Invoice list |
| GET | `/invoices/:id/pdf` | PDF |
| POST | `/coupons/validate` | Validate code at checkout |
| GET | `/coupons/mine` | Buyer coupons |
| CRUD | `/addresses` | Access details |
| CRUD | `/payment-methods` | Saved addresses (UI); not used for buyer deposits |
| GET/POST | `/reviews` | Buyer reviews |
| POST/DELETE | `/following/:sellerId` | Follow sellers |
| GET/POST | `/browsing-history` | Recently viewed |
| CRUD | `/support/tickets` | Support |
| POST | `/reports` | Report product/seller |
| GET | `/notifications` | List |
| PATCH | `/notifications/:id/read` | Mark read |
| POST | `/newsletter/subscribe` | Newsletter |

**Removed from target API (vs prior draft):** buyer deposit address, buyer deposit intents, buyer wallet top-up, buyer withdrawals.

### 5.5 Cryptomus webhooks

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/webhooks/cryptomus` | Payment status updates; verify signature; mark order paid → create EscrowHold |

### 5.6 Seller Internal Wallet & withdrawals

| Method | Endpoint | Notes |
|--------|----------|-------|
| GET | `/seller/wallet` | Available / pending-withdrawal / lifetime stats |
| GET | `/seller/wallet/transactions` | Ledger |
| GET | `/seller/escrow` | Orders currently in escrow |
| GET | `/seller/earnings` | Alias/aggregate for earnings UI |
| POST | `/seller/withdrawals` | Create request → status `Pending`; lock amount from available |
| GET | `/seller/withdrawals` | Seller withdrawal history |
| GET | `/seller/withdrawals/:id` | Detail |

### 5.7 Seller catalog / ops

| Method | Endpoint |
|--------|----------|
| GET/PATCH | `/seller/store` |
| GET/PATCH | `/seller/profile` |
| CRUD | `/seller/products` |
| POST | `/seller/products/:id/submit` |
| CRUD | `/seller/products/:id/accounts` |
| POST | `/seller/products/:id/accounts/import` |
| GET | `/seller/orders` |
| PATCH | `/seller/orders/:id/deliver` |
| GET | `/seller/analytics` |
| GET | `/seller/downloads` |
| GET/POST | `/seller/reviews/:id/reply` |
| GET | `/seller/notifications` |
| GET/POST | `/seller/messages` |

### 5.8 Admin

| Domain | Endpoints |
|--------|-----------|
| Dashboard/Analytics | `GET /admin/stats`, `GET /admin/analytics` |
| Products / Categories / Collections / Brands / Inventory | CRUD + moderation |
| Orders | list/detail + refund/dispute actions |
| Customers / Sellers | CRUD + approve/reject/suspend/verify |
| Coupons / Reviews / Media / Banners / Blog / CMS | As existing admin modules |
| **Commission** | `GET/PUT /admin/commission` (+ rules CRUD) — **DB-backed, editable** |
| **Withdrawals** | `GET /admin/withdrawals?status=Pending`, `POST /admin/withdrawals/:id/mark-paid`, `POST /admin/withdrawals/:id/reject` |
| Escrow/Disputes | resolve → release to seller wallet or refund path |
| Platform settings | store identity, maintenance, `escrowAutoReleaseHours` (default 24) |
| Staff users | CRUD + roles |
| Support tickets | admin inbox |

---

## 6. Required MongoDB Models

| Model | Purpose |
|-------|---------|
| User | Auth identity (buyer/seller/admin roles) |
| BuyerProfile | Extended buyer profile |
| SellerProfile | Store, payout destination, verification |
| Category / Brand / Collection | Catalog taxonomy |
| Product / ProductAccount / ProductFile | Listings + credential units + files |
| MediaAsset | Media library |
| Order | Purchase + Cryptomus payment refs + delivery |
| Payment | Cryptomus invoice/payment records |
| OrderMessage | Chat on order |
| EscrowHold | Escrow record + auto-release timestamp |
| Dispute | Dispute case + resolution |
| **SellerWallet** | Seller Internal Wallet balances |
| **SellerWalletTransaction** | Immutable seller ledger |
| **Withdrawal** | Seller withdrawal requests (Pending/Paid/Rejected) |
| **CommissionConfig** | Configurable commission rules (Admin-editable) |
| Coupon / CouponRedemption | Discounts |
| Review / Follow / BrowsingHistory | Social / engagement |
| Notification / SupportTicket / Report / Invoice | Ops |
| Blog* / Cms* / Banner / Faq / … | CMS parity with seedData |
| PlatformSettings | Escrow timer, maintenance, store identity |
| Session / RefreshToken / AuditLog | Auth + compliance |

**Removed models (vs prior draft):** buyer Deposit wallet top-up, buyer-funded Wallet as spendable checkout balance.

---

## 7. Authentication Architecture

### 7.1 Approach

- **Single User collection** with `roles: ['buyer' | 'seller' | 'admin' | 'editor' | 'support']`
- A user may be both buyer and seller
- **JWT access token** (short-lived) + **refresh token**
- Passwords hashed with **argon2** or **bcrypt**
- Optional **2FA** (TOTP) matching SecurityPage UI
- Google OAuth optional later (UI stub exists; not required for commerce MVP)
- Prefer email verification before seller withdrawals

### 7.2 Session mapping from current frontend

| Frontend key | Backend replacement |
|--------------|---------------------|
| `hs_user` | Access token + `/auth/me` |
| `pm_seller_session` | Same user token; seller routes require `seller` role + approved SellerProfile |
| `pm_admin_auth` | Staff role on User |

### 7.3 Guards

| Guard | Rule |
|-------|------|
| Buyer account | Authenticated |
| Seller portal | Authenticated + seller role (+ approved for selling/withdrawals) |
| Admin | Authenticated + staff role |
| Mark withdrawal Paid | admin only |
| Edit CommissionConfig | admin only |

### 7.4 Demo credentials to replace

Current admin mock: `admin@hstock.store` / `admin123` — seed for local/dev only.

---

## 8. Admin Features

Existing admin UI areas remain as inventoried in §2.4.

**Finance/ops capabilities the backend must support (wire into Admin Panel):**

1. **Commission management** — edit global rate, category overrides, optional per-seller overrides; stored in MongoDB (`CommissionConfig`); never hardcoded in code
2. **Withdrawals queue** — list `Pending`; view seller, amount, asset/network, destination address; mark `Paid` (tx hash/note) or `Rejected`
3. **Escrow / disputes** — view holds, force-release after resolution, refund path
4. **Orders** — Cryptomus payment status, escrow timers
5. Existing catalog, CMS, blog, customers, sellers, coupons, media, settings

SLA: admin completes approved crypto transfer for Pending withdrawals **within 24 hours**.

---

## 9. Seller Features

| Feature | UI surface | Backend |
|---------|------------|---------|
| Register / login | Seller auth | Auth + SellerProfile |
| Products + account upload | Products / UploadAccounts | Product + ProductAccount |
| Orders / escrow / messages | Tabs | Shared Order / EscrowHold / messages |
| **Internal Wallet** | Earnings tab | SellerWallet + ledger |
| **Withdraw** | Earnings tab | Withdrawal `Pending` → admin `Paid` |
| Payout destination | Store settings | Used on withdrawal request |
| Analytics / reviews / notifications | Tabs | Aggregations / Review.reply / Notification |

On escrow release:

```
sellerNet = escrowAmount - calculateCommission(order, CommissionConfig)
SellerWallet.available += sellerNet
SellerWalletTransaction { type: 'escrow_release', ... }
```

---

## 10. Buyer Features

| Feature | Target behavior |
|---------|-----------------|
| Browse/search/filter/sort | Unchanged capabilities |
| Buy Now | Creates order + Cryptomus payment (no deposit wallet) |
| Pay with crypto | Via Cryptomus (BTC, ETH, USDT, TRX, all supported) |
| Orders | Track payment, escrow, delivery, dispute |
| Confirm receipt (UI exists) | May release escrow early if no dispute |
| Open dispute | Blocks 24h auto-release |
| Downloads / invoices / reviews / follow / support | As existing UI |
| `/wallet` page | UI unchanged for now; **not a funded deposit wallet in backend** |

---

## 11. Crypto Payment Flow (Cryptomus Only)

### 11.1 Gateway

- **Sole provider:** Cryptomus
- Buyer may pay with **BTC, ETH, USDT, TRX, and any currency Cryptomus supports**
- Platform does not generate its own deposit addresses for buyer checkout

### 11.2 Checkout sequence

```
1. Buyer authenticated → POST /orders { productId, licenseId, quantity, coupon? }
2. Backend:
     - lock price snapshot
     - compute commission preview from CommissionConfig (for later release)
     - create Order { paymentStatus: 'awaiting_payment' }
     - create Cryptomus invoice (amount, order id, callback URL)
     - store Payment { provider: 'cryptomus', invoiceId, payUrl, ... }
3. API returns payment URL / invoice details to frontend
4. Buyer completes payment on Cryptomus
5. Cryptomus → POST /webhooks/cryptomus
6. Backend verifies signature + idempotency:
     - Payment.status = paid
     - Order.paymentStatus = paid
     - Create EscrowHold { status: 'held', releaseAt: now+24h }
     - Trigger delivery (auto assign ProductAccount or await seller manual)
     - Notify buyer + seller
```

### 11.3 Failure / expiry

- Unpaid / expired invoice → order `Cancelled` or `Expired`
- `/order-failed` can be shown when payment fails (UI already exists)
- Do not create EscrowHold until payment is successfully confirmed

### 11.4 Refunds

- Refunds (dispute won by buyer, cancellations after pay) go through an **admin-controlled Cryptomus refund / manual process**
- Do not credit a buyer deposit wallet (none exists)

---

## 12. Escrow Architecture

### 12.1 Rules

- Escrow starts **only after Cryptomus payment success**
- Default auto-release: **24 hours** after `paidAt` if `disputeOpen === false`
- `escrowAutoReleaseHours` stored in `PlatformSettings` (default 24); timer job reads DB
- If buyer opens dispute before release → status `Disputed`; auto-release job **skips**
- Optional: buyer “Confirm Access & Release Escrow” (existing UI) may release early if no dispute
- On release → credit **Seller Internal Wallet** (net of commission)

### 12.2 State machine

```
Order created (awaiting_payment)
        │ Cryptomus paid
        v
   Escrow Held ──────────────────────────────┐
   releaseAt = paidAt + 24h                  │
        │                                    │
        ├── confirmReceipt (optional)        ├── openDispute
        │         │                          │         │
        │         v                          │         v
        │    Released                        │    Disputed
        │                                    │         │
        └── auto-release job at releaseAt ───┘         │
                  │                              admin resolve
                  v                         ┌──────────┴──────────┐
             Released                       v                     v
                  │                   Release to seller     Refund (Cryptomus/
                  v                   Internal Wallet       admin process)
     SellerWallet += sellerNet
```

### 12.3 Ledger movements

| Event | Effect |
|-------|--------|
| Cryptomus paid | EscrowHold created for order gross (or net policy — recommend hold **gross paid**, commission taken at release) |
| Auto/manual release | EscrowHold → `released`; SellerWallet.available += (amount − commission); platform commission recorded |
| Dispute | EscrowHold → `disputed`; timer paused |
| Resolve to seller | Same as release |
| Resolve to buyer | EscrowHold → `refunded`; no seller credit; refund via Cryptomus/admin |

### 12.4 Jobs

- `autoReleaseEscrow.job` — every minute (or similar): find `held` where `releaseAt <= now` and no open dispute → release

---

## 13. Wallet System (Seller Internal Wallet Only)

### 13.1 Principle

- **Seller Internal Wallet** is the only platform balance that holds withdrawable funds
- Buyers do **not** have a deposit/spend wallet on-platform
- Escrow is tracked per order (`EscrowHold`), not as a buyer wallet bucket

### 13.2 SellerWallet balances

| Field | Meaning |
|-------|---------|
| `available` | Withdrawable balance |
| `pendingWithdrawal` | Sum locked in `Pending` withdrawal requests |
| `lifetimeEarned` | Cumulative escrow releases (net) |
| `lifetimeWithdrawn` | Cumulative `Paid` withdrawals |

### 13.3 Transaction types (seller ledger)

`escrow_release` | `withdrawal_hold` | `withdrawal_paid` | `withdrawal_rejected_restore` | `adjustment` | `commission` (informational/platform)

### 13.4 Invariants

- Never mutate SellerWallet without a SellerWalletTransaction
- `available` cannot go negative
- Withdrawal request moves `amount` from `available` → `pendingWithdrawal`
- Mark Paid: clear pending lock; do not return to available
- Reject: restore `available` from `pendingWithdrawal`

---

## 14. Withdrawal System

### 14.1 Seller-initiated

```
Seller selects amount (+ destination from payout settings / request payload)
  → POST /seller/withdrawals
  → Validate available >= amount
  → Create Withdrawal { status: 'Pending' }
  → Lock funds (available → pendingWithdrawal)
  → Notify admin
```

### 14.2 Status model (business rules)

| Status | Meaning |
|--------|---------|
| `Pending` | Submitted; awaiting admin review / manual transfer |
| `Paid` | Admin completed crypto transfer |
| `Rejected` | Admin rejected; funds restored to seller available |

> Do not auto-broadcast on-chain. Admin sends funds manually within **24 hours** of request.

### 14.3 Admin completion

```
Admin opens Pending withdrawal
  → Verifies seller, amount, asset/network, address
  → Sends crypto manually from platform treasury
  → POST /admin/withdrawals/:id/mark-paid { txHash?, adminNote? }
  → status: Paid; pendingWithdrawal decreased; lifetimeWithdrawn increased
```

Rejection:

```
POST /admin/withdrawals/:id/reject { adminNote }
  → status: Rejected
  → restore seller available
```

### 14.4 Buyer withdrawals

**Not supported** in the target architecture (no buyer deposit wallet).

---

## 15. Database Schema Proposal

### 15.1 User

```
User {
  _id,
  email: String (unique),
  passwordHash: String?,
  name: String,
  roles: ['buyer','seller','admin','editor','support'],
  googleId: String?,
  emailVerified: Boolean,
  twoFactorEnabled: Boolean,
  twoFactorSecret: String?,
  status: 'active'|'suspended'|'deleted',
  lastLoginAt: Date,
  createdAt, updatedAt
}
```

### 15.2 BuyerProfile / SellerProfile

```
BuyerProfile {
  userId,
  username, phone, country, address, city, postalCode, bio,
  instagram, twitter, website, photoUrl, coverUrl,
  prefs: { marketing, orderUpdates, newArrivals }
}

SellerProfile {
  userId,
  storeName, slug (unique), ownerName, email, phone,
  status: 'pending'|'approved'|'rejected'|'suspended',
  verified: Boolean,
  specialty, bio, logo, banner,
  website, social: { facebook, instagram, twitter, youtube, linkedin },
  address,
  payout: {
    asset: String,          // e.g. USDT, BTC, ETH, TRX
    network: String,        // e.g. TRC20, ERC20, BTC, …
    walletAddress: String
  },
  shippingPolicy, defaultProcessingTime,
  notifications: { newOrders, newReviews, payouts, marketing },
  metrics: { productsCount, totalSales, rating, responseTime },
  joinedAt, createdAt, updatedAt
}
```

> Per-seller commission overrides live in `CommissionConfig`, not hardcoded on the profile (profile may reference an optional override rule id).

### 15.3 Product / ProductAccount

(Unchanged in shape from prior analysis — catalog fields remain as frontend forms define.)

```
Product { … listing fields … sellerId, status, price, salePrice, deliveryType, stock, … }
ProductAccount {
  productId, sellerId,
  fields: Object,
  status: 'available'|'reserved'|'sold'|'failed',
  orderId?, createdAt, updatedAt, soldAt?
}
```

### 15.4 Order + Payment + Escrow

```
Order {
  _id, orderNumber,
  buyerId, sellerId,
  productSnapshot: { … },
  licenseId, licenseName,
  amount, currency: 'USD',              // listing currency snapshot
  commissionPercentSnapshot: Number,    // rate used at release time resolution
  commissionAmount: Number?,            // set on release
  sellerNet: Number?,                   // set on release
  couponCode?, discountAmount?,
  status: 'AwaitingPayment'|'Processing'|'Completed'|'Disputed'|'Cancelled'|'Refunded'|'Expired',
  paymentStatus: 'awaiting_payment'|'paid'|'refunded'|'failed'|'expired',
  paymentMethod: 'cryptomus',
  deliveryStatus: 'Awaiting Delivery'|'Delivered',
  deliveryPayload?: Object,
  escrowStatus: 'None'|'Held'|'Released'|'Disputed'|'Refunded',
  disputeOpen: Boolean,
  paidAt?: Date,
  createdAt, updatedAt, completedAt?
}

Payment {
  _id, orderId, buyerId,
  provider: 'cryptomus',
  invoiceId: String,
  paymentId: String?,
  payUrl: String,
  amount, currency,
  paidAsset?: String,                   // BTC/ETH/USDT/TRX/…
  paidAmount?: String,
  status: 'created'|'paid'|'partial'|'expired'|'failed'|'refunded',
  rawPayload?: Object,                  // last webhook snapshot
  createdAt, updatedAt, paidAt?
}

EscrowHold {
  orderId, buyerId, sellerId,
  amount, currency,
  status: 'held'|'released'|'refunded'|'disputed',
  releaseAt: Date,                      // paidAt + 24h (from settings)
  releasedAt?, refundedAt?,
  releaseReason?: 'auto_24h'|'buyer_confirm'|'admin_resolve'
}

Dispute {
  orderId, openedBy,
  reason: String,
  status: 'open'|'under_review'|'resolved_seller'|'resolved_buyer'|'closed',
  adminNotes?, resolvedBy?, resolvedAt?,
  createdAt
}

OrderMessage {
  orderId, from: 'buyer'|'seller'|'system'|'admin',
  senderId?, text, createdAt
}
```

### 15.5 Seller Internal Wallet + Withdrawals

```
SellerWallet {
  sellerId (unique),
  available: Number,
  pendingWithdrawal: Number,
  lifetimeEarned: Number,
  lifetimeWithdrawn: Number,
  currency: 'USD',
  updatedAt
}

SellerWalletTransaction {
  walletId, sellerId,
  type: 'escrow_release'|'withdrawal_hold'|'withdrawal_paid'|'withdrawal_rejected_restore'|'adjustment',
  amount: Number,                       // signed
  balanceAfterAvailable: Number,
  orderId?, withdrawalId?,
  meta: Object,
  createdAt
}

Withdrawal {
  _id, withdrawalNumber,                // WD-XXXXXX
  sellerId,
  amount, currency: 'USD',
  asset: String,
  network: String,
  address: String,
  status: 'Pending'|'Paid'|'Rejected',
  txHash?: String,
  adminNote?: String,
  processedBy?: ObjectId,
  requestedAt: Date,
  paidAt?: Date,
  rejectedAt?: Date
}
```

### 15.6 Configurable commission (NOT hardcoded)

```
CommissionConfig {
  _id,
  key: 'default' | String,              // singleton default + named schedules
  isActive: Boolean,
  defaultPercent: Number,               // e.g. 15 — editable in Admin
  categoryRules: [{
    id, categoryId, percent, priority
  }],
  sellerRules: [{
    id, sellerId, percent, priority
  }],
  updatedBy?,
  createdAt, updatedAt
}

PlatformSettings {
  storeName, storeEmail, …
  maintenanceMode: Boolean,
  escrowAutoReleaseHours: 24,           // business default
  withdrawalAdminSlaHours: 24,
  cryptomus: { merchantId ref via env; no secrets in DB },
  …
}
```

**Resolution order for commission percent:**

1. Active seller-specific rule (if any)  
2. Else category rule matching order product category  
3. Else `defaultPercent`  

Snapshot the resolved percent onto the Order at payment or release time for auditability.

Admin APIs edit these documents only — **no commission constants in source code**.

### 15.7 Supporting + CMS

Same as prior inventory: Coupon, Review, Follow, Notification, SupportTicket, Address, Invoice, Blog*, Cms*, Banner, Faq, Testimonial, etc.

---

## 16. Recommended Backend Folder Structure

```
apps/
  web/                            # existing frontend (UI unchanged)
  api/
    package.json
    src/
      index.js
      app.js
      config/
        env.js                    # MONGO_URI, CRYPTOMUS_*, JWT_*, …
        db.js
      middleware/
        auth.js
        validate.js
        errorHandler.js
        rateLimit.js
        upload.js
      modules/
        auth/
        users/
        sellers/
        products/
        categories/
        collections/
        brands/
        orders/
        payments/                 # Cryptomus invoice create
        webhooks/                 # /webhooks/cryptomus
        escrow/
        disputes/
        sellerWallet/
        withdrawals/
        commission/               # Admin-editable config
        coupons/
        reviews/
        notifications/
        support/
        media/
        blog/
        cms/
        admin/
        search/
      models/
        User.js
        SellerProfile.js
        Product.js
        ProductAccount.js
        Order.js
        Payment.js
        EscrowHold.js
        Dispute.js
        SellerWallet.js
        SellerWalletTransaction.js
        Withdrawal.js
        CommissionConfig.js
        PlatformSettings.js
        …
      services/
        cryptomus.service.js      # sign, create invoice, verify webhook
        ledger.service.js         # seller wallet mutations
        commission.service.js     # resolve percent from DB
        escrow.service.js         # hold/release
        email.service.js
        storage.service.js
        pdf.service.js
        search.service.js
      jobs/
        autoReleaseEscrow.job.js  # 24h release
      utils/
        ids.js
        money.js
      seeds/
        seed.js                   # includes default CommissionConfig doc
    tests/
infra/
  nginx/hstock.conf
  pm2/ecosystem.config.cjs
```

### 16.1 Implementation sequencing (after approval)

1. Auth + Users + SellerProfile + Admin staff  
2. Catalog read/write APIs  
3. **CommissionConfig** + Admin commission APIs  
4. **Orders + Cryptomus payments + webhooks**  
5. **Escrow + 24h auto-release job + disputes**  
6. **Seller Internal Wallet + withdrawal Pending/Paid admin flow**  
7. Delivery/accounts, downloads, messages  
8. CMS/Blog parity, notifications, support  
9. VPS deploy (MongoDB, PM2, Nginx)

### 16.2 Frontend integration notes (later; UI unchanged now)

- Swap mock `request()` for real `fetch` without redesigning pages
- Buy Now should call `POST /orders` and open Cryptomus `payUrl`
- Seller Earnings tab reads `/seller/wallet` + `/seller/withdrawals`
- Admin Settings/Commission screens persist to `/admin/commission`
- Buyer Wallet page left as-is until a dedicated UX decision

---

## 17. Deployment Architecture (Hostinger VPS)

### 17.1 Stack

| Component | Role |
|-----------|------|
| Ubuntu VPS (Hostinger) | Host OS |
| Nginx | TLS termination, reverse proxy to API + static frontend |
| Node.js + PM2 | Run `apps/api` (and optionally serve/build pipeline for `apps/web`) |
| Self-hosted MongoDB | Primary datastore (bind to localhost; auth enabled) |
| Cryptomus | External payment API + webhooks |

### 17.2 Suggested Nginx routing

```
https://hstock.store/           → frontend static build (apps/web dist)
https://hstock.store/api/       → proxy_pass http://127.0.0.1:4000/
https://hstock.store/api/webhooks/cryptomus → API (no browser auth; signature verify)
```

### 17.3 Process management

- PM2 ecosystem: `hstock-api` (node), optional `hstock-escrow-job` if run as separate process
- Restart on reboot via `pm2 startup`
- Logs via `pm2 logs` + Nginx access/error logs

### 17.4 Secrets / env on VPS

```
NODE_ENV=production
PORT=4000
MONGO_URI=mongodb://…           # localhost with auth
JWT_ACCESS_SECRET=…
JWT_REFRESH_SECRET=…
CRYPTOMUS_MERCHANT_ID=…
CRYPTOMUS_API_KEY=…
CRYPTOMUS_WEBHOOK_SECRET=…      # per Cryptomus docs
APP_URL=https://hstock.store
API_URL=https://hstock.store/api
ESCROW_AUTO_RELEASE_HOURS=24    # default; PlatformSettings remains source of truth at runtime
```

### 17.5 Ops checklist

- MongoDB bound to `127.0.0.1`, authentication on, regular backups
- UFW: allow 22/80/443 only
- Certbot / Hostinger SSL in front of Nginx
- Webhook URL publicly reachable over HTTPS
- Do not expose MongoDB or PM2 ports publicly

---

## Appendix A — LocalStorage Key Map (current mock UI)

| Key | Domain |
|-----|--------|
| `hs_user`, `hs_wallet`, `hs_transactions`, `hs_orders`, `hs_compare`, `hs_notifications` | Buyer mock commerce |
| `pm_addresses`, `pm_payment_methods`, `pm_profile_details`, `pm_buyer_reviews`, `pm_followed_sellers`, `pm_support_tickets`, `pm_recent_searches`, `pm_recently_viewed` | Buyer extras |
| `pm_sellers`, `pm_seller_session`, `pm_admin_seller_products` | Seller |
| `pm_admin_*`, `pm_admin_auth` | Admin resources + session |

## Appendix B — Commission (target)

- **Not hardcoded** in backend source
- Stored in `CommissionConfig` (MongoDB)
- Editable from Admin Panel
- Seed may insert an initial `defaultPercent` for bootstrap only; production changes go through Admin APIs
- Optional category + seller overrides
- Order stores commission snapshot at release for audit

## Appendix C — Out of scope for this document

- No backend code generated
- No frontend UI changes
- No smart contracts
- No non-Cryptomus payment providers
- No buyer deposit wallet implementation

---

## Approval Gate

**Please review this revised architecture and approve before backend scaffolding begins.**

Checklist:

1. Confirm **Cryptomus-only** payments (BTC, ETH, USDT, TRX, and all Cryptomus-supported currencies)
2. Confirm **no buyer USD deposit wallet**
3. Confirm funds enter **Escrow after successful Cryptomus payment**
4. Confirm escrow **auto-releases after 24 hours** without dispute
5. Confirm released funds credit **Seller Internal Wallet**
6. Confirm withdrawals: Seller request → **Pending** → Admin manual payout ≤ 24h → **Paid**
7. Confirm **DB-configurable commission** editable in Admin Panel (no hardcoded rates)
8. Confirm deployment target: **Hostinger VPS + Ubuntu + MongoDB + PM2 + Nginx**
9. Confirm **frontend UI stays unchanged** for now
10. Approve proceeding to backend scaffolding on the next request
