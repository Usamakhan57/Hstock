# Services (Phase 2)

Domain services for Authentication, Users, Configuration, Catalog, and Products.

- `auth.service.js` — register/login/logout/refresh/password/email verification
- `user.service.js` — profile & admin user management
- `config.service.js` — SystemConfig / PlatformConfig / CommissionConfig (DB-backed defaults)
- `catalog.service.js` — categories, brands, collections, tags
- `product.service.js` — product foundation + digital metadata
- `activity.service.js` — activity logs

No payment, escrow, wallet, order, or Cryptomus business logic.
