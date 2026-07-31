import {
  User,
  Product,
  Order,
  Payment,
  Escrow,
  Wallet,
  Withdrawal,
  Dispute,
  DisputeReplacement,
  DisputeChatMessage,
  Refund,
  SellerProfile,
} from '../models/index.js';
import { getDatabaseStatus } from '../config/database.js';
import { env } from '../config/env.js';
import { getQueue } from '../queues/index.js';
import { verifyEmailTransport } from '../emails/email.service.js';
import { getIO } from '../realtime/socket.server.js';

function startOfDaysAgo(days) {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - days);
  return d;
}

export async function getDashboardOverview() {
  const since30 = startOfDaysAgo(30);
  const since7 = startOfDaysAgo(7);

  const [
    usersTotal,
    buyers,
    sellers,
    productsTotal,
    productsPending,
    ordersTotal,
    ordersOpen,
    paymentsPaid,
    escrowHeld,
    withdrawalsPending,
    disputesOpen,
    replacementsPending,
    revenueAgg,
    recentOrders,
    revenueByDay,
  ] = await Promise.all([
    User.countDocuments({}),
    User.countDocuments({ roles: 'buyer' }),
    SellerProfile.countDocuments({}),
    Product.countDocuments({ deletedAt: null }),
    Product.countDocuments({ approvalStatus: 'pending', deletedAt: null }),
    Order.countDocuments({}),
    Order.countDocuments({ status: { $in: ['pending_payment', 'paid', 'escrow', 'disputed'] } }),
    Payment.countDocuments({ status: 'paid' }),
    Escrow.countDocuments({ status: 'locked' }),
    Withdrawal.countDocuments({ status: 'pending' }),
    Dispute.countDocuments({ status: { $in: ['open', 'under_review'] } }),
    DisputeReplacement.countDocuments({ status: 'pending' }),
    Payment.aggregate([
      { $match: { status: 'paid', paidAt: { $gte: since30 } } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]),
    Order.find({})
      .sort({ createdAt: -1 })
      .limit(8)
      .select('orderNumber status totalAmount currency createdAt buyer seller')
      .lean(),
    Payment.aggregate([
      { $match: { status: 'paid', paidAt: { $gte: since7 } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$paidAt' } },
          total: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]),
  ]);

  return {
    stats: {
      usersTotal,
      buyers,
      sellers,
      productsTotal,
      productsPending,
      ordersTotal,
      ordersOpen,
      paymentsPaid,
      escrowHeld,
      withdrawalsPending,
      disputesOpen,
      replacementsPending,
      revenue30d: revenueAgg[0]?.total || 0,
    },
    recentOrders,
    revenueByDay: revenueByDay.map((row) => ({
      day: row._id,
      total: row.total,
      count: row.count,
    })),
  };
}

export async function getAnalytics({ days = 30 } = {}) {
  const since = startOfDaysAgo(Number(days) || 30);

  const [ordersByStatus, paymentsByDay, topProducts, disputesByStatus, withdrawalsByStatus] =
    await Promise.all([
      Order.aggregate([
        { $match: { createdAt: { $gte: since } } },
        { $group: { _id: '$status', count: { $sum: 1 }, volume: { $sum: '$totalAmount' } } },
      ]),
      Payment.aggregate([
        { $match: { status: 'paid', paidAt: { $gte: since } } },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$paidAt' } },
            total: { $sum: '$amount' },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),
      Order.aggregate([
        { $match: { createdAt: { $gte: since }, status: { $in: ['paid', 'escrow', 'completed'] } } },
        {
          $group: {
            _id: '$product',
            count: { $sum: 1 },
            revenue: { $sum: '$totalAmount' },
            title: { $first: '$productSnapshot.title' },
          },
        },
        { $sort: { revenue: -1 } },
        { $limit: 10 },
      ]),
      Dispute.aggregate([
        { $match: { createdAt: { $gte: since } } },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
      Withdrawal.aggregate([
        { $match: { createdAt: { $gte: since } } },
        { $group: { _id: '$status', count: { $sum: 1 }, amount: { $sum: '$amount' } } },
      ]),
    ]);

  return {
    days: Number(days) || 30,
    ordersByStatus,
    paymentsByDay: paymentsByDay.map((r) => ({ day: r._id, total: r.total, count: r.count })),
    topProducts,
    disputesByStatus,
    withdrawalsByStatus,
  };
}

export async function getOcrReviewQueue({ page = 1, limit = 30 } = {}) {
  const skip = (Math.max(1, page) - 1) * Math.min(100, Math.max(1, limit));
  const take = Math.min(100, Math.max(1, limit));
  const messageFilter = {
    hasFlaggedAttachments: true,
    'attachments.flaggedForReview': true,
  };

  const [messages, messageTotal, replacements] = await Promise.all([
    DisputeChatMessage.find(messageFilter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(take)
      .populate('author', 'name email roles')
      .lean(),
    DisputeChatMessage.countDocuments(messageFilter),
    DisputeReplacement.find({ status: 'pending' })
      .sort({ updatedAt: -1 })
      .limit(50)
      .lean(),
  ]);

  const items = messages.flatMap((message) =>
    (message.attachments || [])
      .filter((attachment) => attachment.flaggedForReview)
      .map((attachment) => ({
        messageId: message._id,
        disputeId: message.dispute,
        orderId: message.order,
        author: message.author,
        createdAt: message.createdAt,
        attachment,
      })));

  return {
    items,
    replacements,
    meta: {
      page: Number(page) || 1,
      limit: take,
      total: messageTotal,
    },
  };
}

export async function getSystemHealthDetailed() {
  const db = getDatabaseStatus();
  const email = await verifyEmailTransport();
  const io = getIO();

  const queueSizes = {
    webhooks: getQueue('webhooks')?.size?.() ?? 0,
    payments: getQueue('payments')?.size?.() ?? 0,
    escrow: getQueue('escrow')?.size?.() ?? 0,
    notifications: getQueue('notifications')?.size?.() ?? 0,
  };

  const [walletCount, refundOpen, disputeOpen] = await Promise.all([
    Wallet.countDocuments({}),
    Refund.countDocuments({ status: { $in: ['pending', 'processing'] } }),
    Dispute.countDocuments({ status: { $nin: ['resolved', 'closed', 'cancelled'] } }),
  ]);

  return {
    status: db.isConnected ? 'ok' : 'degraded',
    service: env.APP_NAME,
    environment: env.NODE_ENV,
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
    database: {
      status: db.status,
      connected: db.isConnected,
      name: db.name,
    },
    email,
    socket: {
      enabled: Boolean(io),
      clients: io?.engine?.clientsCount ?? 0,
    },
    cryptomus: {
      configured: env.cryptomusConfigured,
      mode: env.CRYPTOMUS_MODE,
    },
    redis: {
      configured: Boolean(env.REDIS_URL),
      note: env.REDIS_URL
        ? 'REDIS_URL set — use for Socket.io adapter / BullMQ in scaled deploys'
        : 'Using in-process memory queues (single instance)',
    },
    queues: queueSizes,
    jobsEnabled: Boolean(env.ENABLE_JOBS),
    counts: {
      wallets: walletCount,
      refundsOpen: refundOpen,
      disputesOpen: disputeOpen,
    },
  };
}

export default {
  getDashboardOverview,
  getAnalytics,
  getOcrReviewQueue,
  getSystemHealthDetailed,
};
