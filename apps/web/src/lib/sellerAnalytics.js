/**
 * Derive seller analytics from live orders + products (no dedicated analytics API yet).
 */

function dayKey(iso) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString().slice(0, 10);
}

function dayLabel(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
}

function orderAmount(order) {
  return Number(order.sellerAmount ?? order.amount ?? 0);
}

function isActiveSale(order) {
  return !['cancelled', 'expired'].includes(order.status);
}

function inLastDays(iso, days) {
  if (!iso) return false;
  const ts = new Date(iso).getTime();
  if (Number.isNaN(ts)) return false;
  const start = Date.now() - days * 24 * 60 * 60 * 1000;
  return ts >= start;
}

function isSameLocalDay(iso, ref = new Date()) {
  if (!iso) return false;
  const d = new Date(iso);
  return d.getFullYear() === ref.getFullYear()
    && d.getMonth() === ref.getMonth()
    && d.getDate() === ref.getDate();
}

export function buildSalesChart(orders = [], days = 14) {
  const map = new Map();
  const now = new Date();
  for (let i = days - 1; i >= 0; i -= 1) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    map.set(key, { day: dayLabel(d.toISOString()), sales: 0, orders: 0, key });
  }

  for (const order of orders) {
    if (!isActiveSale(order)) continue;
    const key = dayKey(order.date || order.createdAt || order.paidAt);
    if (!key || !map.has(key)) continue;
    const row = map.get(key);
    row.sales += orderAmount(order);
    row.orders += 1;
  }

  return [...map.values()].map(({ day, sales, orders: count }) => ({
    day,
    sales: Number(sales.toFixed(2)),
    orders: count,
  }));
}

export function buildBestSelling(orders = [], products = [], limit = 6) {
  const counts = new Map();
  for (const order of orders) {
    if (!isActiveSale(order)) continue;
    const id = order.product?.id || order.productId || order.product?.title;
    if (!id) continue;
    const prev = counts.get(id) || {
      id,
      title: order.product?.title || 'Product',
      img: order.product?.img || '',
      cat: order.product?.cat || '',
      sales: 0,
      revenue: 0,
      downloads: 0,
      stock: null,
      deliveryType: null,
      price: null,
    };
    prev.sales += Number(order.quantity || 1);
    prev.revenue += Number(order.amount || 0);
    prev.downloads += Number(order.quantity || 1);
    counts.set(id, prev);
  }

  if (counts.size === 0) {
    return products.slice(0, limit).map((p) => ({
      id: p.id,
      title: p.title,
      img: p.thumbnail || p.img || '',
      cat: p.category || '',
      sales: p.soldCount || 0,
      revenue: Number(p.metrics?.revenue || 0),
      downloads: p.downloads || p.soldCount || 0,
      stock: p.stock ?? 0,
      deliveryType: p.deliveryType || 'automatic',
      price: Number(p.price || 0),
    }));
  }

  const productById = new Map(products.map((p) => [String(p.id), p]));
  return [...counts.values()]
    .map((row) => {
      const product = productById.get(String(row.id));
      return {
        ...row,
        img: row.img || product?.thumbnail || '',
        stock: product?.stock ?? row.stock,
        deliveryType: product?.deliveryType || row.deliveryType,
        price: product ? Number(product.price || 0) : row.price,
        cat: row.cat || product?.category || '',
      };
    })
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, limit);
}

export function buildLowestStock(products = [], limit = 6) {
  return [...products]
    .filter((p) => p.stockType !== 'unlimited')
    .sort((a, b) => Number(a.stock || 0) - Number(b.stock || 0))
    .slice(0, limit)
    .map((p) => ({
      id: p.id,
      title: p.title,
      img: p.thumbnail || '',
      stock: Number(p.stock || 0),
      status: p.status,
      price: Number(p.price || 0),
      deliveryType: p.deliveryType || 'automatic',
    }));
}

export function buildMostViewed(products = [], limit = 6) {
  return [...products]
    .sort((a, b) => Number(b.metrics?.views || 0) - Number(a.metrics?.views || 0))
    .slice(0, limit)
    .map((p) => ({
      id: p.id,
      title: p.title,
      img: p.thumbnail || '',
      views: Number(p.metrics?.views || 0),
      revenue: Number(p.metrics?.revenue || 0),
      sold: Number(p.soldCount || 0),
      price: Number(p.price || 0),
    }));
}

export function buildTopCategories(orders = [], products = [], limit = 6) {
  const map = new Map();
  for (const order of orders) {
    if (!isActiveSale(order)) continue;
    const name = order.product?.cat || 'Other';
    map.set(name, (map.get(name) || 0) + 1);
  }
  if (map.size === 0) {
    for (const p of products) {
      const name = p.category || 'Other';
      map.set(name, (map.get(name) || 0) + 1);
    }
  }
  return [...map.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

export function buildDownloadsFromOrders(orders = []) {
  return orders
    .filter((o) => ['delivered', 'completed', 'escrow', 'disputed'].includes(o.status))
    .slice(0, 20)
    .map((o, i) => ({
      id: `${o.id || o._id}-dl-${i}`,
      product: o.product?.title || 'Product',
      productImg: o.product?.img || '',
      buyer: o.buyer?.email || o.buyer?.name || 'Buyer',
      downloadCount: Number(o.quantity || 1),
      lastDownload: o.completedAt || o.date || o.createdAt,
      license: 'Commercial',
    }));
}

export function buildActionRequired({
  products = [],
  orders = [],
  disputes = [],
  seller = null,
} = {}) {
  const actions = [];
  const outOfStock = products.filter((p) => (
    (p.status === 'live' || p.approvalStatus === 'approved')
    && p.stockType !== 'unlimited'
    && Number(p.stock || 0) <= 0
  ));
  if (outOfStock.length) {
    actions.push({
      id: 'out-of-stock',
      type: 'inventory',
      severity: 'high',
      title: `${outOfStock.length} product${outOfStock.length === 1 ? '' : 's'} approved but out of stock`,
      description: 'These listings are live but cannot fulfill new orders.',
      cta: 'Refill',
      to: '/seller/products?status=out_of_stock',
      count: outOfStock.length,
    });
  }

  const pendingApproval = products.filter((p) => p.status === 'pending' || p.approvalStatus === 'pending');
  if (pendingApproval.length) {
    actions.push({
      id: 'pending-approval',
      type: 'moderation',
      severity: 'medium',
      title: `${pendingApproval.length} product${pendingApproval.length === 1 ? '' : 's'} awaiting approval`,
      description: 'Listings submitted for review will appear here until moderated.',
      cta: 'Review',
      to: '/seller/products?status=pending',
      count: pendingApproval.length,
    });
  }

  const rejected = products.filter((p) => p.status === 'rejected' || p.approvalStatus === 'rejected');
  if (rejected.length) {
    actions.push({
      id: 'rejected',
      type: 'moderation',
      severity: 'high',
      title: `${rejected.length} rejected listing${rejected.length === 1 ? '' : 's'} need updates`,
      description: 'Fix the listing details and resubmit for approval.',
      cta: 'Fix',
      to: '/seller/products?status=rejected',
      count: rejected.length,
    });
  }

  const openDisputes = (disputes || []).filter((d) => !['resolved', 'closed', 'cancelled'].includes(String(d.status || '').toLowerCase()));
  if (openDisputes.length) {
    actions.push({
      id: 'disputes',
      type: 'dispute',
      severity: 'high',
      title: `${openDisputes.length} open dispute${openDisputes.length === 1 ? '' : 's'}`,
      description: 'Respond quickly to protect escrow release and seller rating.',
      cta: 'Open',
      to: '/seller/messages',
      count: openDisputes.length,
    });
  }

  const refundRequests = orders.filter((o) => (
    o.status === 'refunded'
    || o.refundRequested
    || o.refundStatus === 'requested'
    || o.refundStatus === 'pending'
  ));
  if (refundRequests.length) {
    actions.push({
      id: 'refunds',
      type: 'refund',
      severity: 'medium',
      title: `${refundRequests.length} refund request${refundRequests.length === 1 ? '' : 's'}`,
      description: 'Review refunded or refund-pending orders tied to your listings.',
      cta: 'Orders',
      to: '/seller/orders',
      count: refundRequests.length,
    });
  }

  const manualPending = orders.filter((o) => (
    o.canDeliver === true
    || o.availableActions?.deliver === true
    || (
      ['escrow', 'paid'].includes(o.status)
      && (o.product?.deliveryType === 'manual' || o.deliveryType === 'manual' || o.product?.deliveryType === 'handover')
      && o.deliveryStatus !== 'delivered'
    )
  ));
  if (manualPending.length) {
    actions.push({
      id: 'manual-delivery',
      type: 'delivery',
      severity: 'medium',
      title: `${manualPending.length} manual order${manualPending.length === 1 ? '' : 's'} need delivery`,
      description: 'Upload credentials or mark delivery for buyers waiting in escrow.',
      cta: 'Orders',
      to: '/seller/orders',
      count: manualPending.length,
    });
  }

  const telegramConnected = Boolean(
    seller?.telegramConnected
    || seller?.telegram?.connected
    || seller?.telegramChatId,
  );
  if (seller && !telegramConnected) {
    actions.push({
      id: 'telegram',
      type: 'telegram',
      severity: 'medium',
      title: 'Telegram disconnected',
      description: 'Connect Telegram to receive paid-order and dispute alerts instantly.',
      cta: 'Connect',
      to: '/seller/settings',
      count: 1,
    });
  }

  const missingInventory = products.filter((p) => (
    p.deliveryType === 'automatic'
    && (p.status === 'live' || p.status === 'draft' || p.status === 'pending')
    && Number(p.stock || 0) <= 0
  ));
  if (missingInventory.length && !outOfStock.length) {
    actions.push({
      id: 'missing-inventory',
      type: 'inventory',
      severity: 'medium',
      title: `${missingInventory.length} Instant Access product${missingInventory.length === 1 ? '' : 's'} missing inventory`,
      description: 'Upload account rows so automatic delivery can fulfill orders.',
      cta: 'Upload',
      to: '/seller/products',
      count: missingInventory.length,
    });
  }

  return actions;
}

export function summarizeSellerStats({
  orders = [],
  products = [],
  wallet = null,
  escrow = [],
  withdrawals = [],
  disputes = [],
} = {}) {
  const completed = orders.filter((o) => o.status === 'completed');
  const pending = orders.filter((o) => (
    ['pending_payment', 'payment_processing', 'paid', 'escrow', 'delivered'].includes(o.status)
  ));
  const disputed = orders.filter((o) => o.status === 'disputed' || o.disputeOpen);
  const refunded = orders.filter((o) => o.status === 'refunded');
  const revenue = completed.reduce((s, o) => s + orderAmount(o), 0);
  const grossSales = orders
    .filter(isActiveSale)
    .reduce((s, o) => s + Number(o.amount || 0), 0);
  const productsSold = orders
    .filter(isActiveSale)
    .reduce((s, o) => s + Number(o.quantity || 1), 0);

  const todaySales = orders
    .filter((o) => isActiveSale(o) && isSameLocalDay(o.date || o.createdAt || o.paidAt))
    .reduce((s, o) => s + orderAmount(o), 0);
  const weekSales = orders
    .filter((o) => isActiveSale(o) && inLastDays(o.date || o.createdAt || o.paidAt, 7))
    .reduce((s, o) => s + orderAmount(o), 0);
  const monthSales = orders
    .filter((o) => isActiveSale(o) && inLastDays(o.date || o.createdAt || o.paidAt, 30))
    .reduce((s, o) => s + orderAmount(o), 0);

  const refundedAmount = refunded.reduce((s, o) => s + Number(o.amount || 0), 0);
  const netProfit = Number((revenue - refundedAmount).toFixed(2));
  const avgOrderValue = completed.length
    ? Number((revenue / completed.length).toFixed(2))
    : 0;

  const buyerCounts = new Map();
  for (const order of orders.filter(isActiveSale)) {
    const key = order.buyer?.id || order.buyer?.email || order.buyer?.name;
    if (!key) continue;
    buyerCounts.set(key, (buyerCounts.get(key) || 0) + 1);
  }
  const repeatBuyers = [...buyerCounts.values()].filter((n) => n > 1).length;
  const uniqueBuyers = buyerCounts.size;
  const repeatRate = uniqueBuyers ? Math.round((repeatBuyers / uniqueBuyers) * 100) : 0;

  const liveProducts = products.filter((p) => p.status === 'live').length;
  const outOfStock = products.filter((p) => (
    p.stockType !== 'unlimited' && Number(p.stock || 0) <= 0
  )).length;
  const totalInventory = products.reduce((s, p) => (
    p.stockType === 'unlimited' ? s : s + Math.max(0, Number(p.stock || 0))
  ), 0);
  const disabled = products.filter((p) => p.status === 'disabled' || p.status === 'archived').length;
  const pendingProducts = products.filter((p) => p.status === 'pending').length;
  const rejectedProducts = products.filter((p) => p.status === 'rejected').length;
  const draftProducts = products.filter((p) => p.status === 'draft').length;

  const openDisputes = (disputes || []).filter((d) => (
    !['resolved', 'closed', 'cancelled'].includes(String(d.status || '').toLowerCase())
  )).length;

  return {
    activeListings: liveProducts,
    totalListings: products.length,
    liveProducts,
    draftProducts,
    disabledProducts: disabled,
    pendingProducts,
    rejectedProducts,
    outOfStock,
    totalInventory,
    ordersCount: orders.length,
    pendingOrders: pending.length,
    completedOrders: completed.length,
    disputedOrders: disputed.length,
    refundedOrders: refunded.length,
    openDisputes,
    revenue: Number(revenue.toFixed(2)),
    grossSales: Number(grossSales.toFixed(2)),
    netProfit,
    refundedAmount: Number(refundedAmount.toFixed(2)),
    productsSold,
    avgOrderValue,
    repeatBuyers,
    uniqueBuyers,
    repeatRate,
    todaySales: Number(todaySales.toFixed(2)),
    weekSales: Number(weekSales.toFixed(2)),
    monthSales: Number(monthSales.toFixed(2)),
    escrowBalance: Number(wallet?.pendingBalance ?? 0),
    releasedBalance: Number(wallet?.releasedBalance ?? wallet?.availableBalance ?? 0),
    availableBalance: Number(wallet?.availableBalance ?? wallet?.withdrawableBalance ?? 0),
    withdrawableBalance: Number(wallet?.withdrawableBalance ?? wallet?.availableBalance ?? 0),
    totalWithdrawn: Number(wallet?.totalWithdrawn ?? 0),
    pendingWithdrawals: withdrawals.filter((w) => w.status === 'pending' || w.status === 'approved').length,
    escrowHeld: escrow.filter((e) => e.status === 'locked' || e.status === 'disputed').length,
  };
}

export default {
  buildSalesChart,
  buildBestSelling,
  buildLowestStock,
  buildMostViewed,
  buildTopCategories,
  buildDownloadsFromOrders,
  buildActionRequired,
  summarizeSellerStats,
};
