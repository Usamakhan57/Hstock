import { z } from 'zod';
import { objectIdSchema, paginationSchema } from './common.validator.js';
import { SUPPORTED_COINS, CRYPTOMUS_NETWORKS } from '../constants/coins.js';
import {
  ORDER_STATUS_VALUES,
  PAYMENT_STATUS_VALUES,
  ESCROW_STATUS_VALUES,
  WITHDRAWAL_STATUS_VALUES,
  DISPUTE_STATUS_VALUES,
  DISPUTE_RESOLUTION_VALUES,
  REFUND_STATUS_VALUES,
} from '../constants/statuses.js';

export const buyNowSchema = {
  body: z.object({
    productId: objectIdSchema,
    quantity: z.number().int().min(1).max(500).optional(),
    /**
     * Product purchases are wallet-only.
     * Cryptomus is used solely for wallet deposits/top-ups.
     * Accepting legacy 'cryptomus' is rejected by the service.
     */
    paymentMethod: z.enum(['wallet']).optional().default('wallet'),
    toCurrency: z.string().trim().min(2).max(20).optional(),
    network: z.string().trim().min(2).max(30).optional(),
    urlReturn: z.string().url().optional(),
    urlSuccess: z.string().url().optional(),
    /** Client checkout attempt id — duplicate submits reuse the same invoice */
    idempotencyKey: z.string().trim().min(8).max(128).optional(),
  }),
};

export const buyerDepositSchema = {
  body: z.object({
    amount: z.number().positive(),
    toCurrency: z.string().trim().min(2).max(20).optional(),
    network: z.string().trim().min(2).max(30).optional(),
    urlReturn: z.string().url().optional(),
    urlSuccess: z.string().url().optional(),
    /**
     * When true (seller dashboard top-up), Cryptomus still uses the buyer
     * deposit pipeline; after payment the credited amount is moved into the
     * seller earnings Wallet used for promotions / withdrawable balance.
     */
    creditToSellerWallet: z.boolean().optional(),
  }),
};

export const buyerWalletAdjustSchema = {
  body: z.object({
    amount: z.number().positive(),
    direction: z.enum(['credit', 'debit']),
    reason: z.string().trim().min(3).max(1000),
    type: z.enum(['adjustment', 'bonus']).optional(),
  }),
};

export const orderIdSchema = {
  params: z.object({
    id: z.string().min(1),
  }),
};

export const listOrdersSchema = {
  query: paginationSchema.extend({
    status: z.enum(ORDER_STATUS_VALUES).optional(),
    scope: z.enum(['buyer', 'seller']).optional(),
    buyerId: objectIdSchema.optional(),
    sellerId: objectIdSchema.optional(),
    productId: objectIdSchema.optional(),
  }),
};

export const cancelOrderSchema = {
  params: z.object({ id: objectIdSchema }),
  body: z.object({
    reason: z.string().trim().min(1).max(2000).optional(),
  }).optional().default({}),
};

export const listPaymentsSchema = {
  query: paginationSchema.extend({
    status: z.enum(PAYMENT_STATUS_VALUES).optional(),
    orderId: objectIdSchema.optional(),
    buyerId: objectIdSchema.optional(),
    sellerId: objectIdSchema.optional(),
    scope: z.enum(['buyer', 'seller']).optional(),
  }),
};

export const paymentIdSchema = {
  params: z.object({ id: objectIdSchema }),
};

export const listEscrowsSchema = {
  query: paginationSchema.extend({
    status: z.enum(ESCROW_STATUS_VALUES).optional(),
    sellerId: objectIdSchema.optional(),
    buyerId: objectIdSchema.optional(),
  }),
};

export const escrowIdSchema = {
  params: z.object({ id: objectIdSchema }),
};

export const releaseEscrowSchema = {
  params: z.object({ id: objectIdSchema }),
  body: z.object({
    reason: z.string().trim().max(500).optional(),
  }).optional().default({}),
};

export const createWithdrawalSchema = {
  body: z.object({
    coin: z.enum(SUPPORTED_COINS),
    network: z.enum(CRYPTOMUS_NETWORKS),
    walletAddress: z.string().trim().min(10).max(256),
    amount: z.number().positive(),
  }),
};

export const listWithdrawalsSchema = {
  query: paginationSchema.extend({
    status: z.enum(WITHDRAWAL_STATUS_VALUES).optional(),
    sellerId: objectIdSchema.optional(),
  }),
};

export const withdrawalIdSchema = {
  params: z.object({ id: objectIdSchema }),
};

export const approveWithdrawalSchema = {
  params: z.object({ id: objectIdSchema }),
  body: z.object({
    note: z.string().trim().max(2000).optional(),
  }).optional().default({}),
};

export const rejectWithdrawalSchema = {
  params: z.object({ id: objectIdSchema }),
  body: z.object({
    reason: z.string().trim().min(1).max(2000),
  }),
};

export const payWithdrawalSchema = {
  params: z.object({ id: objectIdSchema }),
  body: z.object({
    payoutReference: z.string().trim().max(200).optional(),
    payoutTxid: z.string().trim().max(200).optional(),
    note: z.string().trim().max(2000).optional(),
  }).optional().default({}),
};

export const openDisputeSchema = {
  body: z.object({
    orderId: objectIdSchema,
    reason: z.string().trim().min(3).max(500),
    description: z.string().trim().min(10).max(10000),
    evidence: z.array(z.string().url()).max(20).optional(),
    disputedQuantity: z.number().int().min(1).max(500).optional(),
    disputedAccountIds: z.array(objectIdSchema).max(500).optional(),
  }),
};

const sensitiveCredentialsSchema = z.object({
  username: z.string().trim().max(200).optional(),
  email: z.string().trim().max(320).optional(),
  password: z.string().max(500).optional(),
  otp: z.string().trim().max(100).optional(),
  recoveryCode: z.string().trim().max(500).optional(),
  backupCode: z.string().trim().max(500).optional(),
  twoFactorRecoveryCode: z.string().trim().max(500).optional(),
  secretKey: z.string().trim().max(500).optional(),
  licenseKey: z.string().trim().max(500).optional(),
  apiKey: z.string().trim().max(500).optional(),
  recoveryEmail: z.string().trim().max(320).optional(),
  recoveryPhone: z.string().trim().max(40).optional(),
}).strict();

export const sendChatCredentialsSchema = {
  params: z.object({ id: objectIdSchema }),
  body: z.object({
    body: z.string().trim().min(1).max(5000).optional().default('Shared secure credentials'),
    credentials: sensitiveCredentialsSchema.refine(
      (obj) => Object.keys(obj).length > 0,
      { message: 'At least one credential field is required' },
    ),
  }),
};

export const revealCredentialsSchema = {
  params: z.object({
    id: objectIdSchema,
    messageId: objectIdSchema,
  }),
};

export const sendReplacementSchema = {
  params: z.object({ id: objectIdSchema }),
  body: z.object({
    notes: z.string().max(5000).optional(),
    /** Preferred: exact replacement text, stored as-is (no parsing). */
    credentialBlob: z.string().min(1).max(100000).optional(),
    /** Legacy structured accounts (still accepted). */
    accounts: z.array(z.object({
      accountIdentifier: z.string().trim().min(1).max(200),
      notes: z.string().trim().max(2000).optional(),
      username: z.string().trim().max(200).optional(),
      email: z.string().trim().max(320).optional(),
      password: z.string().max(500).optional(),
      recoveryEmail: z.string().trim().max(320).optional(),
      recoveryPhone: z.string().trim().max(40).optional(),
      otp: z.string().trim().max(100).optional(),
      recoveryCode: z.string().trim().max(500).optional(),
      backupCode: z.string().trim().max(500).optional(),
      twoFactorRecoveryCode: z.string().trim().max(500).optional(),
      secretKey: z.string().trim().max(500).optional(),
      licenseKey: z.string().trim().max(500).optional(),
      apiKey: z.string().trim().max(500).optional(),
    }).strict()).min(1).max(100).optional(),
  }).superRefine((value, ctx) => {
    const hasBlob = typeof value.credentialBlob === 'string' && value.credentialBlob.trim().length > 0;
    const hasAccounts = Array.isArray(value.accounts) && value.accounts.length > 0;
    if (!hasBlob && !hasAccounts) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Provide credentialBlob or accounts',
        path: ['credentialBlob'],
      });
    }
  }),
};

export const respondReplacementSchema = {
  params: z.object({
    id: objectIdSchema,
    replacementId: objectIdSchema,
  }),
  body: z.object({
    decision: z.enum(['accepted', 'rejected']),
    note: z.string().trim().max(5000).optional(),
  }),
};

export const revealReplacementCredentialsSchema = {
  params: z.object({
    id: objectIdSchema,
    replacementId: objectIdSchema,
    accountId: objectIdSchema,
  }),
};

export const listDisputesSchema = {
  query: paginationSchema.extend({
    status: z.enum(DISPUTE_STATUS_VALUES).optional(),
    scope: z.enum(['buyer', 'seller']).optional(),
    buyerId: objectIdSchema.optional(),
    sellerId: objectIdSchema.optional(),
  }),
};

export const disputeIdSchema = {
  params: z.object({ id: objectIdSchema }),
};

export const disputeMessageSchema = {
  params: z.object({ id: objectIdSchema }),
  body: z.object({
    body: z.string().trim().min(1).max(5000),
    attachments: z.array(z.string().url()).max(20).optional(),
  }),
};

export const disputeChatMessageIdSchema = {
  params: z.object({
    id: objectIdSchema,
    messageId: objectIdSchema,
  }),
};

export const editDisputeChatMessageSchema = {
  params: z.object({
    id: objectIdSchema,
    messageId: objectIdSchema,
  }),
  body: z.object({
    body: z.string().trim().min(1).max(5000),
  }),
};

export const listDisputeChatMessagesSchema = {
  params: z.object({ id: objectIdSchema }),
  query: paginationSchema,
};

export const listDisputeChatBlockedSchema = {
  params: z.object({ id: objectIdSchema }),
  query: paginationSchema,
};

export const listDisputeChatAuditSchema = {
  params: z.object({ id: objectIdSchema }),
  query: paginationSchema,
};

export const listDisputeChatViolationsSchema = {
  query: paginationSchema.extend({
    userId: objectIdSchema.optional(),
    adminNotified: z.enum(['true', 'false']).optional(),
  }),
};

export const listFlaggedAttachmentsSchema = {
  params: z.object({ id: objectIdSchema }),
  query: paginationSchema,
};

export const reviewFlaggedAttachmentSchema = {
  params: z.object({
    id: objectIdSchema,
    messageId: objectIdSchema,
    attachmentId: objectIdSchema,
  }),
  body: z.object({
    decision: z.enum(['cleared', 'confirmed_violation']),
    note: z.string().trim().max(2000).optional(),
  }),
};

export const resolveDisputeSchema = {
  params: z.object({ id: objectIdSchema }),
  body: z.object({
    resolution: z.enum(DISPUTE_RESOLUTION_VALUES),
    refundAmount: z.number().positive().optional(),
    note: z.string().trim().max(5000).optional(),
  }),
};

export const createRefundSchema = {
  body: z.object({
    orderId: objectIdSchema,
    amount: z.number().positive().optional(),
    type: z.enum(['full', 'partial', 'manual', 'escrow']).optional(),
    reason: z.string().trim().min(3).max(2000),
    adminNote: z.string().trim().max(2000).optional(),
  }),
};

export const listRefundsSchema = {
  query: paginationSchema.extend({
    status: z.enum(REFUND_STATUS_VALUES).optional(),
    orderId: objectIdSchema.optional(),
  }),
};

export const refundIdSchema = {
  params: z.object({ id: objectIdSchema }),
};

export const listLedgerSchema = {
  query: paginationSchema.extend({
    sellerId: objectIdSchema.optional(),
    buyerId: objectIdSchema.optional(),
    orderId: objectIdSchema.optional(),
    walletId: objectIdSchema.optional(),
    transferId: z.string().optional(),
  }),
};

export const adjustWalletSchema = {
  body: z.object({
    sellerId: objectIdSchema,
    amount: z.number().positive(),
    direction: z.enum(['credit', 'debit']),
    reason: z.string().trim().min(3).max(1000),
  }),
};

export const deliverOrderSchema = {
  params: z.object({ id: objectIdSchema }),
};

export default {
  buyNowSchema,
  buyerDepositSchema,
  buyerWalletAdjustSchema,
  orderIdSchema,
  listOrdersSchema,
  cancelOrderSchema,
  listPaymentsSchema,
  paymentIdSchema,
  listEscrowsSchema,
  escrowIdSchema,
  releaseEscrowSchema,
  createWithdrawalSchema,
  listWithdrawalsSchema,
  withdrawalIdSchema,
  approveWithdrawalSchema,
  rejectWithdrawalSchema,
  payWithdrawalSchema,
  openDisputeSchema,
  listDisputesSchema,
  disputeIdSchema,
  disputeMessageSchema,
  disputeChatMessageIdSchema,
  editDisputeChatMessageSchema,
  listDisputeChatMessagesSchema,
  listDisputeChatBlockedSchema,
  listDisputeChatAuditSchema,
  listDisputeChatViolationsSchema,
  listFlaggedAttachmentsSchema,
  reviewFlaggedAttachmentSchema,
  sendChatCredentialsSchema,
  revealCredentialsSchema,
  sendReplacementSchema,
  respondReplacementSchema,
  revealReplacementCredentialsSchema,
  resolveDisputeSchema,
  createRefundSchema,
  listRefundsSchema,
  refundIdSchema,
  listLedgerSchema,
  adjustWalletSchema,
  deliverOrderSchema,
};
