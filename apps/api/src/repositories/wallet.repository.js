import { Wallet } from '../models/index.js';
import { withSession } from './base.repository.js';

export async function findWalletBySeller(sellerId, { session = null, lean = false } = {}) {
  let query = Wallet.findOne({ seller: sellerId });
  if (session) query = query.session(session);
  if (lean) query = query.lean();
  return query;
}

export async function findWalletBySellerUser(userId, { session = null, lean = false } = {}) {
  let query = Wallet.findOne({ sellerUser: userId });
  if (session) query = query.session(session);
  if (lean) query = query.lean();
  return query;
}

export async function createWallet(data, session = null) {
  const [doc] = await Wallet.create([data], withSession(session));
  return doc;
}

export async function getOrCreateWallet({ sellerId, sellerUserId }, session = null) {
  let wallet = await findWalletBySeller(sellerId, { session });
  if (wallet) return wallet;
  try {
    return await createWallet(
      {
        seller: sellerId,
        sellerUser: sellerUserId,
      },
      session,
    );
  } catch (error) {
    if (error?.code === 11000) {
      return findWalletBySeller(sellerId, { session });
    }
    throw error;
  }
}

export async function saveWallet(wallet, session = null) {
  if (session) {
    await wallet.save({ session });
  } else {
    await wallet.save();
  }
  return wallet;
}

export default {
  findWalletBySeller,
  findWalletBySellerUser,
  createWallet,
  getOrCreateWallet,
  saveWallet,
};
