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
import { env } from '../../src/config/env.js';
import { initializeQueues } from '../../src/queues/index.js';

describe('telegram API', () => {
  before(async () => {
    await setupTestDb();
    initializeQueues();
    env.TELEGRAM_ENABLED = true;
    env.TELEGRAM_BOT_TOKEN = 'test-bot-token';
    env.TELEGRAM_BOT_USERNAME = 'ApnaStoreTestBot';
    env.TELEGRAM_WEBHOOK_SECRET = 'telegram-webhook-secret-test';
    env.TELEGRAM_MODE = 'webhook';
    env.telegramConfigured = true;
  });

  after(async () => {
    env.TELEGRAM_ENABLED = false;
    env.TELEGRAM_BOT_TOKEN = '';
    await teardownTestDb();
  });

  beforeEach(async () => {
    await resetDb();
  });

  async function createBuyer() {
    const passwordHash = await hashPassword('BuyerPass123!');
    const user = await User.create({
      email: 'tg-buyer@apnastore.test',
      name: 'TG Buyer',
      passwordHash,
      roles: ['buyer'],
      emailVerified: true,
      status: 'active',
    });
    const login = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'tg-buyer@apnastore.test', password: 'BuyerPass123!' });
    assert.equal(login.status, 200);
    return { user, token: login.body.data.accessToken };
  }

  async function createAdmin() {
    const passwordHash = await hashPassword('AdminPass123!');
    const user = await User.create({
      email: 'tg-admin@apnastore.test',
      name: 'TG Admin',
      passwordHash,
      roles: ['admin'],
      emailVerified: true,
      status: 'active',
    });
    await AdminProfile.create({ user: user._id, title: 'Ops' });
    const login = await request(app)
      .post('/api/v1/auth/admin/login')
      .send({ email: 'tg-admin@apnastore.test', password: 'AdminPass123!' });
    assert.equal(login.status, 200);
    return { user, token: login.body.data.accessToken };
  }

  it('returns telegram status and creates connect link for authenticated user', async () => {
    const { token } = await createBuyer();

    const status = await request(app)
      .get('/api/v1/telegram/me')
      .set('Authorization', `Bearer ${token}`);
    assert.equal(status.status, 200);
    assert.equal(status.body.data.connected, false);
    assert.equal(status.body.data.chatId, undefined);

    const connect = await request(app)
      .post('/api/v1/telegram/me/connect')
      .set('Authorization', `Bearer ${token}`)
      .send({});
    assert.equal(connect.status, 200);
    assert.ok(connect.body.data.url.includes('t.me/ApnaStoreTestBot?start='));
  });

  it('rejects buyer profile social/website payload fields', async () => {
    const { token } = await createBuyer();
    const res = await request(app)
      .patch('/api/v1/users/me/profile')
      .set('Authorization', `Bearer ${token}`)
      .send({
        bio: 'hello',
        website: 'https://example.com',
        social: { instagram: 'x', twitter: 'y' },
      });
    // Zod strips unknown keys by default? Actually zod object strips unknown by default in zod 3
    // If website/social are not in schema, they should be stripped and request succeeds with only bio
    // OR fail if strict. Our schema is not .strict(), so unknown keys are stripped.
    assert.equal(res.status, 200);
    assert.equal(res.body.data.profile.bio, 'hello');
    assert.equal(res.body.data.profile.website, undefined);
    assert.equal(res.body.data.profile.social, undefined);
  });

  it('protects webhook with secret and accepts valid updates', async () => {
    const unauthorized = await request(app)
      .post('/api/v1/telegram/webhook')
      .send({ update_id: 1, message: { text: '/start', chat: { id: 1 }, from: { id: 1 } } });
    assert.equal(unauthorized.status, 401);

    const originalFetch = globalThis.fetch;
    globalThis.fetch = async () => ({
      ok: true,
      json: async () => ({ ok: true, result: { message_id: 1 } }),
    });
    try {
      const ok = await request(app)
        .post('/api/v1/telegram/webhook')
        .set('X-Telegram-Bot-Api-Secret-Token', 'telegram-webhook-secret-test')
        .send({ update_id: 1, message: { text: '/start', chat: { id: 1 }, from: { id: 1 } } });
      assert.equal(ok.status, 200);
      assert.equal(ok.body.success, true);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it('exposes admin telegram endpoints', async () => {
    const { token } = await createAdmin();

    const overview = await request(app)
      .get('/api/v1/admin/telegram')
      .set('Authorization', `Bearer ${token}`);
    assert.equal(overview.status, 200);
    assert.ok(overview.body.data);
    assert.equal(typeof overview.body.data.connectedUsers, 'number');

    const users = await request(app)
      .get('/api/v1/admin/telegram/users')
      .set('Authorization', `Bearer ${token}`);
    assert.equal(users.status, 200);

    const logs = await request(app)
      .get('/api/v1/admin/telegram/logs')
      .set('Authorization', `Bearer ${token}`);
    assert.equal(logs.status, 200);

    const broadcasts = await request(app)
      .get('/api/v1/admin/telegram/broadcasts')
      .set('Authorization', `Bearer ${token}`);
    assert.equal(broadcasts.status, 200);

    const create = await request(app)
      .post('/api/v1/admin/telegram/broadcasts')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'Maintenance',
        message: 'ApnaStore will be offline briefly tonight.',
        category: 'maintenance',
        audience: 'connected',
      });
    assert.equal(create.status, 201);
    assert.equal(create.body.data.title, 'Maintenance');
  });

  it('includes telegram in me payload without chat id', async () => {
    const { user, token } = await createBuyer();
    await User.updateOne(
      { _id: user._id },
      {
        $set: {
          telegramConnected: true,
          telegramChatId: 'should-not-leak',
          telegramUserId: '777',
          telegramUsername: 'safeuser',
          telegramConnectedAt: new Date(),
        },
      },
    );

    const me = await request(app)
      .get('/api/v1/users/me')
      .set('Authorization', `Bearer ${token}`);
    assert.equal(me.status, 200);
    assert.equal(me.body.data.user.telegram.connected, true);
    assert.equal(me.body.data.user.telegram.username, 'safeuser');
    assert.equal(me.body.data.user.telegram.telegramUserId, '777');
    assert.equal(me.body.data.user.telegramChatId, undefined);
    assert.equal(me.body.data.user.telegram?.chatId, undefined);
  });
});
