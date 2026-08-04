import { describe, it, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import {
  setupTestDb,
  resetDb,
  teardownTestDb,
} from '../helpers/setup.js';
import { User } from '../../src/models/index.js';
import { logActivity, listActivityLogs } from '../../src/services/activity.service.js';
import { getMyActivity } from '../../src/services/user.service.js';
import { isHiddenActivityAction } from '../../src/constants/notifications.js';
import { hashPassword } from '../../src/utils/password.js';

describe('activity feed auth filter', () => {
  before(async () => {
    await setupTestDb();
  });

  after(async () => {
    await teardownTestDb();
  });

  beforeEach(async () => {
    await resetDb();
  });

  it('classifies auth actions as hidden', () => {
    assert.equal(isHiddenActivityAction('auth.login'), true);
    assert.equal(isHiddenActivityAction('auth.google.login'), true);
    assert.equal(isHiddenActivityAction('users.password.change'), true);
    assert.equal(isHiddenActivityAction('orders.buy_now'), false);
    assert.equal(isHiddenActivityAction('payments.paid'), false);
  });

  it('excludes auth events from buyer/seller activity feed', async () => {
    const user = await User.create({
      email: 'activity-filter@example.com',
      name: 'Seller',
      passwordHash: await hashPassword('Password123!'),
      roles: ['seller', 'buyer'],
    });

    await logActivity({ userId: user._id, action: 'auth.login' });
    await logActivity({ userId: user._id, action: 'auth.google.login' });
    await logActivity({ userId: user._id, action: 'users.password.change' });
    await logActivity({ userId: user._id, action: 'orders.buy_now', resource: 'order' });
    await logActivity({ userId: user._id, action: 'payments.paid', resource: 'payment' });

    const raw = await listActivityLogs({ userId: user._id, page: 1, limit: 20 });
    assert.equal(raw.items.length, 5);

    const filtered = await listActivityLogs({
      userId: user._id,
      page: 1,
      limit: 20,
      excludeHidden: true,
    });
    assert.equal(filtered.items.length, 2);
    assert.ok(filtered.items.every((row) => !String(row.action).startsWith('auth.')));
    assert.ok(filtered.items.every((row) => !String(row.action).startsWith('users.password.')));

    const mine = await getMyActivity(user._id, { page: 1, limit: 20 });
    assert.equal(mine.items.length, 2);
    assert.deepEqual(
      mine.items.map((i) => i.action).sort(),
      ['orders.buy_now', 'payments.paid'],
    );
  });
});
