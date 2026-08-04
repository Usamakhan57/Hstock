import { describe, it, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import {
  setupTestDb,
  resetDb,
  teardownTestDb,
} from '../helpers/setup.js';
import { User } from '../../src/models/index.js';
import * as notificationService from '../../src/services/notification.service.js';
import { hashPassword } from '../../src/utils/password.js';

describe('notification service', () => {
  before(async () => {
    await setupTestDb();
  });

  after(async () => {
    await teardownTestDb();
  });

  beforeEach(async () => {
    await resetDb();
  });

  async function createUser(email = 'buyer@example.com') {
    return User.create({
      email,
      name: 'Buyer',
      passwordHash: await hashPassword('Password123!'),
      roles: ['buyer'],
    });
  }

  it('creates, lists, marks read, and deletes notifications', async () => {
    const user = await createUser();
    const created = await notificationService.createNotification({
      userId: user._id,
      type: 'order_created',
      title: 'Order created',
      body: 'Your order is ready',
      link: '/orders/1',
    });

    assert.equal(created.title, 'Order created');
    assert.equal(created.read, false);

    const listed = await notificationService.listNotifications(user._id, { page: 1, limit: 10 });
    assert.equal(listed.items.length, 1);
    assert.equal(listed.meta.unreadCount, 1);

    const unread = await notificationService.getUnreadCount(user._id);
    assert.equal(unread.count, 1);

    await notificationService.markRead(user._id, created.id);
    const afterRead = await notificationService.getUnreadCount(user._id);
    assert.equal(afterRead.count, 0);

    await notificationService.createNotification({
      userId: user._id,
      type: 'system',
      title: 'Second',
      body: 'Another',
    });
    await notificationService.markAllRead(user._id);
    const allRead = await notificationService.getUnreadCount(user._id);
    assert.equal(allRead.count, 0);

    await notificationService.deleteNotification(user._id, created.id);
    const listedAfterDelete = await notificationService.listNotifications(user._id, {});
    assert.equal(listedAfterDelete.items.length, 1);
  });

  it('excludes auth/hidden notification types from buyer/seller feeds', async () => {
    const user = await createUser('filter-buyer@example.com');
    await notificationService.createNotification({
      userId: user._id,
      type: 'order_created',
      title: 'New order',
      body: 'Order placed',
      link: '/orders/1',
    });
    // Direct insert of hidden type (createNotification blocks these)
    const { Notification } = await import('../../src/models/index.js');
    await Notification.create({
      user: user._id,
      type: 'password_reset',
      title: 'Password changed',
      body: 'Your password was updated',
    });
    await Notification.create({
      user: user._id,
      type: 'registration',
      title: 'Welcome',
      body: 'Account created',
    });

    const listed = await notificationService.listNotifications(user._id, { page: 1, limit: 20 });
    assert.equal(listed.items.length, 1);
    assert.equal(listed.items[0].type, 'order_created');
    assert.equal(listed.meta.unreadCount, 1);

    const blocked = await notificationService.createNotification({
      userId: user._id,
      type: 'password_reset',
      title: 'Should not create',
      body: 'Blocked',
    });
    assert.equal(blocked, null);
  });

  it('resolves a fallback link when notification has none', async () => {
    const user = await createUser('link-buyer@example.com');
    const { Notification } = await import('../../src/models/index.js');
    const doc = await Notification.create({
      user: user._id,
      type: 'wallet_deposit',
      title: 'Deposit',
      body: 'Funds added',
      link: null,
    });
    const listed = await notificationService.listNotifications(user._id, {});
    const item = listed.items.find((n) => String(n.id) === String(doc._id));
    assert.ok(item);
    assert.equal(item.link, '/wallet');
  });
});
