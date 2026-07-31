# Admin Manual — HStock v1.0

## Access

1. Sign in at `/admin/login` with an `admin` or `super_admin` account
2. Staff roles: Admin, Super Admin, Support, Editor (permission-scoped)

## Dashboard & analytics

- **Dashboard** — revenue, orders, users, pending products/withdrawals/disputes
- **Analytics** — payment volume, order status mix, top products
- **System Health** — DB, SMTP, Socket.io, queues, Cryptomus, jobs flag

## Marketplace ops

| Page | Actions |
|------|---------|
| Users / Customers / Sellers | Search, filter, suspend/activate, approve sellers |
| Products | Approve / reject / feature / hide / edit / delete |
| Orders | Search, filters, detail, timeline, escrow & refund status |
| Payments | List, sync Cryptomus status |
| Escrow | List, release when permitted |
| Wallets / Ledger | Inspect balances, admin adjustments |
| Withdrawals | Pending → Approve / Reject / Paid + history |
| Disputes | Review, evidence, chat, resolve, release/refund |
| Replacement Reviews | Pending replacement queue |
| OCR Review | Flagged evidence attachments |
| Settings | Platform, system, commission |

## CMS / blog

CMS, blog, coupons, media, and reviews UIs remain available for content operations. Commerce-critical catalog (products/categories/brands/collections) is API-backed.

## Security notes

- Never share JWT/Cryptomus/SMTP secrets
- Production requires Cryptomus IP whitelist + production mode
- Dispute credentials are encrypted at rest (AES-256-GCM)
