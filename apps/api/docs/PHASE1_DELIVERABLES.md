# Phase 1 Deliverables

## Confirmed boundaries

- Frontend (`apps/web`) was **not** created or modified in this phase
- No Cryptomus / payment business logic
- No escrow release logic
- No seller wallet ledger logic
- No domain CRUD APIs beyond health/version stubs

## Created surface

### Runtime entry

- `server.js`
- `app.js` (re-export)
- `src/server.js`
- `src/app.js`

### Config

- `src/config/env.js` — Zod environment validation
- `src/config/database.js` — Mongoose connection
- `src/config/logger.js` — Winston (app/error/http)
- `src/config/cors.js`
- `src/config/jwt.js`
- `src/config/cookies.js`
- `src/config/uploads.js`
- `src/config/index.js`

### Security & middleware

- Helmet, CORS, compression, cookie-parser, Morgan, rate limiter
- `AppError`, async handler, 404 handler, global error handler
- Auth / role / upload middleware placeholders
- Validation middleware (Zod)

### Routes

- `GET /health`
- `GET /health/live`
- `GET /health/ready`
- `GET /api/v1` (stub only)

### Jobs (scaffold only)

- Escrow, Notification, Cleanup, Withdrawal

### Deploy

- `Dockerfile`
- `docker-compose.yml`
- `ecosystem.config.cjs` (PM2)
- `deploy/nginx/apnastore.conf`

### Docs

- `README.md`
- `docs/FOLDER_STRUCTURE.md`
- `docs/ENVIRONMENT.md`
- `docs/PHASE1_DELIVERABLES.md`
