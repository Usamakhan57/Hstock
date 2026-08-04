import test, { before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { resetDb, setupTestDb, teardownTestDb } from '../helpers/setup.js';

const { default: app } = await import('../../src/app.js');
const { User, SellerProfile, Escrow, Wallet, LedgerEntry, Order } = await import('../../src/models/index.js');
const { hashPassword } = await import('../../src/utils/password.js');
const { USER_ROLES } = await import('../../src/constants/roles.js');
const { releaseEscrow } = await import('../../src/services/escrow.service.js');
const { fundBuyerWallet, buyNowWithWallet } = await import('../helpers/walletBuy.js');

async function createAdminToken() {
  await User.create({
    email: 'commerce-admin@example.com',
    passwordHash: await hashPassword('Password123!'),
    name: 'Commerce Admin',
    roles: [USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN],
    emailVerified: true,
  });

  const login = await request(app)
    .post('/api/v1/auth/admin/login')
    .send({ email: 'commerce-admin@example.com', password: 'Password123!' });

  return login.body.data.accessToken;
}

async function createSeller() {
  const register = await request(app)
    .post('/api/v1/auth/seller/register')
    .send({
      name: 'Commerce Seller',
      email: 'commerce-seller@example.com',
      password: 'Password123!',
      storeName: 'Commerce Seller Store',
    });

  assert.equal(register.status, 201, JSON.stringify(register.body));
  const sellerId = register.body.data.seller._id || register.body.data.seller.id;
  await SellerProfile.findByIdAndUpdate(sellerId, { status: 'approved' });

  return {
    token: register.body.data.accessToken,
    seller: { ...register.body.data.seller, _id: sellerId },
  };
}

async function createBuyer() {
  const register = await request(app)
    .post('/api/v1/auth/register')
    .send({
      name: 'Commerce Buyer',
      email: 'commerce-buyer@example.com',
      password: 'Password123!',
    });
  assert.equal(register.status, 201);
  return { token: register.body.data.accessToken };
}

async function createLiveProduct(adminToken, sellerToken) {
  const category = await request(app)
    .post('/api/v1/categories')
    .set('Authorization', `Bearer ${adminToken}`)
    .send({ name: 'Commerce Apps' });

  assert.equal(category.status, 201, JSON.stringify(category.body));

  const product = await request(app)
    .post('/api/v1/products')
    .set('Authorization', `Bearer ${sellerToken}`)
    .send({
      title: 'Premium License Key',
      description: 'Digital license',
      shortDescription: 'License key pack',
      price: 100,
      productType: 'license_keys',
      category: category.body.data._id,
      stock: 5,
      stockType: 'limited',
      // Commerce escrow tests use Manual Delivery (Instant Access covered separately).
      deliveryType: 'manual',
      digital: {
        downloadType: 'manual',
        automatic: false,
        manual: true,
        downloadUrl: 'https://files.example.com/license.txt',
        fileType: 'txt',
        deliveryInstructions: 'Keys delivered after payment',
      },
    });

  assert.equal(product.status, 201, JSON.stringify(product.body));
  const productId = product.body.data._id;

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

test('buy now pays from wallet and locks escrow', async () => {
  const adminToken = await createAdminToken();
  const { token: sellerToken } = await createSeller();
  const { token: buyerToken } = await createBuyer();
  const product = await createLiveProduct(adminToken, sellerToken);
  const productId = product.id || product._id;

  await fundBuyerWallet('commerce-buyer@example.com', 200);

  const buy = await buyNowWithWallet(app, { token: buyerToken, productId });

  assert.equal(buy.status, 201, JSON.stringify(buy.body));
  assert.equal(buy.body.data.paymentMethod, 'wallet');
  assert.ok(['paid', 'escrow'].includes(buy.body.data.order.status), buy.body.data.order.status);
  assert.equal(buy.body.data.order.commissionPercent, 10);
  assert.equal(buy.body.data.order.commissionAmount, 10);
  assert.equal(buy.body.data.order.sellerAmount, 90);
  assert.ok(buy.body.data.escrow);
});

test('buy now rejects cryptomus direct product payment', async () => {
  const adminToken = await createAdminToken();
  const { token: sellerToken } = await createSeller();
  const { token: buyerToken } = await createBuyer();
  const product = await createLiveProduct(adminToken, sellerToken);
  const productId = product.id || product._id;

  const buy = await request(app)
    .post('/api/v1/orders/buy-now')
    .set('Authorization', `Bearer ${buyerToken}`)
    .send({ productId, paymentMethod: 'cryptomus', toCurrency: 'USDT', network: 'tron' });

  assert.equal(buy.status, 400, JSON.stringify(buy.body));
});

test('buy now fails with insufficient wallet balance', async () => {
  const adminToken = await createAdminToken();
  const { token: sellerToken } = await createSeller();
  const { token: buyerToken } = await createBuyer();
  const product = await createLiveProduct(adminToken, sellerToken);
  const productId = product.id || product._id;

  const buy = await buyNowWithWallet(app, { token: buyerToken, productId });
  assert.equal(buy.status, 400, JSON.stringify(buy.body));
  assert.ok(
    buy.body.code === 'INSUFFICIENT_WALLET_BALANCE'
      || /insufficient wallet/i.test(buy.body.message || ''),
    JSON.stringify(buy.body),
  );
});

test('wallet buy-now creates paid order with escrow pending credit', async () => {
  const adminToken = await createAdminToken();
  const { token: sellerToken, seller } = await createSeller();
  const { token: buyerToken } = await createBuyer();
  const product = await createLiveProduct(adminToken, sellerToken);
  const productId = product.id || product._id;

  await fundBuyerWallet('commerce-buyer@example.com', 200);
  const buy = await buyNowWithWallet(app, { token: buyerToken, productId });
  assert.equal(buy.status, 201, JSON.stringify(buy.body));

  const wallet = await request(app)
    .get('/api/v1/wallet/me')
    .set('Authorization', `Bearer ${sellerToken}`);
  assert.equal(wallet.body.data.pendingBalance, 100);

  const sellerId = seller.id || seller._id;
  const escrows = await Escrow.find({ seller: sellerId });
  assert.equal(escrows.length, 1);
  assert.equal(escrows[0].status, 'locked');
});

test('wallet checkout funds escrow ledger once', async () => {
  const adminToken = await createAdminToken();
  const { token: sellerToken, seller } = await createSeller();
  const { token: buyerToken } = await createBuyer();
  const product = await createLiveProduct(adminToken, sellerToken);

  await fundBuyerWallet('commerce-buyer@example.com', 200);
  const buy = await buyNowWithWallet(app, { token: buyerToken, productId: product.id || product._id });
  assert.equal(buy.status, 201, JSON.stringify(buy.body));
  const paymentId = buy.body.data.payment._id;

  const wallet = await request(app)
    .get('/api/v1/wallet/me')
    .set('Authorization', `Bearer ${sellerToken}`);
  assert.equal(wallet.body.data.pendingBalance, 100);

  const sellerId = seller.id || seller._id;
  const escrows = await Escrow.find({ seller: sellerId });
  assert.equal(escrows.length, 1);
  assert.equal(escrows[0].status, 'locked');

  const fundEntries = await LedgerEntry.find({
    transferId: `escrow_fund_${paymentId}`,
  });
  assert.equal(fundEntries.length, 2);
});

test('checkout assets endpoint returns currencies with networks', async () => {
  const { token: buyerToken } = await createBuyer();
  const res = await request(app)
    .get('/api/v1/payments/cryptomus/checkout-assets')
    .set('Authorization', `Bearer ${buyerToken}`);

  assert.equal(res.status, 200, JSON.stringify(res.body));
  assert.ok(Array.isArray(res.body.data));
  assert.ok(res.body.data.length >= 8);
  const usdt = res.body.data.find((asset) => asset.symbol === 'USDT');
  assert.ok(usdt);
  assert.ok(Array.isArray(usdt.networks));
  assert.ok(usdt.networks.some((n) => n.code === 'tron'));
  assert.equal(res.body.meta?.source, 'fallback');
});

test('wallet payment confirmation locks escrow and credits seller pending', async () => {
  const adminToken = await createAdminToken();
  const { token: sellerToken, seller } = await createSeller();
  const { token: buyerToken } = await createBuyer();
  const product = await createLiveProduct(adminToken, sellerToken);
  const productId = product.id || product._id;

  await fundBuyerWallet('commerce-buyer@example.com', 200);
  const buy = await buyNowWithWallet(app, { token: buyerToken, productId });
  assert.equal(buy.status, 201, JSON.stringify(buy.body));

  const order = await request(app)
    .get(`/api/v1/orders/${buy.body.data.order._id}`)
    .set('Authorization', `Bearer ${buyerToken}`);

  assert.equal(order.status, 200);
  assert.equal(order.body.data.status, 'escrow');

  const wallet = await request(app)
    .get('/api/v1/wallet/me')
    .set('Authorization', `Bearer ${sellerToken}`);

  assert.equal(wallet.status, 200);
  assert.equal(wallet.body.data.pendingBalance, 100);
  assert.equal(wallet.body.data.availableBalance, 0);

  const sellerId = seller.id || seller._id;
  const escrow = await Escrow.findOne({ seller: sellerId });
  assert.ok(escrow);
  assert.equal(escrow.status, 'locked');
  // Manual delivery: inspection Timer #1 starts at delivery, not at escrow lock.
  assert.equal(escrow.releaseAt, null);
});

test('escrow release credits seller wallet minus commission', async () => {
  const adminToken = await createAdminToken();
  const { token: sellerToken } = await createSeller();
  const { token: buyerToken } = await createBuyer();
  const product = await createLiveProduct(adminToken, sellerToken);

  await fundBuyerWallet('commerce-buyer@example.com', 200);
  const buy = await buyNowWithWallet(app, { token: buyerToken, productId: product.id || product._id });
  assert.equal(buy.status, 201, JSON.stringify(buy.body));

  const escrowId = buy.body.data.escrow._id || buy.body.data.escrow.id;
  await releaseEscrow(escrowId, { reason: 'test_release' });

  const wallet = await request(app)
    .get('/api/v1/wallet/me')
    .set('Authorization', `Bearer ${sellerToken}`);

  assert.equal(wallet.body.data.pendingBalance, 0);
  assert.equal(wallet.body.data.availableBalance, 90);
  assert.equal(wallet.body.data.withdrawableBalance, 90);
  assert.equal(wallet.body.data.releasedBalance, 90);
  assert.equal(wallet.body.data.totalCommissionPaid, 10);

  const entries = await LedgerEntry.find({}).lean();
  assert.ok(entries.length >= 4);

  // Every transferId must balance
  const byTransfer = new Map();
  for (const entry of entries) {
    const bucket = byTransfer.get(entry.transferId) || { debit: 0, credit: 0 };
    if (entry.direction === 'debit') bucket.debit += entry.amount;
    else bucket.credit += entry.amount;
    byTransfer.set(entry.transferId, bucket);
  }
  for (const [, totals] of byTransfer) {
    assert.equal(Number(totals.debit.toFixed(2)), Number(totals.credit.toFixed(2)));
  }
});

test('withdrawal is manual: request → approve → pay', async () => {
  const adminToken = await createAdminToken();
  const { token: sellerToken } = await createSeller();
  const { token: buyerToken } = await createBuyer();
  const product = await createLiveProduct(adminToken, sellerToken);

  await fundBuyerWallet('commerce-buyer@example.com', 200);
  const buy = await buyNowWithWallet(app, { token: buyerToken, productId: product._id });
  assert.equal(buy.status, 201, JSON.stringify(buy.body));

  await releaseEscrow(buy.body.data.escrow._id, { reason: 'test_release' });

  const withdraw = await request(app)
    .post('/api/v1/withdrawals')
    .set('Authorization', `Bearer ${sellerToken}`)
    .send({
      coin: 'USDT',
      network: 'TRC20',
      walletAddress: 'TJYeasRQmcrJtWAgqZbiC4W2uKA4sZtQdH',
      amount: 50,
    });

  assert.equal(withdraw.status, 201, JSON.stringify(withdraw.body));
  const withdrawalId = withdraw.body.data._id;

  const approve = await request(app)
    .post(`/api/v1/withdrawals/${withdrawalId}/approve`)
    .set('Authorization', `Bearer ${adminToken}`)
    .send({ note: 'Looks good' });
  assert.equal(approve.status, 200);
  assert.equal(approve.body.data.status, 'approved');

  const pay = await request(app)
    .post(`/api/v1/withdrawals/${withdrawalId}/pay`)
    .set('Authorization', `Bearer ${adminToken}`)
    .send({ payoutTxid: 'manual-txid-1' });
  assert.equal(pay.status, 200);
  assert.equal(pay.body.data.status, 'paid');

  const wallet = await Wallet.findOne({});
  assert.equal(wallet.availableBalance, 40);
  assert.equal(wallet.totalWithdrawn, 50);
});

test('dispute freezes escrow and blocks release', async () => {
  const adminToken = await createAdminToken();
  const { token: sellerToken } = await createSeller();
  const { token: buyerToken } = await createBuyer();
  const product = await createLiveProduct(adminToken, sellerToken);

  await fundBuyerWallet('commerce-buyer@example.com', 200);
  const buy = await buyNowWithWallet(app, { token: buyerToken, productId: product.id || product._id });
  assert.equal(buy.status, 201, JSON.stringify(buy.body));

  const { startInspectionPeriodForOrder } = await import('../../src/services/escrow.service.js');
  await Order.findByIdAndUpdate(buy.body.data.order._id, {
    deliveryStatus: 'delivered',
    deliveredAt: new Date(),
    status: 'delivered',
  });
  await startInspectionPeriodForOrder(buy.body.data.order._id);

  const dispute = await request(app)
    .post('/api/v1/disputes')
    .set('Authorization', `Bearer ${buyerToken}`)
    .send({
      orderId: buy.body.data.order._id,
      reason: 'Not as described',
      description: 'The digital product keys do not work as advertised.',
    });

  assert.equal(dispute.status, 201, JSON.stringify(dispute.body));
  assert.equal(dispute.body.data.status, 'open');
  assert.ok(dispute.body.data.chat, 'secure dispute chat should be auto-created');

  let blocked = false;
  try {
    await releaseEscrow(buy.body.data.escrow._id, { reason: 'should_fail' });
  } catch {
    blocked = true;
  }
  assert.equal(blocked, true);

  const resolve = await request(app)
    .post(`/api/v1/disputes/${dispute.body.data._id}/resolve`)
    .set('Authorization', `Bearer ${adminToken}`)
    .send({
      resolution: 'seller_wins',
      note: 'Evidence supports seller',
    });

  assert.equal(resolve.status, 200, JSON.stringify(resolve.body));
  assert.equal(resolve.body.data.resolution, 'seller_wins');

  const wallet = await request(app)
    .get('/api/v1/wallet/me')
    .set('Authorization', `Bearer ${sellerToken}`);
  assert.equal(wallet.body.data.availableBalance, 90);
});

test('cryptomus webhook signature verification rejects fakes', async () => {
  const fake = await request(app)
    .post('/api/v1/payments/cryptomus/webhook')
    .send({
      uuid: '00000000-0000-0000-0000-000000000000',
      order_id: 'fake-order-id',
      status: 'paid',
      sign: 'invalidsignature0000000000000000',
    });

  // Without configured API key in test, webhook verification fails as not configured or invalid
  assert.ok([401, 503].includes(fake.status), `unexpected status ${fake.status}`);
});

test('api v1 lists commerce modules', async () => {
  const res = await request(app).get('/api/v1');
  assert.equal(res.status, 200);
  assert.ok(res.body.data.modules.includes('orders'));
  assert.ok(res.body.data.modules.includes('payments'));
  assert.ok(res.body.data.modules.includes('escrow'));
  assert.ok(res.body.data.modules.includes('wallet'));
  assert.ok(res.body.data.modules.includes('withdrawals'));
  assert.ok(res.body.data.modules.includes('disputes'));
});
