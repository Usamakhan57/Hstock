import { Order } from '../models/index.js';
import { withSession } from './base.repository.js';

export async function createOrder(data, session = null) {
  const [doc] = await Order.create([data], withSession(session));
  return doc;
}

export async function findOrderById(id, { session = null, lean = false, populate = null } = {}) {
  let query = Order.findById(id);
  if (populate) query = query.populate(populate);
  if (session) query = query.session(session);
  if (lean) query = query.lean();
  return query;
}

export async function findOrderByNumber(orderNumber, { session = null, lean = false } = {}) {
  let query = Order.findOne({ orderNumber });
  if (session) query = query.session(session);
  if (lean) query = query.lean();
  return query;
}

export async function updateOrderById(id, update, session = null) {
  return Order.findByIdAndUpdate(id, update, { new: true, ...withSession(session) });
}

export async function listOrders(filter = {}, { skip = 0, limit = 20, sort = { createdAt: -1 }, populate = null } = {}) {
  let query = Order.find(filter).sort(sort).skip(skip).limit(limit);
  if (populate) query = query.populate(populate);
  const [items, total] = await Promise.all([
    query.lean(),
    Order.countDocuments(filter),
  ]);
  return { items, total };
}

export async function findExpiredPendingOrders(now = new Date(), limit = 100) {
  return Order.find({
    status: { $in: ['pending_payment', 'payment_processing'] },
    expiresAt: { $lte: now },
  })
    .limit(limit)
    .lean();
}

export default {
  createOrder,
  findOrderById,
  findOrderByNumber,
  updateOrderById,
  listOrders,
  findExpiredPendingOrders,
};
