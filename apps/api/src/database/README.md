# Database

MongoDB is configured via Mongoose in `src/config/database.js`.

- Connection URI comes from `MONGODB_URI` in `.env`
- Database name from `MONGODB_DB_NAME`
- Production target: self-hosted MongoDB on the Hostinger Ubuntu VPS (localhost-bound)

Mongoose models will be added under `src/models/` in Phase 2+.
Phase 1 ships no domain schemas.
