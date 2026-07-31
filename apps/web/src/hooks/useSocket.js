import { useEffect } from 'react';
import { connectSocket, disconnectSocket, onSocketEvent } from '../lib/socket';
import { getAccessToken } from '../lib/tokenStorage';

const SOCKET_EVENTS = {
  NOTIFICATION: 'notification',
  NOTIFICATION_UNREAD_COUNT: 'notification:unread_count',
};

/**
 * Connects socket.io when authenticated and refreshes notifications on push events.
 */
export function useSocket({ enabled = true, onNotification, onUnreadCount } = {}) {
  useEffect(() => {
    if (!enabled || !getAccessToken()) {
      disconnectSocket();
      return undefined;
    }

    connectSocket();

    const cleanups = [];

    if (onNotification) {
      cleanups.push(onSocketEvent(SOCKET_EVENTS.NOTIFICATION, onNotification));
    }
    if (onUnreadCount) {
      cleanups.push(onSocketEvent(SOCKET_EVENTS.NOTIFICATION_UNREAD_COUNT, onUnreadCount));
    }

    return () => {
      cleanups.forEach((off) => off());
      disconnectSocket();
    };
  }, [enabled, onNotification, onUnreadCount]);
}

export default useSocket;
