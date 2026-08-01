import '../helpers/env-bootstrap.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { setupTestDb, resetDb, teardownTestDb } from '../helpers/setup.js';

const { default: app } = await import('../../src/app.js');
const { User, SellerProfile, Product } = await import('../../src/models/index.js');
const { hashPassword } = await import('../../src/utils/password.js');
const { USER_ROLES } = await import('../../src/constants/roles.js');
const {
  PRODUCT_STATUS,
  PRODUCT_VISIBILITY,
  APPROVAL_STATUS,
} = await import('../../src/constants/productTypes.js');

async function createAdminToken() {
  await User.create({
    email: 'seller-admin@example.com',
    passwordHash: await hashPassword('Password123!'),
    name: 'Seller Admin',
    roles: [USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN],
    emailVerified: true,
  });
  const login = await request(app)
    .post('/api/v1/auth/admin/login')
    .send({ email: 'seller-admin@example.com', password: 'Password123!' });
  assert.equal(login.status, 200);
  return login.body.data.accessToken;
}

async function createPendingSeller() {
  const register = await request(app)
    .post('/api/v1/auth/seller/register')
    .send({
      name: 'Pending Seller',
      email: 'pending-seller@example.com',
      password: 'Password123!',
      storeName: 'Pending Store',
    });
  assert.equal(register.status, 201, JSON.stringify(register.body));
  const seller = register.body.data.seller;
  const sellerId = seller._id || seller.id;
  const userId = register.body.data.user.id || register.body.data.user._id;
  await SellerProfile.findByIdAndUpdate(sellerId, { status: 'pending', verified: false });
  return { sellerId: String(sellerId), userId: String(userId), token: register.body.data.accessToken };
}

test('admin seller get/update accepts SellerProfile id or User id', async (t) => {
  await setupTestDb();
  t.after(async () => {
    await resetDb();
    await teardownTestDb();
  });

  const adminToken = await createAdminToken();
  const { sellerId, userId } = await createPendingSeller();

  await Product.create({
    title: 'Hidden Listing',
    slug: 'hidden-listing',
    description: 'Should become visible after seller approval',
    price: 5,
    seller: sellerId,
    productType: 'social_accounts',
    status: PRODUCT_STATUS.LIVE,
    visibility: PRODUCT_VISIBILITY.PUBLIC,
    approvalStatus: APPROVAL_STATUS.PENDING,
    createdBy: userId,
    updatedBy: userId,
  });

  const byProfile = await request(app)
    .get(`/api/v1/users/sellers/${sellerId}`)
    .set('Authorization', `Bearer ${adminToken}`);
  assert.equal(byProfile.status, 200, JSON.stringify(byProfile.body));
  assert.equal(byProfile.body.data.seller.id, sellerId);

  const byUserSingular = await request(app)
    .get(`/api/v1/users/seller/${userId}`)
    .set('Authorization', `Bearer ${adminToken}`);
  assert.equal(byUserSingular.status, 200, JSON.stringify(byUserSingular.body));
  assert.equal(byUserSingular.body.data.seller.id, sellerId);

  const approveByUserId = await request(app)
    .patch(`/api/v1/users/sellers/${userId}`)
    .set('Authorization', `Bearer ${adminToken}`)
    .send({ status: 'approved', verified: true, commissionRate: 12 });

  assert.equal(approveByUserId.status, 200, JSON.stringify(approveByUserId.body));
  const updated = approveByUserId.body.data.seller;
  assert.equal(updated.status, 'approved');
  assert.equal(updated.verified, true);
  assert.equal(updated.commissionRate, 12);
  assert.ok(updated.approvedAt);
  assert.ok(updated.approvedBy);

  const fresh = await SellerProfile.findById(sellerId).lean();
  assert.equal(fresh.status, 'approved');
  assert.ok(fresh.approvedAt);
  assert.ok(fresh.approvedBy);

  const product = await Product.findOne({ slug: 'hidden-listing' }).lean();
  assert.equal(product.approvalStatus, APPROVAL_STATUS.APPROVED);
  assert.ok(product.publishedAt);

  const publicList = await request(app).get('/api/v1/products/public');
  assert.equal(publicList.status, 200);
  assert.ok((publicList.body.data || []).some((p) => p.slug === 'hidden-listing'));
});

test('admin seller update returns 404 for unknown id', async (t) => {
  await setupTestDb();
  t.after(async () => {
    await resetDb();
    await teardownTestDb();
  });
  const adminToken = await createAdminToken();
  const missing = '507f1f77bcf86cd799439011';
  const res = await request(app)
    .get(`/api/v1/users/sellers/${missing}`)
    .set('Authorization', `Bearer ${adminToken}`);
  assert.equal(res.status, 404);
  assert.equal(res.body.code, 'SELLER_NOT_FOUND');
});
