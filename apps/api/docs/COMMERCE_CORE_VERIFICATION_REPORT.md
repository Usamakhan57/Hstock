# ApnaStore Commerce Core — Complete Implementation Verification Report

**Branch:** `cursor/commerce-core-8c83`  
**PR:** https://github.com/Usamakhan57/ApnaStore/pull/4  
**Scope:** `apps/api` only (no frontend modifications)  
**Date of verification run:** 2026-07-31  

This report is a full technical verification of the Commerce Core implementation. It is not a summary.

---

## 1. Every New MongoDB Model

### 1.1 Order — `src/models/Order.model.js`

| Field | Type | Constraints |
|-------|------|-------------|
| orderNumber | String | required, unique, indexed |
| buyer | ObjectId→User | required, indexed |
| seller | ObjectId→SellerProfile | required, indexed |
| sellerUser | ObjectId→User | required, indexed |
| product | ObjectId→Product | required, indexed |
| productSnapshot | Subdoc | title, slug, price, currency, productType, thumbnail, deliveryType |
| quantity | Number | default 1, min 1, max 1 (Buy Now = one product) |
| unitPrice | Number | required, min 0 |
| subtotal | Number | required, min 0 |
| commissionPercent | Number | required, 0–100 |
| commissionAmount | Number | required, min 0 |
| sellerAmount | Number | required, min 0 |
| totalAmount | Number | required, min 0 |
| currency | String | default USD, indexed |
| status | String enum | pending_payment, payment_processing, paid, escrow, delivered, completed, cancelled, refunded, disputed, expired |
| deliveryStatus | String enum | pending, awaiting_delivery, delivered, cancelled |
| payment | ObjectId→Payment | indexed |
| escrow | ObjectId→Escrow | indexed |
| dispute | ObjectId→Dispute | indexed |
| refund | ObjectId→Refund | |
| expiresAt | Date | indexed |
| paidAt, escrowedAt, deliveredAt, completedAt, cancelledAt | Date | |
| cancelledReason | String | max 2000 |
| metadata | Mixed | |
| timestamps | createdAt, updatedAt | |

Compound indexes: `{buyer, createdAt}`, `{seller, createdAt}`, `{status, expiresAt}`, `{status, createdAt}`

### 1.2 Payment — `src/models/Payment.model.js`

| Field | Type | Constraints |
|-------|------|-------------|
| order | ObjectId→Order | required, unique, indexed |
| orderNumber | String | required, indexed |
| buyer | ObjectId→User | required, indexed |
| seller | ObjectId→SellerProfile | required, indexed |
| gateway | String | enum `cryptomus` only |
| amount | Number | required, min 0 |
| currency | String | default USD |
| toCurrency | String | optional preferred crypto |
| network | String | optional |
| status | String enum | pending, processing, paid, partial, failed, expired, refunded, cancelled |
| cryptomusUuid | String | sparse unique |
| cryptomusOrderId | String | required, unique |
| invoiceUrl, address, txid | String | |
| payerAmount, payerCurrency, merchantAmount, paymentAmount, paymentAmountUsd | Mixed/Number | Cryptomus callback fields |
| providerStatus | String | indexed |
| isFinal | Boolean | |
| lifetimeSeconds | Number | default 3600 |
| expiresAt, paidAt, lastSyncedAt, lastWebhookAt | Date | |
| webhookCount | Number | |
| rawInvoice, rawLastWebhook | Mixed | |
| failureReason | String | max 2000 |
| metadata | Mixed | |
| timestamps | yes | |

Compound indexes: `{status, createdAt}`, `{buyer, createdAt}`

### 1.3 Escrow — `src/models/Escrow.model.js`

| Field | Type | Constraints |
|-------|------|-------------|
| order | ObjectId→Order | required, unique |
| payment | ObjectId→Payment | required |
| buyer, seller, sellerUser | ObjectId | required, indexed |
| amount, commissionPercent, commissionAmount, sellerAmount | Number | required |
| currency | String | USD |
| status | String enum | pending, locked, released, refunded, disputed |
| lockedAt, releaseAt, releasedAt, refundedAt, disputedAt | Date | releaseAt indexed |
| dispute | ObjectId→Dispute | indexed |
| releaseJobProcessedAt | Date | concurrency claim |
| releaseReason | String | max 500 |
| metadata | Mixed | |
| timestamps | yes | |

Compound indexes: `{status, releaseAt}`, `{seller, status}`

### 1.4 Wallet — `src/models/Wallet.model.js`

| Field | Type | Constraints |
|-------|------|-------------|
| seller | ObjectId→SellerProfile | required, unique |
| sellerUser | ObjectId→User | required, unique |
| currency | String | USD |
| availableBalance | Number | min 0 |
| pendingBalance | Number | escrow-locked funds |
| releasedBalance | Number | lifetime released |
| withdrawableBalance | Number | available − reserved |
| reservedBalance | Number | pending withdrawal holds |
| totalWithdrawn | Number | lifetime paid withdrawals |
| totalCommissionPaid | Number | lifetime commission |
| version | Number | optimistic concurrency |
| lastTransactionAt | Date | |
| metadata | Mixed | |
| timestamps | yes | |

Index: `{availableBalance: -1}`

### 1.5 LedgerEntry — `src/models/LedgerEntry.model.js`

| Field | Type | Constraints |
|-------|------|-------------|
| transferId | String | required, indexed — groups balanced pair |
| entryType | String enum | buyer_payment, escrow_credit, escrow_debit, commission_credit, seller_wallet_credit, seller_pending_credit, seller_pending_debit, withdrawal_reserve, withdrawal_debit, withdrawal_release, refund_debit, refund_credit, admin_adjustment |
| direction | String enum | debit, credit |
| account | String enum | external_gateway, escrow, commission_revenue, seller_available, seller_pending, seller_withdrawal_reserve, platform_adjustment, refund_payable |
| amount | Number | required, min 0 |
| currency | String | USD |
| balanceAfter | Number | optional snapshot |
| order, payment, escrow, withdrawal, refund, dispute | ObjectId | optional refs |
| seller, sellerUser, buyer, wallet | ObjectId | optional refs |
| description | String | max 1000 |
| createdBy | ObjectId→User | |
| meta | Mixed | |
| timestamps | createdAt only (immutable) | |

Compound indexes: `{transferId, direction, account}`, `{createdAt: -1}`, `{seller, createdAt}`

### 1.6 Withdrawal — `src/models/Withdrawal.model.js`

| Field | Type | Constraints |
|-------|------|-------------|
| requestNumber | String | required, unique |
| seller, sellerUser, wallet | ObjectId | required, indexed |
| amount | Number | required, min 0 |
| currency | String | USD |
| coin | String enum | SUPPORTED_COINS (29 assets) |
| network | String enum | CRYPTOMUS_NETWORKS (23 networks) |
| walletAddress | String | required |
| status | String enum | pending, approved, rejected, paid, cancelled |
| adminNote, rejectionReason | String | max 2000 |
| payoutReference, payoutTxid | String | manual payout evidence |
| reviewedBy | ObjectId→User | |
| reviewedAt, approvedAt, paidAt, rejectedAt, cancelledAt | Date | |
| metadata | Mixed | |
| timestamps | yes | |

Compound indexes: `{seller, status, createdAt}`, `{status, createdAt}`

### 1.7 Dispute — `src/models/Dispute.model.js`

Embedded message: `{ author, role(buyer|seller|admin|support|system), body, attachments[], createdAt }`

| Field | Type | Constraints |
|-------|------|-------------|
| disputeNumber | String | required, unique |
| order | ObjectId→Order | required, unique |
| escrow | ObjectId→Escrow | required |
| buyer, seller, sellerUser | ObjectId | required |
| reason | String | required, max 500 |
| description | String | required, max 10000 |
| evidence | [String] | |
| status | String enum | open, under_review, resolved, closed |
| resolution | String enum | seller_wins, buyer_wins, partial_refund, release |
| resolutionNote | String | max 5000 |
| refundAmount | Number | |
| messages | [message] | |
| openedAt, resolvedAt | Date | |
| resolvedBy | ObjectId→User | |
| metadata | Mixed | |
| timestamps | yes | |

Compound indexes: `{status, createdAt}`, `{buyer, createdAt}`, `{seller, createdAt}`

### 1.8 Refund — `src/models/Refund.model.js`

| Field | Type | Constraints |
|-------|------|-------------|
| refundNumber | String | required, unique |
| order, payment, escrow, dispute | ObjectId | |
| buyer, seller | ObjectId | required |
| type | String enum | full, partial, manual, escrow |
| amount | Number | required |
| currency | String | USD |
| status | String enum | pending, processing, completed, failed, cancelled |
| reason | String | required, max 2000 |
| adminNote | String | |
| createdBy | ObjectId→User | |
| completedAt | Date | |
| metadata | Mixed | |
| timestamps | yes | |

Index: `{status, createdAt}`

### 1.9 WebhookEvent — `src/models/WebhookEvent.model.js`

| Field | Type | Constraints |
|-------|------|-------------|
| provider | String | cryptomus |
| eventKey | String | required, unique — SHA-256 dedup key |
| externalId, orderId | String | indexed |
| signature | String | |
| payloadHash | String | required, indexed |
| status | String enum | received, processing, processed, failed, duplicate, rejected |
| providerStatus | String | |
| ip | String | |
| attempts | Number | default 1 |
| processedAt | Date | |
| lastError | String | max 2000 |
| payload | Mixed | required full body |
| payment, order | ObjectId | |
| timestamps | yes | |

Indexes: `{createdAt: -1}`, `{status, createdAt}`

### 1.10 JobRun — `src/models/JobRun.model.js`

| Field | Type |
|-------|------|
| name | String, indexed |
| status | running, success, failed |
| startedAt, finishedAt | Date |
| processed, succeeded, failed | Number |
| error | String max 4000 |
| meta | Mixed |
| timestamps | yes |

Index: `{name, createdAt}`

### 1.11 Modified Existing Models

**PlatformConfig** added:
- `minWithdrawalAmount` (default 10)
- `maxWithdrawalAmount` (default 100000)
- `orderPaymentLifetimeSeconds` (default 3600, range 300–43200)
- Existing: `escrowAutoReleaseHours` (24), `withdrawalAdminSlaHours` (24)

**CommissionConfig** (pre-existing, used by commerce):
- `defaultPercent` default 10
- `categoryRules[]`, `sellerRules[]` with priority

---

## 2. Every REST API Endpoint

Base prefix: `/api/v1`

### Orders (`orders.routes.js`)

| Method | Path | Auth | Role/Permission | Handler |
|--------|------|------|-----------------|---------|
| POST | `/orders/buy-now` | JWT | BUYER\|ADMIN\|SUPER_ADMIN + `orders:write` | `buyNow` |
| GET | `/orders/` | JWT | `orders:read` | `listOrders` |
| GET | `/orders/:id` | JWT | `orders:read` | `getOrder` |
| POST | `/orders/:id/cancel` | JWT | `orders:write` | `cancelOrder` |
| POST | `/orders/:id/deliver` | JWT | SELLER\|ADMIN\|SUPER_ADMIN | `markDelivered` |

### Payments (`payments.routes.js`)

| Method | Path | Auth | Role/Permission | Handler |
|--------|------|------|-----------------|---------|
| POST | `/payments/cryptomus/webhook` | **Public** (signature verified) | — | `cryptomusWebhook` |
| POST | `/payments/cryptomus/sandbox/:uuid` | Public, **blocked in production** | — | `sandboxConfirm` |
| GET | `/payments/` | JWT | `payments:read` | `listPayments` |
| GET | `/payments/cryptomus/services` | JWT | ADMIN\|SUPER_ADMIN | `listCryptomusServices` |
| GET | `/payments/:id` | JWT | `payments:read` | `getPayment` |
| POST | `/payments/:id/sync` | JWT | `payments:read` | `syncPayment` |

### Escrow (`escrow.routes.js`)

| Method | Path | Auth | Role/Permission | Handler |
|--------|------|------|-----------------|---------|
| GET | `/escrow/` | JWT | `escrow:read` | `listEscrows` |
| GET | `/escrow/:id` | JWT | `escrow:read` | `getEscrow` |
| POST | `/escrow/:id/release` | JWT | ADMIN\|SUPER_ADMIN + `escrow:manage` | `releaseEscrow` |

### Wallet (`wallet.routes.js`)

| Method | Path | Auth | Role/Permission | Handler |
|--------|------|------|-----------------|---------|
| GET | `/wallet/me` | JWT | SELLER\|ADMIN\|SUPER_ADMIN + `wallet:read` | `getMyWallet` |
| GET | `/wallet/me/transactions` | JWT | SELLER\|ADMIN\|SUPER_ADMIN + `wallet:read` | `listMyTransactions` |
| GET | `/wallet/seller/:sellerId` | JWT | ADMIN\|SUPER_ADMIN\|SUPPORT + `wallet:read` | `getSellerWallet` |
| GET | `/wallet/ledger` | JWT | `ledger:read` | `listLedger` |
| POST | `/wallet/adjust` | JWT | ADMIN\|SUPER_ADMIN + `wallet:manage` | `adjustWallet` |

### Withdrawals (`withdrawals.routes.js`)

| Method | Path | Auth | Role/Permission | Handler |
|--------|------|------|-----------------|---------|
| POST | `/withdrawals/` | JWT | SELLER\|ADMIN\|SUPER_ADMIN + `withdrawals:write` | `createWithdrawal` |
| GET | `/withdrawals/` | JWT | `withdrawals:read` | `listWithdrawals` |
| GET | `/withdrawals/:id` | JWT | `withdrawals:read` | `getWithdrawal` |
| POST | `/withdrawals/:id/approve` | JWT | ADMIN\|SUPER_ADMIN + `withdrawals:manage` | `approveWithdrawal` |
| POST | `/withdrawals/:id/reject` | JWT | ADMIN\|SUPER_ADMIN + `withdrawals:manage` | `rejectWithdrawal` |
| POST | `/withdrawals/:id/pay` | JWT | ADMIN\|SUPER_ADMIN + `withdrawals:manage` | `payWithdrawal` |
| POST | `/withdrawals/:id/cancel` | JWT | `withdrawals:write` | `cancelWithdrawal` |

### Disputes (`disputes.routes.js`)

| Method | Path | Auth | Role/Permission | Handler |
|--------|------|------|-----------------|---------|
| POST | `/disputes/` | JWT | BUYER\|ADMIN\|SUPER_ADMIN + `disputes:write` | `openDispute` |
| GET | `/disputes/` | JWT | `disputes:read` | `listDisputes` |
| GET | `/disputes/:id` | JWT | `disputes:read` | `getDispute` |
| POST | `/disputes/:id/messages` | JWT | `disputes:write` | `addMessage` |
| POST | `/disputes/:id/resolve` | JWT | ADMIN\|SUPER_ADMIN + `disputes:manage` | `resolveDispute` |

### Refunds (`refunds.routes.js`)

| Method | Path | Auth | Role/Permission | Handler |
|--------|------|------|-----------------|---------|
| POST | `/refunds/` | JWT | ADMIN\|SUPER_ADMIN + `refunds:manage` | `createRefund` |
| GET | `/refunds/` | JWT | `refunds:read` | `listRefunds` |
| GET | `/refunds/:id` | JWT | `refunds:read` | `getRefund` |

Phase 1/2 endpoints (auth, users, config, catalog, products, health) remain unchanged and operational.

---

## 3. Every Service

### Commerce services (new)

| File | Exported functions |
|------|-------------------|
| `order.service.js` | `buyNow`, `getOrder`, `listOrders`, `cancelOrder`, `expireOrders` |
| `payment.service.js` | `getPayment`, `listPayments`, `applyProviderPaymentUpdate`, `handleCryptomusWebhook`, `syncPaymentFromCryptomus`, `retryFailedPayments`, `retryFailedWebhooks`, `sandboxConfirmPayment` |
| `cryptomus.service.js` | `isCryptomusConfigured`, `getCryptomusMode`, `cryptomusRequest`, `createInvoice`, `getPaymentInfo`, `listPaymentServices`, `resendWebhook`, `simulateInvoice`, `createInvoiceOrSimulate`, `mapCryptomusStatusToPaymentStatus`, `verifyWebhookSignature`, `assertWebhookIpAllowed`, `assertWebhookNotExpired`, `buildWebhookEventKey`, `buildCallbackUrl` |
| `escrow.service.js` | `createPendingEscrow`, `lockEscrowAfterPayment`, `releaseEscrow`, `markEscrowDisputed`, `markEscrowRefunded`, `processDueEscrowReleases`, `listEscrows`, `getEscrow`, `markOrderDelivered` |
| `wallet.service.js` | `getOrCreateSellerWallet`, `getWalletForSellerUser`, `getWalletBySellerId`, `serializeWallet`, `recordBuyerPaymentIntoEscrow`, `releaseEscrowToSeller`, `refundFromEscrowPending`, `reserveForWithdrawal`, `releaseWithdrawalReservation`, `finalizeWithdrawalPayment`, `adminAdjustWallet`, `listWalletTransactions` |
| `ledger.service.js` | `recordTransfer`, `listLedger` |
| `commission.service.js` | `resolveCommissionPercent`, `computeOrderCommission` |
| `withdrawal.service.js` | `requestWithdrawal`, `listWithdrawals`, `getWithdrawal`, `approveWithdrawal`, `markWithdrawalPaid`, `rejectWithdrawal`, `cancelWithdrawal` |
| `dispute.service.js` | `openDispute`, `listDisputes`, `getDispute`, `addDisputeMessage`, `resolveDispute` |
| `refund.service.js` | `createEscrowRefund`, `createManualRefund`, `listRefunds`, `getRefund` |

### Pre-existing services (still used)

`auth.service.js`, `user.service.js`, `config.service.js`, `catalog.service.js`, `product.service.js`, `activity.service.js`

### Repositories (data access layer)

`order.repository.js`, `payment.repository.js`, `escrow.repository.js`, `wallet.repository.js`, `ledger.repository.js`, `withdrawal.repository.js`, `dispute.repository.js`, `refund.repository.js`, `webhook.repository.js`, `base.repository.js`

---

## 4. Every Controller

| Controller | Handlers |
|------------|----------|
| `controllers/orders/orders.controller.js` | `buyNow`, `listOrders`, `getOrder`, `cancelOrder`, `markDelivered` |
| `controllers/payments/payments.controller.js` | `listPayments`, `getPayment`, `syncPayment`, `cryptomusWebhook`, `listCryptomusServices`, `sandboxConfirm` |
| `controllers/escrow/escrow.controller.js` | `listEscrows`, `getEscrow`, `releaseEscrow` |
| `controllers/wallet/wallet.controller.js` | `getMyWallet`, `getSellerWallet`, `listMyTransactions`, `listLedger`, `adjustWallet` |
| `controllers/withdrawals/withdrawals.controller.js` | `createWithdrawal`, `listWithdrawals`, `getWithdrawal`, `approveWithdrawal`, `rejectWithdrawal`, `payWithdrawal`, `cancelWithdrawal` |
| `controllers/disputes/disputes.controller.js` | `openDispute`, `listDisputes`, `getDispute`, `addMessage`, `resolveDispute` |
| `controllers/refunds/refunds.controller.js` | `createRefund`, `listRefunds`, `getRefund` |

All handlers use `asyncHandler` + `sendSuccess` envelope. Zero business logic in controllers.

---

## 5. Every Middleware

| File | Exports | Purpose |
|------|---------|---------|
| `auth.middleware.js` | `authenticate`, `optionalAuthenticate`, `requireAuth` | JWT from Bearer or cookie; attaches `req.user` + permissions |
| `role.middleware.js` | `authorize`, `requireRole` | Role gate |
| `permission.middleware.js` | `requirePermission` | Permission OR-gate |
| `validate.middleware.js` | `validate`, `requireFields` | Zod body/query/params |
| `error.middleware.js` | `notFoundHandler`, `errorHandler` | Global errors, Zod, CastError, duplicate key |
| `rateLimit.middleware.js` | `globalRateLimiter`, `authRateLimiter` | express-rate-limit |
| `sanitize.middleware.js` | `sanitizeRequest` | express-mongo-sanitize |
| `requestId.middleware.js` | `requestIdMiddleware` | X-Request-Id |
| `upload.middleware.js` | `createUploadMiddleware`, `uploadSingleTemp` | Multer (no commerce upload routes exposed) |
| `async.middleware.js` | `asyncHandler` | Async error wrap |

App stack also applies: Helmet, CORS, compression, cookie-parser, Morgan, JSON body limit 1mb.

---

## 6. Every Cron Job

Jobs register in `src/jobs/index.js`. Schedules activate only when `ENABLE_JOBS=true`.

| Name | File | Schedule | Enabled | Behavior |
|------|------|----------|---------|----------|
| `escrow-auto-release` | `escrow.job.js` | `*/5 * * * *` | true | `processDueEscrowReleases({limit:100})` |
| `expire-orders` | `orders.job.js` | `*/5 * * * *` | true | `expireOrders({limit:100})` — expire unpaid, restock |
| `retry-failed-payments` | `payments.job.js` | `*/10 * * * *` | true | Sync in-flight payments from Cryptomus |
| `retry-failed-webhooks` | `payments.job.js` | `*/10 * * * *` | true | Reprocess failed WebhookEvent rows |
| `withdrawal-sla` | `withdrawal.job.js` | `0 * * * *` | true | Log overdue pending/approved withdrawals; **does not auto-pay** |
| `cleanup` | `cleanup.job.js` | `0 */6 * * *` | true | Delete processed webhooks + expired refresh tokens > 30d |
| `notification-dispatch` | `notification.job.js` | none | **false** | Noop scaffold (notifications out of Commerce Core scope) |

Each commerce job writes a `JobRun` document with processed/succeeded/failed counts.

---

## 7. Every Queue

`src/queues/index.js` — in-process `MemoryQueue` (EventEmitter-backed), swappable to BullMQ later.

| Queue | Handler today | Retry |
|-------|---------------|-------|
| `webhooks` | `logger.debug` | up to 3 attempts |
| `payments` | `logger.debug` | up to 3 attempts |
| `escrow` | `logger.debug` | up to 3 attempts |
| `notifications` | `logger.debug` | up to 3 attempts |

Exports: `initializeQueues()`, `getQueue(name)`, `enqueue(name, payload)`.

**Note:** Production commerce work is executed by cron jobs + synchronous webhook handling, not by these queue handlers. Queue layer is infrastructure ready; handlers are intentionally thin.

---

## 8. Every Webhook

### Inbound

| Endpoint | Handler | Security |
|----------|---------|----------|
| `POST /api/v1/payments/cryptomus/webhook` | `paymentService.handleCryptomusWebhook` | IP whitelist (optional), MD5 signature, expiry/replay, duplicate eventKey |

### Related non-webhook endpoints

| Endpoint | Purpose |
|----------|---------|
| `POST /api/v1/payments/cryptomus/sandbox/:uuid` | Dev/test confirm; **throws 403 in production** |
| `POST /api/v1/payments/:id/sync` | Pull status from Cryptomus `/payment/info` |
| Cryptomus `resendWebhook` API client | `cryptomusService.resendWebhook` available for ops |

Webhook persistence: `WebhookEvent` model stores full payload, signature, IP, attempts, status.

---

## 9. Cryptomus Implementation Details

**File:** `src/services/cryptomus.service.js` + `src/utils/crypto.js` + `src/constants/cryptomus.js`

| Concern | Implementation |
|---------|----------------|
| HTTP client | Native `fetch`, POST JSON |
| Auth headers | `merchant: CRYPTOMUS_MERCHANT_ID`, `sign: MD5(base64(body)+API_KEY)` |
| Base URL | `CRYPTOMUS_BASE_URL` default `https://api.cryptomus.com/v1` |
| Mode | `CRYPTOMUS_MODE` = `sandbox` \| `production` |
| Endpoints used | `/payment`, `/payment/info`, `/payment/services`, `/payment/resend`, `/test-webhook/payment` (constant defined) |
| Success statuses | `paid`, `paid_over` |
| Processing statuses | `process`, `confirm_check`, `check`, `wrong_amount_waiting`, `locked` |
| Failure statuses | `fail`, `cancel`, `system_fail`, `wrong_amount` |
| Invoice fields | amount, currency, order_id, lifetime, is_payment_multiple=false, url_callback, url_return, url_success, optional network/to_currency |
| Unconfigured behavior | Non-production: `simulateInvoice()`. Production: `503 CRYPTOMUS_NOT_CONFIGURED` |
| Only gateway | `Payment.gateway` enum locked to `cryptomus` |

---

## 10. Invoice Creation Flow

Implemented in `order.service.js → buyNow`:

1. Auth: buyer role required (or staff).
2. Load product; require `status=live`, `approvalStatus=approved`, not deleted.
3. Load seller; require `status=approved`; reject self-purchase.
4. Stock check for `stockType=limited`; atomic `$inc: -1` inside transaction.
5. Resolve commission via `commission.service` from MongoDB (default 10%).
6. Read `PlatformConfig.orderPaymentLifetimeSeconds` (default 3600).
7. Generate `orderNumber` (`ORD-YYYYMMDDHHMMSS-HEX`) and `cryptomusOrderId` (`pay_<sanitized>`).
8. **Mongo transaction:** create Order (`pending_payment`), Payment (`pending`), Escrow (`pending`); link refs; activity log `orders.buy_now`.
9. **Outside transaction:** call `createInvoiceOrSimulate` with callback URL `${APP_URL}${API_PREFIX}/payments/cryptomus/webhook`.
10. On invoice success: update Payment with `cryptomusUuid`, `invoiceUrl`, `rawInvoice`.
11. On invoice failure: cancel order, mark payment failed, throw.
12. Response includes `paymentUrl` for buyer redirect.

---

## 11. Webhook Verification Flow

`payment.service.js → handleCryptomusWebhook(payload, {ip})`:

1. `assertWebhookIpAllowed(ip)` — if `CRYPTOMUS_ENFORCE_IP_WHITELIST=true`, allow only `91.227.144.7`, `91.227.144.54`.
2. `verifyWebhookSignature(payload)` — see §12.
3. `assertWebhookNotExpired(payload)` — reject if `updated_at`/`status_date`/`created_at` older than 24h (`CRYPTOMUS_WEBHOOK_MAX_AGE_SECONDS`).
4. `eventKey = sha256(uuid|order_id|status|txid|sign)`.
5. Lookup `WebhookEvent` by `eventKey`:
   - if `processed` or `processing` → return duplicate (idempotent 200).
6. Create/update WebhookEvent status=`processing`.
7. Unique index on `eventKey` catches races (code 11000 → duplicate).
8. Transaction: find Payment by `uuid` or `order_id`; apply provider update; mark event `processed`.
9. On error: mark event `failed`, store `lastError`, rethrow.

---

## 12. Signature Verification

**Algorithm (Cryptomus official):**

```
sign = MD5( base64( JSON.stringify(bodyWithoutSign) ) + API_KEY )
```

**Code:** `src/utils/crypto.js`

- `signCryptomusPayload(payload, apiKey)` — used for outbound API requests.
- `verifyCryptomusSignature(payload, apiKey, providedSign)`:
  - strip `sign` from clone
  - recompute expected
  - compare with `crypto.timingSafeEqual` (length-checked)
- Webhook key source: `CRYPTOMUS_API_KEY` or fallback `CRYPTOMUS_WEBHOOK_SECRET`.
- Invalid signature → `401 CRYPTOMUS_INVALID_SIGNATURE`.

Unit test: `tests/unit/crypto.test.js` verifies deterministic sign + reject of forged sign.

---

## 13. Payment Confirmation Flow

`applyProviderPaymentUpdate`:

1. Reload Payment by id inside active session (prevents dirty in-memory state after txn fallback).
2. Map Cryptomus status → internal `PAYMENT_STATUS`.
3. If mapped = `paid`:
   - If already paid: repair-path ensures escrow lock / order=`escrow` if interrupted.
   - Else: set Payment `paid`, `paidAt`, `isFinal=true`.
   - Set Order `paid` then call `lockEscrowAfterPayment`.
   - Activity: `payments.paid`.
4. If processing/partial: Order → `payment_processing`.
5. If expired/cancelled/failed (and not already paid): update Payment accordingly.
6. Persist `providerStatus`, `txid`, payer fields, `rawLastWebhook`.

Sources: webhook, sync job, sandbox confirm (non-prod).

---

## 14. Escrow Flow

1. **Pending:** created at Buy Now with order amounts/commission snapshot.
2. **Locked** (`lockEscrowAfterPayment`):
   - status=`locked`, `lockedAt=now`
   - `releaseAt = now + PlatformConfig.escrowAutoReleaseHours` (default 24)
   - `wallet.recordBuyerPaymentIntoEscrow(amount)` — ledger + `pendingBalance += amount`
   - Order status=`escrow`, delivery=`awaiting_delivery`
   - Activity: `escrow.locked`
3. **Released** (`releaseEscrow`):
   - Blocked if `disputed` unless `force=true` (admin/dispute resolution)
   - `wallet.releaseEscrowToSeller(gross, commission, sellerNet)`
   - Escrow=`released`, Order=`completed`, delivery=`delivered` if needed
   - Activity: `escrow.released`
4. **Disputed / Refunded:** via dispute/refund services.

---

## 15. 24-Hour Auto Release Implementation

1. Config source: MongoDB `PlatformConfig.escrowAutoReleaseHours` (default 24). Env `ESCROW_AUTO_RELEASE_HOURS` is bootstrap default only.
2. On lock: `releaseAt = addHours(lockedAt, hours)`.
3. Job `escrow-auto-release` every 5 minutes when `ENABLE_JOBS=true`.
4. Candidate query: `status=locked`, `dispute=null`, `releaseAt<=now`, `releaseJobProcessedAt=null`.
5. Concurrency claim: `findOneAndUpdate` sets `releaseJobProcessedAt` before release.
6. Calls `releaseEscrow(id, {reason:'auto_release_24h'})`.
7. On failure: clears claim marker so next tick can retry.
8. If dispute exists: candidate query excludes it → **never auto-released**.

---

## 16. Seller Wallet Implementation

Balances (USD ledger currency):

| Field | Meaning |
|-------|---------|
| availableBalance | free funds |
| pendingBalance | in locked escrow |
| releasedBalance | lifetime escrow releases (net to seller) |
| reservedBalance | held by pending/approved withdrawals |
| withdrawableBalance | available − reserved (computed/stored) |
| totalWithdrawn | lifetime paid withdrawals |
| totalCommissionPaid | lifetime commission |

Mutations only through `wallet.service` + helpers in `wallet.helper.js`. Every mutation updates `version` and `lastTransactionAt`. Wallet auto-created per seller on first money event.

---

## 17. Double-Entry Ledger Implementation

`ledger.service.recordTransfer`:

- Requires ≥2 lines.
- Each line: direction, account, amount>0, entryType.
- Sum(debits) must equal Sum(credits) or throws `LEDGER_UNBALANCED`.
- All lines share one `transferId`.
- Entries are append-only (`updatedAt: false`).

### Transfer map

| Event | Debit | Credit |
|-------|-------|--------|
| Buyer payment | external_gateway | escrow |
| Allocate pending (memo) | escrow | seller_pending |
| Escrow release | seller_pending | commission_revenue + seller_available |
| Withdrawal reserve | seller_available | seller_withdrawal_reserve |
| Withdrawal pay | seller_withdrawal_reserve | external_gateway |
| Withdrawal release/reject | seller_withdrawal_reserve | seller_available |
| Escrow refund | seller_pending → refund_payable → external_gateway | (two balanced transfers) |
| Admin adjust credit | platform_adjustment | seller_available |
| Admin adjust debit | seller_available | platform_adjustment |

Integration test asserts every `transferId` balances.

---

## 18. Withdrawal Implementation

`withdrawal.service.requestWithdrawal`:

Validates:
- Seller approved
- Coin in `SUPPORTED_COINS`
- Network in `CRYPTOMUS_NETWORKS`
- Coin↔network via `COIN_NETWORK_MAP`
- Address regex via `NETWORK_ADDRESS_PATTERNS`
- Amount ≥ `PlatformConfig.minWithdrawalAmount` (10)
- Amount ≤ `PlatformConfig.maxWithdrawalAmount` (100000)
- Pending+approved count < 5
- Sufficient withdrawable balance

Then: reserve funds (ledger) + create Withdrawal `pending`.

**No Cryptomus payout API is called.** Admin supplies `payoutTxid`/`payoutReference` when marking paid.

---

## 19. Admin Approval Flow

| Step | Endpoint | Effect |
|------|----------|--------|
| Approve | `POST /withdrawals/:id/approve` | pending → approved; does not move crypto |
| Reject | `POST /withdrawals/:id/reject` | releases reserve to available; status rejected |
| Pay | `POST /withdrawals/:id/pay` | pending\|approved → paid; finalizeWithdrawalPayment ledger debit; stores payout evidence |
| Cancel | `POST /withdrawals/:id/cancel` | seller/admin; pending only; releases reserve |

Admin-only roles: `admin`, `super_admin` + `withdrawals:manage`.

---

## 20. Buyer Dispute Flow

1. Buyer `POST /disputes` with `orderId`, `reason`, `description`, optional `evidence[]`.
2. Order must be `paid|escrow|delivered`.
3. One dispute per order (unique index).
4. Escrow → `disputed`, linked dispute id; Order → `disputed`.
5. Auto-release blocked (query requires `dispute=null`).
6. Messages via `POST /disputes/:id/messages` (buyer/seller/admin).
7. Admin resolve (`POST /disputes/:id/resolve`):
   - `seller_wins` / `release` → force escrow release to seller
   - `buyer_wins` → full escrow refund
   - `partial_refund` → refund amount + release remainder to seller

---

## 21. Commission Calculation Flow

`commission.service.js`:

1. Load `CommissionConfig` from MongoDB (`key=default`). Never hardcodes 10% in business calc — reads `defaultPercent`.
2. Priority resolution:
   - seller+category rule (highest)
   - seller-only rule
   - category-only rule
   - `defaultPercent` (seeded 10)
3. `calculateCommission(amount, percent)` → `{commissionAmount, sellerAmount, percent}` with 2-decimal rounding.
4. Snapshot stored on Order and Escrow at purchase time (immutable for that order).
5. Applied at escrow release: seller gets `sellerAmount`, platform gets `commissionAmount`.

Admin can change rules via `PUT /config/commission`.

---

## 22. Refund Flow

### Escrow refund (dispute / admin while locked)

`refund.service.createEscrowRefund`:
- Debit seller pending via ledger refund path
- Create Refund record status=`completed`
- Full: escrow→refunded, order→refunded, payment→refunded
- Partial: reduce escrow remaining amounts; remainder can still release

### Manual / post-release

`createManualRefund`:
- If escrow still open: escrow refund path
- If escrow already released: debit seller available via `adminAdjustWallet`, create Refund type=`manual`

Admin API: `POST /refunds`, `GET /refunds`, `GET /refunds/:id`.

---

## 23. Transaction Flow (End-to-End Buy → Payout)

```
1. Buyer POST /orders/buy-now
2. DB txn: Order pending_payment + Payment pending + Escrow pending + stock--
3. Cryptomus invoice created → paymentUrl returned
4. Buyer pays on Cryptomus
5. Cryptomus webhook → verify → Payment paid → Escrow locked → Wallet.pending += gross
6. Optional: seller marks delivered
7a. After 24h, no dispute → cron releases → commission cut → Wallet.available += net
7b. OR dispute → freeze → admin resolve (release / refund / partial)
8. Seller POST /withdrawals → reserve
9. Admin approve → Admin pay (manual chain payout) → Wallet.totalWithdrawn += amount
```

All money movements produce balanced ledger transfers + ActivityLog entries.

---

## 24. Background Jobs

See §6. Activation: `ENABLE_JOBS=true`.

Observability: each run creates `JobRun` with counts and errors.  
`listJobs()` / `runJobByName(name)` available for ops.

---

## 25. MongoDB Transactions

`src/utils/transaction.js → withTransaction(work)`:

1. Probe whether replica-set transactions are supported (cached).
2. If supported: `startSession` → `startTransaction` → `work(session)` → commit; abort on error.
3. If unsupported (standalone MongoDB): run `work(null)` without session.
4. Used by: buyNow, cancel/expire orders, payment webhook apply, escrow lock/release, withdrawals, disputes, refunds, admin wallet adjust.

**Production requirement:** MongoDB replica set (or mongos) on Hostinger VPS for true multi-document atomicity. Standalone fallback is for local/dev only.

Atomic guards also used outside transactions:
- Product stock `findOneAndUpdate` with `stock >= 1`
- Escrow release claim `findOneAndUpdate` on `releaseJobProcessedAt`

---

## 26. Security Protections

| Control | Implementation |
|---------|----------------|
| JWT access/refresh | Signed secrets min 32 chars; refresh hashed in DB; rotation |
| Helmet | Enabled globally |
| Rate limit | Global + auth-specific |
| Validation | Zod on all commerce inputs |
| Sanitization | express-mongo-sanitize |
| Secure cookies | httpOnly refresh; SameSite/Secure configurable |
| Secrets | Env only; never in code |
| Cryptomus signature | MD5 + timingSafeEqual |
| Replay protection | Webhook max age 24h |
| Duplicate callbacks | Unique `WebhookEvent.eventKey` |
| IP allowlist | Optional Cryptomus webhook IPs |
| RBAC | Roles + fine-grained commerce permissions |
| Sandbox confirm | Disabled in production (`403`) |
| Self-purchase block | Buyer cannot buy own product |
| Withdrawal address validation | Per-network regex |
| Pending withdrawal cap | Max 5 open requests |
| No auto payout | Admin must mark paid |
| Activity audit | `logActivity` on mutations |

---

## 27. Database Indexes

Complete commerce index set (see §1 for per-model detail). Critical query indexes:

- Orders by buyer/seller + status/expiresAt (expiry job)
- Escrow `{status, releaseAt}` (auto-release job)
- Payment unique `cryptomusOrderId` / sparse unique `cryptomusUuid`
- WebhookEvent unique `eventKey`
- Withdrawal `{seller, status, createdAt}`
- Ledger `{transferId, direction, account}`, `{seller, createdAt}`
- Dispute unique `order`
- Wallet unique `seller` / `sellerUser`

---

## 28. Performance Optimizations

- Compound indexes aligned to list/filter/job queries
- Pagination via `parsePagination` (max 100)
- Lean queries on list endpoints
- Invoice HTTP call moved **outside** DB transaction (avoids long locks)
- Escrow release claim prevents double-processing under concurrent cron workers
- Stock decrement atomic conditional update
- Webhook dedup short-circuits already-processed events
- Job batch limits (50–100) per tick
- Cleanup job purges old webhook/token documents
- In-process queue ready for BullMQ swap without API changes
- Transaction support detection cached (no per-call probe after first)

---

## 29. Every Environment Variable Added / Extended

| Variable | Default | Purpose |
|----------|---------|---------|
| `CRYPTOMUS_MERCHANT_ID` | `''` | Merchant header |
| `CRYPTOMUS_API_KEY` | `''` | Request/webhook signing |
| `CRYPTOMUS_WEBHOOK_SECRET` | `''` | Fallback signing key |
| `CRYPTOMUS_BASE_URL` | `https://api.cryptomus.com/v1` | API root |
| `CRYPTOMUS_MODE` | `sandbox` | sandbox\|production |
| `CRYPTOMUS_URL_RETURN` | `''` | Pre-pay return URL |
| `CRYPTOMUS_URL_SUCCESS` | `''` | Success redirect |
| `CRYPTOMUS_ENFORCE_IP_WHITELIST` | `false` | Enforce Cryptomus IPs |
| `FRONTEND_URL` | `http://localhost:3000` | Redirect fallbacks |
| `ENABLE_JOBS` | `false` | Schedule cron jobs |
| `ESCROW_AUTO_RELEASE_HOURS` | `24` | Env bootstrap (runtime from MongoDB) |
| `WITHDRAWAL_ADMIN_SLA_HOURS` | `24` | Env bootstrap (runtime from MongoDB) |

Computed: `env.cryptomusConfigured = Boolean(MERCHANT_ID && API_KEY)`.

Documented in `.env.example`.

---

## 30. Production-Readiness Confirmation (Not Placeholders)

| Module | Production-ready? | Evidence |
|--------|-------------------|----------|
| **Orders** | **YES** | Full Buy Now service, statuses, stock, cancel/expire, APIs, tests |
| **Cryptomus** | **YES** | Real signed HTTP client, invoice/info/services/resend, webhook verify, status map; simulates only when credentials missing **and** not production |
| **Escrow** | **YES** | Lock/release/dispute/refund, 24h timer from MongoDB, cron claim+release, tests |
| **Wallet** | **YES** | All balances, reserve/release/finalize, admin adjust, APIs, tests |
| **Withdrawals** | **YES** | Full validation + manual admin lifecycle as required (no auto payout by design) |
| **Ledger** | **YES** | Balanced double-entry with unbalanced reject; tested per transferId |
| **Disputes** | **YES** | Open/freeze/resolve (seller/buyer/partial), messages, tests |
| **Refunds** | **YES** | Escrow full/partial + manual post-release paths, admin APIs |

### Intentionally out-of-scope / non-commerce scaffolds (not claimed as Commerce Core)

- `notification-dispatch` job = noop
- In-process queue handlers = debug-only (jobs perform real work)
- SMTP email transport not wired
- Domain `eventBus` emitters not hooked
- Digital product file/key fulfillment delivery after purchase (model exists; delivery fulfillment is a later phase)
- Seller registration fee charging when fee > 0 (fee readable; payment not charged — fee default 0)

### Stale comments (logic is implemented)

- `CommissionConfig.model.js` still says calculation deferred — **false**; `commission.service.js` implements it
- `SellerProfile` comment about withdrawal execution — correct that **automatic** payout is not implemented; **manual** withdrawal system is fully implemented

---

## Verification Command Results (re-run for this report)

### `npm install`

```
up to date, audited 222 packages in 345ms
found 0 vulnerabilities
```

### `npm run lint`

```
Syntax check passed: 169 files
```

Exit code: **0**

### `npm run build`

```
Syntax check passed: 169 files
```

Exit code: **0**

### `npm test`

```
# tests 33
# pass 33
# fail 0
# duration_ms 14966.791749
```

Exit code: **0**

All tests:
1. buyer register + login + me + logout — PASS  
2. seller registration is free using SystemConfig fee — PASS  
3. admin login requires admin role — PASS  
4. refresh token rotation works — PASS  
5. forgot + reset password flow — PASS  
6. email verification infrastructure — PASS  
7. config defaults are loaded from MongoDB — PASS  
8. category brand tag CRUD — PASS  
9. product foundation create + moderate — PASS  
10. RBAC blocks buyer from creating categories — PASS  
11. validation errors use standard envelope — PASS  
12. buy now creates order + simulated cryptomus invoice — PASS  
13. payment confirmation locks escrow and credits seller pending — PASS  
14. escrow release credits seller wallet minus commission — PASS  
15. withdrawal is manual: request → approve → pay — PASS  
16. dispute freezes escrow and blocks release — PASS  
17. cryptomus webhook signature verification rejects fakes — PASS  
18. api v1 lists commerce modules — PASS  
19–22. health / v1 / 404 — PASS  
23–24. crypto unit — PASS  
25–29. money/wallet unit — PASS  
30. password — PASS  
31–33. permissions — PASS  

### `npm audit`

```
found 0 vulnerabilities
```

Exit code: **0**

---

## Merge Status

**PR #4 is draft and awaiting your explicit approval.**  
No merge has been performed. No new phase has been started.
