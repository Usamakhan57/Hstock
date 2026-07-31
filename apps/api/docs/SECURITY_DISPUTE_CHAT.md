# Security — Dispute Chat

## Threat model

Attackers / opportunistic users may try to move buyers and sellers off ApnaStore to avoid fees, run scams, or exchange wallet addresses. Dispute chat is a high-risk surface.

## Controls

1. **Private room** — only buyer, seller, assigned admin, super admin
2. **Content filter (text only)** — reject phones, socials, emails, URLs, wallets, obfuscation in chat text
3. **Non-persistence of blocked text** — blocked text messages are never stored as chat messages (HTTP 400)
4. **Evidence screenshots** — always stored; OCR may flag for review but never auto-rejects account UI screenshots
5. **Admin visibility** — blocked text attempts retained with IP + rules; flagged OCR attachments with warning badge
6. **Escalating enforcement** — warning → mute → admin notify (text violations); admin may suspend
7. **Attachment allowlist** — images/PDF/ZIP/TXT only; no executables (file-type gate only)
8. **Rate limits** — IP + per-user per-chat
9. **Immutable audit trail** — send/edit/delete/block/assign/flag/review/reveal/replacement events
10. **Credential vault** — structured credentials encrypted (AES-256-GCM), masked in API lists, reveal audited; never logged in plaintext; TTL expiry clears ciphertext
11. **Partial escrow isolation** — only disputed funds held; prevents over-freezing / over-refunding

## Credential leak prevention

- Encrypted fields stripped from list/chat API responses
- `redactForLogs()` applied to timeline meta and activity metadata
- Reveal endpoints return secrets only to authorized participants
- Exceptions and debug output must never include decrypted credential payloads

## Operational notes

- Assign a moderator early via `POST /disputes/:id/chat/assign`
- Review `GET /disputes/violations?adminNotified=true` for repeat offenders
- Review `GET /disputes/:id/chat/flagged-attachments` for OCR hits
- Use `GET /disputes/:id/dashboard` for quantity/amount/OCR/violation overview
- Suspend accounts with existing `PATCH /users/:id` admin tools when warranted

See also: `docs/SECURE_DISPUTE_CHAT.md`, `docs/DISPUTE_SYSTEM.md`.
