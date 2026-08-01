import { describe, it, before, after, beforeEach, mock } from 'node:test';
import assert from 'node:assert/strict';
import {
  setupTestDb,
  resetDb,
  teardownTestDb,
} from '../helpers/setup.js';
import { User, TelegramConnectToken, TelegramMessageLog } from '../../src/models/index.js';
import { hashPassword } from '../../src/utils/password.js';
import { env } from '../../src/config/env.js';
import { initializeQueues } from '../../src/queues/index.js';
import * as telegramService from '../../src/services/telegram.service.js';

describe('telegram service', () => {
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

  async function createUser(email = 'buyer-tg@example.com') {
    return User.create({
      email,
      name: 'Telegram Buyer',
      passwordHash: await hashPassword('Password123!'),
      roles: ['buyer'],
    });
  }

  it('creates a connect link with opaque token under Telegram start-param limits', async () => {
    const user = await createUser();
    const link = await telegramService.createConnectLink(user._id);
    assert.ok(link.url.includes('https://t.me/ApnaStoreTestBot?start='));
    const token = link.url.split('start=')[1];
    assert.ok(token.length <= 64);
    assert.match(token, /^[A-Za-z0-9_]+$/);
    const count = await TelegramConnectToken.countDocuments({ user: user._id, usedAt: null });
    assert.equal(count, 1);
  });

  it('links Telegram account from /start and rejects replay', async () => {
    const user = await createUser();
    const link = await telegramService.createConnectLink(user._id);
    const token = link.url.split('start=')[1];

    const originalFetch = globalThis.fetch;
    globalThis.fetch = mock.fn(async () => ({
      ok: true,
      json: async () => ({ ok: true, result: { message_id: 1 } }),
    }));

    try {
      const first = await telegramService.processTelegramUpdate({
        update_id: 1,
        message: {
          text: `/start ${token}`,
          chat: { id: 991122 },
          from: { id: 445566, username: 'buyer_tg' },
        },
      });
      assert.equal(first.ok, true);
      assert.equal(first.linked, true);

      const linked = await User.findById(user._id).select('+telegramChatId').lean();
      assert.equal(linked.telegramConnected, true);
      assert.equal(linked.telegramChatId, '991122');
      assert.equal(linked.telegramUserId, '445566');
      assert.equal(linked.telegramUsername, 'buyer_tg');

      const replay = await telegramService.processTelegramUpdate({
        update_id: 2,
        message: {
          text: `/start ${token}`,
          chat: { id: 991122 },
          from: { id: 445566, username: 'buyer_tg' },
        },
      });
      assert.equal(replay.ok, false);
      assert.equal(replay.reason, 'token_replay');
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it('prevents duplicate Telegram account linking', async () => {
    const userA = await createUser('a@example.com');
    const userB = await createUser('b@example.com');

    await User.updateOne(
      { _id: userA._id },
      {
        $set: {
          telegramConnected: true,
          telegramChatId: '111',
          telegramUserId: '999',
          telegramUsername: 'taken',
          telegramConnectedAt: new Date(),
        },
      },
    );

    const link = await telegramService.createConnectLink(userB._id);
    const token = link.url.split('start=')[1];

    const originalFetch = globalThis.fetch;
    globalThis.fetch = mock.fn(async () => ({
      ok: true,
      json: async () => ({ ok: true, result: { message_id: 2 } }),
    }));

    try {
      const result = await telegramService.processTelegramUpdate({
        update_id: 3,
        message: {
          text: `/start ${token}`,
          chat: { id: 222 },
          from: { id: 999, username: 'taken' },
        },
      });
      assert.equal(result.ok, false);
      assert.equal(result.reason, 'TELEGRAM_ALREADY_LINKED');
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it('queues and skips telegram notifications for disconnected users', async () => {
    const user = await createUser('notify@example.com');
    const queued = telegramService.queueUserTelegramNotification({
      userId: user._id,
      title: 'Order created',
      body: 'Test body',
      eventType: 'order_created',
    });
    assert.equal(queued, true);

    // Allow queue drain
    await new Promise((r) => setTimeout(r, 50));
    const logs = await TelegramMessageLog.find({ user: user._id }).lean();
    assert.ok(logs.length >= 1);
    assert.equal(logs[0].status, 'skipped');
  });

  it('exposes public status without chat id and supports disconnect/settings', async () => {
    const user = await createUser('settings@example.com');
    await User.updateOne(
      { _id: user._id },
      {
        $set: {
          telegramConnected: true,
          telegramChatId: 'secret-chat',
          telegramUserId: '12345',
          telegramUsername: 'settings_user',
          telegramConnectedAt: new Date(),
          telegramNotificationsEnabled: true,
        },
      },
    );

    const status = await telegramService.getConnectionStatus(user._id);
    assert.equal(status.connected, true);
    assert.equal(status.username, 'settings_user');
    assert.equal(status.telegramUserId, '12345');
    assert.equal(status.chatId, undefined);

    const disabled = await telegramService.updateTelegramSettings(user._id, {
      notificationsEnabled: false,
    });
    assert.equal(disabled.notificationsEnabled, false);

    const originalFetch = globalThis.fetch;
    globalThis.fetch = mock.fn(async () => ({
      ok: true,
      json: async () => ({ ok: true, result: { message_id: 9 } }),
    }));
    try {
      const disconnected = await telegramService.disconnectTelegram(user._id);
      assert.equal(disconnected.connected, false);
      const refreshed = await User.findById(user._id).select('+telegramChatId').lean();
      assert.equal(refreshed.telegramConnected, false);
      assert.equal(refreshed.telegramChatId, undefined);
      assert.equal(refreshed.telegramUserId, undefined);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it('validates webhook secret', () => {
    assert.throws(
      () => telegramService.assertWebhookSecret('wrong'),
      (err) => err.statusCode === 401,
    );
    assert.equal(telegramService.assertWebhookSecret('telegram-webhook-secret-test'), true);
  });
});
