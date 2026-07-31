import test, { before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { resetDb, setupTestDb, teardownTestDb } from '../helpers/setup.js';

const { default: app } = await import('../../src/app.js');
const {
  User,
  SellerProfile,
  Escrow,
  Dispute,
  DisputeChat,
  DisputeChatMessage,
  DisputeChatAuditLog,
  DisputeReplacement,
  DisputeTimeline,
  Order,
  Wallet,
} = await import('../../src/models/index.js');
const { hashPassword } = await import('../../src/utils/password.js');
const { USER_ROLES } = await import('../../src/constants/roles.js');
const { decryptSensitiveObject } = await import('../../src/utils/credentials.crypto.js');
const {
  setOcrImplementation,
  resetOcrImplementation,
} = await import('../../src/services/ocr.service.js');
const { releaseUndisputedEscrowPortion } = await import('../../src/services/escrow.service.js');
const { expireDueCredentials } = await import('../../src/services/disputeChat.service.js');

async function createAdminToken(email = 'final-admin@example.com') {
  await User.create({
    email,
    passwordHash: await hashPassword('Password123!'),
    name: 'Final Admin',
    roles: [USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN],
    emailVerified: true,
  });
  const login = await request(app)
    .post('/api/v1/auth/admin/login')
    .send({ email, password: 'Password123!' });
  return login.body.data.accessToken;
}

async function createSeller(email = 'final-seller@example.com') {
  const register = await request(app)
    .post('/api/v1/auth/seller/register')
    .send({
      name: 'Final Seller',
      email,
      password: 'Password123!',
      storeName: `Store ${email}`,
    });
  const sellerId = register.body.data.seller._id;
  await SellerProfile.findByIdAndUpdate(sellerId, { status: 'approved' });
  return { token: register.body.data.accessToken, sellerId };
}

async function createBuyer(email = 'final-buyer@example.com') {
  const register = await request(app)
    .post('/api/v1/auth/register')
    .send({
      name: 'Final Buyer',
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

async function createLiveProduct(adminToken, sellerToken, { stock = 20, price = 10 } = {}) {
  const category = await request(app)
    .post('/api/v1/categories')
    .set('Authorization', `Bearer ${adminToken}`)
    .send({ name: `Cat ${Date.now()}` });
  const product = await request(app)
    .post('/api/v1/products')
    .set('Authorization', `Bearer ${sellerToken}`)
    .send({
      title: 'Multi Account Pack',
      description: 'Digital accounts pack',
      shortDescription: 'Accounts',
      price,
      productType: 'license_keys',
      category: category.body.data._id,
      stock,
      digital: {
        downloadType: 'automatic',
        automatic: true,
        manual: false,
        downloadUrl: 'https://files.example.com/keys.txt',
        fileType: 'txt',
      },
    });
  await request(app)
    .post(`/api/v1/products/${product.body.data._id}/submit`)
    .set('Authorization', `Bearer ${sellerToken}`);
  await request(app)
    .post(`/api/v1/products/${product.body.data._id}/moderate`)
    .set('Authorization', `Bearer ${adminToken}`)
    .send({ approvalStatus: 'approved' });
  return product.body.data;
}

async function buyAndPay({ buyerToken, productId, quantity = 1 }) {
  const buy = await request(app)
    .post('/api/v1/orders/buy-now')
    .set('Authorization', `Bearer ${buyerToken}`)
    .send({ productId, quantity });
  assert.equal(buy.status, 201, JSON.stringify(buy.body));
  await request(app)
    .post(`/api/v1/payments/cryptomus/sandbox/${buy.body.data.cryptomus.uuid}`)
    .send({});
  return buy.body.data;
}

before(async () => {
  await setupTestDb();
});

beforeEach(async () => {
  await resetDb();
  setOcrImplementation(async () => ({ text: 'Account panel', confidence: 80 }));
});

after(async () => {
  resetOcrImplementation();
  await teardownTestDb();
});

test('partial dispute holds only disputed escrow amount', async () => {
  const adminToken = await createAdminToken();
  const { token: sellerToken } = await createSeller();
  const { token: buyerToken } = await createBuyer();
  const product = await createLiveProduct(adminToken, sellerToken, { stock: 10, price: 10 });
  const paid = await buyAndPay({ buyerToken, productId: product._id, quantity: 10 });

  const order = await Order.findById(paid.order._id).lean();
  assert.equal(order.quantity, 10);
  assert.equal(order.accounts.length, 10);
  assert.equal(order.totalAmount, 100);

  const dispute = await request(app)
    .post('/api/v1/disputes')
    .set('Authorization', `Bearer ${buyerToken}`)
    .send({
      orderId: paid.order._id,
      reason: 'Two accounts invalid',
      description: 'Login failed for two purchased accounts.',
      disputedQuantity: 2,
    });

  assert.equal(dispute.status, 201, JSON.stringify(dispute.body));
  assert.equal(dispute.body.data.isPartial, true);
  assert.equal(dispute.body.data.disputedQuantity, 2);
  assert.equal(dispute.body.data.disputedAmount, 20);
  assert.equal(dispute.body.data.orderQuantity, 10);
  assert.equal(dispute.body.data.heldQuantity, 2);

  const escrow = await Escrow.findById(paid.escrow._id).lean();
  assert.equal(escrow.partialDispute, true);
  assert.equal(escrow.heldAmount, 20);
  assert.equal(escrow.undisputedAmount, 80);
  assert.equal(escrow.disputedAmount, 20);
  assert.equal(escrow.status, 'locked');

  const dashboard = await request(app)
    .get(`/api/v1/disputes/${dispute.body.data._id}/dashboard`)
    .set('Authorization', `Bearer ${buyerToken}`);
  assert.equal(dashboard.status, 200);
  assert.equal(dashboard.body.data.disputedQuantity, 2);
  assert.equal(dashboard.body.data.heldQuantity, 2);
  assert.equal(dashboard.body.data.amounts.disputed, 20);
  assert.equal(dashboard.body.data.amounts.undisputed, 80);

  const timeline = await request(app)
    .get(`/api/v1/disputes/${dispute.body.data._id}/timeline`)
    .set('Authorization', `Bearer ${buyerToken}`);
  assert.equal(timeline.status, 200);
  const events = timeline.body.data.map((e) => e.event);
  assert.ok(events.includes('dispute_created'));
  assert.ok(events.includes('quantity_selected'));
  assert.ok(events.includes('chat_started'));
});

test('partial escrow releases undisputed portion without freezing whole order', async () => {
  const adminToken = await createAdminToken();
  const { token: sellerToken } = await createSeller();
  const { token: buyerToken } = await createBuyer();
  const product = await createLiveProduct(adminToken, sellerToken, { stock: 10, price: 10 });
  const paid = await buyAndPay({ buyerToken, productId: product._id, quantity: 10 });

  await request(app)
    .post('/api/v1/disputes')
    .set('Authorization', `Bearer ${buyerToken}`)
    .send({
      orderId: paid.order._id,
      reason: 'Partial issue',
      description: 'Two accounts need replacement.',
      disputedQuantity: 2,
    });

  await releaseUndisputedEscrowPortion(paid.escrow._id, { reason: 'test_undisputed' });

  const escrow = await Escrow.findById(paid.escrow._id).lean();
  assert.equal(escrow.undisputedAmount, 0);
  assert.equal(escrow.heldAmount, 20);
  assert.equal(escrow.releasedAmount, 80);
  assert.ok(escrow.undisputedReleasedAt);
  assert.equal(escrow.status, 'locked');

  const wallet = await Wallet.findOne({}).lean();
  // commission 10% → seller net on $80 = $72
  assert.equal(wallet.availableBalance, 72);
  assert.equal(wallet.pendingBalance, 20);
});

test('credential share encrypts, masks, reveals with audit; outsiders denied', async () => {
  const adminToken = await createAdminToken();
  const { token: sellerToken } = await createSeller();
  const { token: buyerToken } = await createBuyer();
  const outsider = await createBuyer(`outsider-${Date.now()}@example.com`);
  const product = await createLiveProduct(adminToken, sellerToken, { stock: 2, price: 50 });
  const paid = await buyAndPay({ buyerToken, productId: product._id, quantity: 1 });

  const dispute = await request(app)
    .post('/api/v1/disputes')
    .set('Authorization', `Bearer ${buyerToken}`)
    .send({
      orderId: paid.order._id,
      reason: 'Need working login',
      description: 'Wrong password on delivered account.',
    });
  const disputeId = dispute.body.data._id;

  const shared = await request(app)
    .post(`/api/v1/disputes/${disputeId}/chat/credentials`)
    .set('Authorization', `Bearer ${sellerToken}`)
    .send({
      body: 'Replacement login details',
      credentials: {
        username: 'user_alpha',
        email: 'alpha@accounts.example',
        password: 'PlainSecret99!',
        otp: '847291',
        recoveryCode: 'REC-111',
      },
    });
  assert.equal(shared.status, 201, JSON.stringify(shared.body));
  assert.equal(shared.body.data.hasCredentials, true);
  assert.ok(shared.body.data.credentialsMasked.password.includes('*'));
  assert.equal(shared.body.data.credentialsEncrypted, undefined);
  assert.notEqual(shared.body.data.credentialsMasked.password, 'PlainSecret99!');

  const stored = await DisputeChatMessage.findById(shared.body.data._id).lean();
  assert.ok(stored.credentialsEncrypted.password.startsWith('v1.'));
  assert.equal(
    decryptSensitiveObject(stored.credentialsEncrypted).password,
    'PlainSecret99!',
  );

  const denied = await request(app)
    .post(`/api/v1/disputes/${disputeId}/chat/messages/${shared.body.data._id}/reveal`)
    .set('Authorization', `Bearer ${outsider.token}`);
  assert.equal(denied.status, 403);

  const revealed = await request(app)
    .post(`/api/v1/disputes/${disputeId}/chat/messages/${shared.body.data._id}/reveal`)
    .set('Authorization', `Bearer ${buyerToken}`);
  assert.equal(revealed.status, 200, JSON.stringify(revealed.body));
  assert.equal(revealed.body.data.credentials.password, 'PlainSecret99!');
  assert.equal(revealed.body.data.credentials.otp, '847291');

  const audits = await DisputeChatAuditLog.find({
    dispute: disputeId,
    action: { $in: ['credential_shared', 'credential_revealed'] },
  }).lean();
  assert.ok(audits.some((a) => a.action === 'credential_shared'));
  assert.ok(audits.some((a) => a.action === 'credential_revealed'));
  assert.ok(!JSON.stringify(audits).includes('PlainSecret99!'));
});

test('replacement versioning, reject then accept resolves dispute and read-only chat', async () => {
  const adminToken = await createAdminToken();
  const { token: sellerToken } = await createSeller();
  const { token: buyerToken } = await createBuyer();
  const product = await createLiveProduct(adminToken, sellerToken, { stock: 10, price: 10 });
  const paid = await buyAndPay({ buyerToken, productId: product._id, quantity: 10 });

  const order = await Order.findById(paid.order._id).lean();
  const accountIds = order.accounts.slice(0, 2).map((a) => String(a._id));

  const dispute = await request(app)
    .post('/api/v1/disputes')
    .set('Authorization', `Bearer ${buyerToken}`)
    .send({
      orderId: paid.order._id,
      reason: 'Bad accounts',
      description: 'Two accounts have login failed errors.',
      disputedAccountIds: accountIds,
    });
  assert.equal(dispute.status, 201, JSON.stringify(dispute.body));
  assert.equal(dispute.body.data.disputedQuantity, 2);
  const disputeId = dispute.body.data._id;

  const buyerBlocked = await request(app)
    .post(`/api/v1/disputes/${disputeId}/replacements`)
    .set('Authorization', `Bearer ${buyerToken}`)
    .send({
      accounts: [{ accountIdentifier: 'acc-1', username: 'u1', password: 'p1' }],
    });
  assert.equal(buyerBlocked.status, 403);

  const v1 = await request(app)
    .post(`/api/v1/disputes/${disputeId}/replacements`)
    .set('Authorization', `Bearer ${sellerToken}`)
    .send({
      notes: 'First attempt',
      accounts: [
        {
          accountIdentifier: 'rep-a1',
          username: 'repuser1',
          email: 'rep1@example.com',
          password: 'RepPass1!',
          recoveryEmail: 'recover1@example.com',
        },
        {
          accountIdentifier: 'rep-a2',
          username: 'repuser2',
          password: 'RepPass2!',
        },
      ],
    });
  assert.equal(v1.status, 201, JSON.stringify(v1.body));
  assert.equal(v1.body.data.version, 1);
  assert.equal(v1.body.data.status, 'pending');
  assert.equal(v1.body.data.accounts.length, 2);
  assert.ok(v1.body.data.accounts[0].masked.password.includes('*'));
  assert.equal(v1.body.data.accounts[0].encrypted, undefined);

  const reject = await request(app)
    .post(`/api/v1/disputes/${disputeId}/replacements/${v1.body.data._id}/respond`)
    .set('Authorization', `Bearer ${buyerToken}`)
    .send({ decision: 'rejected', note: 'Still checkpoint' });
  assert.equal(reject.status, 200);
  assert.equal(reject.body.data.status, 'rejected');

  const open = await Dispute.findById(disputeId).lean();
  assert.equal(open.status, 'open');

  const v2 = await request(app)
    .post(`/api/v1/disputes/${disputeId}/replacements`)
    .set('Authorization', `Bearer ${sellerToken}`)
    .send({
      notes: 'Second attempt',
      accounts: [
        {
          accountIdentifier: 'rep-b1',
          username: 'good1',
          password: 'GoodPass1!',
        },
        {
          accountIdentifier: 'rep-b2',
          username: 'good2',
          password: 'GoodPass2!',
        },
      ],
    });
  assert.equal(v2.status, 201, JSON.stringify(v2.body));
  assert.equal(v2.body.data.version, 2);

  const history = await request(app)
    .get(`/api/v1/disputes/${disputeId}/replacements`)
    .set('Authorization', `Bearer ${buyerToken}`);
  assert.equal(history.status, 200);
  assert.equal(history.body.data.length, 2);
  assert.deepEqual(
    history.body.data.map((r) => r.version),
    [1, 2],
  );

  const reveal = await request(app)
    .post(
      `/api/v1/disputes/${disputeId}/replacements/${v2.body.data._id}/accounts/${v2.body.data.accounts[0]._id}/reveal`,
    )
    .set('Authorization', `Bearer ${buyerToken}`);
  assert.equal(reveal.status, 200);
  assert.equal(reveal.body.data.credentials.password, 'GoodPass1!');

  const accept = await request(app)
    .post(`/api/v1/disputes/${disputeId}/replacements/${v2.body.data._id}/respond`)
    .set('Authorization', `Bearer ${buyerToken}`)
    .send({ decision: 'accepted', note: 'Working now' });
  assert.equal(accept.status, 200, JSON.stringify(accept.body));
  assert.equal(accept.body.data.status, 'accepted');

  const closed = await Dispute.findById(disputeId).lean();
  assert.equal(closed.status, 'resolved');
  assert.equal(closed.resolvedQuantity, 2);

  const chat = await DisputeChat.findOne({ dispute: disputeId }).lean();
  assert.equal(chat.status, 'read_only');

  const blockedWrite = await request(app)
    .post(`/api/v1/disputes/${disputeId}/chat/messages`)
    .set('Authorization', `Bearer ${buyerToken}`)
    .send({ body: 'Can I still talk?' });
  assert.equal(blockedWrite.status, 400);
  assert.equal(blockedWrite.body.code, 'CHAT_READ_ONLY');

  const escrow = await Escrow.findById(paid.escrow._id).lean();
  assert.equal(escrow.heldAmount, 0);
  assert.equal(escrow.status, 'released');
  // undisputed 80 + disputed 20 released to seller
  assert.equal(escrow.releasedAmount, 100);

  const timeline = await DisputeTimeline.find({ dispute: disputeId }).lean();
  const events = timeline.map((t) => t.event);
  assert.ok(events.includes('replacement_sent'));
  assert.ok(events.includes('replacement_rejected'));
  assert.ok(events.includes('replacement_accepted'));
  assert.ok(events.includes('dispute_closed'));
  assert.ok(events.includes('chat_read_only'));

  const versions = await DisputeReplacement.find({ dispute: disputeId }).sort({ version: 1 }).lean();
  assert.equal(versions.length, 2);
  assert.equal(versions[0].status, 'rejected');
  assert.equal(versions[1].status, 'accepted');
  assert.ok(versions[0].accounts[0].encrypted.password);
});

test('partial refund refunds only disputed amount', async () => {
  const adminToken = await createAdminToken();
  const { token: sellerToken } = await createSeller();
  const { token: buyerToken } = await createBuyer();
  const product = await createLiveProduct(adminToken, sellerToken, { stock: 10, price: 10 });
  const paid = await buyAndPay({ buyerToken, productId: product._id, quantity: 10 });

  const dispute = await request(app)
    .post('/api/v1/disputes')
    .set('Authorization', `Bearer ${buyerToken}`)
    .send({
      orderId: paid.order._id,
      reason: 'Refund two',
      description: 'Two accounts unusable after purchase.',
      disputedQuantity: 2,
    });

  const resolve = await request(app)
    .post(`/api/v1/disputes/${dispute.body.data._id}/resolve`)
    .set('Authorization', `Bearer ${adminToken}`)
    .send({
      resolution: 'buyer_wins',
      note: 'Refund disputed quantity only',
    });
  assert.equal(resolve.status, 200, JSON.stringify(resolve.body));
  assert.equal(resolve.body.data.refundQuantity, 2);
  assert.equal(resolve.body.data.refundAmount, 20);

  const escrow = await Escrow.findById(paid.escrow._id).lean();
  assert.equal(escrow.refundedAmount, 20);
  assert.equal(escrow.heldAmount, 0);
  assert.equal(escrow.releasedAmount, 80);

  const wallet = await Wallet.findOne({}).lean();
  // undisputed $80 → seller net $72; disputed refunded from pending
  assert.equal(wallet.availableBalance, 72);
  assert.equal(wallet.pendingBalance, 0);

  const chat = await DisputeChat.findOne({ dispute: dispute.body.data._id }).lean();
  assert.equal(chat.status, 'read_only');
});

test('select exact disputed accounts and dashboard OCR/violation fields', async () => {
  const adminToken = await createAdminToken();
  const { token: sellerToken } = await createSeller();
  const { token: buyerToken } = await createBuyer();
  const product = await createLiveProduct(adminToken, sellerToken, { stock: 5, price: 20 });
  const paid = await buyAndPay({ buyerToken, productId: product._id, quantity: 5 });
  const order = await Order.findById(paid.order._id).lean();
  const pick = order.accounts.slice(0, 2).map((a) => String(a._id));

  const dispute = await request(app)
    .post('/api/v1/disputes')
    .set('Authorization', `Bearer ${buyerToken}`)
    .send({
      orderId: paid.order._id,
      reason: 'Selected accounts bad',
      description: 'Selected exact accounts with Instagram disabled evidence.',
      disputedAccountIds: pick,
    });
  assert.equal(dispute.status, 201, JSON.stringify(dispute.body));
  assert.equal(dispute.body.data.disputedQuantity, 2);
  assert.equal(dispute.body.data.disputedAmount, 40);
  assert.equal(dispute.body.data.disputedAccountIds.length, 2);

  const refreshed = await Order.findById(paid.order._id).lean();
  const disputedStatuses = refreshed.accounts
    .filter((a) => pick.includes(String(a._id)))
    .map((a) => a.status);
  assert.deepEqual(disputedStatuses, ['disputed', 'disputed']);

  setOcrImplementation(async () => ({
    text: 'WhatsApp +923001234567 email recovery@gmail.com https://evil.example',
    confidence: 91,
  }));

  const evidence = await request(app)
    .post(`/api/v1/disputes/${dispute.body.data._id}/chat/messages`)
    .set('Authorization', `Bearer ${buyerToken}`)
    .send({
      body: 'Screenshot of disabled account panel.',
      attachments: ['https://cdn.example.com/evidence/disabled.png'],
    });
  assert.equal(evidence.status, 201, JSON.stringify(evidence.body));

  const dash = await request(app)
    .get(`/api/v1/disputes/${dispute.body.data._id}/dashboard`)
    .set('Authorization', `Bearer ${adminToken}`);
  assert.equal(dash.status, 200);
  assert.ok(dash.body.data.ocrFlagCount >= 1);
  assert.ok(dash.body.data.timeline.some((t) => t.event === 'ocr_flagged'));
});

test('credential expiry clears encrypted blobs and keeps audits', async () => {
  const adminToken = await createAdminToken();
  const { token: sellerToken } = await createSeller();
  const { token: buyerToken } = await createBuyer();
  const product = await createLiveProduct(adminToken, sellerToken, { stock: 1, price: 50 });
  const paid = await buyAndPay({ buyerToken, productId: product._id, quantity: 1 });
  const dispute = await request(app)
    .post('/api/v1/disputes')
    .set('Authorization', `Bearer ${buyerToken}`)
    .send({
      orderId: paid.order._id,
      reason: 'Expire test',
      description: 'Need credential expiry coverage for security policy.',
    });

  const shared = await request(app)
    .post(`/api/v1/disputes/${dispute.body.data._id}/chat/credentials`)
    .set('Authorization', `Bearer ${sellerToken}`)
    .send({
      credentials: { password: 'TempPass!', username: 'tmp' },
    });
  assert.equal(shared.status, 201);

  await DisputeChatMessage.updateOne(
    { _id: shared.body.data._id },
    { $set: { credentialsExpireAt: new Date(Date.now() - 1000) } },
  );

  const result = await expireDueCredentials();
  assert.equal(result.expiredMessages, 1);

  const stored = await DisputeChatMessage.findById(shared.body.data._id).lean();
  assert.equal(stored.credentialsExpired, true);
  assert.equal(stored.credentialsEncrypted, null);

  const audits = await DisputeChatAuditLog.find({
    action: 'credential_expired',
  }).lean();
  assert.ok(audits.length >= 1);
});
