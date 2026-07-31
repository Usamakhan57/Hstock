# HStock API — Folder Structure (Phase 2)

```
apps/api/
├── deploy/nginx/
├── docs/
│   ├── API.md
│   ├── ENVIRONMENT.md
│   ├── FOLDER_STRUCTURE.md
│   ├── PHASE1_DELIVERABLES.md
│   └── PHASE2_DELIVERABLES.md
├── logs/
├── uploads/
├── tests/
│   ├── helpers/
│   ├── integration/
│   └── unit/
├── src/
│   ├── config/                # Phase 1 foundation (env, DB, logger, CORS, JWT, cookies)
│   ├── constants/             # Roles, permissions, product types, coins/networks
│   ├── controllers/           # auth, users, config, catalog, products
│   ├── database/
│   ├── emails/                # Email infrastructure hooks
│   ├── events/                # Phase 1 scaffold (untouched logic)
│   ├── helpers/
│   ├── jobs/                  # Phase 1 scaffolds (no business logic)
│   ├── middlewares/           # Auth/RBAC implemented; security stack preserved
│   ├── models/                # Phase 2 Mongoose models
│   ├── queues/                # Phase 1 scaffold
│   ├── repositories/          # Reserved for deeper data-access split
│   ├── routes/                # /health + /api/v1/*
│   ├── scripts/               # seed.js
│   ├── services/              # Domain services
│   ├── templates/
│   ├── utils/                 # response envelope, password, token, slug
│   ├── validators/            # Reusable Zod validators
│   ├── app.js
│   └── server.js
├── .env.example
├── package.json
└── README.md
```

## Phase 1 remains the foundation

Unchanged in purpose:

- Express bootstrap + security middleware stack
- MongoDB connection layer
- Winston/Morgan logging
- Health endpoints
- Job / queue / event scaffolds (still no payment/escrow/wallet logic)
