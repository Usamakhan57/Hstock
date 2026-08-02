import test, { before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { resetDb, setupTestDb, teardownTestDb } from '../helpers/setup.js';

const { default: app } = await import('../../src/app.js');
const { User } = await import('../../src/models/index.js');
const { hashPassword } = await import('../../src/utils/password.js');
const { USER_ROLES } = await import('../../src/constants/roles.js');

async function createAdminToken() {
  await User.create({
    email: 'catalog-admin@example.com',
    passwordHash: await hashPassword('Password123!'),
    name: 'Catalog Admin',
    roles: [USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN],
    emailVerified: true,
  });

  const login = await request(app)
    .post('/api/v1/auth/admin/login')
    .send({ email: 'catalog-admin@example.com', password: 'Password123!' });

  return login.body.data.accessToken;
}

async function createSellerToken() {
  const register = await request(app)
    .post('/api/v1/auth/seller/register')
    .send({
      name: 'Catalog Seller',
      email: 'catalog-seller@example.com',
      password: 'Password123!',
      storeName: 'Catalog Seller Store',
    });

  return {
    token: register.body.data.accessToken,
    seller: register.body.data.seller,
  };
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

test('config defaults are loaded from MongoDB', async () => {
  const adminToken = await createAdminToken();

  const configs = await request(app)
    .get('/api/v1/config')
    .set('Authorization', `Bearer ${adminToken}`);

  assert.equal(configs.status, 200);
  assert.equal(configs.body.data.systemConfig.sellerRegistrationFee, 0);
  assert.equal(configs.body.data.commissionConfig.defaultPercent, 10);
  assert.equal(configs.body.data.platformConfig.maintenanceMode, false);

  const update = await request(app)
    .put('/api/v1/config/commission')
    .set('Authorization', `Bearer ${adminToken}`)
    .send({ defaultPercent: 12 });

  assert.equal(update.status, 200);
  assert.equal(update.body.data.defaultPercent, 12);
});

test('category brand tag CRUD', async () => {
  const adminToken = await createAdminToken();

  const category = await request(app)
    .post('/api/v1/categories')
    .set('Authorization', `Bearer ${adminToken}`)
    .send({ name: 'Social Accounts', description: 'Social media assets' });

  assert.equal(category.status, 201);
  assert.ok(category.body.data.slug);

  const brand = await request(app)
    .post('/api/v1/brands')
    .set('Authorization', `Bearer ${adminToken}`)
    .send({ name: 'ApnaStore Brand' });

  assert.equal(brand.status, 201);

  const tag = await request(app)
    .post('/api/v1/tags')
    .set('Authorization', `Bearer ${adminToken}`)
    .send({ name: 'instagram' });

  assert.equal(tag.status, 201);

  const list = await request(app).get('/api/v1/categories');
  assert.equal(list.status, 200);
  assert.equal(list.body.data.length, 1);
});

test('product foundation create + moderate', async () => {
  const adminToken = await createAdminToken();
  const { token: sellerToken, seller } = await createSellerToken();
  const sellerId = seller._id || seller.id;

  // Seller must be approved before listings appear in the public catalog.
  const approveSeller = await request(app)
    .patch(`/api/v1/users/sellers/${sellerId}`)
    .set('Authorization', `Bearer ${adminToken}`)
    .send({ status: 'approved', verified: true });
  assert.equal(approveSeller.status, 200);

  const category = await request(app)
    .post('/api/v1/categories')
    .set('Authorization', `Bearer ${adminToken}`)
    .send({ name: 'Apps' });

  const created = await request(app)
    .post('/api/v1/products')
    .set('Authorization', `Bearer ${sellerToken}`)
    .send({
      title: 'Premium SaaS App',
      description: 'A digital app listing',
      shortDescription: 'SaaS app',
      price: 49.99,
      productType: 'apps',
      category: category.body.data._id,
      digital: {
        downloadType: 'automatic',
        automatic: true,
        manual: false,
        downloadUrl: 'https://files.example.com/app.zip',
        fileType: 'zip',
        fileSize: 1024,
        deliveryInstructions: 'Download after purchase',
      },
    });

  assert.equal(created.status, 201);
  assert.equal(created.body.data.productType, 'apps');
  assert.ok(created.body.data.digital);

  const submit = await request(app)
    .post(`/api/v1/products/${created.body.data._id}/submit`)
    .set('Authorization', `Bearer ${sellerToken}`);

  assert.equal(submit.status, 200);
  assert.equal(submit.body.data.status, 'pending');

  const moderate = await request(app)
    .post(`/api/v1/products/${created.body.data._id}/moderate`)
    .set('Authorization', `Bearer ${adminToken}`)
    .send({ approvalStatus: 'approved' });

  assert.equal(moderate.status, 200);
  assert.equal(moderate.body.data.status, 'live');
  assert.equal(moderate.body.data.approvalStatus, 'approved');

  const publicList = await request(app).get('/api/v1/products');
  assert.equal(publicList.status, 200);
  assert.equal(publicList.body.data.length, 1);
});

test('RBAC blocks buyer from creating categories', async () => {
  const register = await request(app)
    .post('/api/v1/auth/register')
    .send({
      name: 'Buyer Two',
      email: 'buyer2@example.com',
      password: 'Password123!',
    });

  const denied = await request(app)
    .post('/api/v1/categories')
    .set('Authorization', `Bearer ${register.body.data.accessToken}`)
    .send({ name: 'Nope' });

  assert.equal(denied.status, 403);
  assert.equal(denied.body.success, false);
});

test('validation errors use standard envelope', async () => {
  const res = await request(app)
    .post('/api/v1/auth/register')
    .send({ email: 'bad', password: 'short' });

  assert.equal(res.status, 400);
  assert.equal(res.body.success, false);
  assert.equal(res.body.code, 'VALIDATION_ERROR');
  assert.ok(Array.isArray(res.body.errors));
});
