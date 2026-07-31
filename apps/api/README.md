# ApnaStore API — v1.0 Release Candidate

Production **Node.js + Express + MongoDB** backend for the ApnaStore multi-vendor digital marketplace.

## Stack

| Layer | Technology |
|-------|------------|
| Runtime | Node.js 20+ |
| Framework | Express.js |
| ODM | Mongoose |
| Validation | Zod |
| Auth | JWT access + refresh, bcrypt, httpOnly cookies |
| Payments | Cryptomus only |
| Realtime | Socket.io |
| Email | Nodemailer (SMTP) |
| Logging | Winston + Morgan |
| Jobs | node-cron |
| Process manager | PM2 |
| Reverse proxy | Nginx |
| Target host | Hostinger VPS — Ubuntu |

## Quick start

```bash
cd apps/api
cp .env.example .env
# set MONGODB_URI, JWT_*, CREDENTIALS_ENCRYPTION_KEY
npm install
npm run seed
npm run dev
```

## API surface (`/api/v1`)

Auth · Users · Config · Catalog · Products · Orders · Payments · Escrow · Wallet · Withdrawals · Disputes · Refunds · Notifications · Admin

Health: `/health`, `/health/live`, `/health/ready`  
Socket: `/socket.io`

## Scripts

```bash
npm install
npm run lint
npm run build
npm test
npm audit
npm run seed
npm run dev
npm run pm2:start
```

## Documentation

See [`docs/`](./docs/) — Environment, Production Deployment, API, manuals, Release Notes, Deployment Checklist, Rollback Plan.
