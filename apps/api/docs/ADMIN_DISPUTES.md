# Admin — Dispute Moderation

## Dashboard

`GET /api/v1/disputes/:id/dashboard`

Shows:

- Order / disputed / resolved / replacement / refund / released / held / remaining quantities
- Held / released / refunded / undisputed amounts
- Replacement history (all versions)
- Violation count
- OCR flag count
- Full timeline

## OCR review

1. `GET /disputes/:id/chat/flagged-attachments`
2. `POST .../attachments/:attachmentId/review` with `cleared` or `confirmed_violation`

Screenshots are never auto-deleted.

## Violations

`GET /disputes/violations?adminNotified=true`

Escalation: warning → 30-minute mute → admin notify. Suspend via user admin APIs when needed.

## Resolution

`POST /disputes/:id/resolve`

| Resolution | Effect |
|------------|--------|
| `seller_wins` / `release` | Release disputed hold to seller |
| `buyer_wins` | Refund disputed hold only; undisputed already/then released to seller |
| `partial_refund` | Refund ≤ held disputed amount; remainder of hold to seller |

Chat becomes read-only after resolution.

## Replacements

Admins (super admin) may inspect all replacement versions via list/dashboard APIs. Seller sends; buyer accepts/rejects. Nothing is overwritten.
