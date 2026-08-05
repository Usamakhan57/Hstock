import {
  ORDER_STATUS_LABEL,
  PAYMENT_STATUS_LABEL,
  ESCROW_STATUS_LABEL,
  WITHDRAWAL_STATUS_LABEL,
  formatMoney,
} from '../../constants/commerce';

function idOf(value) {
  if (!value) return null;
  if (typeof value === 'string') return value;
  return value._id || value.id || null;
}

function snapshotProduct(order) {
  const snap = order.productSnapshot || {};
  const product = typeof order.product === 'object' && order.product ? order.product : null;
  const deliveryType = snap.deliveryType || product?.deliveryType || order.deliveryType || null;
  return {
    id: idOf(product) || idOf(order.product) || null,
    title: snap.title || product?.title || 'Product',
    img: snap.thumbnail || product?.thumbnail || product?.img || '',
    cat: snap.productType || product?.productType || '',
    artist: order.seller?.storeName || order.sellerName || 'Seller',
    sellerSlug: order.seller?.slug || null,
    quantity: order.quantity ?? 1,
    productType: snap.productType || product?.productType || 'digital',
    slug: snap.slug || product?.slug || null,
    deliveryType,
  };
}

const DELIVERY_STATUS_LABEL = Object.freeze({
  pending: 'Pending',
  awaiting_delivery: 'Awaiting Delivery',
  delivered: 'Delivered',
  failed: 'Failed',
});

export function mapBackendOrder(order) {
  if (!order) return null;
  const payment = typeof order.payment === 'object' && order.payment ? order.payment : null;
  const escrow = typeof order.escrow === 'object' && order.escrow ? order.escrow : null;
  const status = order.status || 'pending_payment';
  const paymentStatus = payment?.status || null;
  const escrowStatusRaw = escrow?.status || null;
  const product = snapshotProduct(order);
  const deliveryStatus = order.deliveryStatus || 'pending';
  const deliveryType = product.deliveryType || order.deliveryType || null;
  const paymentCompleted = Boolean(
    order.paidAt
    || paymentStatus === 'paid'
    || ['paid', 'escrow', 'delivered', 'completed', 'disputed'].includes(status),
  );
  const escrowCreated = Boolean(
    escrow
    || order.escrowedAt
    || ['escrow', 'delivered', 'completed', 'disputed'].includes(status),
  );
  const computedCanDeliver = Boolean(
    (deliveryType === 'manual' || deliveryType === 'handover')
    && paymentCompleted
    && escrowCreated
    && deliveryStatus !== 'delivered'
    && !['cancelled', 'expired', 'refunded', 'completed', 'delivered'].includes(status)
    && status !== 'disputed'
    && ['escrow', 'paid'].includes(status),
  );
  // Prefer backend canDeliver / availableActions.deliver when present.
  let canDeliver = computedCanDeliver;
  if (typeof order.canDeliver === 'boolean') {
    canDeliver = order.canDeliver;
  } else if (typeof order.availableActions?.deliver === 'boolean') {
    canDeliver = order.availableActions.deliver;
  }
  const availableActions = {
    ...(order.availableActions && typeof order.availableActions === 'object'
      ? order.availableActions
      : {}),
    deliver: canDeliver,
  };

  return {
    id: order.orderNumber || idOf(order),
    _id: idOf(order),
    orderNumber: order.orderNumber,
    date: order.createdAt || order.paidAt || null,
    createdAt: order.createdAt,
    paidAt: order.paidAt || payment?.paidAt || null,
    escrowedAt: order.escrowedAt || escrow?.lockedAt || null,
    completedAt: order.completedAt || escrow?.releasedAt || null,
    cancelledAt: order.cancelledAt || null,
    expiresAt: order.expiresAt || payment?.expiresAt || null,
    product,
    deliveryType,
    quantity: order.quantity ?? 1,
    unitPrice: formatMoney(order.unitPrice),
    subtotal: formatMoney(order.subtotal ?? order.totalAmount),
    commissionPercent: order.commissionPercent ?? 0,
    commissionAmount: formatMoney(order.commissionAmount),
    sellerAmount: formatMoney(order.sellerAmount),
    amount: formatMoney(order.totalAmount ?? order.subtotal),
    currency: order.currency || 'USD',
    status,
    statusLabel: ORDER_STATUS_LABEL[status] || status,
    paymentStatus,
    paymentStatusLabel: paymentStatus ? (PAYMENT_STATUS_LABEL[paymentStatus] || paymentStatus) : '—',
    escrowStatus: escrowStatusRaw,
    escrowStatusLabel: escrowStatusRaw ? (ESCROW_STATUS_LABEL[escrowStatusRaw] || escrowStatusRaw) : '—',
    deliveryStatus,
    deliveryStatusLabel: DELIVERY_STATUS_LABEL[deliveryStatus] || deliveryStatus,
    canDeliver,
    availableActions,
    disputeOpen: status === 'disputed' || !!order.dispute,
    disputeId: idOf(order.dispute) || null,
    accounts: Array.isArray(order.accounts)
      ? order.accounts.map((account) => ({
        id: idOf(account),
        _id: idOf(account),
        index: account.index ?? 0,
        identifier: account.identifier || null,
        label: account.label || account.identifier || null,
        status: account.status || 'active',
      }))
      : [],
    paymentId: idOf(payment) || idOf(order.payment),
    paymentUrl: payment?.invoiceUrl || null,
    escrowId: idOf(escrow) || idOf(order.escrow),
    escrowReleaseAt: escrow?.releaseAt || null,
    buyer: order.buyer,
    seller: order.seller,
    sellerUser: order.sellerUser,
    timeline: buildOrderTimeline(order, payment, escrow),
    raw: order,
  };
}

export function buildOrderTimeline(order, payment, escrow) {
  const steps = [
    {
      key: 'created',
      label: 'Order Created',
      done: true,
      date: order.createdAt || null,
    },
    {
      key: 'payment_started',
      label: 'Payment Started',
      done: !!payment || ['pending_payment', 'payment_processing', 'paid', 'escrow', 'delivered', 'completed', 'disputed', 'refunded'].includes(order.status),
      date: order.createdAt || null,
    },
    {
      key: 'payment_verified',
      label: 'Payment Verified',
      done: !!order.paidAt || payment?.status === 'paid' || ['paid', 'escrow', 'delivered', 'completed', 'disputed'].includes(order.status),
      date: order.paidAt || payment?.paidAt || null,
    },
    {
      key: 'escrow_created',
      label: 'Escrow Created',
      done: !!escrow || ['escrow', 'delivered', 'completed', 'disputed'].includes(order.status),
      date: order.escrowedAt || escrow?.lockedAt || null,
    },
    {
      key: 'delivered',
      label: 'Delivered',
      done: order.deliveryStatus === 'delivered' || !!order.deliveredAt || ['delivered', 'completed'].includes(order.status),
      date: order.deliveredAt || null,
    },
    {
      key: 'escrow_released',
      label: 'Escrow Released',
      done: escrow?.status === 'released' || order.status === 'completed',
      date: escrow?.releasedAt || order.completedAt || null,
    },
    {
      key: 'completed',
      label: 'Completed',
      done: order.status === 'completed',
      date: order.completedAt || null,
    },
  ];

  if (order.status === 'refunded' || escrow?.status === 'refunded') {
    steps.push({
      key: 'refund',
      label: 'Refund',
      done: true,
      date: order.updatedAt || null,
    });
  }
  if (order.status === 'disputed' || escrow?.status === 'disputed') {
    steps.push({
      key: 'dispute',
      label: 'Dispute',
      done: true,
      date: escrow?.disputedAt || order.updatedAt || null,
    });
  }
  if (order.status === 'cancelled' || order.status === 'expired') {
    steps.push({
      key: 'cancelled',
      label: order.status === 'expired' ? 'Expired' : 'Cancelled',
      done: true,
      date: order.cancelledAt || null,
    });
  }

  return steps;
}

export function mapBackendPayment(payment) {
  if (!payment) return null;
  return {
    id: idOf(payment),
    orderId: idOf(payment.order),
    orderNumber: payment.orderNumber,
    amount: formatMoney(payment.amount),
    currency: payment.currency || 'USD',
    toCurrency: payment.toCurrency,
    network: payment.network,
    status: payment.status,
    statusLabel: PAYMENT_STATUS_LABEL[payment.status] || payment.status,
    invoiceUrl: payment.invoiceUrl || null,
    paidAt: payment.paidAt || null,
    expiresAt: payment.expiresAt || null,
    failureReason: payment.failureReason || null,
    simulated: !!payment.metadata?.simulated,
    createdAt: payment.createdAt,
  };
}

export function mapBackendWallet(wallet) {
  if (!wallet) return null;
  return {
    id: idOf(wallet),
    currency: wallet.currency || 'USD',
    availableBalance: formatMoney(wallet.availableBalance),
    pendingBalance: formatMoney(wallet.pendingBalance),
    releasedBalance: formatMoney(wallet.releasedBalance),
    withdrawableBalance: formatMoney(wallet.withdrawableBalance),
    reservedBalance: formatMoney(wallet.reservedBalance),
    totalWithdrawn: formatMoney(wallet.totalWithdrawn),
    totalCommissionPaid: formatMoney(wallet.totalCommissionPaid),
    lastTransactionAt: wallet.lastTransactionAt || null,
    seller: wallet.seller || null,
  };
}

export function mapBackendLedgerEntry(entry) {
  if (!entry) return null;
  return {
    id: idOf(entry),
    transferId: entry.transferId,
    entryType: entry.entryType,
    direction: entry.direction,
    account: entry.account,
    amount: formatMoney(entry.amount),
    currency: entry.currency || 'USD',
    balanceAfter: entry.balanceAfter != null ? formatMoney(entry.balanceAfter) : null,
    description: entry.description || entry.entryType || 'Ledger entry',
    date: entry.createdAt,
    orderId: idOf(entry.order),
  };
}

export function mapBackendWithdrawal(withdrawal) {
  if (!withdrawal) return null;
  return {
    id: idOf(withdrawal),
    requestNumber: withdrawal.requestNumber,
    amount: formatMoney(withdrawal.amount),
    currency: withdrawal.currency || 'USD',
    coin: withdrawal.coin,
    network: withdrawal.network,
    walletAddress: withdrawal.walletAddress,
    status: withdrawal.status,
    statusLabel: WITHDRAWAL_STATUS_LABEL[withdrawal.status] || withdrawal.status,
    date: withdrawal.createdAt,
    paidAt: withdrawal.paidAt || null,
    rejectReason: withdrawal.rejectReason || withdrawal.rejectionReason || null,
  };
}

export function mapBackendEscrow(escrow) {
  if (!escrow) return null;
  const order = typeof escrow.order === 'object' && escrow.order ? escrow.order : null;
  return {
    id: idOf(escrow),
    orderId: idOf(order) || idOf(escrow.order),
    orderNumber: order?.orderNumber || null,
    amount: formatMoney(escrow.amount),
    sellerAmount: formatMoney(escrow.sellerAmount),
    commissionAmount: formatMoney(escrow.commissionAmount),
    status: escrow.status,
    statusLabel: ESCROW_STATUS_LABEL[escrow.status] || escrow.status,
    releaseAt: escrow.releaseAt || null,
    lockedAt: escrow.lockedAt || null,
    releasedAt: escrow.releasedAt || null,
    productTitle: order?.productSnapshot?.title || order?.product?.title || 'Order',
    date: escrow.createdAt || escrow.lockedAt,
  };
}

export default {
  mapBackendOrder,
  mapBackendPayment,
  mapBackendWallet,
  mapBackendLedgerEntry,
  mapBackendWithdrawal,
  mapBackendEscrow,
  buildOrderTimeline,
};
