/**
 * Test helpers for wallet-only product checkout.
 */
import request from 'supertest';
import { User } from '../../src/models/index.js';
import * as buyerWalletService from '../../src/services/buyerWallet.service.js';
import { creditAvailable } from '../../src/helpers/buyerWallet.helper.js';

export async function fundBuyerWallet(userIdOrEmail, amount = 500) {
  let userId = userIdOrEmail;
  if (typeof userIdOrEmail === 'string' && userIdOrEmail.includes('@')) {
    const user = await User.findOne({ email: userIdOrEmail }).lean();
    if (!user) throw new Error(`Buyer not found: ${userIdOrEmail}`);
    userId = user._id;
  }
  const wallet = await buyerWalletService.getOrCreateBuyerWallet(userId);
  creditAvailable(wallet, amount);
  await wallet.save();
  return buyerWalletService.getOrCreateBuyerWallet(userId);
}

export async function buyNowWithWallet(app, { token, productId, quantity = 1 }) {
  return request(app)
    .post('/api/v1/orders/buy-now')
    .set('Authorization', `Bearer ${token}`)
    .send({ productId, quantity, paymentMethod: 'wallet' });
}

export default {
  fundBuyerWallet,
  buyNowWithWallet,
};
