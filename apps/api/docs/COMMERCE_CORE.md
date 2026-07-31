# Commerce Core

Production commerce layer for ApnaStore Marketplace (`apps/api` only).

## New MongoDB models

| Model | Purpose |
|-------|---------|
| `Order` | Buy Now — one order = one product |
| `Payment` | Cryptomus invoice + payment state |
| `Escrow` | Locked funds + 24h auto-release timer |
| `Wallet` | Seller internal balances |
| `LedgerEntry` | Immutable double-entry ledger lines |
| `Withdrawal` | Manual payout requests |
| `Dispute` | Buyer disputes that freeze escrow |
| `Refund` | Full / partial / manual / escrow refunds |
| `WebhookEvent` | Replay + duplicate callback protection |
| `JobRun` | Background job execution audit |

## REST API surface

### Buyer
- `POST /api/v1/orders/buy-now`
- `GET /api/v1/orders` / `GET /api/v1/orders/:id`
- `POST /api/v1/orders/:id/cancel`
- `GET /api/v1/payments` / `GET /api/v1/payments/:id`
- `POST /api/v1/disputes` (auto-creates secure dispute chat)
- `GET /api/v1/disputes` / `GET /api/v1/disputes/:id`
- `POST /api/v1/disputes/:id/messages` (secure content filter)
- `GET/POST /api/v1/disputes/:id/chat*` — see `docs/SECURE_DISPUTE_CHAT.md`

### Seller
- `GET /api/v1/orders?scope=seller`
- `POST /api/v1/orders/:id/deliver`
- `GET /api/v1/wallet/me`
- `GET /api/v1/wallet/me/transactions`
- `GET /api/v1/wallet/ledger`
- `POST /api/v1/withdrawals`
- `GET /api/v1/withdrawals` / `GET /api/v1/withdrawals/:id`
- `POST /api/v1/withdrawals/:id/cancel`
- `GET /api/v1/escrow`
- `GET /api/v1/disputes?scope=seller`

### Admin
- `GET /api/v1/orders` (all)
- `GET /api/v1/payments` (all)
- `GET /api/v1/escrow` / `POST /api/v1/escrow/:id/release`
- `POST /api/v1/withdrawals/:id/approve|reject|pay`
- `POST /api/v1/disputes/:id/resolve`
- `POST /api/v1/disputes/:id/chat/assign`
- `GET /api/v1/disputes/:id/chat/blocked-attempts`
- `GET /api/v1/disputes/:id/chat/audit`
- `GET /api/v1/disputes/violations`
- `POST /api/v1/refunds`
- `GET /api/v1/refunds` / `GET /api/v1/refunds/:id`
- `POST /api/v1/wallet/adjust`
- `GET /api/v1/wallet/seller/:sellerId`
- `GET /api/v1/wallet/ledger`
- `GET /api/v1/payments/cryptomus/services`

### Public / gateway
- `POST /api/v1/payments/cryptomus/webhook`
- `POST /api/v1/payments/cryptomus/sandbox/:uuid` (non-production)

## Payment flow

```
BUY NOW → Create Order + Payment → Cryptomus Invoice → Buyer Pays
→ Webhook (sign + replay + duplicate checks) → Payment Paid
→ Escrow Locked → Seller pendingBalance += amount
```

## Escrow flow

```
Payment confirmed → Escrow status=locked → releaseAt = now + PlatformConfig.escrowAutoReleaseHours (24)
→ Cron every 5m releases if no dispute
→ Commission (MongoDB %) deducted → Seller available/withdrawable credited
→ Order completed
```

## Withdrawal flow

```
Seller request (coin/network/address/amount validated)
→ Funds reserved from available
→ Admin approve (optional) → Admin mark paid (manual payout only)
→ OR Admin reject / Seller cancel → reserve released
```

## Ledger flow

Every financial action writes balanced debit+credit `LedgerEntry` rows sharing one `transferId`:
- Buyer payment → External Gateway / Escrow (+ seller pending allocation)
- Escrow release → Seller Pending → Commission Revenue + Seller Available
- Withdrawal reserve / pay / release
- Refunds and admin adjustments

## Dispute flow

```
Buyer opens dispute (optional disputedQuantity / disputedAccountIds)
→ Partial: hold only disputed $; undisputed follows normal release timer
→ Full: escrow status=disputed (auto-release blocked)
→ Secure dispute chat auto-created
→ Seller may send versioned replacement accounts
→ Buyer accept → release disputed hold + resolve + chat read-only
→ Buyer reject → dispute stays open
→ Admin resolves:
   seller_wins|release → release disputed hold to seller
   buyer_wins → refund disputed hold only (+ release undisputed)
   partial_refund → refund ≤ held disputed amount + release remainder
```

Details: `docs/DISPUTE_SYSTEM.md`, `docs/ESCROW_PARTIAL.md`, `docs/SECURE_DISPUTE_CHAT.md`.

## Background jobs (`ENABLE_JOBS=true`)

| Job | Schedule |
|-----|----------|
| `escrow-auto-release` | `*/5 * * * *` |
| `expire-orders` | `*/5 * * * *` |
| `retry-failed-payments` | `*/10 * * * *` |
| `retry-failed-webhooks` | `*/10 * * * *` |
| `withdrawal-sla` | `0 * * * *` |
| `cleanup` | `0 */6 * * *` |

## Business rules

- Seller registration fee default **0** (MongoDB `SystemConfig`)
- Commission default **10%** (MongoDB `CommissionConfig`) — never hardcoded in business logic
- Escrow auto-release **24h** if no dispute (`PlatformConfig.escrowAutoReleaseHours`)
- Withdrawals are **always manual** — no automatic Cryptomus payout
- Cryptomus is the **only** payment gateway
