import { Payment } from '../models/index.js';
import { withSession } from './base.repository.js';

export async function createPayment(data, session = null) {
  const [doc] = await Payment.create([data], withSession(session));
  return doc;
}

export async function findPaymentById(id, { session = null, lean = false } = {}) {
  let query = Payment.findById(id);
  if (session) query = query.session(session);
  if (lean) query = query.lean();
  return query;
}

export async function findPaymentByOrder(orderId, { session = null, lean = false } = {}) {
  let query = Payment.findOne({ order: orderId });
  if (session) query = query.session(session);
  if (lean) query = query.lean();
  return query;
}

export async function findPaymentByCryptomusOrderId(cryptomusOrderId, { session = null, lean = false } = {}) {
  let query = Payment.findOne({ cryptomusOrderId });
  if (session) query = query.session(session);
  if (lean) query = query.lean();
  return query;
}

export async function findPaymentByCryptomusUuid(uuid, { session = null, lean = false } = {}) {
  let query = Payment.findOne({ cryptomusUuid: uuid });
  if (session) query = query.session(session);
  if (lean) query = query.lean();
  return query;
}

export async function updatePaymentById(id, update, session = null) {
  return Payment.findByIdAndUpdate(id, update, { new: true, ...withSession(session) });
}

export async function listPayments(filter = {}, { skip = 0, limit = 20, sort = { createdAt: -1 } } = {}) {
  const [items, total] = await Promise.all([
    Payment.find(filter).sort(sort).skip(skip).limit(limit).lean(),
    Payment.countDocuments(filter),
  ]);
  return { items, total };
}

export async function findPaymentsNeedingSync(limit = 50) {
  return Payment.find({
    status: { $in: ['pending', 'processing', 'partial'] },
    cryptomusUuid: { $type: 'string', $ne: '' },
  })
    .sort({ lastSyncedAt: 1, createdAt: 1 })
    .limit(limit);
}

export default {
  createPayment,
  findPaymentById,
  findPaymentByOrder,
  findPaymentByCryptomusOrderId,
  findPaymentByCryptomusUuid,
  updatePaymentById,
  listPayments,
  findPaymentsNeedingSync,
};
