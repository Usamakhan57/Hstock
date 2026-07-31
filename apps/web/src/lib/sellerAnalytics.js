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
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
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
    if (order.status === 'cancelled' || order.status === 'expired') continue;
    const key = dayKey(order.date || order.createdAt || order.paidAt);
    if (!key || !map.has(key)) continue;
    const row = map.get(key);
    row.sales += Number(order.amount || order.sellerAmount || 0);
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
    if (order.status === 'cancelled' || order.status === 'expired') continue;
    const id = order.product?.id || order.productId || order.product?.title;
    if (!id) continue;
    const prev = counts.get(id) || {
      id,
      title: order.product?.title || 'Product',
      img: order.product?.img || '',
      sales: 0,
      revenue: 0,
      downloads: 0,
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
      sales: p.soldCount || 0,
      revenue: Number(p.metrics?.revenue || 0),
      downloads: p.downloads || p.soldCount || 0,
    }));
  }

  return [...counts.values()]
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, limit);
}

export function buildTopCategories(orders = [], products = [], limit = 6) {
  const map = new Map();
  for (const order of orders) {
    if (order.status === 'cancelled' || order.status === 'expired') continue;
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

export function summarizeSellerStats({ orders = [], products = [], wallet = null, escrow = [], withdrawals = [] } = {}) {
  const completed = orders.filter((o) => o.status === 'completed');
  const pending = orders.filter((o) => ['pending_payment', 'payment_processing', 'paid', 'escrow', 'delivered'].includes(o.status));
  const disputed = orders.filter((o) => o.status === 'disputed' || o.disputeOpen);
  const revenue = completed.reduce((s, o) => s + Number(o.sellerAmount ?? o.amount ?? 0), 0);
  const productsSold = orders
    .filter((o) => !['cancelled', 'expired'].includes(o.status))
    .reduce((s, o) => s + Number(o.quantity || 1), 0);

  return {
    activeListings: products.filter((p) => p.status === 'live').length,
    totalListings: products.length,
    ordersCount: orders.length,
    pendingOrders: pending.length,
    completedOrders: completed.length,
    disputedOrders: disputed.length,
    revenue: Number(revenue.toFixed(2)),
    productsSold,
    escrowBalance: Number(wallet?.pendingBalance ?? 0),
    releasedBalance: Number(wallet?.releasedBalance ?? wallet?.availableBalance ?? 0),
    availableBalance: Number(wallet?.availableBalance ?? wallet?.withdrawableBalance ?? 0),
    pendingWithdrawals: withdrawals.filter((w) => w.status === 'pending' || w.status === 'approved').length,
    escrowHeld: escrow.filter((e) => e.status === 'locked' || e.status === 'disputed').length,
  };
}

export default {
  buildSalesChart,
  buildBestSelling,
  buildTopCategories,
  buildDownloadsFromOrders,
  summarizeSellerStats,
};
