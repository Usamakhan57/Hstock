# HStock API — Folder Structure (Phase 1)

```
apps/api/
├── deploy/nginx/              # Nginx reverse-proxy template for Hostinger VPS
├── docs/                      # Backend documentation
├── logs/                      # Runtime logs (gitignored content)
│   ├── app/                   # Application logs
│   ├── error/                 # Error logs
│   └── http/                  # HTTP access logs
├── uploads/                   # Local upload storage
│   ├── avatars/
│   ├── documents/
│   ├── products/
│   └── temp/
├── tests/
│   ├── integration/
│   └── unit/
├── src/
│   ├── config/                # Env, DB, logger, CORS, JWT, cookies, uploads
│   ├── constants/             # Roles, statuses, currencies, enums
│   ├── controllers/           # Route handlers (health only in Phase 1)
│   ├── database/              # DB docs / re-exports
│   ├── emails/                # Email service scaffold
│   ├── events/                # In-process event bus scaffold
│   ├── helpers/               # Date / wallet helpers
│   ├── jobs/                  # Escrow, notification, cleanup, withdrawal scaffolds
│   ├── middlewares/           # Auth/role placeholders, errors, validation, upload, rate limit
│   ├── models/                # Reserved for Phase 2+ Mongoose models
│   ├── queues/                # Queue layer scaffold
│   ├── repositories/          # Reserved for Phase 2+ data access
│   ├── routes/                # /health + /api/v1
│   ├── scripts/               # Ops scripts (Phase 2+)
│   ├── services/              # Reserved for Phase 2+ domain services
│   ├── templates/             # Email/HTML templates (Phase 2+)
│   ├── utils/                 # AppError, asyncHandler, response, pagination, crypto placeholder
│   ├── validators/            # Zod validation schemas
│   ├── app.js                 # Express app
│   └── server.js              # HTTP bootstrap + graceful shutdown
├── .env.example
├── .gitignore
├── Dockerfile
├── docker-compose.yml
├── ecosystem.config.cjs       # PM2 process file
├── package.json
└── README.md
```

## Phase 1 boundaries

Implemented:

- Production-ready Express bootstrap
- MongoDB connection layer
- Security middleware stack
- Logging
- Health endpoints
- Job / email / upload / queue scaffolds

Not implemented (intentionally):

- Auth business logic
- Cryptomus payments
- Escrow release logic
- Seller wallet ledger
- Domain CRUD APIs
- Email templates
