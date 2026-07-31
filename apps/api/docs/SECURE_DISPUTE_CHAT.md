# Secure Dispute Chat System

When a buyer opens a dispute, ApnaStore automatically creates a **private dispute chat**.

## Access control

Only these participants may access the chat:

| Role | Access |
|------|--------|
| Buyer (order buyer) | Full participant |
| Seller (order seller user) | Full participant |
| Assigned Admin (moderator) | Full participant after `POST /disputes/:id/chat/assign` |
| Super Admin | Oversight access |

No other users (including unassigned admins) can read or write chat messages.

## Anti off-platform communication

Messages containing personal contact information or external communication channels are **rejected**, **not saved**, and return:

- **HTTP 400**
- `code`: `CONTACT_INFO_BLOCKED`
- `message`: `For your security, sharing personal contact information or external links is not allowed.`

Blocked categories include phones, WhatsApp/Telegram/Discord, social profiles, emails, URLs, wallets, referral/invite language, QR references, and obfuscated variants (`w h a t s a p p`, `tg:`, spoken digits, spaced emails, mixed Unicode).

Implementation: `src/helpers/contentFilter.helper.js`.

## Violations

Per-user counter (`DisputeChatViolation`):

| Count | Action |
|------:|--------|
| 1 | Warning |
| 2 | Temporary chat mute (30 minutes) |
| 3+ | Notify admin (`adminNotified=true` + activity log) |

Admins may suspend accounts via existing user management APIs.

## Attachments / evidence screenshots

Allowed: images (`jpg/jpeg/png/gif/webp`), `pdf`, `zip`, `txt`  
Rejected (file type only): executables and dangerous extensions (`exe`, `js`, `sh`, …)

**Screenshots are never auto-blocked.** ApnaStore sells digital accounts, so dispute evidence often contains account UI text such as:

- Login failed / wrong password
- Recovery email screens
- Instagram disabled
- Gmail security warning
- Facebook checkpoint
- Domain dashboard / cPanel / hosting panel

### OCR policy

1. Run OCR on uploaded/linked images
2. If OCR finds phones, emails, Telegram/WhatsApp, external URLs, or wallet addresses:
   - **Do not reject** the image
   - Store the image
   - Record OCR text + findings
   - Flag for admin review
   - Show a **warning badge** to moderators only
3. Only **text chat messages** are auto-blocked by the contact filter
4. Admins review flagged screenshots and mark `cleared` or `confirmed_violation`

Moderator endpoints:

- `GET /disputes/:id/chat/flagged-attachments`
- `POST /disputes/:id/chat/messages/:messageId/attachments/:attachmentId/review`

## Rate limits

1. Express IP limiter on chat write routes (`disputeChatRateLimiter`)
2. Per-user per-chat limit: **10 messages / minute** (service-level)

## Credential protection

Legitimate account credentials (username, email, password, OTP, recovery/backup/2FA codes, secret/license/API keys) must be shared via:

`POST /disputes/:id/chat/credentials`

- Encrypted at rest (AES-256-GCM)
- Masked in chat list responses
- Revealed only by buyer / seller / assigned admin / super admin
- Reveal actions audited
- Encrypted blobs expire after 30 days (`DISPUTE_CREDENTIAL_TTL_DAYS`); audits remain

Free-text messages that contain emails/phones/URLs are still blocked. Use the structured credentials endpoint for account data.

## Read-only mode

When a dispute is resolved/closed, chat status becomes `read_only`. Messages, edits, deletes, credentials, and replacements are rejected with `CHAT_READ_ONLY`.

## Audit

`DisputeChatAuditLog` records:

- chat created
- message sent / edited / deleted
- message blocked
- admin assigned
- warning / mute / admin notified
- attachment rejected / flagged / reviewed
- credential shared / revealed / expired
- replacement sent

Blocked attempts (admin-visible) are stored in `DisputeChatBlockedAttempt` with:

user, order/dispute, time, original message, detected rules, IP, user agent.

## API

| Method | Path | Notes |
|--------|------|-------|
| GET | `/disputes/:id/chat` | Chat metadata |
| GET | `/disputes/:id/chat/messages` | List visible messages (credentials masked) |
| POST | `/disputes/:id/chat/messages` | Send (filtered) |
| POST | `/disputes/:id/chat/credentials` | Share encrypted credentials |
| POST | `/disputes/:id/chat/messages/:messageId/reveal` | Reveal credentials (audited) |
| PATCH | `/disputes/:id/chat/messages/:messageId` | Edit (filtered) |
| DELETE | `/disputes/:id/chat/messages/:messageId` | Soft delete |
| POST | `/disputes/:id/chat/assign` | Assign admin moderator |
| GET | `/disputes/:id/chat/blocked-attempts` | Assigned admin / super admin |
| GET | `/disputes/:id/chat/audit` | Assigned admin / super admin |
| GET | `/disputes/violations` | Staff moderation list |
| POST | `/disputes/:id/messages` | Legacy path — same secure filter |

Opening a dispute auto-creates the chat and seeds a system notice + buyer opening statement.

Full marketplace dispute/escrow/replacement docs: `docs/DISPUTE_SYSTEM.md`.

