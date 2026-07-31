import { Dispute } from '../models/index.js';
import { withSession } from './base.repository.js';

export async function createDispute(data, session = null) {
  const [doc] = await Dispute.create([data], withSession(session));
  return doc;
}

export async function findDisputeById(id, { session = null, lean = false } = {}) {
  let query = Dispute.findById(id);
  if (session) query = query.session(session);
  if (lean) query = query.lean();
  return query;
}

export async function findDisputeByOrder(orderId, { session = null, lean = false } = {}) {
  let query = Dispute.findOne({ order: orderId });
  if (session) query = query.session(session);
  if (lean) query = query.lean();
  return query;
}

export async function updateDisputeById(id, update, session = null) {
  return Dispute.findByIdAndUpdate(id, update, { new: true, ...withSession(session) });
}

export async function listDisputes(filter = {}, { skip = 0, limit = 20, sort = { createdAt: -1 } } = {}) {
  const [items, total] = await Promise.all([
    Dispute.find(filter).sort(sort).skip(skip).limit(limit).lean(),
    Dispute.countDocuments(filter),
  ]);
  return { items, total };
}

export default {
  createDispute,
  findDisputeById,
  findDisputeByOrder,
  updateDisputeById,
  listDisputes,
};
