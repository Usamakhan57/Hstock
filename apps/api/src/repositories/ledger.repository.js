import { LedgerEntry } from '../models/index.js';
import { withSession } from './base.repository.js';

export async function createLedgerEntries(entries, session = null) {
  if (!entries?.length) return [];
  return LedgerEntry.create(entries, withSession(session));
}

export async function listLedgerEntries(filter = {}, { skip = 0, limit = 50, sort = { createdAt: -1 } } = {}) {
  const [items, total] = await Promise.all([
    LedgerEntry.find(filter).sort(sort).skip(skip).limit(limit).lean(),
    LedgerEntry.countDocuments(filter),
  ]);
  return { items, total };
}

export async function sumByTransfer(transferId, session = null) {
  const pipeline = [
    { $match: { transferId } },
    {
      $group: {
        _id: '$direction',
        total: { $sum: '$amount' },
      },
    },
  ];
  if (session) {
    return LedgerEntry.aggregate(pipeline).session(session);
  }
  return LedgerEntry.aggregate(pipeline);
}

export async function findEntriesByTransferId(transferId, { session = null, lean = true } = {}) {
  if (!transferId) return [];
  let query = LedgerEntry.find({ transferId });
  if (session) query = query.session(session);
  if (lean) query = query.lean();
  return query;
}

export default {
  createLedgerEntries,
  listLedgerEntries,
  sumByTransfer,
  findEntriesByTransferId,
};
