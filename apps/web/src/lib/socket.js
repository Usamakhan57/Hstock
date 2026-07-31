import { io } from 'socket.io-client';
import { API_BASE_URL } from './apiClient';
import { getAccessToken } from './tokenStorage';

function socketOrigin() {
  try {
    const url = new URL(API_BASE_URL);
    return url.origin;
  } catch {
    return (import.meta.env.VITE_API_URL || 'http://localhost:4000/api/v1').replace(/\/api\/v1\/?$/, '');
  }
}

let socket = null;
const listeners = new Map();

function ensureListener(event) {
  if (!listeners.has(event)) {
    listeners.set(event, new Set());
  }
  return listeners.get(event);
}

function attachBridge() {
  if (!socket) return;
  listeners.forEach((handlers, event) => {
    handlers.forEach((handler) => {
      socket.off(event, handler);
      socket.on(event, handler);
    });
  });
}

export function connectSocket() {
  const token = getAccessToken();
  if (!token) return null;

  if (!socket) {
    socket = io(socketOrigin(), {
      path: '/socket.io',
      auth: { token },
      transports: ['websocket', 'polling'],
      autoConnect: true,
    });
    attachBridge();
  } else if (!socket.connected) {
    socket.auth = { token };
    socket.connect();
  } else {
    socket.auth = { token };
  }

  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

export function onSocketEvent(event, handler) {
  const handlers = ensureListener(event);
  handlers.add(handler);
  if (socket) {
    socket.on(event, handler);
  }
  return () => offSocketEvent(event, handler);
}

export function offSocketEvent(event, handler) {
  const handlers = listeners.get(event);
  if (handlers) {
    handlers.delete(handler);
    if (handlers.size === 0) listeners.delete(event);
  }
  if (socket) {
    socket.off(event, handler);
  }
}

export function getSocket() {
  return socket;
}

export default {
  connectSocket,
  disconnectSocket,
  onSocketEvent,
  offSocketEvent,
  getSocket,
};
