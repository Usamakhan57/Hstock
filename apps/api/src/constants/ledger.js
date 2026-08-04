/**
 * Double-entry ledger accounts and entry types.
 * Every financial action must produce balanced debit + credit entries.
 */

export const LEDGER_ACCOUNT = Object.freeze({
  EXTERNAL_GATEWAY: 'external_gateway',
  ESCROW: 'escrow',
  COMMISSION_REVENUE: 'commission_revenue',
  SELLER_AVAILABLE: 'seller_available',
  SELLER_PENDING: 'seller_pending',
  SELLER_WITHDRAWAL_RESERVE: 'seller_withdrawal_reserve',
  PLATFORM_ADJUSTMENT: 'platform_adjustment',
  REFUND_PAYABLE: 'refund_payable',
  BUYER_AVAILABLE: 'buyer_available',
  BUYER_PENDING: 'buyer_pending',
});

export const LEDGER_ACCOUNT_VALUES = Object.freeze(Object.values(LEDGER_ACCOUNT));

export const LEDGER_ENTRY_TYPE = Object.freeze({
  BUYER_PAYMENT: 'buyer_payment',
  ESCROW_CREDIT: 'escrow_credit',
  ESCROW_DEBIT: 'escrow_debit',
  COMMISSION_CREDIT: 'commission_credit',
  SELLER_WALLET_CREDIT: 'seller_wallet_credit',
  SELLER_PENDING_CREDIT: 'seller_pending_credit',
  SELLER_PENDING_DEBIT: 'seller_pending_debit',
  WITHDRAWAL_RESERVE: 'withdrawal_reserve',
  WITHDRAWAL_DEBIT: 'withdrawal_debit',
  WITHDRAWAL_RELEASE: 'withdrawal_release',
  REFUND_DEBIT: 'refund_debit',
  REFUND_CREDIT: 'refund_credit',
  ADMIN_ADJUSTMENT: 'admin_adjustment',
  BUYER_DEPOSIT: 'buyer_deposit',
  BUYER_TOPUP: 'buyer_topup',
  BUYER_SPEND: 'buyer_spend',
  BUYER_REFUND_CREDIT: 'buyer_refund_credit',
  BUYER_ADJUSTMENT: 'buyer_adjustment',
  BUYER_BONUS: 'buyer_bonus',
  /** Seller wallet debit for paid store promotion */
  PROMOTION_FEE: 'promotion_fee',
});

export const LEDGER_ENTRY_TYPE_VALUES = Object.freeze(Object.values(LEDGER_ENTRY_TYPE));

export const LEDGER_DIRECTION = Object.freeze({
  DEBIT: 'debit',
  CREDIT: 'credit',
});

export const LEDGER_DIRECTION_VALUES = Object.freeze(Object.values(LEDGER_DIRECTION));

export default {
  LEDGER_ACCOUNT,
  LEDGER_ACCOUNT_VALUES,
  LEDGER_ENTRY_TYPE,
  LEDGER_ENTRY_TYPE_VALUES,
  LEDGER_DIRECTION,
  LEDGER_DIRECTION_VALUES,
};
