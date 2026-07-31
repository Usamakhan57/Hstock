# Security — Dispute Chat

## Threat model

Attackers / opportunistic users may try to move buyers and sellers off HStock to avoid fees, run scams, or exchange wallet addresses. Dispute chat is a high-risk surface.

## Controls

1. **Private room** — only buyer, seller, assigned admin
2. **Content filter** — reject phones, socials, emails, URLs, wallets, obfuscation
3. **Non-persistence of blocked text** — blocked messages are never stored as chat messages
4. **Admin visibility** — blocked attempts retained with IP + rules
5. **Escalating enforcement** — warning → mute → admin notify
6. **Attachment allowlist** — no executables
7. **Rate limits** — IP + per-user per-chat
8. **Immutable audit trail** — send/edit/delete/block/assign events

## Operational notes

- Assign a moderator early via `POST /disputes/:id/chat/assign`
- Review `GET /disputes/violations?adminNotified=true` for repeat offenders
- Suspend accounts with existing `PATCH /users/:id` admin tools when warranted

See also: `docs/SECURE_DISPUTE_CHAT.md`.
