# Global Digital Asset Uniqueness — Verification Report

## Summary

Implemented marketplace-wide digital asset uniqueness in `apps/api` so the same identifier (email, Instagram, domain, website, TikTok, Telegram, source code, etc.) cannot have two blocking listings concurrently.

## Changes

| Area | Change |
|------|--------|
| Normalization | `src/helpers/asset.helper.js` |
| Constants | `src/constants/assetUniqueness.js` + expanded product types |
| Schema | `Product.assetIdentifier`, `assetIdentifierNormalized`, `assetPlatform` |
| Claim model | `DigitalAssetClaim` with unique index on normalized id |
| Service | `assetUniqueness.service.js` + wired into product create/update/submit/moderate/delete |
| Validators | Optional `assetIdentifier` / `assetPlatform` + list filters |
| Search | Normalized identifier query params + smart `search` |
| Errors | HTTP 409 + `ASSET_ALREADY_LISTED` |
| Docs | `ASSET_UNIQUENESS.md`, `API.md`, deliverables/structure |
| Tests | Unit normalization + integration uniqueness suite |

## Duplicate response

```
HTTP 409
message: "This digital asset is already listed on ApnaStore."
code: ASSET_ALREADY_LISTED
```

## Blocking statuses

`draft`, `pending`, `live`, `out_of_stock`, `disabled` (and not soft-deleted)

Reusable: `rejected`, `archived`, soft-deleted (`deletedAt` set)

## Verification commands

```bash
npm install   # 0 vulnerabilities
npm run lint  # pass
npm run build # pass
npm test      # 36/36 pass
npm audit     # 0 vulnerabilities
```

## Test coverage

- Duplicate email / Instagram / domain / website / TikTok / Telegram / source code
- Admin blocked from duplicates
- Update validation
- Soft delete reuse
- Rejected listing reuse
- Normalized search
- Concurrent race (one 201, one 409)
- Normalization (case, spaces, URLs, usernames)
- Backward compatible create without `assetIdentifier`

## Compatibility

- No frontend changes
- Existing product APIs remain valid without `assetIdentifier`
- Additive product types only

## PR note

Do **not** merge until explicitly approved.
