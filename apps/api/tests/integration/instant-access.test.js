import test, { before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { resetDb, setupTestDb, teardownTestDb } from '../helpers/setup.js';

const { default: app } = await import('../../src/app.js');
const {
  User,
  SellerProfile,
  ProductInventoryItem,
  OrderDelivery,
  Escrow,
} = await import('../../src/models/index.js');
const { hashPassword } = await import('../../src/utils/password.js');
const { USER_ROLES } = await import('../../src/constants/roles.js');
const { releaseEscrow } = await import('../../src/services/escrow.service.js');

async function createAdminToken() {
  await User.create({
    email: 'ia-admin@example.com',
    passwordHash: await hashPassword('Password123!'),
    name: 'IA Admin',
    roles: [USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN],
    emailVerified: true,
  });
  const login = await request(app)
    .post('/api/v1/auth/admin/login')
    .send({ email: 'ia-admin@example.com', password: 'Password123!' });
  return login.body.data.accessToken;
}

async function createSeller() {
  const register = await request(app)
    .post('/api/v1/auth/seller/register')
    .send({
      name: 'IA Seller',
      email: 'ia-seller@example.com',
      password: 'Password123!',
      storeName: 'IA Seller Store',
    });
  assert.equal(register.status, 201, JSON.stringify(register.body));
  const sellerId = register.body.data.seller._id || register.body.data.seller.id;
  await SellerProfile.findByIdAndUpdate(sellerId, { status: 'approved' });
  return {
    token: register.body.data.accessToken,
    seller: { ...register.body.data.seller, _id: sellerId },
  };
}

async function createBuyer({
  name = 'IA Buyer',
  email = 'ia-buyer@example.com',
  username = 'ia_buyer_one',
} = {}) {
  const register = await request(app)
    .post('/api/v1/auth/register')
    .send({
      name,
      email,
      username,
      password: 'Password123!',
    });
  assert.equal(register.status, 201, JSON.stringify(register.body));
  return { token: register.body.data.accessToken };
}

async function createInstantAccessProduct(adminToken, sellerToken, accounts) {
  const category = await request(app)
    .post('/api/v1/categories')
    .set('Authorization', `Bearer ${adminToken}`)
    .send({ name: 'IA Social' });
  assert.equal(category.status, 201, JSON.stringify(category.body));

  const product = await request(app)
    .post('/api/v1/products')
    .set('Authorization', `Bearer ${sellerToken}`)
    .send({
      title: 'Instant Gmail Pack',
      description: 'Instant Access accounts',
      shortDescription: 'Gmail accounts',
      price: 25,
      productType: 'email_accounts',
      category: category.body.data._id,
      stock: accounts.length,
      stockType: 'limited',
      deliveryType: 'automatic',
      digital: {
        downloadType: 'automatic',
        automatic: true,
        manual: false,
        deliveryInstructions: 'Credentials delivered instantly after payment',
      },
    });
  assert.equal(product.status, 201, JSON.stringify(product.body));
  const productId = product.body.data._id;

  const inventory = await request(app)
    .put(`/api/v1/products/${productId}/inventory`)
    .set('Authorization', `Bearer ${sellerToken}`)
    .send({
      sourceFormat: 'paste',
      mode: 'replace_available',
      accounts: accounts.map((row) => ({ fields: row })),
    });
  assert.equal(inventory.status, 200, JSON.stringify(inventory.body));
  assert.equal(inventory.body.data.available, accounts.length);

  const submit = await request(app)
    .post(`/api/v1/products/${productId}/submit`)
    .set('Authorization', `Bearer ${sellerToken}`);
  assert.equal(submit.status, 200, JSON.stringify(submit.body));

  const moderated = await request(app)
    .post(`/api/v1/products/${productId}/moderate`)
    .set('Authorization', `Bearer ${adminToken}`)
    .send({ approvalStatus: 'approved' });
  assert.equal(moderated.status, 200, JSON.stringify(moderated.body));

  return moderated.body.data;
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

test('Instant Access: payment locks escrow and auto-delivers credentials', async () => {
  const adminToken = await createAdminToken();
  const { token: sellerToken } = await createSeller();
  const { token: buyerToken } = await createBuyer();
  const product = await createInstantAccessProduct(adminToken, sellerToken, [
    {
      email: 'account1@gmail.com',
      password: 'SecretPass1!',
      recovery: 'recover1@gmail.com',
      '2fa': '123456',
    },
    {
      email: 'account2@gmail.com',
      password: 'SecretPass2!',
      recovery: 'recover2@gmail.com',
    },
  ]);
  const productId = product.id || product._id;

  const buy = await request(app)
    .post('/api/v1/orders/buy-now')
    .set('Authorization', `Bearer ${buyerToken}`)
    .send({ productId });
  assert.equal(buy.status, 201, JSON.stringify(buy.body));

  const confirm = await request(app)
    .post(`/api/v1/payments/cryptomus/sandbox/${buy.body.data.cryptomus.uuid}`)
    .send({});
  assert.equal(confirm.status, 200, JSON.stringify(confirm.body));
  assert.equal(confirm.body.data.status, 'paid');

  const orderId = buy.body.data.order._id;
  const order = await request(app)
    .get(`/api/v1/orders/${orderId}`)
    .set('Authorization', `Bearer ${buyerToken}`);
  assert.equal(order.status, 200);
  assert.equal(order.body.data.status, 'escrow');
  assert.equal(order.body.data.deliveryStatus, 'delivered');

  const escrow = await Escrow.findOne({ order: orderId });
  assert.ok(escrow);
  assert.equal(escrow.status, 'locked');

  const delivery = await request(app)
    .get(`/api/v1/orders/${orderId}/delivery`)
    .set('Authorization', `Bearer ${buyerToken}`);
  assert.equal(delivery.status, 200, JSON.stringify(delivery.body));
  assert.equal(delivery.body.data.delivered, true);
  assert.equal(delivery.body.data.accountCount, 1);
  assert.equal(delivery.body.data.accounts[0].fields.email, 'account1@gmail.com');
  assert.equal(delivery.body.data.accounts[0].fields.password, 'SecretPass1!');
  assert.equal(delivery.body.data.accounts[0].fields.recovery, 'recover1@gmail.com');
  assert.equal(delivery.body.data.downloads.txt, true);
  assert.equal(delivery.body.data.downloads.csv, true);
  assert.equal(delivery.body.data.downloads.zip, true);

  const sold = await ProductInventoryItem.countDocuments({ product: productId, status: 'sold' });
  const available = await ProductInventoryItem.countDocuments({ product: productId, status: 'available' });
  assert.equal(sold, 1);
  assert.equal(available, 1);

  const inv = await request(app)
    .get(`/api/v1/products/${productId}/inventory`)
    .set('Authorization', `Bearer ${sellerToken}`);
  assert.equal(inv.status, 200);
  assert.equal(inv.body.data.summary.available, 1);
  assert.equal(inv.body.data.summary.sold, 1);
});

test('Instant Access: same account cannot be sold twice', async () => {
  const adminToken = await createAdminToken();
  const { token: sellerToken } = await createSeller();
  const { token: buyerToken } = await createBuyer();

  const { token: buyer2Token } = await createBuyer({
    name: 'Second Instant Buyer',
    email: 'ia-buyer-two@example.com',
    username: 'ia_buyer_two',
  });

  const product = await createInstantAccessProduct(adminToken, sellerToken, [
    {
      email: 'onlyone@gmail.com',
      password: 'OnlyOnce!',
      recovery: 'backup@gmail.com',
    },
  ]);
  const productId = product.id || product._id;

  const buy1 = await request(app)
    .post('/api/v1/orders/buy-now')
    .set('Authorization', `Bearer ${buyerToken}`)
    .send({ productId });
  assert.equal(buy1.status, 201, JSON.stringify(buy1.body));

  await request(app)
    .post(`/api/v1/payments/cryptomus/sandbox/${buy1.body.data.cryptomus.uuid}`)
    .send({});

  const delivery1 = await request(app)
    .get(`/api/v1/orders/${buy1.body.data.order._id}/delivery`)
    .set('Authorization', `Bearer ${buyerToken}`);
  assert.equal(delivery1.body.data.accounts[0].fields.email, 'onlyone@gmail.com');

  const buy2 = await request(app)
    .post('/api/v1/orders/buy-now')
    .set('Authorization', `Bearer ${buyer2Token}`)
    .send({ productId });
  assert.equal(buy2.status, 400);
  assert.ok(
    ['OUT_OF_STOCK', 'PRODUCT_NOT_AVAILABLE'].includes(buy2.body.code),
    JSON.stringify(buy2.body),
  );

  const sold = await ProductInventoryItem.countDocuments({ product: productId, status: 'sold' });
  const available = await ProductInventoryItem.countDocuments({ product: productId, status: 'available' });
  assert.equal(sold, 1);
  assert.equal(available, 0);
});

test('Instant Access: credentials remain after order completed', async () => {
  const adminToken = await createAdminToken();
  const { token: sellerToken } = await createSeller();
  const { token: buyerToken } = await createBuyer();
  const product = await createInstantAccessProduct(adminToken, sellerToken, [
    {
      email: 'keepme@gmail.com',
      password: 'KeepForever!',
      token: 'tok_abc',
    },
  ]);

  const buy = await request(app)
    .post('/api/v1/orders/buy-now')
    .set('Authorization', `Bearer ${buyerToken}`)
    .send({ productId: product.id || product._id });
  assert.equal(buy.status, 201);

  await request(app)
    .post(`/api/v1/payments/cryptomus/sandbox/${buy.body.data.cryptomus.uuid}`)
    .send({});

  const escrowId = buy.body.data.escrow._id || buy.body.data.escrow.id;
  await releaseEscrow(escrowId, { reason: 'test_release' });

  const order = await request(app)
    .get(`/api/v1/orders/${buy.body.data.order._id}`)
    .set('Authorization', `Bearer ${buyerToken}`);
  assert.equal(order.body.data.status, 'completed');
  assert.equal(order.body.data.deliveryStatus, 'delivered');

  const delivery = await request(app)
    .get(`/api/v1/orders/${buy.body.data.order._id}/delivery`)
    .set('Authorization', `Bearer ${buyerToken}`);
  assert.equal(delivery.status, 200);
  assert.equal(delivery.body.data.delivered, true);
  assert.equal(delivery.body.data.accounts[0].fields.email, 'keepme@gmail.com');
  assert.equal(delivery.body.data.accounts[0].fields.password, 'KeepForever!');
  assert.equal(delivery.body.data.accounts[0].fields.token, 'tok_abc');

  const persisted = await OrderDelivery.countDocuments({ order: buy.body.data.order._id });
  assert.equal(persisted, 1);
});

test('Manual Delivery products are not auto-fulfilled', async () => {
  const adminToken = await createAdminToken();
  const { token: sellerToken } = await createSeller();
  const { token: buyerToken } = await createBuyer();

  const category = await request(app)
    .post('/api/v1/categories')
    .set('Authorization', `Bearer ${adminToken}`)
    .send({ name: 'Manual Cat' });

  const product = await request(app)
    .post('/api/v1/products')
    .set('Authorization', `Bearer ${sellerToken}`)
    .send({
      title: 'Manual Handover',
      description: 'Seller delivers manually',
      price: 40,
      productType: 'social_accounts',
      category: category.body.data._id,
      stock: 3,
      deliveryType: 'manual',
      digital: {
        downloadType: 'manual',
        manual: true,
        automatic: false,
      },
    });
  const productId = product.body.data._id;
  await request(app)
    .post(`/api/v1/products/${productId}/submit`)
    .set('Authorization', `Bearer ${sellerToken}`);
  await request(app)
    .post(`/api/v1/products/${productId}/moderate`)
    .set('Authorization', `Bearer ${adminToken}`)
    .send({ approvalStatus: 'approved' });

  const buy = await request(app)
    .post('/api/v1/orders/buy-now')
    .set('Authorization', `Bearer ${buyerToken}`)
    .send({ productId });
  assert.equal(buy.status, 201);

  await request(app)
    .post(`/api/v1/payments/cryptomus/sandbox/${buy.body.data.cryptomus.uuid}`)
    .send({});

  const order = await request(app)
    .get(`/api/v1/orders/${buy.body.data.order._id}`)
    .set('Authorization', `Bearer ${buyerToken}`);
  assert.equal(order.body.data.status, 'escrow');
  assert.equal(order.body.data.deliveryStatus, 'awaiting_delivery');

  const delivery = await request(app)
    .get(`/api/v1/orders/${buy.body.data.order._id}/delivery`)
    .set('Authorization', `Bearer ${buyerToken}`);
  assert.equal(delivery.body.data.delivered, false);
  assert.equal(delivery.body.data.accounts.length, 0);
});
