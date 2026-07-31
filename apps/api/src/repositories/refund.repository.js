import { Refund } from '../models/index.js';
import { withSession } from './base.repository.js';

export async function createRefund(data, session = null) {
  const [doc] = await Refund.create([data], withSession(session));
  return doc;
}

export async function findRefundById(id, { session = null, lean = false } = {}) {
  let query = Refund.findById(id);
  if (session) query = query.session(session);
  if (lean) query = query.lean();
  return query;
}

export async function listRefunds(filter = {}, { skip = 0, limit = 20, sort = { createdAt: -1 } } = {}) {
  const [items, total] = await Promise.all([
    Refund.find(filter).sort(sort).skip(skip).limit(limit).lean(),
    Refund.countDocuments(filter),
  ]);
  return { items, total };
}

export async function updateRefundById(id, update, session = null) {
  return Refund.findByIdAndUpdate(id, update, { new: true, ...withSession(session) });
}

export default {
  createRefund,
  findRefundById,
  listRefunds,
  updateRefundById,
};
