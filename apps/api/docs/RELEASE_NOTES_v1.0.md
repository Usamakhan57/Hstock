# HStock v1.0 — Release Candidate Notes

**Release:** v1.0-rc.1  
**Date:** 2026-07-31  
**Branch:** `cursor/release-candidate-v1`

## What's included

- Buyer / seller / admin authentication with JWT + refresh rotation
- Marketplace catalog, search, filters, product details
- Seller product CRUD + dashboard
- Buy Now purchase flow via Cryptomus only
- Orders, escrow (incl. partial), wallet, ledger, withdrawals
- Dispute center, secure chat, OCR evidence flags, replacements
- Admin marketplace ops dashboard
- In-app notifications + Socket.io realtime
- SMTP transactional email templates
- Hostinger VPS deployment assets (Nginx, PM2, SSL, backups)

## RC hardening in this cut

- SSRF protection for OCR image fetches
- Socket.io room authorization
- Payment seller IDOR fix
- Production env guards (Cryptomus, CORS, credentials key)
- Refresh-token reuse detection (revoke-all)
- Upload MIME allowlist
- Generic 5xx responses in production
- Mongo compound indexes on hot paths
- Admin catalog wired to API; catalog hydrate paging
- Admin route code-splitting + Vite manual chunks
- Nginx HTML no-cache + gzip_vary
- Backup/restore scripts + runbooks

## Breaking changes

None for existing Phase 6/7 API consumers.

**Ops note:** Production boot now **requires** `CREDENTIALS_ENCRYPTION_KEY`, Cryptomus production credentials, `CRYPTOMUS_ENFORCE_IP_WHITELIST=true`, and non-wildcard `CORS_ORIGINS`.

## Known issues

1. CMS/blog/coupons/reviews/media admin modules may still use local content stores (non-commerce).
2. Seller registration fee payment collection is unused while fee remains `0`.
3. Withdrawals are manually marked Paid (intentional — no automatic Cryptomus payout).
4. Access tokens remain in browser storage for SPA auth; mitigate with CSP + short access TTL. Prefer refresh via httpOnly cookie.
5. Redis adapter is optional and not required for single-instance PM2.

## Upgrade / deploy

Follow [`DEPLOYMENT_CHECKLIST.md`](./DEPLOYMENT_CHECKLIST.md). Rollback: [`ROLLBACK_PLAN.md`](./ROLLBACK_PLAN.md).
