import { describe, it, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import {
  setupTestDb,
  resetDb,
  teardownTestDb,
} from '../helpers/setup.js';
import app from '../../src/app.js';
import { User, AdminProfile } from '../../src/models/index.js';
import { hashPassword } from '../../src/utils/password.js';
import * as notificationService from '../../src/services/notification.service.js';
import { initializeEvents } from '../../src/events/index.js';
import { initializeQueues } from '../../src/queues/index.js';

describe('notifications + admin ops API', () => {
  before(async () => {
    await setupTestDb();
    initializeEvents();
    initializeQueues();
  });

  after(async () => {
    await teardownTestDb();
  });

  beforeEach(async () => {
    await resetDb();
  });

  async function createAdmin() {
    const passwordHash = await hashPassword('AdminPass123!');
    const user = await User.create({
      email: 'admin@apnastore.test',
      name: 'Admin',
      passwordHash,
      roles: ['admin'],
      emailVerified: true,
      status: 'active',
    });
    await AdminProfile.create({ user: user._id, title: 'Ops' });
    const login = await request(app)
      .post('/api/v1/auth/admin/login')
      .send({ email: 'admin@apnastore.test', password: 'AdminPass123!' });
    assert.equal(login.status, 200);
    return {
      user,
      token: login.body.data.accessToken,
    };
  }

  async function createBuyer() {
    const passwordHash = await hashPassword('BuyerPass123!');
    const user = await User.create({
      email: 'buyer@apnastore.test',
      name: 'Buyer',
      passwordHash,
      roles: ['buyer'],
      emailVerified: true,
      status: 'active',
    });
    const login = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'buyer@apnastore.test', password: 'BuyerPass123!' });
    assert.equal(login.status, 200);
    return { user, token: login.body.data.accessToken };
  }

  it('lists notifications and unread count for authenticated user', async () => {
    const { user, token } = await createBuyer();
    await notificationService.createNotification({
      userId: user._id,
      type: 'system',
      title: 'Hello',
      body: 'World',
    });

    const list = await request(app)
      .get('/api/v1/notifications')
      .set('Authorization', `Bearer ${token}`);
    assert.equal(list.status, 200);
    assert.equal(list.body.success, true);
    assert.equal(list.body.data.length, 1);

    const unread = await request(app)
      .get('/api/v1/notifications/unread-count')
      .set('Authorization', `Bearer ${token}`);
    assert.equal(unread.status, 200);
    assert.equal(unread.body.data.count, 1);

    const mark = await request(app)
      .patch(`/api/v1/notifications/${list.body.data[0].id}/read`)
      .set('Authorization', `Bearer ${token}`);
    assert.equal(mark.status, 200);
    assert.equal(mark.body.data.read, true);
  });

  it('exposes admin dashboard, analytics, ocr queue, and system health', async () => {
    const { token } = await createAdmin();

    const dashboard = await request(app)
      .get('/api/v1/admin/dashboard')
      .set('Authorization', `Bearer ${token}`);
    assert.equal(dashboard.status, 200);
    assert.ok(dashboard.body.data.stats);

    const analytics = await request(app)
      .get('/api/v1/admin/analytics')
      .set('Authorization', `Bearer ${token}`);
    assert.equal(analytics.status, 200);

    const ocr = await request(app)
      .get('/api/v1/admin/ocr-queue')
      .set('Authorization', `Bearer ${token}`);
    assert.equal(ocr.status, 200);
    assert.ok(Array.isArray(ocr.body.data));

    const health = await request(app)
      .get('/api/v1/admin/system-health')
      .set('Authorization', `Bearer ${token}`);
    assert.equal(health.status, 200);
    assert.equal(health.body.data.database.connected, true);
    assert.ok('socket' in health.body.data);
    assert.ok('email' in health.body.data);
  });
});
