# Models (Phase 2)

Mongoose domain models for Authentication, Users, RBAC, Platform Configuration, and Product Foundation.

## Auth & users

- `User.model.js`
- `BuyerProfile.model.js`
- `SellerProfile.model.js` (includes `withdrawalWallets` structure for future wallet phase)
- `AdminProfile.model.js`
- `ActivityLog.model.js`
- `RefreshToken.model.js`
- `PasswordResetToken.model.js`
- `EmailVerificationToken.model.js`

## Configuration (MongoDB-backed, never hardcoded)

- `SystemConfig.model.js` — `sellerRegistrationFee` (default `0`), `currency`, `isEnabled`
- `PlatformConfig.model.js` — `maintenanceMode` (default `false`), store identity, escrow/withdrawal hours
- `CommissionConfig.model.js` — `defaultPercent` (default `10`)

## Catalog & products

- `Category.model.js`
- `Brand.model.js`
- `Collection.model.js`
- `Tag.model.js`
- `Product.model.js`
- `ProductImage.model.js`
- `DigitalProduct.model.js`

## Explicitly not implemented

Order, Payment, Escrow, SellerWallet, Withdrawal, Cryptomus, Reviews, Disputes.
