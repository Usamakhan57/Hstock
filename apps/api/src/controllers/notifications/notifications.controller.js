import { asyncHandler } from '../../utils/asyncHandler.js';
import { sendSuccess } from '../../utils/response.js';
import * as notificationService from '../../services/notification.service.js';

export const listMine = asyncHandler(async (req, res) => {
  const result = await notificationService.listNotifications(req.user.id, req.query);
  return sendSuccess(res, {
    message: 'Notifications',
    data: result.items,
    meta: result.meta,
  });
});

export const unreadCount = asyncHandler(async (req, res) => {
  const result = await notificationService.getUnreadCount(req.user.id);
  return sendSuccess(res, { message: 'Unread count', data: result });
});

export const markRead = asyncHandler(async (req, res) => {
  const notification = await notificationService.markRead(req.user.id, req.params.id);
  return sendSuccess(res, { message: 'Notification marked read', data: notification });
});

export const markAllRead = asyncHandler(async (req, res) => {
  const result = await notificationService.markAllRead(req.user.id);
  return sendSuccess(res, { message: 'All notifications marked read', data: result });
});

export const remove = asyncHandler(async (req, res) => {
  const result = await notificationService.deleteNotification(req.user.id, req.params.id);
  return sendSuccess(res, { message: 'Notification deleted', data: result });
});

export default {
  listMine,
  unreadCount,
  markRead,
  markAllRead,
  remove,
};
