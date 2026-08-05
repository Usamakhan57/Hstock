import test, { before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { resetDb, setupTestDb, teardownTestDb } from '../helpers/setup.js';

const { default: app } = await import('../../src/app.js');
const {
  User,
  SellerProfile,
  Product,
  Order,
} = await import('../../src/models/index.js');
const { hashPassword } = await import('../../src/utils/password.js');
const { USER_ROLES } = await import('../../src/constants/roles.js');
const { ORDER_STATUS } = await import('../../src/constants/statuses.js');
const {
  getSellerStatistics,
  computeTotalSalesFromOrders,
} = await import('../../src/services/sellerStatistics.service.js');
const { getTelegramConnectionStatus } = await import('../../src/services/telegram.service.js');

async function createApprovedSeller(email = 'stats-seller@example.com') {
  const register = await request(app)
    .post('/api/v1/auth/seller/register')
    .send({
      name: 'Stats Seller',
      username: 'stats_seller',
      email,
      password: 'Password123!',
      storeName: 'Stats Seller Store',
    });
  assert.equal(register.status, 201, JSON.stringify(register.body));
  const sellerId = register.body.data.seller._id || register.body.data.seller.id;
  const profile = await SellerProfile.findByIdAndUpdate(
    sellerId,
    { status: 'approved', slug: 'stats-seller-store' },
    { new: true },
  );
  return {
    token: register.body.data.accessToken,
    sellerId,
    userId: register.body.data.user.id || register.body.data.user._id,
    slug: profile.slug,
  };
}

async function seedOrders(sellerProfileId, sellerUserId) {
  const buyer = await User.create({
    email: 'stats-buyer@example.com',
    passwordHash: await hashPassword('Password123!'),
    name: 'Stats Buyer',
    roles: [USER_ROLES.BUYER],
    emailVerified: true,
  });

  const product = await Product.create({
    title: 'Stats Product',
    slug: 'stats-product',
    description: 'Test product for seller statistics',
    price: 3,
    seller: sellerProfileId,
    productType: 'social_accounts',
    status: 'live',
    visibility: 'public',
    approvalStatus: 'approved',
    createdBy: sellerUserId,
    updatedBy: sellerUserId,
  });

  const base = {
    buyer: buyer._id,
    seller: sellerProfileId,
    sellerUser: sellerUserId,
    product: product._id,
    productSnapshot: {
      title: product.title,
      slug: product.slug,
      price: 3,
      currency: 'USD',
    },
    quantity: 1,
    unitPrice: 3,
    subtotal: 3,
    commissionPercent: 10,
    commissionAmount: 0.3,
    sellerAmount: 2.7,
    totalAmount: 3,
    currency: 'USD',
  };

  await Order.create([
    {
      ...base,
      orderNumber: 'ORD-STATS-COMPLETED',
      status: ORDER_STATUS.COMPLETED,
    },
    {
      ...base,
      orderNumber: 'ORD-STATS-CANCELLED',
      status: ORDER_STATUS.CANCELLED,
      totalAmount: 99,
      sellerAmount: 90,
      subtotal: 99,
    },
    {
      ...base,
      orderNumber: 'ORD-STATS-EXPIRED',
      status: ORDER_STATUS.EXPIRED,
      totalAmount: 50,
      sellerAmount: 45,
      subtotal: 50,
    },
  ]);

  return product;
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

test('computeTotalSalesFromOrders matches dashboard grossSales rules', () => {
  const total = computeTotalSalesFromOrders([
    { status: 'completed', totalAmount: 3 },
    { status: 'escrow', amount: 2 },
    { status: 'cancelled', totalAmount: 99 },
    { status: 'expired', totalAmount: 50 },
  ]);
  assert.equal(total, 5);
});

test('public seller profile Total Sales matches getSellerStatistics', async () => {
  const seller = await createApprovedSeller();
  await seedOrders(seller.sellerId, seller.userId);

  const stats = await getSellerStatistics(seller.sellerId);
  assert.equal(stats.totalSales, 3);

  const publicRes = await request(app).get(`/api/v1/sellers/${seller.slug}`);
  assert.equal(publicRes.status, 200, JSON.stringify(publicRes.body));
  assert.equal(publicRes.body.data.totalSalesAmount, 3);
  assert.equal(publicRes.body.data.metrics.totalSales, 3);

  const listRes = await request(app).get('/api/v1/sellers?limit=20');
  assert.equal(listRes.status, 200, JSON.stringify(listRes.body));
  const card = (listRes.body.data || []).find((row) => String(row.id) === String(seller.sellerId)
    || row.slug === seller.slug);
  assert.ok(card, 'seller card missing from list');
  assert.equal(card.totalSalesAmount, 3);
  assert.equal(card.metrics.totalSales, 3);

  const meStats = await request(app)
    .get('/api/v1/sellers/me/statistics')
    .set('Authorization', `Bearer ${seller.token}`);
  assert.equal(meStats.status, 200, JSON.stringify(meStats.body));
  assert.equal(meStats.body.data.totalSales, 3);
});

test('getTelegramConnectionStatus reflects User.telegramConnected', async () => {
  const seller = await createApprovedSeller('tg-stats@example.com');
  const before = await getTelegramConnectionStatus(seller.userId);
  assert.equal(before.connected, false);

  await User.findByIdAndUpdate(seller.userId, {
    telegramConnected: true,
    telegramUsername: 'seller_tg',
    telegramUserId: 123456,
    telegramConnectedAt: new Date(),
  });

  const after = await getTelegramConnectionStatus(seller.userId);
  assert.equal(after.connected, true);
  assert.equal(after.username, 'seller_tg');

  const me = await request(app)
    .get('/api/v1/telegram/me')
    .set('Authorization', `Bearer ${seller.token}`);
  assert.equal(me.status, 200);
  assert.equal(me.body.data.connected, true);
  assert.equal(me.body.data.username, 'seller_tg');
});
