import test, { before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { resetDb, setupTestDb, teardownTestDb } from '../helpers/setup.js';

const { default: app } = await import('../../src/app.js');
const { User, DigitalAssetClaim } = await import('../../src/models/index.js');
const { hashPassword } = await import('../../src/utils/password.js');
const { USER_ROLES } = await import('../../src/constants/roles.js');
const { ASSET_DUPLICATE_MESSAGE, ASSET_CLAIM_STATUS } = await import('../../src/constants/assetUniqueness.js');

async function createAdminToken() {
  await User.create({
    email: 'asset-admin@example.com',
    passwordHash: await hashPassword('Password123!'),
    name: 'Asset Admin',
    roles: [USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN],
    emailVerified: true,
  });

  const login = await request(app)
    .post('/api/v1/auth/admin/login')
    .send({ email: 'asset-admin@example.com', password: 'Password123!' });

  return login.body.data.accessToken;
}

async function createSeller(email, storeName) {
  const register = await request(app)
    .post('/api/v1/auth/seller/register')
    .send({
      name: storeName,
      email,
      password: 'Password123!',
      storeName,
    });

  return {
    token: register.body.data.accessToken,
    seller: register.body.data.seller,
  };
}

async function createListing(token, body) {
  return request(app)
    .post('/api/v1/products')
    .set('Authorization', `Bearer ${token}`)
    .send(body);
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

test('duplicate email account is rejected with HTTP 409', async () => {
  const { token: sellerA } = await createSeller('seller-a@example.com', 'Seller A Store');
  const { token: sellerB } = await createSeller('seller-b@example.com', 'Seller B Store');

  const first = await createListing(sellerA, {
    title: 'Gmail Asset A',
    price: 20,
    productType: 'email_accounts',
    assetIdentifier: 'AMANKHAN@gmail.com',
  });
  assert.equal(first.status, 201);
  assert.equal(first.body.data.assetIdentifierNormalized, 'amankhan@gmail.com');

  const second = await createListing(sellerB, {
    title: 'Gmail Asset B',
    price: 25,
    productType: 'email_accounts',
    assetIdentifier: '  amankhan@gmail.com  ',
  });
  assert.equal(second.status, 409);
  assert.equal(second.body.message, ASSET_DUPLICATE_MESSAGE);
  assert.equal(second.body.code, 'ASSET_ALREADY_LISTED');
});

test('duplicate Instagram username is rejected', async () => {
  const { token: sellerA } = await createSeller('ig-a@example.com', 'IG A');
  const { token: sellerB } = await createSeller('ig-b@example.com', 'IG B');

  const first = await createListing(sellerA, {
    title: 'IG Account',
    price: 50,
    productType: 'instagram',
    assetIdentifier: '@CoolUser',
  });
  assert.equal(first.status, 201);

  const second = await createListing(sellerB, {
    title: 'IG Account Copy',
    price: 55,
    productType: 'social_accounts',
    assetPlatform: 'instagram',
    assetIdentifier: 'https://instagram.com/cooluser/',
  });
  assert.equal(second.status, 409);
  assert.equal(second.body.message, ASSET_DUPLICATE_MESSAGE);
});

test('duplicate domain and website are rejected', async () => {
  const { token: sellerA } = await createSeller('dom-a@example.com', 'Dom A');
  const { token: sellerB } = await createSeller('dom-b@example.com', 'Dom B');

  const domain = await createListing(sellerA, {
    title: 'Premium Domain',
    price: 100,
    productType: 'domains',
    assetIdentifier: 'HTTPS://WWW.Example.com',
  });
  assert.equal(domain.status, 201);
  assert.equal(domain.body.data.assetIdentifierNormalized, 'domain:example.com');

  const domainDup = await createListing(sellerB, {
    title: 'Domain Dup',
    price: 110,
    productType: 'domains',
    assetIdentifier: 'example.com',
  });
  assert.equal(domainDup.status, 409);

  const website = await createListing(sellerA, {
    title: 'Shop Site',
    price: 200,
    productType: 'websites',
    assetIdentifier: 'https://shop.example.org/store/',
  });
  assert.equal(website.status, 201);

  const websiteDup = await createListing(sellerB, {
    title: 'Shop Site Dup',
    price: 210,
    productType: 'websites',
    assetIdentifier: 'shop.example.org/store',
  });
  assert.equal(websiteDup.status, 409);
});

test('duplicate TikTok and Telegram are rejected', async () => {
  const { token: sellerA } = await createSeller('tt-a@example.com', 'TT A');
  const { token: sellerB } = await createSeller('tt-b@example.com', 'TT B');

  const tiktok = await createListing(sellerA, {
    title: 'TikTok',
    price: 40,
    productType: 'tiktok',
    assetIdentifier: '@ViralCreator',
  });
  assert.equal(tiktok.status, 201);

  const tiktokDup = await createListing(sellerB, {
    title: 'TikTok Dup',
    price: 41,
    productType: 'tiktok',
    assetIdentifier: 'viralcreator',
  });
  assert.equal(tiktokDup.status, 409);

  const telegram = await createListing(sellerA, {
    title: 'Telegram Channel',
    price: 30,
    productType: 'telegram',
    assetIdentifier: 'https://t.me/NewsChannel',
  });
  assert.equal(telegram.status, 201);

  const telegramDup = await createListing(sellerB, {
    title: 'Telegram Dup',
    price: 31,
    productType: 'telegram',
    assetIdentifier: '@newschannel',
  });
  assert.equal(telegramDup.status, 409);
});

test('duplicate source code identifier is rejected', async () => {
  const { token: sellerA } = await createSeller('src-a@example.com', 'Src A');
  const { token: sellerB } = await createSeller('src-b@example.com', 'Src B');

  const first = await createListing(sellerA, {
    title: 'Repo One',
    price: 80,
    productType: 'source_code',
    assetIdentifier: 'github.com/org/awesome-repo',
  });
  assert.equal(first.status, 201);

  const second = await createListing(sellerB, {
    title: 'Repo Two',
    price: 85,
    productType: 'source_code',
    assetIdentifier: 'HTTPS://github.com/org/awesome-repo/',
  });
  assert.equal(second.status, 409);
});

test('admin cannot create a duplicate asset', async () => {
  const adminToken = await createAdminToken();
  const { token: sellerA } = await createSeller('admin-dup-a@example.com', 'Admin Dup A');

  const first = await createListing(sellerA, {
    title: 'Admin Blocked Asset',
    price: 15,
    productType: 'email_accounts',
    assetIdentifier: 'unique-admin@example.com',
  });
  assert.equal(first.status, 201);

  const adminCreate = await createListing(adminToken, {
    title: 'Admin Attempt',
    price: 16,
    productType: 'email_accounts',
    assetIdentifier: 'UNIQUE-ADMIN@example.com',
  });
  assert.equal(adminCreate.status, 409);
  assert.equal(adminCreate.body.message, ASSET_DUPLICATE_MESSAGE);
});

test('update validation rejects changing asset to an already listed one', async () => {
  const { token: sellerA } = await createSeller('upd-a@example.com', 'Upd A');
  const { token: sellerB } = await createSeller('upd-b@example.com', 'Upd B');

  const listed = await createListing(sellerA, {
    title: 'Listed Email',
    price: 10,
    productType: 'email_accounts',
    assetIdentifier: 'listed@example.com',
  });
  assert.equal(listed.status, 201);

  const other = await createListing(sellerB, {
    title: 'Other Email',
    price: 11,
    productType: 'email_accounts',
    assetIdentifier: 'other@example.com',
  });
  assert.equal(other.status, 201);

  const update = await request(app)
    .patch(`/api/v1/products/${other.body.data._id}`)
    .set('Authorization', `Bearer ${sellerB}`)
    .send({ assetIdentifier: 'LISTED@example.com' });

  assert.equal(update.status, 409);
  assert.equal(update.body.message, ASSET_DUPLICATE_MESSAGE);
});

test('soft delete releases asset for reuse', async () => {
  const { token: sellerA } = await createSeller('soft-a@example.com', 'Soft A');
  const { token: sellerB } = await createSeller('soft-b@example.com', 'Soft B');

  const first = await createListing(sellerA, {
    title: 'Reusable Email',
    price: 12,
    productType: 'email_accounts',
    assetIdentifier: 'reusable@example.com',
  });
  assert.equal(first.status, 201);

  const del = await request(app)
    .delete(`/api/v1/products/${first.body.data._id}`)
    .set('Authorization', `Bearer ${sellerA}`);
  assert.equal(del.status, 200);

  const claim = await DigitalAssetClaim.findOne({
    assetIdentifierNormalized: 'reusable@example.com',
  }).lean();
  assert.equal(claim.status, ASSET_CLAIM_STATUS.RELEASED);

  const second = await createListing(sellerB, {
    title: 'Reused Email',
    price: 13,
    productType: 'email_accounts',
    assetIdentifier: 'reusable@example.com',
  });
  assert.equal(second.status, 201);
});

test('rejected listing releases asset for reuse', async () => {
  const adminToken = await createAdminToken();
  const { token: sellerA } = await createSeller('rej-a@example.com', 'Rej A');
  const { token: sellerB } = await createSeller('rej-b@example.com', 'Rej B');

  const first = await createListing(sellerA, {
    title: 'Pending Reject',
    price: 14,
    productType: 'email_accounts',
    assetIdentifier: 'reject-me@example.com',
  });
  assert.equal(first.status, 201);

  await request(app)
    .post(`/api/v1/products/${first.body.data._id}/submit`)
    .set('Authorization', `Bearer ${sellerA}`);

  const moderate = await request(app)
    .post(`/api/v1/products/${first.body.data._id}/moderate`)
    .set('Authorization', `Bearer ${adminToken}`)
    .send({ approvalStatus: 'rejected' });
  assert.equal(moderate.status, 200);
  assert.equal(moderate.body.data.status, 'rejected');

  const second = await createListing(sellerB, {
    title: 'After Reject',
    price: 15,
    productType: 'email_accounts',
    assetIdentifier: 'reject-me@example.com',
  });
  assert.equal(second.status, 201);
});

test('search uses normalized asset identifiers', async () => {
  const adminToken = await createAdminToken();
  const { token: sellerA } = await createSeller('search-a@example.com', 'Search A');

  const created = await createListing(sellerA, {
    title: 'Searchable IG',
    price: 22,
    productType: 'instagram',
    assetIdentifier: '@SearchHandle',
    status: 'live',
    approvalStatus: 'approved',
  });
  assert.equal(created.status, 201);

  // Seller-created live may still need staff approval path; force via moderate
  await request(app)
    .post(`/api/v1/products/${created.body.data._id}/moderate`)
    .set('Authorization', `Bearer ${adminToken}`)
    .send({ approvalStatus: 'approved', status: 'live' });

  const byAsset = await request(app)
    .get('/api/v1/products')
    .query({ assetIdentifier: 'SEARCHHANDLE', assetPlatform: 'instagram' });

  assert.equal(byAsset.status, 200);
  assert.equal(byAsset.body.data.length, 1);
  assert.equal(byAsset.body.data[0].assetIdentifierNormalized, 'instagram:searchhandle');

  const bySearch = await request(app)
    .get('/api/v1/products')
    .query({ search: '@SearchHandle', assetPlatform: 'instagram' });

  assert.equal(bySearch.status, 200);
  assert.equal(bySearch.body.data.length, 1);
});

test('concurrent duplicate creates: only one wins', async () => {
  const { token: sellerA } = await createSeller('race-a@example.com', 'Race A');
  const { token: sellerB } = await createSeller('race-b@example.com', 'Race B');

  const payloadA = {
    title: 'Race Email A',
    price: 9,
    productType: 'email_accounts',
    assetIdentifier: 'race@example.com',
  };
  const payloadB = {
    title: 'Race Email B',
    price: 9,
    productType: 'email_accounts',
    assetIdentifier: 'RACE@example.com',
  };

  const [resA, resB] = await Promise.all([
    createListing(sellerA, payloadA),
    createListing(sellerB, payloadB),
  ]);

  const statuses = [resA.status, resB.status].sort();
  assert.deepEqual(statuses, [201, 409]);

  const winner = resA.status === 201 ? resA : resB;
  const loser = resA.status === 409 ? resA : resB;
  assert.equal(loser.body.message, ASSET_DUPLICATE_MESSAGE);
  assert.equal(winner.body.data.assetIdentifierNormalized, 'race@example.com');

  const claims = await DigitalAssetClaim.find({
    assetIdentifierNormalized: 'race@example.com',
    status: ASSET_CLAIM_STATUS.CLAIMED,
  });
  assert.equal(claims.length, 1);
});

test('products without assetIdentifier remain backward compatible', async () => {
  const { token: sellerA } = await createSeller('compat-a@example.com', 'Compat A');

  const created = await createListing(sellerA, {
    title: 'No Identifier App',
    price: 49.99,
    productType: 'apps',
  });
  assert.equal(created.status, 201);
  assert.equal(created.body.data.assetIdentifier, null);
});
