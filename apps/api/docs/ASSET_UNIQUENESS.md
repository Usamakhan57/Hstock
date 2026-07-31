# Global Digital Asset Uniqueness

HStock is a digital marketplace. The same digital asset must never have two blocking listings at the same time, across all sellers and admins.

## Business rule

If Seller A lists `amankhan@gmail.com`, no other seller (or admin) may create another blocking listing for that same email.

The same rule applies to Instagram usernames, TikTok accounts, Telegram usernames, domains, websites, source-code identities, and any other digital asset identifier.

## Normalization

Before persistence and uniqueness checks, identifiers are normalized via `normalizeAssetIdentifier()`:

1. Trim whitespace
2. Collapse internal whitespace
3. Lowercase
4. Strip unnecessary trailing slashes
5. Platform-specific rules:
   - Email → lowercase local@domain
   - Domain → `domain:example.com`
   - Website / SaaS / URL → `url:host/path` (no www, no trailing slash)
   - Social usernames → `platform:handle` (strip `@` and profile URLs)

Examples:

| Input | Normalized |
|-------|------------|
| `AMANKHAN@gmail.com` | `amankhan@gmail.com` |
| `@CoolUser` (Instagram) | `instagram:cooluser` |
| `https://instagram.com/CoolUser/` | `instagram:cooluser` |
| `HTTPS://WWW.Example.com/` | `domain:example.com` |
| `https://shop.example.org/store/` | `url:shop.example.org/store` |

## Data model

### Product fields

- `assetIdentifier` — raw seller-provided value (optional for backward compatibility)
- `assetIdentifierNormalized` — canonical identity used for uniqueness + search
- `assetPlatform` — optional platform hint (`email`, `instagram`, `tiktok`, …)

### DigitalAssetClaim

Authoritative reservation row per normalized identifier:

- Unique index on `assetIdentifierNormalized`
- `status: claimed | released`
- Linked to `product` + optional `seller`

### Product partial unique index

MongoDB partial unique index on `assetIdentifierNormalized` where:

- `deletedAt` is null
- `status` is a blocking status

This is a second line of defense against race conditions.

## Blocking vs reusable statuses

Mapped onto existing `Product.status` values:

| Business meaning | Product status | Blocks duplicates? |
|------------------|----------------|--------------------|
| Draft / reserved early | `draft` | Yes |
| Pending review | `pending` | Yes |
| Active / published | `live` | Yes |
| Reserved / escrow / sold-not-completed | `out_of_stock` | Yes |
| Admin hold | `disabled` | Yes |
| Rejected | `rejected` | No (reusable) |
| Archived / cancelled / expired | `archived` | No (reusable) |
| Soft-deleted | `deletedAt` set | No (reusable) |

## API behavior

### Create / update / submit / moderate

When `assetIdentifier` is present:

1. Normalize
2. Assert no other claimed / blocking listing exists
3. Persist product fields
4. Upsert `DigitalAssetClaim` inside a MongoDB transaction (when supported)

Duplicate → **HTTP 409**

```json
{
  "success": false,
  "message": "This digital asset is already listed on HStock.",
  "code": "ASSET_ALREADY_LISTED"
}
```

Admin create/update uses the same path — admins cannot accidentally list a duplicate asset.

### Soft delete / reject / archive

Claim is released (`status: released`) so the identifier may be listed again.

### Search

- `GET /products?assetIdentifier=...` normalizes the query and matches `assetIdentifierNormalized`
- `GET /products?assetIdentifierNormalized=...` exact match
- `GET /products?search=...` uses normalized identity matching when the query looks like an email/URL/username

## Race conditions

Concurrency is handled by:

1. Pre-check (`assertAssetAvailable`)
2. Unique index on `DigitalAssetClaim.assetIdentifierNormalized`
3. Partial unique index on active `Product.assetIdentifierNormalized`
4. Transactions via `withTransaction()` when the MongoDB deployment supports them
5. Mapping duplicate-key errors (`E11000`) to HTTP 409 with the marketplace message

## Backward compatibility

- Existing create/update payloads without `assetIdentifier` continue to work
- No frontend changes required
- Existing product types remain valid; additional types (`email_accounts`, `instagram`, `tiktok`, `saas`, …) were added additively
