import '../helpers/env-bootstrap.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import app from '../../src/app.js';
import {
  setupTestDb,
  resetDb,
  teardownTestDb,
} from '../helpers/setup.js';
import {
  SellerProfile,
  BuyerWallet,
  Wallet,
  WalletDeposit,
  LedgerEntry,
} from '../../src/models/index.js';
import * as buyerWalletService from '../../src/services/buyerWallet.service.js';
import { PAYMENT_STATUS } from '../../src/constants/statuses.js';

async function createApprovedSeller(email = 'seller-topup@example.com') {
  const register = await request(app)
    .post('/api/v1/auth/seller/register')
    .send({
      name: 'Topup Seller',
      email,
      password: 'Password123!',
      storeName: 'Topup Seller Store',
    });
  assert.equal(register.status, 201, JSON.stringify(register.body));
  const sellerId = register.body.data.seller._id || register.body.data.seller.id;
  await SellerProfile.findByIdAndUpdate(sellerId, { status: 'approved' });
  return {
    token: register.body.data.accessToken,
    sellerId,
    userId: register.body.data.user?._id || register.body.data.user?.id,
  };
}

test('seller Cryptomus deposit credits seller wallet once via shared buyer pipeline', async (t) => {
  await setupTestDb();
  t.after(async () => {
    await resetDb();
    await teardownTestDb();
  });
  await resetDb();

  const { token, sellerId, userId } = await createApprovedSeller();

  const create = await request(app)
    .post('/api/v1/wallet/deposit')
    .set('Authorization', `Bearer ${token}`)
    .send({
      amount: 25,
      creditToSellerWallet: true,
      urlReturn: 'http://localhost:3000/seller/earnings',
      urlSuccess: 'http://localhost:3000/seller/earnings',
    });
  assert.equal(create.status, 201, JSON.stringify(create.body));
  assert.ok(create.body.data.paymentUrl || create.body.data.cryptomus?.simulated);
  assert.equal(create.body.data.deposit.metadata?.creditToSellerWallet, true);

  const depositId = create.body.data.deposit._id || create.body.data.deposit.id;

  const list = await request(app)
    .get('/api/v1/wallet/deposits?creditToSellerWallet=true')
    .set('Authorization', `Bearer ${token}`);
  assert.equal(list.status, 200, JSON.stringify(list.body));
  assert.ok((list.body.data || []).some((d) => String(d.id || d._id) === String(depositId)));

  // Simulate Cryptomus paid webhook path (same applyDepositPaid used by real webhooks)
  const deposit = await WalletDeposit.findById(depositId);
  assert.ok(deposit);
  const paid = await buyerWalletService.applyDepositPaid(deposit, {
    providerStatus: 'paid',
    raw: { uuid: deposit.cryptomusUuid, status: 'paid' },
  });
  assert.equal(paid.deposit.status, PAYMENT_STATUS.PAID);
  assert.ok(paid.deposit.metadata?.sellerWalletCreditedAt);

  // Buyer prepaid wallet should be back to ~0 after bridge
  const buyerWallet = await BuyerWallet.findOne({ buyer: userId || deposit.buyer }).lean();
  assert.ok(buyerWallet);
  assert.ok(Number(buyerWallet.availableBalance || 0) < 0.01);

  // Seller earnings wallet credited
  const sellerWallet = await Wallet.findOne({ seller: sellerId }).lean();
  assert.ok(sellerWallet);
  assert.equal(Number(sellerWallet.availableBalance), 25);

  // Idempotent: second apply / refresh must not double-credit
  await buyerWalletService.applyDepositPaid(deposit, {
    providerStatus: 'paid',
    raw: { uuid: deposit.cryptomusUuid, status: 'paid' },
  });
  const sellerWalletAfter = await Wallet.findOne({ seller: sellerId }).lean();
  assert.equal(Number(sellerWalletAfter.availableBalance), 25);

  const transferEntries = await LedgerEntry.find({
    transferId: `seller_topup_${depositId}`,
  }).lean();
  assert.equal(transferEntries.length, 2);

  const refresh = await request(app)
    .post(`/api/v1/wallet/deposits/${depositId}/refresh`)
    .set('Authorization', `Bearer ${token}`);
  assert.equal(refresh.status, 200, JSON.stringify(refresh.body));

  const me = await request(app)
    .get('/api/v1/wallet/me')
    .set('Authorization', `Bearer ${token}`);
  assert.equal(me.status, 200, JSON.stringify(me.body));
  assert.equal(Number(me.body.data.availableBalance), 25);
});

test('buyer deposit without creditToSellerWallet does not touch seller wallet', async (t) => {
  await setupTestDb();
  t.after(async () => {
    await resetDb();
    await teardownTestDb();
  });
  await resetDb();

  const { token, sellerId, userId } = await createApprovedSeller('buyer-style-deposit@example.com');

  const create = await request(app)
    .post('/api/v1/wallet/deposit')
    .set('Authorization', `Bearer ${token}`)
    .send({ amount: 15 });
  assert.equal(create.status, 201, JSON.stringify(create.body));

  const depositId = create.body.data.deposit._id || create.body.data.deposit.id;
  const deposit = await WalletDeposit.findById(depositId);
  await buyerWalletService.applyDepositPaid(deposit, {
    providerStatus: 'paid',
    raw: { uuid: deposit.cryptomusUuid, status: 'paid' },
  });

  const buyerWallet = await BuyerWallet.findOne({ buyer: userId || deposit.buyer }).lean();
  assert.equal(Number(buyerWallet.availableBalance), 15);

  const sellerWallet = await Wallet.findOne({ seller: sellerId }).lean();
  assert.equal(Number(sellerWallet?.availableBalance || 0), 0);

  assert.equal(Boolean(deposit.metadata?.creditToSellerWallet), false);
});
