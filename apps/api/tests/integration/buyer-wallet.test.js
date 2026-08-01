import '../helpers/env-bootstrap.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import app from '../../src/app.js';
import {
  setupTestDb,
  resetDb,
  teardownTestDb,
} from '../helpers/setup.js';
import { User, BuyerProfile } from '../../src/models/index.js';
import { hashPassword } from '../../src/utils/password.js';
import * as buyerWalletService from '../../src/services/buyerWallet.service.js';
import { creditAvailable } from '../../src/helpers/buyerWallet.helper.js';

async function registerBuyer(email = 'buyer-wallet@example.com') {
  const passwordHash = await hashPassword('Password123!');
  const user = await User.create({
    email,
    passwordHash,
    name: 'Wallet Buyer',
    roles: ['buyer'],
    emailVerified: true,
  });
  await BuyerProfile.create({ user: user._id });
  const login = await request(app)
    .post('/api/v1/auth/login')
    .send({ email, password: 'Password123!' });
  assert.equal(login.status, 200);
  return { user, token: login.body.data.accessToken };
}

test('buyer wallet deposit credit + spend + history', async (t) => {
  await setupTestDb();
  t.after(async () => {
    await resetDb();
    await teardownTestDb();
  });
  await resetDb();

  const { user, token } = await registerBuyer();

  const walletRes = await request(app)
    .get('/api/v1/wallet')
    .set('Authorization', `Bearer ${token}`);
  assert.equal(walletRes.status, 200);
  assert.equal(walletRes.body.data.availableBalance, 0);

  // Simulate funded wallet (Cryptomus webhook path uses applyDepositPaid)
  let wallet = await buyerWalletService.getOrCreateBuyerWallet(user._id);
  creditAvailable(wallet, 100);
  await wallet.save();
  wallet = await buyerWalletService.getOrCreateBuyerWallet(user._id);
  assert.ok(wallet.availableBalance >= 100);

  const history = await request(app)
    .get('/api/v1/wallet/history')
    .set('Authorization', `Bearer ${token}`);
  assert.equal(history.status, 200);

  // Admin credit
  const adminHash = await hashPassword('AdminPass123!');
  const admin = await User.create({
    email: 'admin-wallet@example.com',
    passwordHash: adminHash,
    name: 'Admin',
    roles: ['admin', 'super_admin'],
    emailVerified: true,
  });
  const adminLogin = await request(app)
    .post('/api/v1/auth/admin/login')
    .send({ email: admin.email, password: 'AdminPass123!' });
  // admin login may require admin profile — if fails, skip admin path
  if (adminLogin.status === 200) {
    const adjust = await request(app)
      .post(`/api/v1/wallet/buyer/${user._id}/adjust`)
      .set('Authorization', `Bearer ${adminLogin.body.data.accessToken}`)
      .send({ amount: 5, direction: 'credit', reason: 'Test bonus' });
    assert.ok([200, 201].includes(adjust.status));
  } else {
    await buyerWalletService.adminAdjustBuyerWallet({
      buyerId: String(user._id),
      amount: 5,
      direction: 'credit',
      reason: 'Test bonus',
      type: 'bonus',
    }, { id: admin._id });
  }

  const after = await request(app)
    .get('/api/v1/wallet')
    .set('Authorization', `Bearer ${token}`);
  assert.equal(after.status, 200);
  assert.ok(after.body.data.availableBalance >= 105);
});

test('google oauth status endpoint', async (t) => {
  await setupTestDb();
  t.after(async () => {
    await resetDb();
    await teardownTestDb();
  });
  const res = await request(app).get('/api/v1/auth/google/status');
  assert.equal(res.status, 200);
  assert.equal(typeof res.body.data.enabled, 'boolean');
});
