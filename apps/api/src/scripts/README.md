# Scripts

- `seed.js` — ensures SystemConfig / PlatformConfig / CommissionConfig defaults and optional local admin user.

```bash
node src/scripts/seed.js
```

Environment:

- `SEED_ADMIN_EMAIL` (default `admin@hstock.store`)
- `SEED_ADMIN_PASSWORD` (default `Admin123!ChangeMe`)
- `SEED_ADMIN=true` to seed admin in production
