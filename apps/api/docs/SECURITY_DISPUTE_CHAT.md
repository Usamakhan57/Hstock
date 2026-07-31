# Security — Dispute Chat

## Threat model

Attackers / opportunistic users may try to move buyers and sellers off HStock to avoid fees, run scams, or exchange wallet addresses. Dispute chat is a high-risk surface.

## Controls

1. **Private room** — only buyer, seller, assigned admin
2. **Content filter (text only)** — reject phones, socials, emails, URLs, wallets, obfuscation in chat text
3. **Non-persistence of blocked text** — blocked text messages are never stored as chat messages
4. **Evidence screenshots** — always stored; OCR may flag for review but never auto-rejects account UI screenshots
5. **Admin visibility** — blocked text attempts retained with IP + rules; flagged OCR attachments with warning badge
6. **Escalating enforcement** — warning → mute → admin notify (text violations)
7. **Attachment allowlist** — no executables (file-type gate only)
8. **Rate limits** — IP + per-user per-chat
9. **Immutable audit trail** — send/edit/delete/block/assign/flag/review events

## Operational notes

- Assign a moderator early via `POST /disputes/:id/chat/assign`
- Review `GET /disputes/violations?adminNotified=true` for repeat offenders
- Suspend accounts with existing `PATCH /users/:id` admin tools when warranted

See also: `docs/SECURE_DISPUTE_CHAT.md`.
