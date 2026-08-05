import test, { before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { resetDb, setupTestDb, teardownTestDb } from '../helpers/setup.js';

const { default: app } = await import('../../src/app.js');
const { User } = await import('../../src/models/index.js');
const { hashPassword } = await import('../../src/utils/password.js');
const { USER_ROLES } = await import('../../src/constants/roles.js');

before(async () => {
  await setupTestDb();
});

beforeEach(async () => {
  await resetDb();
});

after(async () => {
  await teardownTestDb();
});

test('buyer register + login + me + logout', async () => {
  const register = await request(app)
    .post('/api/v1/auth/register')
    .send({
      name: 'Buyer One',
      email: 'buyer1@example.com',
      password: 'Password123!',
      country: 'US',
    });

  assert.equal(register.status, 201);
  assert.equal(register.body.success, true);
  assert.ok(register.body.data.accessToken);
  assert.ok(register.body.data.refreshToken);
  assert.equal(register.body.data.user.roles.includes('buyer'), true);
  assert.equal(register.body.errors, null);

  const login = await request(app)
    .post('/api/v1/auth/login')
    .send({ email: 'buyer1@example.com', password: 'Password123!' });

  assert.equal(login.status, 200);
  assert.ok(login.body.data.accessToken);

  const me = await request(app)
    .get('/api/v1/auth/me')
    .set('Authorization', `Bearer ${login.body.data.accessToken}`);

  assert.equal(me.status, 200);
  assert.equal(me.body.data.user.email, 'buyer1@example.com');

  const logout = await request(app)
    .post('/api/v1/auth/logout')
    .send({ refreshToken: login.body.data.refreshToken });

  assert.equal(logout.status, 200);
  assert.equal(logout.body.data.revoked, true);
});

test('seller registration is free using SystemConfig fee', async () => {
  const fee = await request(app).get('/api/v1/config/seller-registration-fee');
  assert.equal(fee.status, 200);
  assert.equal(fee.body.data.sellerRegistrationFee, 0);
  assert.equal(fee.body.data.isEnabled, true);

  const register = await request(app)
    .post('/api/v1/auth/seller/register')
    .send({
      name: 'Seller One',
      email: 'seller1@example.com',
      password: 'Password123!',
      storeName: 'Seller One Store',
    });

  assert.equal(register.status, 201);
  assert.equal(register.body.data.registration.fee, 0);
  assert.equal(register.body.data.registration.paymentRequired, false);
  assert.ok(register.body.data.seller.slug);
  assert.equal(register.body.data.seller.slug, 'seller-one');
  assert.equal(register.body.data.user.username, 'seller-one');
  assert.equal(register.body.data.user.roles.includes('seller'), true);

  const login = await request(app)
    .post('/api/v1/auth/seller/login')
    .send({ email: 'seller1@example.com', password: 'Password123!' });

  assert.equal(login.status, 200);
  assert.ok(login.body.data.seller);
});

test('admin login requires admin role', async () => {
  await User.create({
    email: 'admin@example.com',
    passwordHash: await hashPassword('Password123!'),
    name: 'Admin User',
    roles: [USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN],
    emailVerified: true,
  });

  const login = await request(app)
    .post('/api/v1/auth/admin/login')
    .send({ email: 'admin@example.com', password: 'Password123!' });

  assert.equal(login.status, 200);
  assert.ok(login.body.data.user.roles.includes('super_admin'));

  const buyerLogin = await request(app)
    .post('/api/v1/auth/admin/login')
    .send({ email: 'nobody@example.com', password: 'Password123!' });

  assert.equal(buyerLogin.status, 401);
});

test('refresh token rotation works', async () => {
  const register = await request(app)
    .post('/api/v1/auth/register')
    .send({
      name: 'Refresh User',
      email: 'refresh@example.com',
      password: 'Password123!',
    });

  const refresh = await request(app)
    .post('/api/v1/auth/refresh')
    .send({ refreshToken: register.body.data.refreshToken });

  assert.equal(refresh.status, 200);
  assert.ok(refresh.body.data.accessToken);
  assert.ok(refresh.body.data.refreshToken);
  assert.notEqual(refresh.body.data.refreshToken, register.body.data.refreshToken);
});

test('forgot + reset password flow', async () => {
  await request(app)
    .post('/api/v1/auth/register')
    .send({
      name: 'Reset User',
      email: 'reset@example.com',
      password: 'Password123!',
    });

  const forgot = await request(app)
    .post('/api/v1/auth/forgot-password')
    .send({ email: 'reset@example.com' });

  assert.equal(forgot.status, 200);
  assert.ok(forgot.body.data.token);
  assert.match(String(forgot.body.data.resetUrl || ''), /\/reset-password\?token=/);

  const reset = await request(app)
    .post('/api/v1/auth/reset-password')
    .send({
      token: forgot.body.data.token,
      password: 'NewPassword123!',
    });

  assert.equal(reset.status, 200);

  // Token is single-use.
  const reuse = await request(app)
    .post('/api/v1/auth/reset-password')
    .send({
      token: forgot.body.data.token,
      password: 'AnotherPassword123!',
    });
  assert.equal(reuse.status, 400);

  const login = await request(app)
    .post('/api/v1/auth/login')
    .send({ email: 'reset@example.com', password: 'NewPassword123!' });

  assert.equal(login.status, 200);
});

test('forgot password for unknown email still returns success', async () => {
  const forgot = await request(app)
    .post('/api/v1/auth/forgot-password')
    .send({ email: 'nobody-here@example.com' });
  assert.equal(forgot.status, 200);
  assert.equal(forgot.body.data.sent, true);
});

test('email verification infrastructure', async () => {
  const register = await request(app)
    .post('/api/v1/auth/register')
    .send({
      name: 'Verify User',
      email: 'verify@example.com',
      password: 'Password123!',
    });

  assert.ok(register.body.data.emailVerification.token);

  const verify = await request(app)
    .post('/api/v1/auth/verify-email')
    .send({ token: register.body.data.emailVerification.token });

  assert.equal(verify.status, 200);
  assert.equal(verify.body.data.user.emailVerified, true);
});
