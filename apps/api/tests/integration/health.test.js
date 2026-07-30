import test from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';

process.env.NODE_ENV = 'test';
process.env.MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/hstock_phase2_test';
process.env.MONGODB_DB_NAME = 'hstock_phase2_test';
process.env.JWT_ACCESS_SECRET = 'test-access-secret-32-characters-min';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-32-characters-min';
process.env.CORS_ORIGINS = 'http://localhost:3000';
process.env.ENABLE_JOBS = 'false';

const { default: app } = await import('../../src/app.js');

test('GET /health/live returns alive payload', async () => {
  const res = await request(app).get('/health/live');
  assert.equal(res.status, 200);
  assert.equal(res.body.success, true);
  assert.equal(res.body.data.status, 'live');
});

test('GET /health returns service metadata', async () => {
  const res = await request(app).get('/health');
  assert.equal(res.status, 200);
  assert.equal(res.body.success, true);
  assert.equal(res.body.data.status, 'ok');
  assert.ok(res.body.data.database);
});

test('GET /api/v1 returns phase 2 root', async () => {
  const res = await request(app).get('/api/v1');
  assert.equal(res.status, 200);
  assert.equal(res.body.data.phase, 2);
  assert.ok(Array.isArray(res.body.data.modules));
});

test('GET /unknown returns 404', async () => {
  const res = await request(app).get('/unknown-route');
  assert.equal(res.status, 404);
  assert.equal(res.body.success, false);
  assert.equal(res.body.code, 'NOT_FOUND');
  assert.equal(res.body.errors, null);
});
