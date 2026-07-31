# HStock Final Dispute System

Production dispute system for the digital-account marketplace: partial disputes, partial escrow, secure chat, credential protection, replacement accounts, OCR evidence review, timeline, and admin dashboard.

## Partial disputes

Orders may contain multiple accounts (`order.quantity` + `order.accounts[]`).

Buyer opens a dispute with either:

- `disputedQuantity` — e.g. dispute 2 of 10
- `disputedAccountIds` — exact account line items (sets quantity automatically)

Only the disputed quantity is held. Unaffected accounts continue the normal escrow path.

## Partial escrow

| Scenario | Escrow behavior |
|----------|-----------------|
| Full dispute | `status=disputed`, entire amount held |
| Partial dispute | `status=locked`, `partialDispute=true`, `heldAmount` = disputed $, `undisputedAmount` = remainder |

Undisputed funds auto-release after `releaseAt` via `releaseUndisputedEscrowPortion`.  
Disputed funds stay held until replacement accept, seller-wins, or admin refund.

## Replacement accounts

Seller-only action inside the dispute:

`POST /disputes/:id/replacements`

Each version includes one or many accounts with encrypted credentials:

- Account Identifier, Username, Email, Password
- Recovery Email / Phone (optional)
- OTP / recovery / backup / 2FA / secret / license / API keys
- Notes

Versions are never overwritten (`v1`, `v2`, `v3`…). Previous pending versions become `superseded` when a newer one is sent.

Buyer:

- `POST .../replacements/:replacementId/respond` with `accepted` or `rejected`
- Accept → disputed items resolved, disputed escrow released to seller, chat read-only
- Reject → dispute stays open; seller may send another version; admin may intervene

## Secure credentials in chat

Do **not** paste passwords/emails into free-text chat (contact filter blocks emails/phones/URLs).

Use structured API:

`POST /disputes/:id/chat/credentials`

Values are AES-256-GCM encrypted at rest, masked in list responses, and revealable only by buyer / seller / assigned admin / super admin (`POST .../messages/:messageId/reveal`). Reveals are audited.

Encrypted blobs expire after `DISPUTE_CREDENTIAL_TTL_DAYS` (default 30). Audit logs remain.

## Timeline events

`dispute_created`, `quantity_selected`, `chat_started`, `evidence_uploaded`, `ocr_flagged`, `replacement_sent`, `replacement_accepted`, `replacement_rejected`, `refund_approved`, `escrow_released`, `admin_decision`, `dispute_closed`, `credential_revealed`, `chat_read_only`

## Admin dashboard

`GET /disputes/:id/dashboard`

Returns order/disputed/resolved/replacement/refund/released/held/remaining quantities, amounts, OCR flags, violation count, replacement history, and timeline.

## Partial refunds

Admin `buyer_wins` / `partial_refund` refund **only** the disputed held amount. Undisputed funds are released to the seller — never refunded with the dispute.

## Auto-close

When dispute becomes `resolved` / `closed`:

- Chat → `read_only` (no further writes)
- Credentials scheduled to expire
- Audit + timeline retained

## API surface

| Method | Path | Who |
|--------|------|-----|
| POST | `/disputes` | Buyer — supports `disputedQuantity` / `disputedAccountIds` |
| GET | `/disputes/:id/dashboard` | Parties / admin |
| GET | `/disputes/:id/timeline` | Parties / admin |
| GET/POST | `/disputes/:id/replacements` | List / seller send |
| POST | `/disputes/:id/replacements/:id/respond` | Buyer accept/reject |
| POST | `/disputes/:id/replacements/:id/accounts/:accountId/reveal` | Parties |
| POST | `/disputes/:id/chat/credentials` | Parties |
| POST | `/disputes/:id/chat/messages/:messageId/reveal` | Parties |

See also: `SECURE_DISPUTE_CHAT.md`, `SECURITY_DISPUTE_CHAT.md`, `COMMERCE_CORE.md`, `API.md`.
