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
    toCurrency: z.string().trim().min(2).max(20).optional(),
    network: z.string().trim().min(2).max(30).optional(),
    urlReturn: z.string().url().optional(),
    urlSuccess: z.string().url().optional(),
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
  resolveDisputeSchema,
  createRefundSchema,
  listRefundsSchema,
  refundIdSchema,
  listLedgerSchema,
  adjustWalletSchema,
  deliverOrderSchema,
};
