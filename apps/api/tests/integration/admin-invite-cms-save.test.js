import test, { before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { resetDb, setupTestDb, teardownTestDb } from '../helpers/setup.js';

const { default: app } = await import('../../src/app.js');
const { User, PasswordResetToken, AdminProfile } = await import('../../src/models/index.js');
const { hashPassword } = await import('../../src/utils/password.js');
const { USER_ROLES } = await import('../../src/constants/roles.js');
const { UserStatusEnum } = await import('../../src/constants/enums.js');
const { CMS_KEYS } = await import('../../src/constants/cmsDefaults.js');
const { invalidateCmsCache } = await import('../../src/services/cms.service.js');

async function createAdminToken(email = 'invite-admin@example.com') {
  await User.create({
    email,
    passwordHash: await hashPassword('Password123!'),
    name: 'Invite Admin',
    roles: [USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN],
    emailVerified: true,
  });

  const login = await request(app)
    .post('/api/v1/auth/admin/login')
    .send({ email, password: 'Password123!' });

  assert.equal(login.status, 200, JSON.stringify(login.body));
  return login.body.data.accessToken;
}

before(async () => {
  await setupTestDb();
});

beforeEach(async () => {
  await resetDb();
  invalidateCmsCache();
});

after(async () => {
  await teardownTestDb();
});

test('POST /users/invite creates invited staff user and set-password token', async () => {
  const adminToken = await createAdminToken();

  const res = await request(app)
    .post('/api/v1/users/invite')
    .set('Authorization', `Bearer ${adminToken}`)
    .send({ name: 'New Editor', email: 'editor@example.com', role: 'editor' });

  assert.equal(res.status, 200, JSON.stringify(res.body));
  assert.equal(res.body.data.user.email, 'editor@example.com');
  assert.equal(res.body.data.user.status, UserStatusEnum.Invited);
  assert.ok(res.body.data.user.roles.includes(USER_ROLES.EDITOR));
  assert.ok(res.body.data.resetUrl);

  const user = await User.findOne({ email: 'editor@example.com' });
  assert.ok(user);
  assert.equal(user.status, UserStatusEnum.Invited);

  const profile = await AdminProfile.findOne({ user: user._id });
  assert.ok(profile);
  assert.equal(profile.staffRole, USER_ROLES.EDITOR);

  const tokens = await PasswordResetToken.find({ user: user._id, usedAt: null });
  assert.equal(tokens.length, 1);

  // Invited users cannot log into admin until password is set.
  const blocked = await request(app)
    .post('/api/v1/auth/admin/login')
    .send({ email: 'editor@example.com', password: 'anything' });
  assert.equal(blocked.status, 401);

  // Completing reset activates the account.
  const url = new URL(res.body.data.resetUrl);
  const token = url.searchParams.get('token');
  const reset = await request(app)
    .post('/api/v1/auth/reset-password')
    .send({ token, password: 'NewPass123!' });
  assert.equal(reset.status, 200, JSON.stringify(reset.body));

  const activated = await User.findById(user._id);
  assert.equal(activated.status, UserStatusEnum.Active);

  const login = await request(app)
    .post('/api/v1/auth/admin/login')
    .send({ email: 'editor@example.com', password: 'NewPass123!' });
  assert.equal(login.status, 200, JSON.stringify(login.body));
});

test('POST /users/invite rejects duplicate email and invalid role', async () => {
  const adminToken = await createAdminToken();

  await request(app)
    .post('/api/v1/users/invite')
    .set('Authorization', `Bearer ${adminToken}`)
    .send({ name: 'Dup', email: 'dup@example.com', role: 'support' })
    .expect(200);

  const dup = await request(app)
    .post('/api/v1/users/invite')
    .set('Authorization', `Bearer ${adminToken}`)
    .send({ name: 'Dup2', email: 'dup@example.com', role: 'support' });
  assert.equal(dup.status, 409);

  const badRole = await request(app)
    .post('/api/v1/users/invite')
    .set('Authorization', `Bearer ${adminToken}`)
    .send({ name: 'Buyer', email: 'buyer-invite@example.com', role: 'buyer' });
  assert.equal(badRole.status, 400);
});

test('PUT /cms/header returns promptly for authenticated admin (no hang)', async () => {
  const adminToken = await createAdminToken('cms-header@example.com');

  const started = Date.now();
  const res = await request(app)
    .put(`/api/v1/cms/${CMS_KEYS.HEADER}`)
    .set('Authorization', `Bearer ${adminToken}`)
    .send({
      data: {
        logo: '',
        stickyHeader: true,
        megaMenuEnabled: true,
        searchPlaceholder: 'Search…',
        brandName: 'ApnaStore',
        topBar: { enabled: false, text: '', linkText: '', linkUrl: '' },
        announcementBar: {
          enabled: false,
          text: '',
          linkText: '',
          linkUrl: '',
          backgroundColor: '#7C3AED',
        },
        becomeSellerButton: { enabled: true, text: 'Become a Seller', url: '/become-a-seller' },
        headerButtons: [],
        popularSearches: [],
      },
    });
  const elapsed = Date.now() - started;

  assert.equal(res.status, 200, JSON.stringify(res.body));
  assert.equal(res.body.data.data.brandName, 'ApnaStore');
  assert.ok(elapsed < 5000, `CMS header save took too long: ${elapsed}ms`);
});
