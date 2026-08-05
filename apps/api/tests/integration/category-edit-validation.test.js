import test, { before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { resetDb, setupTestDb, teardownTestDb } from '../helpers/setup.js';

const { default: app } = await import('../../src/app.js');
const { User } = await import('../../src/models/index.js');
const { hashPassword } = await import('../../src/utils/password.js');
const { USER_ROLES } = await import('../../src/constants/roles.js');
const { categoryUpdateSchema } = await import('../../src/validators/catalog.validator.js');

async function createAdminToken() {
  await User.create({
    email: 'category-edit-admin@example.com',
    passwordHash: await hashPassword('Password123!'),
    name: 'Category Admin',
    roles: [USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN],
    emailVerified: true,
  });
  const login = await request(app)
    .post('/api/v1/auth/admin/login')
    .send({ email: 'category-edit-admin@example.com', password: 'Password123!' });
  assert.equal(login.status, 200, JSON.stringify(login.body));
  return login.body.data.accessToken;
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

test('categoryUpdateSchema accepts typical edit payload with blank images', () => {
  const parsed = categoryUpdateSchema.body.safeParse({
    name: 'Facebook Accounts',
    slug: 'facebook-accounts',
    description: 'Updated description',
    image: '',
    icon: 'Facebook',
    parent: '6a6f1781e65942a05aa0df21',
    displayOrder: '1',
    status: 'active',
    featured: false,
    showInHeader: true,
    showOnHomepage: true,
    seoTitle: '',
    seoDescription: '',
    ogImage: '',
  });
  assert.equal(parsed.success, true, JSON.stringify(parsed.error?.issues));
  assert.equal(parsed.data.image, null);
  assert.equal(parsed.data.ogImage, null);
  assert.equal(parsed.data.seoTitle, null);
  assert.equal(parsed.data.displayOrder, 1);
  assert.equal(parsed.data.parent, '6a6f1781e65942a05aa0df21');
});

test('categoryUpdateSchema maps root parent sentinels to null', () => {
  for (const parent of ['__root__', 'null', '', null]) {
    const parsed = categoryUpdateSchema.body.safeParse({ name: 'Rootish', parent });
    assert.equal(parsed.success, true, JSON.stringify({ parent, issues: parsed.error?.issues }));
    assert.equal(parsed.data.parent, null);
  }
});

test('PATCH category allows description-only edit and unchanged slug', async () => {
  const adminToken = await createAdminToken();

  const parent = await request(app)
    .post('/api/v1/categories')
    .set('Authorization', `Bearer ${adminToken}`)
    .send({ name: 'Social Media', slug: 'social-media' });
  assert.equal(parent.status, 201, JSON.stringify(parent.body));

  const created = await request(app)
    .post('/api/v1/categories')
    .set('Authorization', `Bearer ${adminToken}`)
    .send({
      name: 'Facebook Accounts',
      slug: 'facebook-accounts',
      description: 'Original',
      parent: parent.body.data._id,
      icon: 'Facebook',
      image: '',
      ogImage: '',
      status: 'active',
    });
  assert.equal(created.status, 201, JSON.stringify(created.body));
  const id = created.body.data._id;

  const descOnly = await request(app)
    .patch(`/api/v1/categories/${id}`)
    .set('Authorization', `Bearer ${adminToken}`)
    .send({
      name: 'Facebook Accounts',
      slug: 'facebook-accounts',
      description: 'Changed description only',
      image: '',
      icon: 'Facebook',
      parent: parent.body.data._id,
      displayOrder: 1,
      status: 'active',
      featured: false,
      showInHeader: true,
      showOnHomepage: true,
      seoTitle: '',
      seoDescription: '',
      ogImage: '',
    });
  assert.equal(descOnly.status, 200, JSON.stringify(descOnly.body));
  assert.equal(descOnly.body.data.description, 'Changed description only');
  assert.equal(descOnly.body.data.slug, 'facebook-accounts');
  assert.equal(descOnly.body.data.parent, parent.body.data._id);

  const rename = await request(app)
    .patch(`/api/v1/categories/${id}`)
    .set('Authorization', `Bearer ${adminToken}`)
    .send({ name: 'FB Accounts' });
  assert.equal(rename.status, 200, JSON.stringify(rename.body));
  assert.equal(rename.body.data.name, 'FB Accounts');

  const slugChange = await request(app)
    .patch(`/api/v1/categories/${id}`)
    .set('Authorization', `Bearer ${adminToken}`)
    .send({ slug: 'fb-accounts-v2' });
  assert.equal(slugChange.status, 200, JSON.stringify(slugChange.body));
  assert.equal(slugChange.body.data.slug, 'fb-accounts-v2');

  const keepSlug = await request(app)
    .patch(`/api/v1/categories/${id}`)
    .set('Authorization', `Bearer ${adminToken}`)
    .send({ slug: 'fb-accounts-v2', description: 'Still ok' });
  assert.equal(keepSlug.status, 200, JSON.stringify(keepSlug.body));
  assert.equal(keepSlug.body.data.slug, 'fb-accounts-v2');

  const reparentRoot = await request(app)
    .patch(`/api/v1/categories/${id}`)
    .set('Authorization', `Bearer ${adminToken}`)
    .send({ parent: null });
  assert.equal(reparentRoot.status, 200, JSON.stringify(reparentRoot.body));
  assert.equal(reparentRoot.body.data.parent, null);

  const invalidParent = await request(app)
    .patch(`/api/v1/categories/${id}`)
    .set('Authorization', `Bearer ${adminToken}`)
    .send({ parent: id });
  assert.equal(invalidParent.status, 400, JSON.stringify(invalidParent.body));
  assert.match(String(invalidParent.body.message || ''), /parent/i);
});

test('validation errors include field paths in message', async () => {
  const adminToken = await createAdminToken();
  const created = await request(app)
    .post('/api/v1/categories')
    .set('Authorization', `Bearer ${adminToken}`)
    .send({ name: 'Editable' });
  assert.equal(created.status, 201);

  const bad = await request(app)
    .patch(`/api/v1/categories/${created.body.data._id}`)
    .set('Authorization', `Bearer ${adminToken}`)
    .send({ name: 'x' });
  assert.equal(bad.status, 400);
  assert.equal(bad.body.code, 'VALIDATION_ERROR');
  assert.match(bad.body.message, /name/i);
  assert.ok(Array.isArray(bad.body.errors));
  assert.ok(bad.body.errors.some((e) => e.path === 'name'));
});
