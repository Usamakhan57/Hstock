import { notificationsApi } from '../../services/notificationsApi';

export const getNotifications = (params) => notificationsApi.list(params).then((r) => r.items);
export const getUnreadCount = () => notificationsApi.unreadCount();
export const markNotificationRead = (id) => notificationsApi.markRead(id);
export const markAllNotificationsRead = () => notificationsApi.markAllRead();
export const deleteNotification = (id) => notificationsApi.remove(id);
