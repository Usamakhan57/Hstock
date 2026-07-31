# HStock API Documentation (Phase 2)

Base URL: `/api/v1`

## Response envelope

Every response uses:

```json
{
  "success": true,
  "message": "…",
  "data": {},
  "errors": null,
  "meta": null
}
```

Errors may also include `code` (e.g. `VALIDATION_ERROR`, `UNAUTHORIZED`, `FORBIDDEN`, `NOT_FOUND`).

## Authentication

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/auth/register` | Public | Buyer registration |
| POST | `/auth/login` | Public | Buyer login |
| POST | `/auth/seller/register` | Public | Seller registration (fee from `SystemConfig`, default `0`) |
| POST | `/auth/seller/login` | Public | Seller login |
| POST | `/auth/admin/login` | Public | Admin / Super Admin login |
| POST | `/auth/logout` | Public | Revoke refresh token + clear cookie |
| POST | `/auth/refresh` | Public | Rotate refresh token / issue access token |
| POST | `/auth/forgot-password` | Public | Start password reset |
| POST | `/auth/reset-password` | Public | Complete password reset |
| POST/GET | `/auth/verify-email` | Public | Email verification |
| GET | `/auth/me` | Bearer | Current authenticated user |

Tokens:

- Access token: JWT (`Authorization: Bearer <token>` or `accessToken` cookie)
- Refresh token: JWT stored in DB (hashed) + httpOnly `refreshToken` cookie

## Users

| Method | Endpoint | Auth / Permission | Description |
|--------|----------|-------------------|-------------|
| GET | `/users/me` | Auth | Current user + profiles |
| PATCH | `/users/me` | Auth | Update basic profile |
| PATCH | `/users/me/profile` | Auth | Update buyer profile |
| PATCH | `/users/me/seller-profile` | Seller+ | Update seller profile / withdrawal wallets |
| POST | `/users/me/change-password` | Auth | Change password |
| GET | `/users/me/activity` | Auth | Activity logs |
| GET | `/users` | `users:manage` | List users |
| PATCH | `/users/:id` | `users:manage` | Admin update user |
| PATCH | `/users/sellers/:id` | Admin/Super Admin | Approve/reject/suspend seller |

## Configuration

Defaults are stored in MongoDB (never hardcoded in business logic):

- `sellerRegistrationFee = 0`
- `defaultCommission = 10`
- `maintenanceMode = false`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/config/seller-registration-fee` | Public | Current seller fee |
| GET | `/config/platform` | Public | Public platform settings |
| GET | `/config` | `config:read` | All configs |
| GET | `/config/system` | `config:read` | SystemConfig |
| GET | `/config/commission` | `config:read` | CommissionConfig |
| PUT | `/config/system` | `config:write` | Update SystemConfig |
| PUT | `/config/platform` | `config:write` | Update PlatformConfig |
| PUT | `/config/commission` | `config:write` | Update CommissionConfig |

## Categories / Brands / Collections / Tags

Public list + get. Write endpoints require corresponding `*:write` permission (Admin/Editor/Super Admin).

| Resource | List | Get | Create | Update | Delete |
|----------|------|-----|--------|--------|--------|
| Categories | `GET /categories` | `GET /categories/:idOrSlug` | `POST /categories` | `PATCH /categories/:id` | `DELETE /categories/:id` |
| Brands | `GET /brands` | `GET /brands/:idOrSlug` | `POST /brands` | `PATCH /brands/:id` | `DELETE /brands/:id` |
| Collections | `GET /collections` | `GET /collections/:idOrSlug` | `POST /collections` | `PATCH /collections/:id` | `DELETE /collections/:id` |
| Tags | `GET /tags` | `GET /tags/:idOrSlug` | `POST /tags` | `PATCH /tags/:id` | `DELETE /tags/:id` |

## Products

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/products` | Optional | Public live products (staff/seller filters supported) |
| GET | `/products/:idOrSlug` | Optional | Product detail + digital metadata |
| POST | `/products` | Seller/Admin | Create product foundation |
| PATCH | `/products/:id` | Owner/Staff | Update product |
| DELETE | `/products/:id` | Owner/Admin | Soft delete |
| POST | `/products/:id/submit` | Owner/Admin | Submit for approval |
| POST | `/products/:id/moderate` | `products:moderate` | Approve/reject/feature |

## Roles & permissions

Roles: `super_admin`, `admin`, `seller`, `buyer`, `editor`, `support`

Middleware:

- `requireAuth` / `authenticate`
- `requireRole` / `authorize`
- `requirePermission`

## Out of scope (not implemented)

Cryptomus, Escrow, Orders, Wallet balances, Withdrawals execution, Notifications, Reviews, Disputes, Admin Dashboard UI, Background business jobs.
