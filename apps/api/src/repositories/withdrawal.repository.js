import { Withdrawal } from '../models/index.js';
import { WITHDRAWAL_STATUS } from '../constants/statuses.js';
import { withSession } from './base.repository.js';

export async function createWithdrawal(data, session = null) {
  const [doc] = await Withdrawal.create([data], withSession(session));
  return doc;
}

export async function findWithdrawalById(id, { session = null, lean = false } = {}) {
  let query = Withdrawal.findById(id);
  if (session) query = query.session(session);
  if (lean) query = query.lean();
  return query;
}

export async function updateWithdrawalById(id, update, session = null) {
  return Withdrawal.findByIdAndUpdate(id, update, { new: true, ...withSession(session) });
}

export async function listWithdrawals(filter = {}, { skip = 0, limit = 20, sort = { createdAt: -1 } } = {}) {
  const [items, total] = await Promise.all([
    Withdrawal.find(filter).sort(sort).skip(skip).limit(limit).lean(),
    Withdrawal.countDocuments(filter),
  ]);
  return { items, total };
}

export async function countPendingBySeller(sellerId, session = null) {
  const filter = {
    seller: sellerId,
    status: { $in: [WITHDRAWAL_STATUS.PENDING, WITHDRAWAL_STATUS.APPROVED] },
  };
  if (session) {
    return Withdrawal.countDocuments(filter).session(session);
  }
  return Withdrawal.countDocuments(filter);
}

export default {
  createWithdrawal,
  findWithdrawalById,
  updateWithdrawalById,
  listWithdrawals,
  countPendingBySeller,
};
