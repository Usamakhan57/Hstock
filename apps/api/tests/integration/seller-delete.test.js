import '../helpers/env-bootstrap.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import mongoose from 'mongoose';
import { setupTestDb, resetDb, teardownTestDb } from '../helpers/setup.js';

const { default: app } = await import('../../src/app.js');
const {
  User,
  SellerProfile,
  Product,
  Order,
  Escrow,
  Dispute,
  LedgerEntry,
  Wallet,
} = await import('../../src/models/index.js');
const { hashPassword } = await import('../../src/utils/password.js');
const { USER_ROLES } = await import('../../src/constants/roles.js');
const {
  PRODUCT_STATUS,
  PRODUCT_VISIBILITY,
  APPROVAL_STATUS,
} = await import('../../src/constants/productTypes.js');
const { LEDGER_ENTRY_TYPE, LEDGER_DIRECTION, LEDGER_ACCOUNT } = await import('../../src/constants/ledger.js');

async function createAdminToken(email = 'delete-admin@example.com') {
  await User.create({
    email,
    passwordHash: await hashPassword('Password123!'),
    name: 'Delete Admin',
    roles: [USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN],
    emailVerified: true,
  });
  const login = await request(app)
    .post('/api/v1/auth/admin/login')
    .send({ email, password: 'Password123!' });
  assert.equal(login.status, 200);
  return login.body.data.accessToken;
}

async function createApprovedSeller(email = 'delete-seller@example.com', storeName = 'Delete Me Store') {
  const register = await request(app)
    .post('/api/v1/auth/seller/register')
    .send({
      name: 'Delete Seller',
      email,
      password: 'Password123!',
      storeName,
    });
  assert.equal(register.status, 201, JSON.stringify(register.body));
  const sellerId = register.body.data.seller._id || register.body.data.seller.id;
  const userId = register.body.data.user.id || register.body.data.user._id;
  await SellerProfile.findByIdAndUpdate(sellerId, {
    status: 'approved',
    verified: false,
  });
  return {
    token: register.body.data.accessToken,
    sellerId: String(sellerId),
    userId: String(userId),
    slug: register.body.data.seller.slug,
  };
}

test('admin can soft-delete a normal seller and hide from public catalog', async (t) => {
  await setupTestDb();
  t.after(async () => {
    await resetDb();
    await teardownTestDb();
  });

  const adminToken = await createAdminToken();
  const { sellerId, userId, slug } = await createApprovedSeller();

  await Product.create({
    title: 'Delete Listing',
    slug: 'delete-listing',
    description: 'Should disappear after seller delete',
    price: 8,
    seller: sellerId,
    productType: 'social_accounts',
    status: PRODUCT_STATUS.LIVE,
    visibility: PRODUCT_VISIBILITY.PUBLIC,
    approvalStatus: APPROVAL_STATUS.APPROVED,
    createdBy: userId,
    updatedBy: userId,
  });

  await Wallet.create({
    seller: sellerId,
    sellerUser: userId,
    availableBalance: 25,
    pendingBalance: 0,
    reservedBalance: 0,
    withdrawableBalance: 25,
    currency: 'USD',
  });
  await LedgerEntry.create({
    transferId: `ledger_delete_${sellerId}`,
    entryType: LEDGER_ENTRY_TYPE.ADMIN_ADJUSTMENT,
    direction: LEDGER_DIRECTION.CREDIT,
    account: LEDGER_ACCOUNT.SELLER_AVAILABLE,
    amount: 25,
    currency: 'USD',
    seller: sellerId,
    sellerUser: userId,
    description: 'Seed funds',
  });

  const beforePublic = await request(app).get(`/api/v1/sellers/${slug}`);
  assert.equal(beforePublic.status, 200);

  const missingConfirm = await request(app)
    .delete(`/api/v1/admin/sellers/${sellerId}`)
    .set('Authorization', `Bearer ${adminToken}`)
    .send({});
  assert.equal(missingConfirm.status, 400);
  assert.equal(missingConfirm.body.code, 'DELETE_CONFIRMATION_REQUIRED');

  const deleted = await request(app)
    .delete(`/api/v1/admin/sellers/${sellerId}`)
    .set('Authorization', `Bearer ${adminToken}`)
    .send({ confirm: 'DELETE' });
  assert.equal(deleted.status, 200, JSON.stringify(deleted.body));
  assert.equal(deleted.body.data.seller.deleted, true);
  assert.equal(deleted.body.data.seller.storeName, 'Deleted Seller');

  const seller = await SellerProfile.findById(sellerId).lean();
  assert.equal(seller.deleted, true);
  assert.ok(seller.deletedAt);
  assert.equal(seller.storeName, 'Deleted Seller');
  assert.equal(seller.verified, false);

  const user = await User.findById(userId).lean();
  assert.equal(user.status, 'deleted');
  assert.equal((user.roles || []).includes('seller'), false);

  const product = await Product.findOne({ slug: 'delete-listing' }).lean();
  assert.ok(product.deletedAt);

  const afterPublic = await request(app).get(`/api/v1/sellers/${slug}`);
  assert.equal(afterPublic.status, 404);

  const publicProducts = await request(app).get('/api/v1/products/public');
  assert.equal(publicProducts.status, 200);
  assert.equal(
    (publicProducts.body.data || []).some((p) => p.slug === 'delete-listing'),
    false,
  );

  const wallet = await Wallet.findOne({ seller: sellerId }).lean();
  assert.equal(wallet.availableBalance, 25);
  const ledgerCount = await LedgerEntry.countDocuments({ seller: sellerId });
  assert.equal(ledgerCount, 1);
});

test('admin delete is blocked by open escrow order + locked escrow with detailed reasons', async (t) => {
  await setupTestDb();
  t.after(async () => {
    await resetDb();
    await teardownTestDb();
  });

  const adminToken = await createAdminToken('escrow-block-admin@example.com');
  const { sellerId, userId } = await createApprovedSeller('escrow-block-seller@example.com');
  const buyerId = new mongoose.Types.ObjectId();
  const orderId = new mongoose.Types.ObjectId();
  const paymentId = new mongoose.Types.ObjectId();

  await Order.collection.insertOne({
    _id: orderId,
    orderNumber: `ORD-DEL-${Date.now()}`,
    buyer: buyerId,
    seller: new mongoose.Types.ObjectId(sellerId),
    sellerUser: new mongoose.Types.ObjectId(userId),
    product: new mongoose.Types.ObjectId(),
    status: 'escrow',
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  await Escrow.collection.insertOne({
    order: orderId,
    payment: paymentId,
    buyer: buyerId,
    seller: new mongoose.Types.ObjectId(sellerId),
    sellerUser: new mongoose.Types.ObjectId(userId),
    amount: 10,
    status: 'locked',
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  const res = await request(app)
    .delete(`/api/v1/admin/sellers/${sellerId}`)
    .set('Authorization', `Bearer ${adminToken}`)
    .send({ confirm: 'DELETE' });
  assert.equal(res.status, 409, JSON.stringify(res.body));
  assert.equal(res.body.code, 'SELLER_DELETE_BLOCKED');
  // Order in escrow status + locked escrow → both are legitimate blockers.
  assert.equal(res.body.errors.blockedBy, 'Open Orders');
  assert.equal(res.body.errors.count, 1);
  assert.deepEqual(
    res.body.errors.blockers.map((b) => ({ blockedBy: b.blockedBy, count: b.count })),
    [
      { blockedBy: 'Open Orders', count: 1 },
      { blockedBy: 'Active Escrow', count: 1 },
    ],
  );
  assert.match(res.body.message, /Open Orders/);
  assert.match(res.body.message, /Active Escrow/);

  const seller = await SellerProfile.findById(sellerId).lean();
  assert.notEqual(seller.deleted, true);
});

test('locked escrow alone blocks delete with Active Escrow reason', async (t) => {
  await setupTestDb();
  t.after(async () => {
    await resetDb();
    await teardownTestDb();
  });

  const adminToken = await createAdminToken('escrow-only-admin@example.com');
  const { sellerId, userId } = await createApprovedSeller('escrow-only-seller@example.com');
  const buyerId = new mongoose.Types.ObjectId();

  // Order already completed (not an open-order blocker), but escrow still locked.
  await Escrow.collection.insertOne({
    order: new mongoose.Types.ObjectId(),
    payment: new mongoose.Types.ObjectId(),
    buyer: buyerId,
    seller: new mongoose.Types.ObjectId(sellerId),
    sellerUser: new mongoose.Types.ObjectId(userId),
    amount: 10,
    status: 'locked',
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  const res = await request(app)
    .delete(`/api/v1/admin/sellers/${sellerId}`)
    .set('Authorization', `Bearer ${adminToken}`)
    .send({ confirm: 'DELETE' });
  assert.equal(res.status, 409, JSON.stringify(res.body));
  assert.equal(res.body.code, 'SELLER_DELETE_BLOCKED');
  assert.equal(res.body.errors.blockedBy, 'Active Escrow');
  assert.equal(res.body.errors.count, 1);
  assert.match(res.body.message, /Active Escrow \(1\)/);
});

test('stale pending escrow on cancelled/expired order does NOT block delete', async (t) => {
  await setupTestDb();
  t.after(async () => {
    await resetDb();
    await teardownTestDb();
  });

  const adminToken = await createAdminToken('stale-escrow-admin@example.com');
  const { sellerId, userId } = await createApprovedSeller('stale-escrow-seller@example.com');
  const buyerId = new mongoose.Types.ObjectId();
  const cancelledOrderId = new mongoose.Types.ObjectId();
  const expiredOrderId = new mongoose.Types.ObjectId();

  await Order.collection.insertMany([
    {
      _id: cancelledOrderId,
      orderNumber: `ORD-CANCEL-${Date.now()}`,
      buyer: buyerId,
      seller: new mongoose.Types.ObjectId(sellerId),
      sellerUser: new mongoose.Types.ObjectId(userId),
      product: new mongoose.Types.ObjectId(),
      status: 'cancelled',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      _id: expiredOrderId,
      orderNumber: `ORD-EXPIRE-${Date.now()}`,
      buyer: buyerId,
      seller: new mongoose.Types.ObjectId(sellerId),
      sellerUser: new mongoose.Types.ObjectId(userId),
      product: new mongoose.Types.ObjectId(),
      status: 'expired',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ]);

  await Escrow.collection.insertMany([
    {
      order: cancelledOrderId,
      payment: new mongoose.Types.ObjectId(),
      buyer: buyerId,
      seller: new mongoose.Types.ObjectId(sellerId),
      sellerUser: new mongoose.Types.ObjectId(userId),
      amount: 12,
      status: 'pending',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      order: expiredOrderId,
      payment: new mongoose.Types.ObjectId(),
      buyer: buyerId,
      seller: new mongoose.Types.ObjectId(sellerId),
      sellerUser: new mongoose.Types.ObjectId(userId),
      amount: 15,
      status: 'pending',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      order: new mongoose.Types.ObjectId(),
      payment: new mongoose.Types.ObjectId(),
      buyer: buyerId,
      seller: new mongoose.Types.ObjectId(sellerId),
      sellerUser: new mongoose.Types.ObjectId(userId),
      amount: 20,
      status: 'released',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      order: new mongoose.Types.ObjectId(),
      payment: new mongoose.Types.ObjectId(),
      buyer: buyerId,
      seller: new mongoose.Types.ObjectId(sellerId),
      sellerUser: new mongoose.Types.ObjectId(userId),
      amount: 8,
      status: 'refunded',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ]);

  const res = await request(app)
    .delete(`/api/v1/admin/sellers/${sellerId}`)
    .set('Authorization', `Bearer ${adminToken}`)
    .send({ confirm: 'DELETE' });
  assert.equal(res.status, 200, JSON.stringify(res.body));
  assert.equal(res.body.data.seller.deleted, true);

  const seller = await SellerProfile.findById(sellerId).lean();
  assert.equal(seller.deleted, true);
});

test('admin delete is blocked when dispute exists and returns Active Dispute', async (t) => {
  await setupTestDb();
  t.after(async () => {
    await resetDb();
    await teardownTestDb();
  });

  const adminToken = await createAdminToken('dispute-block-admin@example.com');
  const { sellerId, userId } = await createApprovedSeller('dispute-block-seller@example.com');
  const buyerId = new mongoose.Types.ObjectId();
  const orderId = new mongoose.Types.ObjectId();
  const escrowId = new mongoose.Types.ObjectId();

  await Dispute.collection.insertOne({
    disputeNumber: `DSP-${Date.now()}`,
    order: orderId,
    escrow: escrowId,
    buyer: buyerId,
    seller: new mongoose.Types.ObjectId(sellerId),
    sellerUser: new mongoose.Types.ObjectId(userId),
    reason: 'Item not as described',
    description: 'Test dispute',
    status: 'open',
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  const res = await request(app)
    .delete(`/api/v1/admin/sellers/${sellerId}`)
    .set('Authorization', `Bearer ${adminToken}`)
    .send({ confirm: 'DELETE' });
  assert.equal(res.status, 409, JSON.stringify(res.body));
  assert.equal(res.body.code, 'SELLER_DELETE_BLOCKED');
  assert.equal(res.body.errors.blockedBy, 'Active Dispute');
  assert.equal(res.body.errors.count, 1);
  assert.match(res.body.message, /Active Dispute/);
});

test('resolved/closed disputes and completed orders do NOT block delete', async (t) => {
  await setupTestDb();
  t.after(async () => {
    await resetDb();
    await teardownTestDb();
  });

  const adminToken = await createAdminToken('terminal-ok-admin@example.com');
  const { sellerId, userId } = await createApprovedSeller('terminal-ok-seller@example.com');
  const buyerId = new mongoose.Types.ObjectId();

  await Order.collection.insertMany([
    {
      orderNumber: `ORD-DONE-${Date.now()}`,
      buyer: buyerId,
      seller: new mongoose.Types.ObjectId(sellerId),
      sellerUser: new mongoose.Types.ObjectId(userId),
      product: new mongoose.Types.ObjectId(),
      status: 'completed',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      orderNumber: `ORD-REF-${Date.now()}`,
      buyer: buyerId,
      seller: new mongoose.Types.ObjectId(sellerId),
      sellerUser: new mongoose.Types.ObjectId(userId),
      product: new mongoose.Types.ObjectId(),
      status: 'refunded',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ]);

  await Dispute.collection.insertMany([
    {
      disputeNumber: `DSP-RES-${Date.now()}`,
      order: new mongoose.Types.ObjectId(),
      escrow: new mongoose.Types.ObjectId(),
      buyer: buyerId,
      seller: new mongoose.Types.ObjectId(sellerId),
      sellerUser: new mongoose.Types.ObjectId(userId),
      reason: 'resolved case',
      description: 'Should not block',
      status: 'resolved',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      disputeNumber: `DSP-CL-${Date.now()}`,
      order: new mongoose.Types.ObjectId(),
      escrow: new mongoose.Types.ObjectId(),
      buyer: buyerId,
      seller: new mongoose.Types.ObjectId(sellerId),
      sellerUser: new mongoose.Types.ObjectId(userId),
      reason: 'closed case',
      description: 'Should not block',
      status: 'closed',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ]);

  const res = await request(app)
    .delete(`/api/v1/admin/sellers/${sellerId}`)
    .set('Authorization', `Bearer ${adminToken}`)
    .send({ confirm: 'DELETE' });
  assert.equal(res.status, 200, JSON.stringify(res.body));
  assert.equal(res.body.data.seller.deleted, true);
});
