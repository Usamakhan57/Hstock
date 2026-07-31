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
});
