import test, { before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { resetDb, setupTestDb, teardownTestDb } from '../helpers/setup.js';

const { env } = await import('../../src/config/env.js');
const { loginOrRegisterWithGoogle } = await import('../../src/services/auth.service.js');
const { User, SellerProfile, BuyerProfile } = await import('../../src/models/index.js');
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

function googleProfile({
  id = 'google-seller-1',
  email = 'seller.google@example.com',
  displayName = 'Seller Google',
} = {}) {
  return {
    id,
    email,
    displayName,
    photos: [{ value: 'https://example.com/avatar.png' }],
  };
}

test('Google OAuth with buyer intent creates buyer only (no seller profile)', async () => {
  const prev = env.googleOAuthConfigured;
  env.googleOAuthConfigured = true;
  try {
    const result = await loginOrRegisterWithGoogle(googleProfile({
      id: 'g-buyer-1',
      email: 'buyer.google@example.com',
      displayName: 'Buyer Google',
    }), { ip: '127.0.0.1' }, { intent: 'buyer' });

    assert.equal(result.created, true);
    assert.deepEqual(result.user.roles.sort(), ['buyer']);
    assert.ok(result.accessToken);

    const seller = await SellerProfile.findOne({ user: result.user.id });
    assert.equal(seller, null);
    const buyer = await BuyerProfile.findOne({ user: result.user.id });
    assert.ok(buyer);
  } finally {
    env.googleOAuthConfigured = prev;
  }
});

test('Google OAuth with seller intent creates seller role + SellerProfile + JWT seller role', async () => {
  const prev = env.googleOAuthConfigured;
  env.googleOAuthConfigured = true;
  try {
    const result = await loginOrRegisterWithGoogle(
      googleProfile({
        id: 'g-seller-1',
        email: 'newseller.google@example.com',
        displayName: 'Studio Lume',
      }),
      { ip: '127.0.0.1' },
      { intent: 'seller', storeName: 'Studio Lume', username: 'studio_lume' },
    );

    assert.equal(result.created, true);
    assert.equal(result.createdSeller, true);
    assert.ok(result.user.roles.includes(USER_ROLES.SELLER));
    assert.ok(result.user.roles.includes(USER_ROLES.BUYER));
    assert.ok(result.accessToken);

    const seller = await SellerProfile.findOne({ user: result.user.id });
    assert.ok(seller);
    assert.equal(seller.storeName, 'Studio Lume');
    assert.equal(seller.status, 'pending');

    const user = await User.findById(result.user.id);
    assert.ok(user.roles.includes(USER_ROLES.SELLER));
    assert.equal(user.username, 'studio_lume');
  } finally {
    env.googleOAuthConfigured = prev;
  }
});

test('Google OAuth seller intent upgrades existing buyer and is idempotent', async () => {
  const prev = env.googleOAuthConfigured;
  env.googleOAuthConfigured = true;
  try {
    const first = await loginOrRegisterWithGoogle(
      googleProfile({ id: 'g-upgrade-1', email: 'upgrade.google@example.com', displayName: 'Upgrade Me' }),
      {},
      { intent: 'buyer' },
    );
    assert.deepEqual(first.user.roles, ['buyer']);
    assert.equal(await SellerProfile.countDocuments({ user: first.user.id }), 0);

    const upgraded = await loginOrRegisterWithGoogle(
      googleProfile({ id: 'g-upgrade-1', email: 'upgrade.google@example.com', displayName: 'Upgrade Me' }),
      {},
      { intent: 'seller' },
    );
    assert.equal(upgraded.created, false);
    assert.equal(upgraded.createdSeller, true);
    assert.ok(upgraded.user.roles.includes(USER_ROLES.SELLER));
    assert.equal(await SellerProfile.countDocuments({ user: first.user.id }), 1);

    const again = await loginOrRegisterWithGoogle(
      googleProfile({ id: 'g-upgrade-1', email: 'upgrade.google@example.com', displayName: 'Upgrade Me' }),
      {},
      { intent: 'seller' },
    );
    assert.equal(again.createdSeller, false);
    assert.ok(again.user.roles.includes(USER_ROLES.SELLER));
    assert.equal(await SellerProfile.countDocuments({ user: first.user.id }), 1);
  } finally {
    env.googleOAuthConfigured = prev;
  }
});
