/** Shared helpers for admin API modules — map backend shapes to mock-admin UI shapes. */

export function idOf(value) {
  if (!value) return null;
  if (typeof value === 'string') return value;
  return String(value._id || value.id || '');
}

export async function fetchAllPages(fetchPage, { limit = 100 } = {}) {
  let page = 1;
  const items = [];
  let hasMore = true;
  while (hasMore) {
    const result = await fetchPage({ page, limit });
    const batch = Array.isArray(result) ? result : (result?.items || result?.data || []);
    items.push(...batch);
    const meta = result?.meta;
    if (meta?.total != null) {
      hasMore = items.length < meta.total;
    } else {
      hasMore = batch.length >= limit;
    }
    page += 1;
    if (page > 50) break;
  }
  return items;
}

const ROLE_LABEL = {
  admin: 'Admin',
  super_admin: 'Super Admin',
  editor: 'Editor',
  support: 'Support',
  seller: 'Seller',
  buyer: 'Buyer',
};

export function mapAdminUser(user) {
  if (!user) return null;
  const roles = user.roles || [];
  const primaryRole = roles.find((r) => ['super_admin', 'admin', 'editor', 'support'].includes(r))
    || roles[0]
    || 'admin';
  return {
    id: idOf(user),
    name: user.name || '',
    email: user.email || '',
    role: ROLE_LABEL[primaryRole] || primaryRole,
    roles,
    status: user.status || 'active',
    lastLoginAt: user.lastLoginAt || null,
    phone: user.phone || '',
    createdAt: user.createdAt,
  };
}

export function mapCustomer(user, buyerProfile = null) {
  if (!user) return null;
  const metrics = buyerProfile?.metrics || {};
  return {
    id: idOf(user),
    name: user.name || '',
    email: user.email || '',
    phone: user.phone || buyerProfile?.phone || '',
    status: user.status === 'suspended' ? 'suspended' : 'active',
    totalOrders: metrics.ordersCount ?? buyerProfile?.totalOrders ?? 0,
    totalSpent: Number(metrics.totalSpent ?? buyerProfile?.totalSpent ?? 0),
    joinedAt: user.createdAt || buyerProfile?.createdAt || new Date().toISOString(),
  };
}

export function mapSellerFromProfile(seller, user = null) {
  if (!seller && !user) return null;
  const metrics = seller?.metrics || {};
  const status = seller?.status || 'pending';
  return {
    id: idOf(seller) || idOf(user),
    sellerProfileId: seller ? idOf(seller) : null,
    userId: idOf(user) || idOf(seller?.user),
    storeName: seller?.storeName || user?.name || 'Seller',
    ownerName: seller?.ownerName || user?.name || '',
    email: seller?.email || user?.email || '',
    phone: seller?.phone || user?.phone || '',
    status,
    verified: !!seller?.verified,
    specialty: seller?.specialty || '',
    bio: seller?.bio || '',
    productsCount: metrics.productsCount ?? 0,
    totalSales: Number(metrics.totalSales ?? 0),
    commissionRate: seller?.commissionRate ?? 15,
    joinedAt: seller?.joinedAt || seller?.createdAt || user?.createdAt || new Date().toISOString(),
  };
}

const ORDER_STATUS_MAP = {
  pending_payment: 'pending',
  payment_processing: 'processing',
  paid: 'processing',
  escrow: 'processing',
  delivered: 'shipped',
  completed: 'completed',
  disputed: 'processing',
  refunded: 'cancelled',
  cancelled: 'cancelled',
  expired: 'cancelled',
};

const PAYMENT_STATUS_MAP = {
  pending: 'unpaid',
  processing: 'unpaid',
  paid: 'paid',
  failed: 'unpaid',
  cancelled: 'unpaid',
  expired: 'unpaid',
  refunded: 'refunded',
};

export function mapAdminOrder(order) {
  if (!order) return null;
  const buyer = typeof order.buyer === 'object' && order.buyer ? order.buyer : null;
  const payment = typeof order.payment === 'object' && order.payment ? order.payment : null;
  const snap = order.productSnapshot || {};
  const product = typeof order.product === 'object' && order.product ? order.product : null;
  const orderNumber = order.orderNumber || idOf(order);
  const displayId = String(orderNumber).startsWith('ord-') ? orderNumber : `ord-${orderNumber}`;

  const item = {
    productId: idOf(product) || idOf(order.product),
    title: snap.title || product?.title || 'Product',
    price: Number(order.unitPrice ?? snap.price ?? order.totalAmount ?? 0),
    qty: order.quantity ?? 1,
    licenseName: snap.licenseType || 'Standard',
  };

  const escrow = typeof order.escrow === 'object' && order.escrow ? order.escrow : null;
  const timeline = [
    { key: 'created', label: 'Order Created', date: order.createdAt, done: true },
    { key: 'paid', label: 'Payment', date: order.paidAt || payment?.paidAt, done: !!(order.paidAt || payment?.status === 'paid') },
    { key: 'escrow', label: 'Escrow', date: order.escrowedAt || escrow?.lockedAt, done: !!(escrow || order.escrowedAt) },
    { key: 'delivered', label: 'Delivered', date: order.deliveredAt, done: !!order.deliveredAt || order.status === 'delivered' || order.status === 'completed' },
    { key: 'completed', label: 'Completed', date: order.completedAt || escrow?.releasedAt, done: order.status === 'completed' || escrow?.status === 'released' },
  ];

  return {
    id: displayId,
    _id: idOf(order),
    orderNumber,
    customerId: idOf(buyer) || idOf(order.buyer),
    customerName: buyer?.name || order.buyerName || 'Customer',
    email: buyer?.email || order.buyerEmail || '',
    items: [item],
    total: Number(order.totalAmount ?? order.subtotal ?? 0),
    status: ORDER_STATUS_MAP[order.status] || order.status || 'pending',
    backendStatus: order.status,
    paymentStatus: PAYMENT_STATUS_MAP[payment?.status] || (order.paidAt ? 'paid' : 'unpaid'),
    paymentMethod: payment?.provider || payment?.method || 'Crypto',
    escrowStatus: escrow?.status || null,
    escrowReleaseAt: escrow?.releaseAt || null,
    escrowId: idOf(escrow) || idOf(order.escrow),
    refundStatus: order.status === 'refunded' || payment?.status === 'refunded' ? 'refunded' : null,
    timeline,
    createdAt: order.createdAt || new Date().toISOString(),
    raw: order,
  };
}

export function mapAdminProduct(product) {
  if (!product) return null;
  const category = product.category;
  const images = Array.isArray(product.images) && product.images.length
    ? product.images.map((img) => (typeof img === 'string' ? img : img?.url)).filter(Boolean)
    : (Array.isArray(product.gallery) ? product.gallery : []);
  const thumbnail = product.thumbnail || images[0] || '';

  let status = product.status || 'draft';
  if (status === 'live') status = 'active';
  if (product.approvalStatus === 'pending') status = product.status === 'live' ? 'active' : (product.status || 'draft');

  return {
    id: idOf(product),
    title: product.title || '',
    slug: product.slug || '',
    sku: product.sku || '',
    categoryId: idOf(category) || idOf(product.category),
    collectionIds: product.collection ? [idOf(product.collection)] : [],
    brandId: idOf(product.brand),
    tags: Array.isArray(product.tags)
      ? product.tags.map((t) => (typeof t === 'string' ? t : t?.name)).filter(Boolean)
      : [],
    price: Number(product.price) || 0,
    salePrice: product.compareAtPrice != null ? Number(product.compareAtPrice) : null,
    stock: product.stock ?? 0,
    lowStockThreshold: product.lowStockThreshold ?? 5,
    status,
    approvalStatus: product.approvalStatus || null,
    featured: !!product.featured,
    thumbnail,
    createdAt: product.createdAt,
    raw: product,
  };
}

export function mapAdminPayment(payment) {
  if (!payment) return null;
  return {
    id: idOf(payment),
    orderId: idOf(payment.order),
    orderNumber: payment.orderNumber || null,
    amount: Number(payment.amount) || 0,
    currency: payment.currency || 'USD',
    status: payment.status || 'pending',
    paidAt: payment.paidAt || null,
    createdAt: payment.createdAt,
    invoiceUrl: payment.invoiceUrl || null,
  };
}

export function mapAdminEscrow(escrow) {
  if (!escrow) return null;
  const order = typeof escrow.order === 'object' && escrow.order ? escrow.order : null;
  return {
    id: idOf(escrow),
    orderId: idOf(order) || idOf(escrow.order),
    orderNumber: order?.orderNumber || escrow.orderNumber || null,
    amount: Number(escrow.amount) || 0,
    sellerAmount: Number(escrow.sellerAmount) || 0,
    status: escrow.status || 'locked',
    releaseAt: escrow.releaseAt || null,
    lockedAt: escrow.lockedAt || null,
    createdAt: escrow.createdAt || escrow.lockedAt,
  };
}

export function mapAdminWithdrawal(withdrawal) {
  if (!withdrawal) return null;
  const seller = typeof withdrawal.seller === 'object' && withdrawal.seller ? withdrawal.seller : null;
  return {
    id: idOf(withdrawal),
    requestNumber: withdrawal.requestNumber || idOf(withdrawal),
    sellerName: seller?.storeName || withdrawal.sellerName || 'Seller',
    amount: Number(withdrawal.amount) || 0,
    coin: withdrawal.coin || '',
    network: withdrawal.network || '',
    walletAddress: withdrawal.walletAddress || '',
    status: withdrawal.status || 'pending',
    createdAt: withdrawal.createdAt,
  };
}

export function mapAdminDispute(dispute) {
  if (!dispute) return null;
  const order = typeof dispute.order === 'object' && dispute.order ? dispute.order : null;
  const buyer = typeof dispute.buyer === 'object' && dispute.buyer ? dispute.buyer : null;
  return {
    id: idOf(dispute),
    disputeNumber: dispute.disputeNumber || idOf(dispute),
    orderId: idOf(order) || idOf(dispute.order),
    orderNumber: order?.orderNumber || dispute.orderNumber || null,
    reason: dispute.reason || '',
    status: dispute.status || 'open',
    buyerName: buyer?.name || dispute.buyerName || 'Buyer',
    productTitle: order?.productSnapshot?.title || order?.product?.title || 'Order',
    createdAt: dispute.createdAt,
    evidence: Array.isArray(dispute.evidence) ? dispute.evidence : [],
  };
}

export function mapAdminLedgerEntry(entry) {
  if (!entry) return null;
  const seller = typeof entry.seller === 'object' && entry.seller ? entry.seller : null;
  return {
    id: idOf(entry),
    sellerId: idOf(seller) || idOf(entry.seller),
    sellerName: seller?.storeName || entry.sellerName || '—',
    entryType: entry.entryType || entry.type || 'adjustment',
    direction: entry.direction || '',
    amount: Number(entry.amount) || 0,
    currency: entry.currency || 'USD',
    description: entry.description || entry.entryType || '',
    createdAt: entry.createdAt,
    orderId: idOf(entry.order),
  };
}
