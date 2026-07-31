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

### Global digital asset uniqueness

Optional create/update fields (backward compatible):

| Field | Type | Description |
|-------|------|-------------|
| `assetIdentifier` | string \| null | Raw email / username / domain / URL / repo key |
| `assetPlatform` | string \| null | Hint: `email`, `instagram`, `tiktok`, `telegram`, `domain`, `website`, … |

The API stores `assetIdentifierNormalized` (canonical form). Duplicate blocking listings return:

- **HTTP 409**
- `code`: `ASSET_ALREADY_LISTED`
- `message`: `This digital asset is already listed on HStock.`

Applies to sellers **and** admins. Soft-deleted / rejected / archived listings release the identifier.

List/search query params:

| Param | Description |
|-------|-------------|
| `assetIdentifier` | Normalized before exact match on `assetIdentifierNormalized` |
| `assetIdentifierNormalized` | Exact match on stored canonical identity |
| `assetPlatform` | Filter by platform |
| `search` | Text search, or normalized asset match when query looks like an identifier |

See `docs/ASSET_UNIQUENESS.md` for architecture details.

## Commerce Core (orders / payments / escrow / wallet / disputes)

See `docs/COMMERCE_CORE.md` for full commerce API surface.

### Disputes (final system)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/disputes` | Buyer | Open dispute (`disputedQuantity` / `disputedAccountIds` optional) |
| GET | `/disputes/:id/dashboard` | Party/Admin | Quantities, amounts, OCR flags, replacements, timeline |
| GET | `/disputes/:id/timeline` | Party/Admin | Ordered dispute timeline |
| GET | `/disputes/:id/replacements` | Party | Versioned replacement history |
| POST | `/disputes/:id/replacements` | Seller | Send replacement account(s) (encrypted) |
| POST | `/disputes/:id/replacements/:replacementId/respond` | Buyer | `accepted` / `rejected` |
| POST | `/disputes/:id/replacements/:replacementId/accounts/:accountId/reveal` | Party | Reveal replacement credentials |
| GET | `/disputes/:id/chat` | Participant | Chat metadata |
| GET | `/disputes/:id/chat/messages` | Participant | List messages (credentials masked) |
| POST | `/disputes/:id/chat/messages` | Participant | Send message (content-filtered) |
| POST | `/disputes/:id/chat/credentials` | Participant | Share encrypted credentials |
| POST | `/disputes/:id/chat/messages/:messageId/reveal` | Participant | Reveal credentials (audited) |
| PATCH | `/disputes/:id/chat/messages/:messageId` | Author | Edit message (filtered) |
| DELETE | `/disputes/:id/chat/messages/:messageId` | Author/Assigned admin | Soft delete |
| POST | `/disputes/:id/chat/assign` | Admin/Support | Assign moderator |
| GET | `/disputes/:id/chat/blocked-attempts` | Assigned admin | View blocked contact attempts |
| GET | `/disputes/:id/chat/flagged-attachments` | Assigned admin | OCR-flagged evidence screenshots |
| POST | `/disputes/:id/chat/messages/:messageId/attachments/:attachmentId/review` | Assigned admin | Clear or confirm flagged screenshot |
| GET | `/disputes/:id/chat/audit` | Assigned admin | Full chat audit trail |
| GET | `/disputes/violations` | Staff | Violation counters |
| POST | `/disputes/:id/messages` | Participant | Legacy path (same secure filter) |
| POST | `/disputes/:id/resolve` | Admin | Resolve (partial escrow/refund aware) |

Blocked **text** contact / off-platform content → **HTTP 400** `CONTACT_INFO_BLOCKED`:

`For your security, sharing personal contact information or external links is not allowed.`

Evidence **screenshots are never auto-blocked**. OCR may flag them for admin review with a moderator warning badge.

Details: `docs/DISPUTE_SYSTEM.md`, `docs/SECURE_DISPUTE_CHAT.md`, `docs/ESCROW_PARTIAL.md`.

## Roles & permissions

Roles: `super_admin`, `admin`, `seller`, `buyer`, `editor`, `support`

Middleware:

- `requireAuth` / `authenticate`
- `requireRole` / `authorize`
- `requirePermission`

## Out of scope (not implemented)

Reviews module (storefront reviews). Notifications and Admin ops APIs are included in v1.0.

