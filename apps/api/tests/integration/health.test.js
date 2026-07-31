import '../helpers/env-bootstrap.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';

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

test('GET /api/v1 returns production root', async () => {
  const res = await request(app).get('/api/v1');
  assert.equal(res.status, 200);
  assert.equal(res.body.data.phase, 'production');
  assert.ok(Array.isArray(res.body.data.modules));
  assert.ok(res.body.data.modules.includes('orders'));
  assert.ok(res.body.data.modules.includes('notifications'));
  assert.ok(res.body.data.modules.includes('admin'));
});

test('GET /unknown returns 404', async () => {
  const res = await request(app).get('/unknown-route');
  assert.equal(res.status, 404);
  assert.equal(res.body.success, false);
  assert.equal(res.body.code, 'NOT_FOUND');
  assert.equal(res.body.errors, null);
});
