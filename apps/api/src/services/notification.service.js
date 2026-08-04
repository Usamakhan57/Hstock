import { Notification } from '../models/index.js';
import { AppError } from '../utils/AppError.js';
import { parsePagination, buildPaginationMeta } from '../utils/pagination.js';
import { enqueue } from '../queues/index.js';
import { eventBus } from '../events/bus.js';
import { DOMAIN_EVENTS, SOCKET_EVENTS } from '../constants/events.js';
import { emitToUser, emitToAdmins } from '../realtime/socket.server.js';
import { sendTemplatedEmail } from '../emails/email.service.js';
import { User } from '../models/index.js';
import { logger } from '../config/logger.js';
import { queueUserTelegramNotification } from './telegram.service.js';
import {
  HIDDEN_NOTIFICATION_TYPES,
  MARKETPLACE_NOTIFICATION_TYPES,
  marketplaceNotificationFilter,
  resolveNotificationLink,
} from '../constants/notifications.js';

function mapNotification(doc) {
  if (!doc) return null;
  const n = doc.toObject ? doc.toObject() : doc;
  const mapped = {
    id: String(n._id),
    _id: String(n._id),
    type: n.type,
    title: n.title,
    body: n.body,
    link: n.link || null,
    meta: n.meta || {},
    read: !!n.read,
    date: n.createdAt,
    createdAt: n.createdAt,
    readAt: n.readAt || null,
  };
  if (!mapped.link) {
    mapped.link = resolveNotificationLink(mapped);
  }
  return mapped;
}

function buildUserFacingFilter(userId, query = {}) {
  const filter = marketplaceNotificationFilter({ user: userId });
  if (query.read === 'true' || query.unreadOnly === 'false') filter.read = true;
  if (query.read === 'false' || query.unreadOnly === 'true') filter.read = false;
  if (query.type) {
    // Only allow explicit marketplace types through; ignore auth/hidden types.
    if (
      MARKETPLACE_NOTIFICATION_TYPES.includes(query.type)
      && !HIDDEN_NOTIFICATION_TYPES.includes(query.type)
    ) {
      filter.type = query.type;
    }
  }
  return filter;
}

/**
 * Create an in-app notification, optionally email + socket push.
 */
export async function createNotification({
  userId,
  type,
  title,
  body,
  link = null,
  meta = {},
  sendEmail = false,
  emailType = null,
  emailData = {},
  notifyAdmins = false,
  sendTelegram = true,
}) {
  if (!userId) throw new AppError('userId is required', 400, { code: 'VALIDATION_ERROR' });

  if (HIDDEN_NOTIFICATION_TYPES.includes(String(type || ''))) {
    logger.warn('Blocked auth/internal notification create', { type, userId: String(userId) });
    return null;
  }

  const notification = await Notification.create({
    user: userId,
    type,
    title,
    body,
    link,
    meta,
  });

  const mapped = mapNotification(notification);

  emitToUser(userId, SOCKET_EVENTS.NOTIFICATION, mapped);
  const unread = await Notification.countDocuments(
    marketplaceNotificationFilter({ user: userId, read: false }),
  );
  emitToUser(userId, SOCKET_EVENTS.NOTIFICATION_UNREAD_COUNT, { count: unread });

  if (notifyAdmins) {
    emitToAdmins(SOCKET_EVENTS.ADMIN_DASHBOARD, {
      type: 'notification',
      notification: mapped,
    });
  }

  if (sendEmail) {
    enqueue('notifications', {
      kind: 'email',
      userId: String(userId),
      notificationId: String(notification._id),
      emailType: emailType || type,
      emailData: { ...emailData, title, body },
    });
  }

  // Mirror in-app notifications to Telegram when the user is connected.
  // Failures are isolated inside the Telegram queue/service.
  if (sendTelegram) {
    try {
      queueUserTelegramNotification({
        userId,
        title,
        body,
        link,
        eventType: type,
        notificationId: String(notification._id),
        meta,
      });
    } catch (error) {
      logger.warn('Telegram notification enqueue skipped', { message: error.message });
    }
  }

  eventBus.emit(DOMAIN_EVENTS.NOTIFICATION_CREATED, {
    notification: mapped,
    userId: String(userId),
  });

  return mapped;
}

export async function notifyUsers(userIds, payload) {
  const unique = [...new Set((userIds || []).filter(Boolean).map(String))];
  const results = [];
  for (const userId of unique) {
    // sequential to keep load predictable for in-process queue
    // eslint-disable-next-line no-await-in-loop
    results.push(await createNotification({ ...payload, userId }));
  }
  return results;
}

export async function listNotifications(userId, query = {}) {
  const pagination = parsePagination(query);
  const filter = buildUserFacingFilter(userId, query);
  const unreadFilter = marketplaceNotificationFilter({ user: userId, read: false });

  const [items, total, unreadCount] = await Promise.all([
    Notification.find(filter)
      .sort({ createdAt: -1 })
      .skip(pagination.skip)
      .limit(pagination.limit)
      .lean(),
    Notification.countDocuments(filter),
    Notification.countDocuments(unreadFilter),
  ]);

  return {
    items: items.map(mapNotification),
    meta: {
      ...buildPaginationMeta({ ...pagination, total }),
      unreadCount,
    },
  };
}

export async function getUnreadCount(userId) {
  const count = await Notification.countDocuments(
    marketplaceNotificationFilter({ user: userId, read: false }),
  );
  return { count };
}

export async function markRead(userId, notificationId) {
  const notification = await Notification.findOne({ _id: notificationId, user: userId });
  if (!notification) {
    throw new AppError('Notification not found', 404, { code: 'NOTIFICATION_NOT_FOUND' });
  }
  if (!notification.read) {
    notification.read = true;
    notification.readAt = new Date();
    await notification.save();
  }
  const unread = await getUnreadCount(userId);
  emitToUser(userId, SOCKET_EVENTS.NOTIFICATION_UNREAD_COUNT, unread);
  return mapNotification(notification);
}

export async function markAllRead(userId) {
  await Notification.updateMany(
    marketplaceNotificationFilter({ user: userId, read: false }),
    { $set: { read: true, readAt: new Date() } },
  );
  emitToUser(userId, SOCKET_EVENTS.NOTIFICATION_UNREAD_COUNT, { count: 0 });
  return { updated: true, count: 0 };
}

export async function deleteNotification(userId, notificationId) {
  const result = await Notification.deleteOne({ _id: notificationId, user: userId });
  if (!result.deletedCount) {
    throw new AppError('Notification not found', 404, { code: 'NOTIFICATION_NOT_FOUND' });
  }
  const unread = await getUnreadCount(userId);
  emitToUser(userId, SOCKET_EVENTS.NOTIFICATION_UNREAD_COUNT, unread);
  return { deleted: true };
}

export async function processNotificationJob(job) {
  const payload = job?.payload || {};
  if (payload.kind !== 'email') return;

  try {
    const user = await User.findById(payload.userId).select('email name').lean();
    if (!user?.email) return;

    await sendTemplatedEmail(payload.emailType, {
      to: user.email,
      data: {
        name: user.name,
        ...(payload.emailData || {}),
      },
    });

    if (payload.notificationId) {
      await Notification.updateOne(
        { _id: payload.notificationId },
        { $set: { emailSent: true, emailSentAt: new Date() } },
      );
    }
  } catch (error) {
    logger.error('Notification email job failed', {
      message: error.message,
      jobId: job.id,
    });
    throw error;
  }
}

export default {
  createNotification,
  notifyUsers,
  listNotifications,
  getUnreadCount,
  markRead,
  markAllRead,
  deleteNotification,
  processNotificationJob,
  mapNotification,
};
