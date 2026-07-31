# Partial Escrow (Dispute Integration)

## Rules

1. Never freeze the entire order unless the whole order is disputed.
2. Only disputed quantity remains in escrow hold (`heldAmount` / `disputedAmount`).
3. Undisputed amount continues the normal auto-release timer (`releaseAt`).
4. Partial refunds refund only disputed held funds.

## Example

- 10 accounts × $10 = $100
- Buyer disputes 2 → hold **$20**, undisputed **$80**
- After `releaseAt`, $80 releases to seller (minus commission)
- Dispute resolution acts only on the remaining $20 hold

## Fields (`Escrow`)

| Field | Meaning |
|-------|---------|
| `partialDispute` | Partial hold active |
| `heldAmount` | Currently frozen disputed $ |
| `disputedAmount` | Disputed $ at open |
| `undisputedAmount` | Remainder eligible for normal release |
| `releasedAmount` | Cumulative released to seller |
| `refundedAmount` | Cumulative refunded to buyer |
| `undisputedReleasedAt` | When undisputed portion released |

## Service APIs

- `markEscrowDisputed(id, disputeId, session, { disputedAmount, isPartial })`
- `releaseUndisputedEscrowPortion(id, opts)`
- `releaseDisputedEscrowPortion(id, opts)` — also clears remaining undisputed
- `processDueEscrowReleases()` — full candidates + partial undisputed candidates
