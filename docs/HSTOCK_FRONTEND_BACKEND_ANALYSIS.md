# HStock Marketplace — Frontend Analysis & Backend Blueprint

**Status:** Analysis complete — awaiting approval before any backend implementation  
**Source:** `hstock-marketplace-layout.zip` → `apps/web`  
**Product:** HStock (`hstock.store`) — digital marketplace for social accounts, domains, websites, SaaS, source code, apps, AI tools, templates, courses, eBooks, and scripts  
**Date:** 2026-07-30

---

## Executive Summary

The repository contains a **frontend-only React + Vite marketplace UI**. All commerce, auth, wallet, escrow, and admin CMS behavior is simulated with **localStorage mock APIs**. No Node/Express/Mongo backend exists yet.

The UI already encodes a clear product model:

1. Buyers fund a **USD wallet via crypto** (BTC, ETH, USDT, SOL, BNB).
2. Purchases debit the wallet; funds move into **escrow**.
3. Buyer confirms delivery → escrow **releases** to seller; or buyer opens a **dispute**.
4. Sellers manage listings (including **account credential inventory**), orders, escrow, earnings, and crypto payouts.
5. Admins manage catalog, sellers, orders, CMS, blog, coupons, and platform settings (15% commission, 2% platform fee in seed config).

This document maps the existing frontend and proposes the REST APIs, MongoDB models, and backend structure required to replace the mock layer — **without generating backend code**.

---

## 1. Project Architecture

### 1.1 Repository layout

```
hstock-marketplace-layout/
├── apps/web/                 # Vite React SPA (entire product UI)
│   ├── src/
│   │   ├── admin/            # Admin panel (auth, pages, localStorage API)
│   │   ├── app/              # Router + route modules
│   │   ├── components/       # Shared storefront UI
│   │   ├── context/          # StoreContext, SellerAuthContext
│   │   ├── pages/            # Storefront + buyer account + seller portal
│   │   ├── services/         # Mock API + repositories
│   │   ├── constants/        # SITE, API_BASE_URL, ENDPOINTS, filters
│   │   ├── hooks/, lib/, types/
│   │   └── features/, modules/, config/   # Empty placeholders
│   ├── plugins/              # Hostinger Horizons Vite tooling (not product backend)
│   └── package.json
└── vault/                    # Temp tooling vault
```

### 1.2 Tech stack (frontend)

| Layer | Choice |
|-------|--------|
| UI | React 18 |
| Bundler | Vite 7 |
| Routing | react-router-dom v7 |
| Styling | Tailwind 3 + Radix/shadcn primitives |
| Forms | react-hook-form + zod (available; many auth forms use local state) |
| Charts | recharts |
| Motion | framer-motion |
| Icons | lucide-react, react-icons |
| SEO | react-helmet |
| Data today | localStorage mock DB with artificial latency |
| Intended backend | Node/Express + MongoDB (scaffolded via `API_BASE_URL` / `ENDPOINTS`) |

### 1.3 Runtime architecture (current)

```
Browser
  └─ AppRouter
       ├─ StoreProvider          (buyer session, wallet, orders, compare)
       ├─ AdminAuthProvider      (admin session)
       └─ SellerAuthProvider     (seller session)
            └─ Routes
                 ├─ Public storefront
                 ├─ Buyer account   (RequireCustomerAuth)
                 ├─ Seller portal   (RequireSellerAuth)
                 └─ Admin panel     (RequireAdminAuth → AdminLayout)
```

### 1.4 Data layer today

| Concern | Mechanism |
|---------|-----------|
| Catalog (products, categories, …) | `admin/api/db.js` → `pm_admin_*` localStorage |
| Storefront reads | Repositories map admin seed → public shapes |
| Buyer commerce | `StoreContext` → `hs_*` keys |
| Seller auth | `SellerAuthContext` → `pm_sellers`, `pm_seller_session` |
| Seller products | `pm_admin_seller_products` |
| Admin auth | Hardcoded demo credentials → `pm_admin_auth` |
| HTTP API | `services/api.js` simulates `request()`; ready to swap for `fetch(API_BASE_URL + path)` |

`API_BASE_URL = import.meta.env.VITE_API_URL || '/api'`

---

## 2. Frontend Pages

### 2.1 Public storefront

| Path | Page | Purpose |
|------|------|---------|
| `/` | HomePage | Hero, categories, featured products, sellers, testimonials, newsletter |
| `/shop` | ShopPage | Product grid, search, sort, grid/list (no full filter sidebar) |
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
| `/order-failed` | OrderFailedPage | Failure state (not wired from purchase) |
| `/403`, `/500`, `/network-error`, `/maintenance`, `/coming-soon` | System pages | Error / status surfaces |

### 2.2 Buyer account (guarded)

Layout: `AccountLayout` (Header + account sidebar + Footer)

| Path | Page |
|------|------|
| `/dashboard` | Account dashboard stats |
| `/orders`, `/orders/:id` | Orders + escrow actions + chat |
| `/wallet` | Crypto deposit / withdraw + balances |
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
| `/payment-methods` | Saved crypto wallets |
| `/settings` | Email preference toggles |
| `/support` | Support tickets + FAQ |

### 2.3 Seller portal (guarded)

| Path | Surface |
|------|---------|
| `/seller/dashboard`, `/seller/overview` | Overview KPIs |
| `/seller/products` | Listing management |
| `/seller/products/new`, `/seller/products/:id/edit` | Product editor |
| `/seller/upload-accounts/:productId` | Credential/account inventory upload |
| `/seller/orders` | Seller orders (mock) |
| `/seller/escrow` | Escrow held/disputed (live from buyer orders) |
| `/seller/downloads` | Download activity |
| `/seller/earnings` | Seller wallet / withdrawals |
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

### 3.1 Buyer discovery → purchase → escrow release

```
Browse / Search / Category filters
  → Product Detail (or Quick View)
  → Buy Now (requires login)
  → PurchaseModal (wallet balance check)
  → confirmPurchase
       • Debit wallet
       • Create order (escrowStatus: Held)
  → Order Detail
       • Chat with seller
       • Confirm Access & Release Escrow  → Completed / Released
       • OR Open Dispute                  → Disputed
  → Downloads (when digital + delivered)
```

**Important:** There is **no cart** and **no multi-item checkout**. One product per order.

### 3.2 Buyer wallet funding

```
/wallet → Deposit
  → Select network (BTC/ETH/USDT/SOL/BNB)
  → Show deposit address + copy
  → Enter USD amount
  → Instant credit (simulated)
```

### 3.3 Buyer withdrawal

```
/wallet → Withdraw
  → Amount + network + destination address
  → Debit available balance
  → History entry (no pending lifecycle today)
```

### 3.4 Seller onboarding → listing → delivery

```
/become-a-seller → /seller/register
  → Seller dashboard
  → Create product (draft/publish → pending)
  → UploadAccountsPage (credential inventory)
  → Product goes live (stock from accounts)
  → Buyer purchases → Escrow held
  → Seller sees escrow + messages
  → Buyer confirms → Escrow released (earnings credit missing in mock)
  → Seller withdraws earnings
```

### 3.5 Admin moderation

```
Seller registers / product pending
  → Admin Sellers: approve/reject/suspend
  → Admin Products: publish/unpublish/feature
  → Admin Orders: status/payment/refund
  → Admin Reviews: approve/reject
  → CMS/Blog/Settings maintenance
```

### 3.6 Auth flows (current mock)

| Role | Entry | Guard redirect |
|------|-------|----------------|
| Buyer | `/login`, `/register` | `/login` |
| Seller | `/seller/login`, `/seller/register` | `/seller/login` |
| Admin | `/admin/login` | `/admin/login` |
| Google | Button → `/auth/google` | **Not implemented** |

---

## 4. Missing Backend Functionality

Everything below is implied by the UI but not implemented as a real service.

### 4.1 Cross-cutting

- Real authentication (JWT/session), password hashing, email verification, password reset
- Google OAuth callback + account linking
- Role-based access control (buyer / seller / admin staff roles)
- Persistent MongoDB instead of localStorage
- File/media upload storage (S3 or equivalent) with signed download URLs
- Email delivery (order, low stock, dispute, withdrawal, templates from CMS)
- Rate limiting, audit logs, idempotent payment webhooks
- Unification of admin seed orders (fiat Card/PayPal) with storefront crypto/escrow model

### 4.2 Catalog & search

- Product CRUD with seller ownership + admin moderation
- Category tree, collections, brands
- Full-text / faceted search matching FilterSidebar
- Inventory decrement + account-unit allocation on purchase
- Product approval workflow (`draft` → `pending` → `live` / `rejected`)

### 4.3 Commerce

- Wallet ledger (available / pending / escrow)
- Crypto deposit address generation + on-chain confirmation watcher
- Crypto withdrawal queue + broadcast + fees
- Checkout with coupons, tax, platform fee, commission split
- Escrow state machine + auto-release timer + admin resolution
- Seller earnings credit on release
- Order messaging
- Invoice PDF generation
- Downloads with signed, time-limited URLs

### 4.4 Marketplace ops

- Seller KYC/verification flags
- Dispute resolution console (admin)
- Support tickets
- Notifications (in-app + email/push)
- Analytics aggregations for admin/seller dashboards
- Newsletter subscribe
- Report product/seller

### 4.5 Gaps / inconsistencies to resolve in backend design

| Issue | Recommendation |
|-------|----------------|
| Admin orders use Card/PayPal; storefront uses crypto wallet | Standardize on wallet + crypto; keep paymentMethod enum extensible |
| Seller Orders tab is mock; Escrow uses real buyer orders | Single Order collection shared by buyer/seller/admin |
| Escrow release does not credit seller balance | Ledger transfer: Escrow → Seller Available (minus commission) |
| Coupons not applied at checkout | Validate + apply in purchase API |
| Saved crypto wallets unused by WalletPage | Prefill withdraw address from payment methods |
| Pending balance always `$0` | Use for unconfirmed deposits / withdrawal holds |
| Google OAuth dead end | Implement `/auth/google` + callback |
| Seller passwords stored plaintext in mock | bcrypt/argon2; never store plaintext |
| USDT has no chain variant (ERC20/TRC20/BEP20) | Model `network` + `asset` separately |
| PDP license selection incomplete | Purchase must require selected license |

---

## 5. Required REST APIs

Base: `/api` (matches `API_BASE_URL`). Auth via `Authorization: Bearer <accessToken>` (or httpOnly cookie).

### 5.1 Auth

| Method | Endpoint | Notes |
|--------|----------|-------|
| POST | `/auth/register` | Buyer register |
| POST | `/auth/login` | Buyer login |
| POST | `/auth/seller/register` | Create seller + user |
| POST | `/auth/seller/login` | Seller login |
| POST | `/auth/admin/login` | Staff login |
| POST | `/auth/google` | Exchange Google token / start OAuth |
| GET | `/auth/google/callback` | OAuth callback |
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
| GET | `/sellers` / `/artists` |
| GET | `/sellers/:slug` |
| GET | `/search?q=&filters…` |
| GET | `/blog` / `/blog/:slug` |

### 5.4 Buyer commerce

| Method | Endpoint |
|--------|----------|
| POST | `/orders` | Buy Now (wallet purchase) |
| GET | `/orders` | Buyer order list |
| GET | `/orders/:id` | Order detail |
| POST | `/orders/:id/confirm-receipt` | Release escrow |
| POST | `/orders/:id/dispute` | Open dispute |
| GET/POST | `/orders/:id/messages` | Order chat |
| GET | `/downloads` | Purchased files/accounts |
| GET | `/downloads/:id/url` | Signed download |
| GET | `/invoices` | Invoice list |
| GET | `/invoices/:id/pdf` | PDF |
| GET/POST | `/coupons/validate` | Validate code |
| GET | `/coupons/mine` | Assigned/used coupons |
| CRUD | `/addresses` | Access details |
| CRUD | `/payment-methods` | Saved crypto wallets |
| GET/POST | `/reviews` | Buyer reviews |
| POST/DELETE | `/following/:sellerId` | Follow sellers |
| GET | `/browsing-history` | Recently viewed |
| POST | `/browsing-history` | Track view |
| CRUD | `/support/tickets` | Support |
| POST | `/reports` | Report product/seller |
| GET | `/notifications` | List |
| PATCH | `/notifications/:id/read` | Mark read |
| POST | `/newsletter/subscribe` | Newsletter |

### 5.5 Wallet / crypto

| Method | Endpoint |
|--------|----------|
| GET | `/wallet` | Balances (available, escrow, pending) |
| GET | `/wallet/transactions` | Ledger history |
| GET | `/wallet/deposit-address?asset=&network=` | Fresh or reusable address |
| POST | `/wallet/deposits/intent` | Create deposit intent (USD target optional) |
| GET | `/wallet/deposits/:id` | Deposit status / confirmations |
| POST | `/wallet/withdrawals` | Request withdrawal |
| GET | `/wallet/withdrawals` | Withdrawal history |
| GET | `/wallet/withdrawals/:id` | Status |
| GET | `/wallet/networks` | Supported assets/networks + fees |

### 5.6 Seller

| Method | Endpoint |
|--------|----------|
| GET/PATCH | `/seller/store` |
| GET/PATCH | `/seller/profile` |
| CRUD | `/seller/products` |
| POST | `/seller/products/:id/submit` | Submit for review |
| CRUD | `/seller/products/:id/accounts` | Credential inventory |
| POST | `/seller/products/:id/accounts/import` | Bulk import |
| GET | `/seller/orders` |
| PATCH | `/seller/orders/:id/deliver` | Mark delivered / attach delivery payload |
| GET | `/seller/escrow` |
| GET | `/seller/earnings` |
| POST | `/seller/withdrawals` |
| GET | `/seller/analytics` |
| GET | `/seller/downloads` |
| GET/POST | `/seller/reviews/:id/reply` |
| GET | `/seller/notifications` |
| GET/POST | `/seller/messages` |

### 5.7 Admin

Mirror existing `admin/api/*` modules as REST:

| Domain | Endpoints |
|--------|-----------|
| Dashboard/Analytics | `GET /admin/stats`, `GET /admin/analytics` |
| Products | CRUD + bulk + feature/publish |
| Categories | CRUD + trash/restore |
| Collections, Brands | CRUD |
| Inventory | list + adjust + stock log |
| Orders | list/detail + status + refund + dispute resolve |
| Customers | CRUD + suspend |
| Sellers | CRUD + approve/reject/suspend/reinstate + verify |
| Coupons | CRUD |
| Reviews | moderate |
| Media | upload/list/delete |
| Banners | CRUD |
| Blog | posts/authors/categories/tags/comments/trash/settings |
| CMS | homepage, header, footer, menus, hero, pages, FAQ, testimonials, newsletter, popups, SEO, email templates, global/social/contact |
| Settings | get/update (fees, commission, maintenance) |
| Staff Users | CRUD + roles |
| Wallets/Withdrawals | admin approval queue, deposit monitoring |
| Escrow/Disputes | resolve → release to seller or refund buyer |
| Support tickets | admin inbox |

### 5.8 Webhooks (internal/crypto provider)

| Endpoint | Purpose |
|----------|---------|
| POST | `/webhooks/crypto/deposit` | Confirmed deposit → credit pending/available |
| POST | `/webhooks/crypto/withdrawal` | Broadcast/confirmed status updates |

---

## 6. Required MongoDB Models

Primary collections (see §15 for full schema fields):

| Model | Purpose |
|-------|---------|
| User | Auth identity (buyer/seller/admin roles) |
| BuyerProfile | Extended buyer profile |
| SellerProfile | Store, payout, verification, commission |
| StaffProfile / AdminUser | Internal roles (Admin/Editor/Support) |
| Category | Nested category tree |
| Brand | Brands |
| Collection | Curated groups |
| Product | Listings (admin or seller owned) |
| ProductAccount | Sellable credential/unit inventory |
| ProductFile | Digital download assets |
| MediaAsset | Media library |
| Order | Purchase + escrow + delivery |
| OrderMessage | Chat on order |
| OrderItem | Optional if multi-item later; MVP can embed single item |
| Wallet | Per-user balances |
| WalletTransaction | Immutable ledger |
| Deposit | Crypto deposit intents/confirmations |
| Withdrawal | Buyer or seller payout requests |
| EscrowHold | Escrow record linked to order |
| Dispute | Dispute case + resolution |
| Coupon | Discount codes |
| CouponRedemption | Usage tracking |
| Review | Product reviews |
| Follow | Buyer→seller follows |
| BrowsingHistory | Recently viewed |
| Notification | In-app notifications |
| SupportTicket | Support |
| Report | Abuse reports |
| Invoice | Invoice metadata |
| BlogPost / BlogAuthor / BlogCategory / BlogTag / BlogComment | Blog CMS |
| Cms* singletons / documents | Homepage, header, footer, settings, etc. |
| Banner, HeroSlide, Faq, Testimonial, Popup, SeoEntry, EmailTemplate, NavMenu, StaticPage | CMS entities |
| PlatformSettings | Fees, commission, maintenance |
| Session / RefreshToken | Auth sessions |
| AuditLog | Admin/seller sensitive actions |

---

## 7. Authentication Architecture

### 7.1 Recommended approach

- **Single User collection** with `roles: ['buyer' | 'seller' | 'admin' | 'editor' | 'support']`
- A user may be both buyer and seller
- **JWT access token** (short-lived) + **refresh token** (httpOnly cookie or rotating DB token)
- Passwords hashed with **argon2** or **bcrypt**
- Optional **2FA** (TOTP) matching SecurityPage
- **Google OAuth** for buyer + seller (admin optional / off by default)
- Email verification before high-risk actions (withdrawals)

### 7.2 Session mapping from current frontend

| Frontend key | Backend replacement |
|--------------|---------------------|
| `hs_user` | Access token + `/auth/me` |
| `pm_seller_session` | Same user token; seller routes require `seller` role + approved SellerProfile |
| `pm_admin_auth` | Staff role on User; separate admin login UI can remain |

### 7.3 Route guards (backend equivalents)

| Guard | Rule |
|-------|------|
| Buyer account | Authenticated |
| Seller portal | Authenticated + seller role + status ∈ {approved} (register may allow pending limited access) |
| Admin | Authenticated + staff role |
| Seller product write | Owner sellerId match |
| Admin dispute resolve | admin/support |

### 7.4 Demo credentials to replace

Current admin mock: `admin@hstock.store` / `admin123` — seed only for local/dev, never production.

---

## 8. Admin Features

From `admin/layout/nav.js` and pages:

1. **Dashboard & Analytics** — GMV, orders, customers, inventory health
2. **Catalog** — Products, Categories (trash/restore), Collections, Brands, Inventory adjustments
3. **Sales** — Orders (status/payment/refund), Customers (suspend), Sellers (approve/reject/suspend/reinstate, commission), Coupons
4. **Content** — Reviews moderation, Media library, full Blog CMS
5. **CMS** — Homepage, Header, Footer, Nav menus, Hero slider, Banners, Static pages, FAQ, Testimonials, Newsletter, Popups, SEO, Email templates, Global/Social/Contact settings
6. **System** — Platform settings (tax, shipping stubs, `platformFeePercent`, `commissionRules`, maintenance), Staff user management

**Backend additions admin UI will need (not fully present today):**

- Escrow / dispute resolution console
- Deposit & withdrawal approval / monitoring
- Wallet ledger inspection per user
- Seller payout configuration oversight

---

## 9. Seller Features

| Feature | UI surface | Backend need |
|---------|------------|--------------|
| Register / login | Seller auth pages | Auth + SellerProfile |
| Overview KPIs | Overview tab | Aggregations |
| Product CRUD | Editor | Products owned by sellerId |
| Publish workflow | draft/pending/live/rejected | Moderation statuses |
| Account inventory | UploadAccountsPage | ProductAccount units |
| Delivery type | automatic/manual | Delivery engine |
| Orders | Orders tab | Shared Order model |
| Escrow view | Escrow tab | EscrowHold queries |
| Order chat | Messages tab | OrderMessage |
| Earnings / withdraw | Earnings tab | Seller wallet + Withdrawal |
| Payout settings | Store settings | crypto method + address |
| Analytics | Analytics tab | Metrics pipeline |
| Reviews reply | Reviews tab | Review.reply |
| Store branding | Store/Profile tabs | SellerProfile fields |
| Notifications | Notifications tab | Notification service |

Seller product fields of note: title, descriptions, category, price/salePrice, stock, deliveryType, marketplaceType, listingType, promotion/bulkDiscounts, thumbnail/gallery, tags, SEO, productAccounts, custom fields, verification/handover metadata.

---

## 10. Buyer Features

| Feature | Notes |
|---------|-------|
| Browse/shop/search/filter/sort | Facets: price, rating, fileTypes, licenses, verified, deliveryTime |
| Product detail + licenses | Purchase should bind license |
| Buy Now + wallet checkout | No cart |
| Wallet deposit/withdraw | Crypto networks |
| Orders + escrow confirm/dispute | Core trust flow |
| Order messaging | Buyer↔seller |
| Downloads | Gated digital delivery |
| Invoices | PDF |
| Coupons | Must apply at purchase |
| Reviews | CRUD |
| Follow sellers | Social graph |
| Compare (max 4) | Can stay client-side or persist |
| Profile / security / 2FA / sessions | Account security |
| Addresses | Billing/shipping metadata |
| Saved crypto wallets | Withdraw convenience |
| Support tickets | Helpdesk |
| Notifications | In-app |
| Browsing history | Personalization |
| Newsletter | Marketing |

---

## 11. Crypto Payment Flow

### 11.1 Supported assets (UI)

| Asset | Networks shown | Notes |
|-------|----------------|-------|
| BTC | Bitcoin | Bech32-style demo address |
| ETH | Ethereum | 0x address |
| USDT | Shown as Tether | Needs explicit chain (ERC20/TRC20/BEP20) |
| SOL | Solana | Base58 address |
| BNB | BNB Chain | bnb1… address |

All wallet UI amounts are **USD**, not coin units. Backend must convert using a rate oracle or fixed invoice in crypto.

### 11.2 Recommended deposit flow

```
1. Buyer opens Deposit → selects asset + network
2. POST /wallet/deposit-address (or /deposits/intent)
3. Backend assigns/reuses deposit address; creates Deposit{status: awaiting_payment}
4. Buyer sends crypto on-chain
5. Watcher/webhook detects tx → status: confirming (confirmations N/M)
6. After threshold → credit Wallet.pending or Wallet.available
7. Optional clearing delay moves pending → available (UI already has Pending Balance)
8. WalletTransaction{type: deposit} written; notify buyer
```

### 11.3 Checkout payment (not on-chain per order)

Checkout does **not** take crypto directly. Flow is:

```
Crypto deposit → USD wallet balance → Buy Now debits wallet → Escrow hold
```

### 11.4 What to implement beyond UI theater

- Per-user or pooled address management
- Confirmation policies per chain
- Exchange rate locking for “deposit $X worth”
- Dust/min deposit rules
- QR code payload for addresses (UI-ready enhancement)
- Tx hash display in transaction detail
- Network fee estimates for withdrawals

---

## 12. Escrow Architecture

### 12.1 State machine (from UI)

```
                 confirmPurchase
                       │
                       v
              ┌─────────────────┐
              │ Held            │  order.status = Processing
              │ delivery=Awaiting│
              └────────┬────────┘
                       │
         ┌─────────────┼──────────────┐
         │ confirmReceipt             │ openDispute
         v                            v
 ┌───────────────┐            ┌──────────────┐
 │ Released      │            │ Disputed     │
 │ Completed     │            │ disputeOpen  │
 │ Delivered     │            └──────┬───────┘
 └───────────────┘                   │
                                     │ admin resolve
                          ┌──────────┴──────────┐
                          v                     v
                     Release to seller    Refund to buyer wallet
```

### 12.2 Ledger movements

| Event | Ledger |
|-------|--------|
| Purchase | Buyer Available − amount → EscrowHold +amount |
| Release | EscrowHold − amount → Seller Available +(amount − commission − platformFee) ; Platform revenue +fees |
| Refund (dispute won by buyer) | EscrowHold − amount → Buyer Available +amount |
| Partial resolve | Split per admin decision |

### 12.3 Additional rules to add

- Seller `markDelivered` / automatic delivery of ProductAccount credentials
- Auto-release after N hours/days if no dispute (config in PlatformSettings)
- Dispute evidence + admin notes
- Freeze seller payouts while disputed
- Message thread audit trail

---

## 13. Wallet System

### 13.1 Balance buckets (match WalletPage)

| Bucket | Meaning |
|--------|---------|
| `available` | Spendable / withdrawable |
| `escrow` | Sum of active Held/Disputed holds (may be computed) |
| `pending` | Unconfirmed deposits or withdrawal locks |
| `current` | available + escrow + pending (display only) |

### 13.2 Transaction types

`deposit` | `withdrawal` | `purchase` | `escrow_release` | `refund` | `commission` | `adjustment`

### 13.3 Invariants

- Never mutate balances without a WalletTransaction
- Available cannot go negative
- Purchase only against available
- Escrow amounts tracked per Order/EscrowHold
- Seller and buyer wallets are separate Wallet documents (same User may have both contexts; recommend one wallet per user with seller earnings as available after release)

---

## 14. Withdrawal System

### 14.1 Buyer withdrawals

From WalletPage:

- Inputs: USD amount, network, destination address
- Source: available balance only
- Backend statuses: `requested` → `processing` → `broadcast` → `completed` | `failed` | `rejected`
- Persist fee, txHash, asset, network

### 14.2 Seller withdrawals

From SellerEarningsTab + Store payout settings:

- Preferred payout method: Bitcoin | Ethereum | Tether | Solana | BNB Chain + wallet address
- UI currently hardcodes method `PayPal` on create — **backend should use saved crypto payout settings**
- Apply minimum withdrawal, fee, and optional admin approval above threshold
- Available earnings = lifetime credits − pending − withdrawn (or simply Wallet.available for seller)

### 14.3 Admin controls

- View queue, approve/reject, mark broadcast/completed
- Compliance holds for unverified sellers
- Audit log every status change

---

## 15. Database Schema Proposal

> Field names align with frontend mock shapes where possible.

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

### 15.2 BuyerProfile

```
BuyerProfile {
  userId,
  username, phone, country, address, city, postalCode, bio,
  instagram, twitter, website, photoUrl, coverUrl,
  prefs: { marketing, orderUpdates, newArrivals }
}
```

### 15.3 SellerProfile

```
SellerProfile {
  userId,
  storeName, slug (unique), ownerName, email, phone,
  status: 'pending'|'approved'|'rejected'|'suspended',
  verified: Boolean,
  specialty, bio, logo, banner,
  website, social: { facebook, instagram, twitter, youtube, linkedin },
  address,
  payout: { method: 'BTC'|'ETH'|'USDT'|'SOL'|'BNB', network, walletAddress },
  commissionRate: Number,          // override; default from PlatformSettings
  shippingPolicy, defaultProcessingTime,
  notifications: { newOrders, newReviews, payouts, marketing },
  metrics: { productsCount, totalSales, rating, responseTime },
  joinedAt, createdAt, updatedAt
}
```

### 15.4 Product

```
Product {
  _id, sellerId?, createdByAdmin: Boolean,
  title, slug, sku, shortDescription, description, whatsIncluded,
  categoryId, subCategoryId, collectionIds[], brandId, tags[],
  fileTypes[], licenseIds[] | licenses[{ id, name, price, ... }],
  price, salePrice, cost, currency, taxClass, discountPercent,
  stock, unlimitedStock, lowStockThreshold, barcode,
  status: 'draft'|'pending'|'rejected'|'disabled'|'live'|'active'|'archived'|'out_of_stock',
  featured, trending, bestSeller, newArrival, promoted,
  promotion: { label, discount },
  bulkDiscounts: [{ minQuantity, percentage, label }],
  deliveryType: 'automatic'|'manual',
  marketplaceType, listingType, inventoryType,
  thumbnail, gallery[], previewImages[], previewVideos[],
  zipFile / files[], liveDemoUrl, documentationPdf,
  version, changelog, fileSize, supportedSoftware[], compatibleVersions[],
  shipping: { productType, weight, dims, shippingClass, ... },
  variations: { allowVariations, attributes[] },
  faq: [{ question, answer }],
  seo: { title, description, keywords[], ogImage, canonicalUrl },
  rating, reviewCount, downloads,
  verification, handover, metrics,
  createdAt, updatedAt, publishedAt
}
```

### 15.5 ProductAccount (credential units)

```
ProductAccount {
  productId, sellerId,
  fields: Object,                 // email, password, recovery, 2fa, cookie, token, custom
  status: 'available'|'reserved'|'sold'|'failed',
  validation: Object?,
  orderId?: ObjectId,
  createdAt, updatedAt, soldAt?
}
```

### 15.6 Order + Escrow

```
Order {
  _id, orderNumber,                    // ORD-XXXXXX
  buyerId, sellerId,
  productSnapshot: { id, title, img, cat, artist, sellerSlug, quantity, ... },
  licenseId, licenseName,
  amount, currency: 'USD',
  platformFee, commissionAmount, sellerNet,
  couponCode?, discountAmount?,
  status: 'Processing'|'Completed'|'Disputed'|'Cancelled'|'Refunded',
  paymentStatus: 'paid'|'refunded'|'partial',
  paymentMethod: 'wallet',
  deliveryStatus: 'Awaiting Delivery'|'Delivered',
  deliveryPayload?: Object,            // credentials/files meta
  escrowStatus: 'Held'|'Released'|'Disputed'|'Refunded',
  disputeOpen: Boolean,
  walletBalanceAfter?,                 // optional audit
  createdAt, updatedAt, completedAt?
}

EscrowHold {
  orderId, buyerId, sellerId,
  amount, currency,
  status: 'held'|'released'|'refunded'|'disputed',
  releaseAt?: Date,                    // auto-release deadline
  releasedAt?, refundedAt?
}

Dispute {
  orderId, openedBy: buyerId,
  reason: String,
  status: 'open'|'under_review'|'resolved_buyer'|'resolved_seller'|'closed',
  adminNotes?, resolvedBy?, resolvedAt?,
  createdAt
}

OrderMessage {
  orderId, from: 'buyer'|'seller'|'system'|'admin',
  senderId?, text, createdAt
}
```

### 15.7 Wallet ledger

```
Wallet {
  userId (unique),
  available: Number,
  pending: Number,
  currency: 'USD',
  updatedAt
}

WalletTransaction {
  walletId, userId,
  type: 'deposit'|'withdrawal'|'purchase'|'escrow_release'|'refund'|'adjustment'|'commission',
  amount: Number,                      // signed
  balanceAfter: Number,
  method?: String,
  orderId?, depositId?, withdrawalId?,
  meta: Object,
  createdAt
}

Deposit {
  userId, asset, network, address, txHash?,
  cryptoAmount?, usdAmount, rate?,
  confirmations, requiredConfirmations,
  status: 'awaiting_payment'|'confirming'|'credited'|'expired'|'failed',
  createdAt, creditedAt?
}

Withdrawal {
  userId, roleContext: 'buyer'|'seller',
  asset, network, address,
  amountUsd, feeUsd, cryptoAmount?,
  txHash?,
  status: 'requested'|'processing'|'broadcast'|'completed'|'failed'|'rejected',
  adminNote?, processedBy?,
  createdAt, completedAt?
}
```

### 15.8 Supporting commerce

```
Coupon { code, type: 'percent'|'fixed', value, minSpend, usageLimit, usedCount, status, expiresAt }
CouponRedemption { couponId, userId, orderId, amount, createdAt }
Review { productId, userId, rating, text/comment, status, reply?, createdAt }
Follow { buyerId, sellerId, createdAt }
Notification { userId, type, title, body, link, read, createdAt }
SupportTicket { userId, subject, priority, status, messages[{ from, text, date }] }
Address { userId, type, label, fullName, line1, city, state, postalCode, country, phone, isDefault }
PaymentMethod { userId, network, address, isDefault }
Invoice { invoiceNumber, orderId, userId, amount, createdAt }
PlatformSettings { storeName, fees, commissionRules, shipping*, tax*, maintenanceMode, escrowAutoReleaseHours, ... }
```

### 15.9 CMS / blog

Mirror `seedData.js` exports 1:1 as collections or typed documents:

`Category`, `Brand`, `Collection`, `Banner`, `MediaAsset`, `BlogPost`, `BlogAuthor`, `BlogCategory`, `BlogTag`, `BlogComment`, `BlogSettings`, `HomepageCms`, `HeaderCms`, `FooterCms`, `NavMenu`, `HeroSlide`, `StaticPage`, `FaqCategory`, `Faq`, `Testimonial`, `NewsletterCms`, `Popup`, `SeoEntry`, `EmailTemplate`, `GlobalSettings`, `SocialSettings`, `ContactSettings`.

---

## 16. Recommended Backend Folder Structure

Proposed monorepo addition alongside `apps/web`:

```
apps/
  web/                          # existing frontend
  api/                          # Node.js + Express (or Fastify) API
    package.json
    src/
      index.js                  # bootstrap HTTP server
      app.js                    # express app, middleware, routes mount
      config/
        env.js
        db.js
        cryptoNetworks.js
        fees.js
      middleware/
        auth.js                 # JWT / roles
        validate.js             # zod/joi
        errorHandler.js
        rateLimit.js
        upload.js
      modules/
        auth/
          auth.routes.js
          auth.controller.js
          auth.service.js
          auth.validation.js
        users/
        sellers/
        products/
        categories/
        collections/
        brands/
        orders/
        escrow/
        disputes/
        wallet/
        deposits/
        withdrawals/
        coupons/
        reviews/
        notifications/
        support/
        media/
        blog/
        cms/
        admin/
        search/
        webhooks/
      models/                   # Mongoose models (or modules/*/model.js)
        User.js
        SellerProfile.js
        Product.js
        ProductAccount.js
        Order.js
        EscrowHold.js
        Dispute.js
        Wallet.js
        WalletTransaction.js
        Deposit.js
        Withdrawal.js
        ...
      services/
        ledger.service.js       # double-entry-ish balance updates
        crypto.provider.js      # address gen + watcher adapter
        email.service.js
        storage.service.js      # S3 signed URLs
        pdf.service.js
        search.service.js
      jobs/
        confirmDeposits.job.js
        processWithdrawals.job.js
        autoReleaseEscrow.job.js
      utils/
        ids.js                  # ORD-/TXN-/WD- generators
        money.js                # cents-safe rounding
      seeds/
        seed.js                 # port of seedData.js
    tests/
```

### 16.1 Implementation sequencing (recommendation only)

1. **Auth + Users + SellerProfile + Admin staff**
2. **Catalog read APIs** (products/categories/search) wired to replace repositories
3. **Wallet + Deposit watcher (can start with manual credit admin tool)**
4. **Orders + Escrow + Messages + Delivery/Accounts**
5. **Seller earnings + Withdrawals**
6. **Coupons, Reviews, Notifications, Support**
7. **Admin CMS/Blog parity**
8. **Google OAuth, 2FA, invoices PDF, analytics**

### 16.2 Frontend integration contract

Replace mock `request()` in `services/api.js` and contexts with real `fetch`:

- Keep path shapes close to `constants/ENDPOINTS`
- Expand ENDPOINTS for wallet, escrow, seller, admin namespaces
- Persist tokens; remove `hs_*` / `pm_*` business data from localStorage (keep only UI prefs if desired)

---

## Appendix A — LocalStorage Key Map (current mock)

| Key | Domain |
|-----|--------|
| `hs_user`, `hs_wallet`, `hs_transactions`, `hs_orders`, `hs_compare`, `hs_notifications` | Buyer commerce |
| `pm_addresses`, `pm_payment_methods`, `pm_profile_details`, `pm_buyer_reviews`, `pm_followed_sellers`, `pm_support_tickets`, `pm_recent_searches`, `pm_recently_viewed` | Buyer extras |
| `pm_sellers`, `pm_seller_session`, `pm_admin_seller_products` | Seller |
| `pm_admin_*`, `pm_admin_auth` | Admin resources + session |

## Appendix B — Platform fee defaults (from seed)

- `platformFeePercent`: **2**
- `commissionRules`: **15%** all categories (per-seller override exists on Seller)
- Currency: **USD**
- Digital-first shipping methods (instant)

## Appendix C — Out of scope for this document

- No backend code was generated
- No smart contracts assumed (custodial crypto + internal USD ledger)
- Payment processor alternatives (Stripe etc.) not required by current UI

---

## Approval Gate

**Please review this analysis and approve before backend scaffolding or API implementation begins.**

Suggested approval checklist:

1. Confirm custodial crypto → USD wallet → escrow model
2. Confirm no shopping cart (single-item Buy Now)
3. Confirm commission 15% + platform fee 2% (or provide new rates)
4. Confirm USDT networks to support
5. Confirm escrow auto-release policy
6. Confirm Google OAuth required for MVP
7. Approve proposed folder structure (`apps/api`)
