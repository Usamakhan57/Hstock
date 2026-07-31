# Repositories

Commerce Core uses a thin repository layer under `src/repositories/` for Order, Payment, Escrow, Wallet, Ledger, Withdrawal, Dispute, Refund, and WebhookEvent persistence.

Services own business rules and call repositories for data access. Controllers never talk to repositories or models directly.
