import test, { before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { resetDb, setupTestDb, teardownTestDb } from '../helpers/setup.js';

const { default: app } = await import('../../src/app.js');
const { User, SellerProfile, LedgerEntry, Wallet } = await import('../../src/models/index.js');
const { hashPassword } = await import('../../src/utils/password.js');
const { USER_ROLES } = await import('../../src/constants/roles.js');

async function createAdminToken() {
  await User.create({
    email: 'verify-admin@example.com',
    passwordHash: await hashPassword('Password123!'),
    name: 'Verify Admin',
    roles: [USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN],
    emailVerified: true,
  });
  const login = await request(app)
    .post('/api/v1/auth/admin/login')
    .send({ email: 'verify-admin@example.com', password: 'Password123!' });
  return login.body.data.accessToken;
}

async function createApprovedSeller(email = 'verify-seller@example.com', storeName = 'Verify Seller Store') {
  const register = await request(app)
    .post('/api/v1/auth/seller/register')
    .send({
      name: 'Verify Seller',
      email,
      password: 'Password123!',
      storeName,
    });
  assert.equal(register.status, 201, JSON.stringify(register.body));
  const sellerId = register.body.data.seller._id || register.body.data.seller.id;
  await SellerProfile.findByIdAndUpdate(sellerId, { status: 'approved' });
  return {
    token: register.body.data.accessToken,
    sellerId,
    slug: register.body.data.seller.slug,
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
      reason: 'Test verification funds',
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

test('seller profile branding updates appear on public sellers API', async () => {
  const { token: sellerToken, slug } = await createApprovedSeller(
    'branding-seller@example.com',
    'Branding Store',
  );

  const update = await request(app)
    .patch('/api/v1/users/me/seller-profile')
    .set('Authorization', `Bearer ${sellerToken}`)
    .send({
      storeName: 'Fresh Brand Store',
      bio: 'Short store description for featured cards',
      logo: 'https://cdn.example/logo.png',
      banner: 'https://cdn.example/banner.png',
    });
  assert.equal(update.status, 200, JSON.stringify(update.body));
  assert.equal(update.body.data.storeName, 'Fresh Brand Store');
  assert.equal(update.body.data.bio, 'Short store description for featured cards');
  assert.equal(update.body.data.logo, 'https://cdn.example/logo.png');
  assert.equal(update.body.data.banner, 'https://cdn.example/banner.png');
  assert.equal(update.body.data.verified, false);

  const list = await request(app).get('/api/v1/sellers').query({ limit: 50 });
  assert.equal(list.status, 200, JSON.stringify(list.body));
  const found = (list.body.data || []).find((s) => s.slug === slug || s.storeName === 'Fresh Brand Store');
  assert.ok(found, 'seller should appear in public list');
  assert.equal(found.storeName, 'Fresh Brand Store');
  assert.equal(found.bio, 'Short store description for featured cards');
  assert.equal(found.logo, 'https://cdn.example/logo.png');
  assert.equal(found.banner, 'https://cdn.example/banner.png');
  assert.equal(found.verified, false);

  const bySlug = await request(app).get(`/api/v1/sellers/${found.slug}`);
  assert.equal(bySlug.status, 200, JSON.stringify(bySlug.body));
  assert.equal(bySlug.body.data.bio, 'Short store description for featured cards');
  assert.equal(bySlug.body.data.logo, 'https://cdn.example/logo.png');
});

test('seller can purchase permanent verification from wallet', async () => {
  const adminToken = await createAdminToken();
  const { token: sellerToken, sellerId } = await createApprovedSeller();
  await creditSellerWallet(sellerId, 20, adminToken);

  const status = await request(app)
    .get('/api/v1/seller-verification/me')
    .set('Authorization', `Bearer ${sellerToken}`);
  assert.equal(status.status, 200, JSON.stringify(status.body));
  assert.equal(status.body.data.settings.feeUsd, 10);
  assert.equal(status.body.data.canAfford, true);
  assert.equal(status.body.data.verified, false);

  const purchase = await request(app)
    .post('/api/v1/seller-verification/me/purchase')
    .set('Authorization', `Bearer ${sellerToken}`)
    .send({});
  assert.equal(purchase.status, 201, JSON.stringify(purchase.body));
  assert.equal(purchase.body.data.seller.verified, true);
  assert.equal(purchase.body.data.seller.sellerVerified, true);
  assert.equal(purchase.body.data.seller.verificationFeePaid, 10);
  assert.equal(purchase.body.data.seller.verificationSource, 'wallet');
  assert.ok(purchase.body.data.seller.verifiedAt);

  const seller = await SellerProfile.findById(sellerId).lean();
  assert.equal(seller.verified, true);
  assert.equal(seller.verificationFeePaid, 10);
  assert.equal(seller.verificationSource, 'wallet');
  assert.ok(seller.verifiedAt);

  const wallet = await Wallet.findOne({ seller: sellerId }).lean();
  assert.equal(wallet.availableBalance, 10);

  const ledger = await LedgerEntry.find({ entryType: 'verification_fee' }).lean();
  assert.equal(ledger.length, 2);

  const publicList = await request(app).get('/api/v1/sellers').query({ verified: 'true' });
  assert.equal(publicList.status, 200);
  assert.ok((publicList.body.data || []).some((s) => String(s.id) === String(sellerId)));

  const reuse = await request(app)
    .post('/api/v1/seller-verification/me/purchase')
    .set('Authorization', `Bearer ${sellerToken}`)
    .send({});
  assert.equal(reuse.status, 200, JSON.stringify(reuse.body));
  assert.equal(reuse.body.data.reused, true);
  const walletAfter = await Wallet.findOne({ seller: sellerId }).lean();
  assert.equal(walletAfter.availableBalance, 10);
});

test('insufficient wallet balance blocks verification purchase', async () => {
  const adminToken = await createAdminToken();
  const { token: sellerToken, sellerId } = await createApprovedSeller('poor-seller@example.com');
  await creditSellerWallet(sellerId, 5, adminToken);

  const purchase = await request(app)
    .post('/api/v1/seller-verification/me/purchase')
    .set('Authorization', `Bearer ${sellerToken}`)
    .send({});
  assert.equal(purchase.status, 400, JSON.stringify(purchase.body));
  assert.equal(purchase.body.code, 'INSUFFICIENT_WALLET_BALANCE');

  const seller = await SellerProfile.findById(sellerId).lean();
  assert.equal(seller.verified, false);
});

test('admin can manually verify and unverify with optional refund', async () => {
  const adminToken = await createAdminToken();
  const { token: sellerToken, sellerId } = await createApprovedSeller('manual-seller@example.com');
  await creditSellerWallet(sellerId, 20, adminToken);

  await request(app)
    .post('/api/v1/seller-verification/me/purchase')
    .set('Authorization', `Bearer ${sellerToken}`)
    .send({});

  const list = await request(app)
    .get('/api/v1/seller-verification')
    .set('Authorization', `Bearer ${adminToken}`)
    .query({ verified: 'true' });
  assert.equal(list.status, 200, JSON.stringify(list.body));
  assert.ok((list.body.data || []).some((s) => String(s.id) === String(sellerId)));

  const unverify = await request(app)
    .post(`/api/v1/seller-verification/${sellerId}/unverify`)
    .set('Authorization', `Bearer ${adminToken}`)
    .send({ refund: true });
  assert.equal(unverify.status, 200, JSON.stringify(unverify.body));
  assert.equal(unverify.body.data.verified, false);

  const wallet = await Wallet.findOne({ seller: sellerId }).lean();
  assert.equal(wallet.availableBalance, 20);

  const reverify = await request(app)
    .post(`/api/v1/seller-verification/${sellerId}/verify`)
    .set('Authorization', `Bearer ${adminToken}`)
    .send({});
  assert.equal(reverify.status, 200, JSON.stringify(reverify.body));
  assert.equal(reverify.body.data.verified, true);
  assert.equal(reverify.body.data.verificationSource, 'admin');
});
