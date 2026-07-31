# Secure Dispute Chat System

When a buyer opens a dispute, HStock automatically creates a **private dispute chat**.

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

## Attachments

Allowed: images (`jpg/jpeg/png/gif/webp`), `pdf`, `zip`, `txt`  
Rejected: executables and dangerous extensions (`exe`, `js`, `sh`, …)

## Rate limits

1. Express IP limiter on chat write routes (`disputeChatRateLimiter`)
2. Per-user per-chat limit: **10 messages / minute** (service-level)

## Audit

`DisputeChatAuditLog` records:

- chat created
- message sent / edited / deleted
- message blocked
- admin assigned
- warning / mute / admin notified
- attachment rejected

Blocked attempts (admin-visible) are stored in `DisputeChatBlockedAttempt` with:

user, order/dispute, time, original message, detected rules, IP, user agent.

## API

| Method | Path | Notes |
|--------|------|-------|
| GET | `/disputes/:id/chat` | Chat metadata |
| GET | `/disputes/:id/chat/messages` | List visible messages |
| POST | `/disputes/:id/chat/messages` | Send (filtered) |
| PATCH | `/disputes/:id/chat/messages/:messageId` | Edit (filtered) |
| DELETE | `/disputes/:id/chat/messages/:messageId` | Soft delete |
| POST | `/disputes/:id/chat/assign` | Assign admin moderator |
| GET | `/disputes/:id/chat/blocked-attempts` | Assigned admin / super admin |
| GET | `/disputes/:id/chat/audit` | Assigned admin / super admin |
| GET | `/disputes/violations` | Staff moderation list |
| POST | `/disputes/:id/messages` | Legacy path — same secure filter |

Opening a dispute auto-creates the chat and seeds a system notice + buyer opening statement.
