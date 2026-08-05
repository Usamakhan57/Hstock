import '../helpers/env-bootstrap.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { setupTestDb, resetDb, teardownTestDb } from '../helpers/setup.js';

const { default: app } = await import('../../src/app.js');
const { User, SellerProfile, BuyerProfile } = await import('../../src/models/index.js');
const { hashPassword } = await import('../../src/utils/password.js');
const { USER_ROLES } = await import('../../src/constants/roles.js');

async function createStaffToken(email, roles) {
  await User.create({
    email,
    passwordHash: await hashPassword('Password123!'),
    name: 'Staff',
    roles,
    emailVerified: true,
  });
  const login = await request(app)
    .post('/api/v1/auth/admin/login')
    .send({ email, password: 'Password123!' });
  assert.equal(login.status, 200, JSON.stringify(login.body));
  return {
    token: login.body.data.accessToken,
    userId: String(login.body.data.user.id || login.body.data.user._id),
  };
}

test('super admin can soft-delete an admin user', async (t) => {
  await setupTestDb();
  t.after(async () => {
    await resetDb();
    await teardownTestDb();
  });

  const { token: superToken } = await createStaffToken(
    'super-del@example.com',
    [USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN],
  );
  const target = await User.create({
    email: 'admin-target@example.com',
    passwordHash: await hashPassword('Password123!'),
    name: 'Target Admin',
    roles: [USER_ROLES.ADMIN],
    emailVerified: true,
  });

  const missing = await request(app)
    .delete(`/api/v1/admin/users/${target._id}`)
    .set('Authorization', `Bearer ${superToken}`)
    .send({});
  assert.equal(missing.status, 400);
  assert.equal(missing.body.code, 'DELETE_CONFIRMATION_REQUIRED');

  const res = await request(app)
    .delete(`/api/v1/admin/users/${target._id}`)
    .set('Authorization', `Bearer ${superToken}`)
    .send({ confirm: 'DELETE' });
  assert.equal(res.status, 200, JSON.stringify(res.body));
  assert.equal(res.body.data.deleted, true);

  const deleted = await User.findById(target._id).lean();
  assert.equal(deleted.deleted, true);
  assert.ok(deleted.deletedAt);
  assert.equal(deleted.status, 'deleted');
  assert.equal((deleted.roles || []).includes('admin'), false);

  const list = await request(app)
    .get('/api/v1/users')
    .set('Authorization', `Bearer ${superToken}`);
  assert.equal(list.status, 200);
  assert.equal(
    (list.body.data || []).some((u) => String(u.id || u._id) === String(target._id)),
    false,
  );
});

test('normal admin cannot delete admin users', async (t) => {
  await setupTestDb();
  t.after(async () => {
    await resetDb();
    await teardownTestDb();
  });

  const { token: adminToken } = await createStaffToken(
    'normal-admin-del@example.com',
    [USER_ROLES.ADMIN],
  );
  const target = await User.create({
    email: 'victim-admin@example.com',
    passwordHash: await hashPassword('Password123!'),
    name: 'Victim Admin',
    roles: [USER_ROLES.ADMIN],
    emailVerified: true,
  });

  const res = await request(app)
    .delete(`/api/v1/admin/users/${target._id}`)
    .set('Authorization', `Bearer ${adminToken}`)
    .send({ confirm: 'DELETE' });
  assert.equal(res.status, 403, JSON.stringify(res.body));

  const still = await User.findById(target._id).lean();
  assert.notEqual(still.deleted, true);
  assert.equal(still.status, 'active');
});

test('cannot delete the last super admin', async (t) => {
  await setupTestDb();
  t.after(async () => {
    await resetDb();
    await teardownTestDb();
  });

  const { token: superToken, userId } = await createStaffToken(
    'only-super@example.com',
    [USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN],
  );

  const res = await request(app)
    .delete(`/api/v1/admin/users/${userId}`)
    .set('Authorization', `Bearer ${superToken}`)
    .send({ confirm: 'DELETE' });
  assert.equal(res.status, 409, JSON.stringify(res.body));
  assert.equal(res.body.code, 'LAST_SUPER_ADMIN');

  const still = await User.findById(userId).lean();
  assert.notEqual(still.deleted, true);
});

test('seller registration saves unique username and slug', async (t) => {
  await setupTestDb();
  t.after(async () => {
    await resetDb();
    await teardownTestDb();
  });

  const register = await request(app)
    .post('/api/v1/auth/seller/register')
    .send({
      storeName: 'Neon Goods',
      username: 'Neon_Shop',
      email: 'neon-shop@example.com',
      password: 'Password123!',
    });
  assert.equal(register.status, 201, JSON.stringify(register.body));
  assert.equal(register.body.data.user.username, 'neon_shop');
  assert.equal(register.body.data.seller.slug, 'neon_shop');
  assert.equal(register.body.data.seller.ownerName, 'neon_shop');
  assert.equal(register.body.data.seller.storeName, 'Neon Goods');

  const dup = await request(app)
    .post('/api/v1/auth/seller/register')
    .send({
      storeName: 'Other Store',
      username: 'neon_shop',
      email: 'other-neon@example.com',
      password: 'Password123!',
    });
  assert.equal(dup.status, 409);
  assert.equal(dup.body.code, 'USERNAME_EXISTS');

  const invalid = await request(app)
    .post('/api/v1/auth/seller/register')
    .send({
      storeName: 'Bad Store',
      username: 'bad name!',
      email: 'bad-name@example.com',
      password: 'Password123!',
    });
  assert.equal(invalid.status, 400);

  const token = register.body.data.accessToken;
  const sellerId = register.body.data.seller._id || register.body.data.seller.id;
  const profile = await request(app)
    .patch('/api/v1/users/me/seller-profile')
    .set('Authorization', `Bearer ${token}`)
    .send({ username: 'neon_updated', bio: 'hello' });
  assert.equal(profile.status, 200, JSON.stringify(profile.body));
  assert.equal(profile.body.data.profile.username, 'neon_updated');

  const user = await User.findById(register.body.data.user.id || register.body.data.user._id).lean();
  assert.equal(user.username, 'neon_updated');
  const seller = await SellerProfile.findById(sellerId).lean();
  assert.equal(seller.slug, 'neon_shop'); // slug unchanged for existing store
  assert.equal(seller.ownerName, 'neon_updated');

  await SellerProfile.findByIdAndUpdate(sellerId, { status: 'approved' });
  const publicSeller = await request(app).get('/api/v1/sellers/neon_shop');
  assert.equal(publicSeller.status, 200, JSON.stringify(publicSeller.body));
  assert.equal(publicSeller.body.data.storeName, 'Neon Goods');
});

test('existing storeName-based seller slugs remain usable', async (t) => {
  await setupTestDb();
  t.after(async () => {
    await resetDb();
    await teardownTestDb();
  });

  const user = await User.create({
    email: 'legacy-seller@example.com',
    passwordHash: await hashPassword('Password123!'),
    name: 'Legacy Seller',
    roles: [USER_ROLES.BUYER, USER_ROLES.SELLER],
    emailVerified: true,
  });
  await BuyerProfile.create({ user: user._id });
  await SellerProfile.create({
    user: user._id,
    storeName: 'Legacy Store',
    slug: 'legacy-store',
    ownerName: 'Legacy Seller',
    email: 'legacy-seller@example.com',
    status: 'approved',
  });

  const publicSeller = await request(app).get('/api/v1/sellers/legacy-store');
  assert.equal(publicSeller.status, 200, JSON.stringify(publicSeller.body));
  assert.equal(publicSeller.body.data.storeName, 'Legacy Store');
  assert.equal(publicSeller.body.data.slug, 'legacy-store');
});
