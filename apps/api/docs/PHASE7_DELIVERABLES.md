# Phase 7 Deliverables — Admin, Notifications & Production Launch

## Admin Dashboard

- Connected admin commerce modules to production APIs (users, buyers/customers, sellers, products moderation, orders, payments, escrow, wallets, withdrawals, disputes, replacements, OCR queue, analytics, config/commission, system health)
- New Marketplace Ops nav section (no redesign of existing CMS/catalog UI)

## Socket.io

- Production Socket.io server with JWT auth (`/socket.io`)
- Realtime events for notifications, orders, payments, escrow, withdrawals, disputes/chat, admin/seller/buyer dashboards
- Nginx WebSocket proxy configuration

## Email Notifications

- Nodemailer SMTP transport
- HTML templates for registration, verification, password reset, orders, payments, escrow, withdrawals, disputes
- Logged fallback when SMTP is unset

## In-App Notifications

- `Notification` model + REST APIs (list, unread count, mark read, mark all read, delete)
- Notification center wired in storefront + admin header
- Queue-backed email fan-out from domain events

## Deployment

- Hostinger VPS runbook (`docs/PRODUCTION_DEPLOYMENT.md`)
- Nginx (SSL, security headers, gzip, caching, Socket.io)
- PM2 ecosystem, deploy/backup scripts, logrotate
- Health checks + admin system health panel
- Optional `REDIS_URL` for scaled deploys

## Quality

- `npm install` / `lint` / `build` / `test` / `audit` green for `apps/api` and `apps/web`
- Tests use mongodb-memory-server
