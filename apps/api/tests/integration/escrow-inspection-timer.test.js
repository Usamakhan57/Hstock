/**
 * Escrow inspection timer (Timer #1) and independent replacement window (Timer #2).
 */
import test, { before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { resetDb, setupTestDb, teardownTestDb } from '../helpers/setup.js';
import { fundBuyerWallet } from '../helpers/walletBuy.js';

const { default: app } = await import('../../src/app.js');
const { User, SellerProfile, Escrow, Order } = await import('../../src/models/index.js');
const { hashPassword } = await import('../../src/utils/password.js');
const { USER_ROLES } = await import('../../src/constants/roles.js');
const {
  processDueEscrowReleases,
} = await import('../../src/services/escrow.service.js');
const { extendSellerReplacementDeadline } = await import('../../src/services/dispute.service.js');

async function createAdminToken(email = 'timer-admin@example.com') {
  await User.create({
    email,
    passwordHash: await hashPassword('Password123!'),
    name: 'Timer Admin',
    roles: [USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN],
    emailVerified: true,
  });
  const login = await request(app)
    .post('/api/v1/auth/admin/login')
    .send({ email, password: 'Password123!' });
  return login.body.data.accessToken;
}

async function createSeller(email = 'timer-seller@example.com') {
  const register = await request(app)
    .post('/api/v1/auth/seller/register')
    .send({
      name: 'Timer Seller',
      email,
      password: 'Password123!',
      storeName: `Store ${email}`,
    });
  const sellerId = register.body.data.seller._id;
  await SellerProfile.findByIdAndUpdate(sellerId, { status: 'approved' });
  return { token: register.body.data.accessToken, sellerId };
}

async function createBuyer(email = 'timer-buyer@example.com') {
  const register = await request(app)
    .post('/api/v1/auth/register')
    .send({
      name: 'Timer Buyer',
      email,
      password: 'Password123!',
      username: `buyer_${email.split('@')[0].replace(/[^a-z0-9]/gi, '_')}`,
    });
  assert.equal(register.status, 201, JSON.stringify(register.body));
  return {
    token: register.body.data.accessToken,
    userId: register.body.data.user?._id || register.body.data.user?.id,
  };
}

async function createManualProduct(adminToken, sellerToken) {
  const category = await request(app)
    .post('/api/v1/categories')
    .set('Authorization', `Bearer ${adminToken}`)
    .send({ name: `Cat ${Date.now()}` });
  const product = await request(app)
    .post('/api/v1/products')
    .set('Authorization', `Bearer ${sellerToken}`)
    .send({
      title: 'Manual Escrow Item',
      description: 'Manual delivery escrow timer test',
      shortDescription: 'Manual',
      price: 40,
      productType: 'license_keys',
      category: category.body.data._id,
      stock: 5,
      deliveryType: 'manual',
      digitalDelivery: {
        downloadType: 'manual',
        automatic: false,
      },
    });
  assert.equal(product.status, 201, JSON.stringify(product.body));
  await request(app)
    .post(`/api/v1/products/${product.body.data._id}/submit`)
    .set('Authorization', `Bearer ${sellerToken}`);
  await request(app)
    .post(`/api/v1/products/${product.body.data._id}/moderate`)
    .set('Authorization', `Bearer ${adminToken}`)
    .send({ approvalStatus: 'approved' });
  return product.body.data;
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

test('starts inspection releaseAt only after delivery; auto-release skips undelivered', async () => {
  const adminToken = await createAdminToken();
  const { token: sellerToken } = await createSeller();
  const { token: buyerToken, userId } = await createBuyer();
  const product = await createManualProduct(adminToken, sellerToken);

  await fundBuyerWallet(userId, 200);
  const buy = await request(app)
    .post('/api/v1/orders/buy-now')
    .set('Authorization', `Bearer ${buyerToken}`)
    .send({ productId: product._id, paymentMethod: 'wallet' });
  assert.equal(buy.status, 201, JSON.stringify(buy.body));

  const escrowId = buy.body.data.escrow._id;
  let escrow = await Escrow.findById(escrowId).lean();
  assert.equal(escrow.status, 'locked');
  assert.equal(escrow.releaseAt, null);

  // Past releaseAt without delivery — job must skip.
  await Escrow.findByIdAndUpdate(escrowId, {
    releaseAt: new Date(Date.now() - 60_000),
  });
  await processDueEscrowReleases({ limit: 20 });
  escrow = await Escrow.findById(escrowId).lean();
  assert.equal(escrow.status, 'locked');
  assert.equal(escrow.releaseJobProcessedAt, null);

  // Deliver via seller API → Timer #1 starts from deliveredAt.
  const deliver = await request(app)
    .post(`/api/v1/orders/${buy.body.data.order._id}/deliver`)
    .set('Authorization', `Bearer ${sellerToken}`)
    .send({});
  assert.equal(deliver.status, 200, JSON.stringify(deliver.body));

  escrow = await Escrow.findById(escrowId).lean();
  assert.ok(escrow.releaseAt);
  assert.ok(escrow.metadata?.inspectionStartedAt);
  assert.ok(new Date(escrow.releaseAt).getTime() > Date.now());

  const dispute = await request(app)
    .post('/api/v1/disputes')
    .set('Authorization', `Bearer ${buyerToken}`)
    .send({
      orderId: buy.body.data.order._id,
      reason: 'Bad login',
      description: 'Credentials do not work after delivery.',
    });
  assert.equal(dispute.status, 201, JSON.stringify(dispute.body));
  assert.ok(dispute.body.data.sellerResponseDeadline);

  const beforeReleaseAt = (await Escrow.findById(escrowId).lean()).releaseAt;
  const adminUser = await User.findOne({ email: 'timer-admin@example.com' }).lean();
  const extended = await extendSellerReplacementDeadline(
    dispute.body.data._id,
    { hours: 12 },
    { id: adminUser._id, roles: ['admin', 'super_admin'] },
  );
  assert.ok(new Date(extended.sellerResponseDeadline).getTime()
    > new Date(dispute.body.data.sellerResponseDeadline).getTime());
  const afterReleaseAt = (await Escrow.findById(escrowId).lean()).releaseAt;
  assert.equal(String(beforeReleaseAt), String(afterReleaseAt));

  const dash = await request(app)
    .get(`/api/v1/disputes/${dispute.body.data._id}/dashboard`)
    .set('Authorization', `Bearer ${buyerToken}`);
  assert.equal(dash.status, 200);
  assert.ok(dash.body.data.timers?.sellerResponseDeadline);
  assert.ok(dash.body.data.timers?.inspectionReleaseAt);
});

test('rejects dispute before delivery', async () => {
  const adminToken = await createAdminToken('pre-admin@example.com');
  const { token: sellerToken } = await createSeller('pre-seller@example.com');
  const { token: buyerToken, userId } = await createBuyer('pre-buyer@example.com');
  const product = await createManualProduct(adminToken, sellerToken);
  await fundBuyerWallet(userId, 200);
  const buy = await request(app)
    .post('/api/v1/orders/buy-now')
    .set('Authorization', `Bearer ${buyerToken}`)
    .send({ productId: product._id, paymentMethod: 'wallet' });
  assert.equal(buy.status, 201, JSON.stringify(buy.body));

  const dispute = await request(app)
    .post('/api/v1/disputes')
    .set('Authorization', `Bearer ${buyerToken}`)
    .send({
      orderId: buy.body.data.order._id,
      reason: 'Too early',
      description: 'Trying to dispute before delivery credentials arrive.',
    });
  assert.equal(dispute.status, 400);
  assert.equal(dispute.body.code || dispute.body.errors?.code, 'ORDER_NOT_DELIVERED');
});
