# Scripts

- `seed.js` — ensures SystemConfig / PlatformConfig / CommissionConfig defaults and optional local admin user.

```bash
node src/scripts/seed.js
```

Environment:

- `SEED_ADMIN_EMAIL` (default `admin.apnastore@gmail.com`)
- `SEED_ADMIN_PASSWORD` (**required** when seeding admin — no hardcoded default)
- `SEED_ADMIN=true` to seed admin in production
