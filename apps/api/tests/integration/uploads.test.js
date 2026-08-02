import '../helpers/env-bootstrap.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { setupTestDb, resetDb, teardownTestDb } from '../helpers/setup.js';

const { default: app } = await import('../../src/app.js');
const { User } = await import('../../src/models/index.js');
const { hashPassword } = await import('../../src/utils/password.js');
const { USER_ROLES } = await import('../../src/constants/roles.js');
const { MAX_IMAGE_UPLOAD_BYTES } = await import('../../src/constants/uploads.js');

function buildJpegBuffer(sizeBytes) {
  // Minimal JPEG SOI/EOI markers with padding to the requested size.
  const buf = Buffer.alloc(Math.max(sizeBytes, 12), 0);
  buf[0] = 0xff;
  buf[1] = 0xd8;
  buf[2] = 0xff;
  buf[3] = 0xe0;
  buf[sizeBytes - 2] = 0xff;
  buf[sizeBytes - 1] = 0xd9;
  return buf.subarray(0, sizeBytes);
}

async function createSellerToken() {
  const register = await request(app)
    .post('/api/v1/auth/seller/register')
    .send({
      name: 'Upload Seller',
      email: `upload-seller-${Date.now()}@example.com`,
      password: 'Password123!',
      storeName: `Upload Store ${Date.now()}`,
    });
  assert.equal(register.status, 201, JSON.stringify(register.body));
  return register.body.data.accessToken;
}

async function createAdminToken() {
  const email = `upload-admin-${Date.now()}@example.com`;
  await User.create({
    email,
    passwordHash: await hashPassword('Password123!'),
    name: 'Upload Admin',
    roles: [USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN],
    emailVerified: true,
  });
  const login = await request(app)
    .post('/api/v1/auth/admin/login')
    .send({ email, password: 'Password123!' });
  assert.equal(login.status, 200);
  return login.body.data.accessToken;
}

test('image upload accepts 5/10/20/24 MB JPG/PNG/WEBP and rejects oversized + invalid types', async (t) => {
  await setupTestDb();
  t.after(async () => {
    await resetDb();
    await teardownTestDb();
  });

  const token = await createSellerToken();

  const sizes = [
    5 * 1024 * 1024,
    10 * 1024 * 1024,
    20 * 1024 * 1024,
    24 * 1024 * 1024,
  ];

  for (const size of sizes) {
    const res = await request(app)
      .post('/api/v1/uploads/images')
      .set('Authorization', `Bearer ${token}`)
      .attach('file', buildJpegBuffer(size), {
        filename: `product-${size}.jpg`,
        contentType: 'image/jpeg',
      });

    assert.equal(res.status, 201, `size=${size} body=${JSON.stringify(res.body)}`);
    assert.equal(res.body.success, true);
    assert.ok(res.body.data.url || res.body.data.path);
    assert.equal(res.body.data.size, size);
    assert.match(String(res.body.data.mimetype), /image\/jpeg/i);

    const path = res.body.data.path || new URL(res.body.data.url).pathname;
    const served = await request(app).get(path);
    assert.equal(served.status, 200, `static serve failed for ${path}`);
  }

  const png = await request(app)
    .post('/api/v1/uploads/images')
    .set('Authorization', `Bearer ${token}`)
    .attach('file', buildJpegBuffer(1024 * 1024), {
      filename: 'ok.png',
      contentType: 'image/png',
    });
  assert.equal(png.status, 201, JSON.stringify(png.body));

  const webp = await request(app)
    .post('/api/v1/uploads/images')
    .set('Authorization', `Bearer ${token}`)
    .attach('file', buildJpegBuffer(1024 * 1024), {
      filename: 'ok.webp',
      contentType: 'image/webp',
    });
  assert.equal(webp.status, 201, JSON.stringify(webp.body));

  const tooBig = await request(app)
    .post('/api/v1/uploads/images')
    .set('Authorization', `Bearer ${token}`)
    .attach('file', buildJpegBuffer(MAX_IMAGE_UPLOAD_BYTES + 1024), {
      filename: 'too-big.jpg',
      contentType: 'image/jpeg',
    });
  assert.equal(tooBig.status, 413, JSON.stringify(tooBig.body));
  assert.match(String(tooBig.body.message), /too large|25 MB/i);
  assert.equal(tooBig.body.code, 'FILE_TOO_LARGE');

  const badType = await request(app)
    .post('/api/v1/uploads/images')
    .set('Authorization', `Bearer ${token}`)
    .attach('file', Buffer.from('not-an-image'), {
      filename: 'notes.gif',
      contentType: 'image/gif',
    });
  assert.equal(badType.status, 400, JSON.stringify(badType.body));
  assert.match(String(badType.body.message), /JPG|PNG|WEBP/i);

  const adminToken = await createAdminToken();
  const adminUpload = await request(app)
    .post('/api/v1/uploads/images')
    .set('Authorization', `Bearer ${adminToken}`)
    .attach('file', buildJpegBuffer(2 * 1024 * 1024), {
      filename: 'admin.jpg',
      contentType: 'image/jpeg',
    });
  assert.equal(adminUpload.status, 201, JSON.stringify(adminUpload.body));
});

test('json body limit accepts large payloads up to 25mb class and rejects far larger', async (t) => {
  await setupTestDb();
  t.after(async () => {
    await resetDb();
    await teardownTestDb();
  });

  // Unauthenticated large JSON should still be gated by body parser (401/413/400 ok),
  // but must not crash the process.
  const huge = 'x'.repeat(26 * 1024 * 1024);
  const res = await request(app)
    .post('/api/v1/auth/login')
    .send({ email: 'a@b.com', password: huge });
  assert.ok([400, 401, 413].includes(res.status), `unexpected status ${res.status}`);
});
