import { Escrow } from '../models/index.js';
import { ESCROW_STATUS } from '../constants/statuses.js';
import { withSession } from './base.repository.js';

export async function createEscrow(data, session = null) {
  const [doc] = await Escrow.create([data], withSession(session));
  return doc;
}

export async function findEscrowById(id, { session = null, lean = false } = {}) {
  let query = Escrow.findById(id);
  if (session) query = query.session(session);
  if (lean) query = query.lean();
  return query;
}

export async function findEscrowByOrder(orderId, { session = null, lean = false } = {}) {
  let query = Escrow.findOne({ order: orderId });
  if (session) query = query.session(session);
  if (lean) query = query.lean();
  return query;
}

export async function updateEscrowById(id, update, session = null) {
  return Escrow.findByIdAndUpdate(id, update, { new: true, ...withSession(session) });
}

export async function listEscrows(filter = {}, { skip = 0, limit = 20, sort = { createdAt: -1 } } = {}) {
  const [items, total] = await Promise.all([
    Escrow.find(filter).sort(sort).skip(skip).limit(limit).lean(),
    Escrow.countDocuments(filter),
  ]);
  return { items, total };
}

export async function findReleaseCandidates(now = new Date(), limit = 100) {
  return Escrow.find({
    status: ESCROW_STATUS.LOCKED,
    dispute: null,
    releaseAt: { $ne: null, $lte: now },
    releaseJobProcessedAt: null,
  })
    .sort({ releaseAt: 1 })
    .limit(limit);
}

export default {
  createEscrow,
  findEscrowById,
  findEscrowByOrder,
  updateEscrowById,
  listEscrows,
  findReleaseCandidates,
};
