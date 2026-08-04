import test, { before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { resetDb, setupTestDb, teardownTestDb } from '../helpers/setup.js';

const { default: app } = await import('../../src/app.js');
const { User, SellerProfile, StorePromotion, LedgerEntry, Wallet } = await import('../../src/models/index.js');
const { hashPassword } = await import('../../src/utils/password.js');
const { USER_ROLES } = await import('../../src/constants/roles.js');
const { expireDuePromotions } = await import('../../src/services/storePromotion.service.js');

async function createAdminToken() {
  await User.create({
    email: 'promo-admin@example.com',
    passwordHash: await hashPassword('Password123!'),
    name: 'Promo Admin',
    roles: [USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN],
    emailVerified: true,
  });
  const login = await request(app)
    .post('/api/v1/auth/admin/login')
    .send({ email: 'promo-admin@example.com', password: 'Password123!' });
  return login.body.data.accessToken;
}

async function createApprovedSeller(email = 'promo-seller@example.com') {
  const register = await request(app)
    .post('/api/v1/auth/seller/register')
    .send({
      name: 'Promo Seller',
      email,
      password: 'Password123!',
      storeName: 'Promo Seller Store',
    });
  assert.equal(register.status, 201, JSON.stringify(register.body));
  const sellerId = register.body.data.seller._id || register.body.data.seller.id;
  await SellerProfile.findByIdAndUpdate(sellerId, { status: 'approved' });
  return {
    token: register.body.data.accessToken,
    sellerId,
  };
}

async function creditSellerWallet(sellerId, amount, adminToken) {
  const adjust = await request(app)
    .post('/api/v1/wallet/adjust')
    .set('Authorization', `Bearer ${adminToken}`)
    .send({
      sellerId,
      amount,
      direction: 'credit',
      reason: 'Test promo funds',
    });
  assert.ok([200, 201].includes(adjust.status), JSON.stringify(adjust.body));
  return adjust.body.data;
}

before(async () => {
  await setupTestDb();
});

beforeEach(async () => {
  await resetDb();
});

after(async () => {
  await teardownTestDb();
});

test('seller can purchase store promotion from wallet', async () => {
  const adminToken = await createAdminToken();
  const { token: sellerToken, sellerId } = await createApprovedSeller();
  await creditSellerWallet(sellerId, 50, adminToken);

  const status = await request(app)
    .get('/api/v1/store-promotions/me')
    .set('Authorization', `Bearer ${sellerToken}`);
  assert.equal(status.status, 200, JSON.stringify(status.body));
  assert.equal(status.body.data.settings.priceUsd, 10);
  assert.equal(status.body.data.settings.durationHours, 72);
  assert.equal(status.body.data.canAfford, true);

  const purchase = await request(app)
    .post('/api/v1/store-promotions/me/purchase')
    .set('Authorization', `Bearer ${sellerToken}`)
    .send({});
  assert.equal(purchase.status, 201, JSON.stringify(purchase.body));
  assert.equal(purchase.body.data.promotion.status, 'active');
  assert.equal(purchase.body.data.promotion.amount, 10);

  const seller = await SellerProfile.findById(sellerId).lean();
  assert.equal(seller.storePromotionActive, true);
  assert.ok(seller.storePromotedUntil);
  assert.ok(new Date(seller.storePromotedUntil).getTime() > Date.now());

  const wallet = await Wallet.findOne({ seller: sellerId }).lean();
  assert.equal(wallet.availableBalance, 40);

  const ledger = await LedgerEntry.find({ entryType: 'promotion_fee' }).lean();
  assert.equal(ledger.length, 2);
  assert.ok(ledger.every((e) => e.meta?.reference === String(purchase.body.data.promotion._id)
    || e.meta?.promotionId === String(purchase.body.data.promotion._id)));
});

test('purchase fails with insufficient seller wallet balance', async () => {
  await createAdminToken();
  const { token: sellerToken } = await createApprovedSeller();

  const purchase = await request(app)
    .post('/api/v1/store-promotions/me/purchase')
    .set('Authorization', `Bearer ${sellerToken}`)
    .send({});
  assert.equal(purchase.status, 400, JSON.stringify(purchase.body));
  assert.equal(purchase.body.code, 'INSUFFICIENT_WALLET_BALANCE');
});

test('promotion auto-expires and clears seller badges', async () => {
  const adminToken = await createAdminToken();
  const { token: sellerToken, sellerId } = await createApprovedSeller();
  await creditSellerWallet(sellerId, 20, adminToken);

  const purchase = await request(app)
    .post('/api/v1/store-promotions/me/purchase')
    .set('Authorization', `Bearer ${sellerToken}`)
    .send({});
  assert.equal(purchase.status, 201, JSON.stringify(purchase.body));

  const promoId = purchase.body.data.promotion._id;
  await StorePromotion.findByIdAndUpdate(promoId, {
    expiresAt: new Date(Date.now() - 1000),
  });

  const results = await expireDuePromotions({ limit: 10 });
  assert.equal(results.succeeded, 1);

  const promo = await StorePromotion.findById(promoId).lean();
  assert.equal(promo.status, 'expired');

  const seller = await SellerProfile.findById(sellerId).lean();
  assert.equal(seller.storePromotionActive, false);
  assert.equal(seller.storePromotedUntil, null);
});

test('admin can list extend and cancel promotions', async () => {
  const adminToken = await createAdminToken();
  const { token: sellerToken, sellerId } = await createApprovedSeller();
  await creditSellerWallet(sellerId, 30, adminToken);

  await request(app)
    .post('/api/v1/store-promotions/me/purchase')
    .set('Authorization', `Bearer ${sellerToken}`)
    .send({});

  const list = await request(app)
    .get('/api/v1/store-promotions')
    .set('Authorization', `Bearer ${adminToken}`);
  assert.equal(list.status, 200, JSON.stringify(list.body));
  assert.ok(list.body.data.length >= 1);
  const promoId = list.body.data[0]._id;

  const extend = await request(app)
    .post(`/api/v1/store-promotions/${promoId}/extend`)
    .set('Authorization', `Bearer ${adminToken}`)
    .send({ hours: 24 });
  assert.equal(extend.status, 200, JSON.stringify(extend.body));

  const analytics = await request(app)
    .get('/api/v1/store-promotions/analytics')
    .set('Authorization', `Bearer ${adminToken}`);
  assert.equal(analytics.status, 200);
  assert.ok(analytics.body.data.purchases >= 1);
  assert.ok(analytics.body.data.revenue >= 10);

  const cancel = await request(app)
    .post(`/api/v1/store-promotions/${promoId}/cancel`)
    .set('Authorization', `Bearer ${adminToken}`)
    .send({ reason: 'test' });
  assert.equal(cancel.status, 200, JSON.stringify(cancel.body));
  assert.equal(cancel.body.data.status, 'cancelled');

  const seller = await SellerProfile.findById(sellerId).lean();
  assert.equal(seller.storePromotionActive, false);
});
