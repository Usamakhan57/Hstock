import { Server } from 'socket.io';
import { env } from '../config/env.js';
import { logger } from '../config/logger.js';
import { verifyAccessToken } from '../utils/token.js';
import { User, Dispute, Order } from '../models/index.js';
import { USER_ROLES } from '../constants/roles.js';
import { UserStatusEnum } from '../constants/enums.js';
import { SOCKET_EVENTS } from '../constants/events.js';

let io = null;

function isStaff(roles = []) {
  return roles.some((role) => [
    USER_ROLES.ADMIN,
    USER_ROLES.SUPER_ADMIN,
    USER_ROLES.SUPPORT,
  ].includes(role));
}

function isBlockedStatus(status) {
  return [
    UserStatusEnum.Suspended,
    UserStatusEnum.Deleted,
    UserStatusEnum.Inactive,
    'banned',
  ].includes(status);
}

export function getIO() {
  return io;
}

async function canJoinDispute(user, disputeId) {
  if (!disputeId) return false;
  if (isStaff(user.roles)) return true;
  const dispute = await Dispute.findById(disputeId).select('buyer sellerUser').lean();
  if (!dispute) return false;
  return [String(dispute.buyer), String(dispute.sellerUser)].includes(String(user.id));
}

async function canJoinOrder(user, orderId) {
  if (!orderId) return false;
  if (isStaff(user.roles)) return true;
  const order = await Order.findById(orderId).select('buyer sellerUser').lean();
  if (!order) {
    // Allow orderNumber lookup for clients that join by number
    const byNumber = await Order.findOne({ orderNumber: orderId }).select('buyer sellerUser').lean();
    if (!byNumber) return false;
    return [String(byNumber.buyer), String(byNumber.sellerUser)].includes(String(user.id));
  }
  return [String(order.buyer), String(order.sellerUser)].includes(String(user.id));
}

export function initializeSocket(httpServer) {
  if (io) return io;

  io = new Server(httpServer, {
    path: '/socket.io',
    cors: {
      origin: env.corsOrigins.includes('*') ? false : env.corsOrigins,
      credentials: true,
      methods: ['GET', 'POST'],
    },
    transports: ['websocket', 'polling'],
    pingTimeout: 30000,
    pingInterval: 25000,
  });

  io.use(async (socket, next) => {
    try {
      const token =
        socket.handshake.auth?.token
        || socket.handshake.headers?.authorization?.replace(/^Bearer\s+/i, '')
        || socket.handshake.query?.token;

      if (!token || typeof token !== 'string') {
        return next(new Error('UNAUTHORIZED'));
      }

      const decoded = verifyAccessToken(token);
      const userId = decoded.sub || decoded.id || decoded.userId;
      if (!userId) return next(new Error('UNAUTHORIZED'));

      const user = await User.findById(userId).select('_id email name roles status').lean();
      if (!user || isBlockedStatus(user.status)) {
        return next(new Error('UNAUTHORIZED'));
      }

      socket.user = {
        id: String(user._id),
        email: user.email,
        name: user.name,
        roles: user.roles || [],
      };
      return next();
    } catch (error) {
      logger.warn('Socket auth failed', { message: error.message });
      return next(new Error('UNAUTHORIZED'));
    }
  });

  io.on('connection', (socket) => {
    const userId = socket.user.id;
    const roles = socket.user.roles || [];

    socket.join(`user:${userId}`);
    if (roles.includes(USER_ROLES.SELLER)) socket.join(`seller:${userId}`);
    if (roles.includes(USER_ROLES.BUYER)) socket.join(`buyer:${userId}`);
    if (isStaff(roles)) socket.join('admins');

    socket.on('dispute:join', async (disputeId) => {
      try {
        if (await canJoinDispute(socket.user, disputeId)) {
          socket.join(`dispute:${disputeId}`);
        }
      } catch (error) {
        logger.warn('dispute:join denied', { userId, disputeId, message: error.message });
      }
    });
    socket.on('dispute:leave', (disputeId) => {
      if (disputeId) socket.leave(`dispute:${disputeId}`);
    });
    socket.on('order:join', async (orderId) => {
      try {
        if (await canJoinOrder(socket.user, orderId)) {
          socket.join(`order:${orderId}`);
        }
      } catch (error) {
        logger.warn('order:join denied', { userId, orderId, message: error.message });
      }
    });
    socket.on('order:leave', (orderId) => {
      if (orderId) socket.leave(`order:${orderId}`);
    });

    logger.debug('Socket connected', { userId, socketId: socket.id });

    socket.on('disconnect', (reason) => {
      logger.debug('Socket disconnected', { userId, reason });
    });
  });

  logger.info('Socket.io initialized', { path: '/socket.io' });
  return io;
}

export function emitToUser(userId, event, payload) {
  if (!io || !userId) return false;
  io.to(`user:${String(userId)}`).emit(event, payload);
  return true;
}

export function emitToAdmins(event, payload) {
  if (!io) return false;
  io.to('admins').emit(event, payload);
  return true;
}

export function emitToRoom(room, event, payload) {
  if (!io || !room) return false;
  io.to(room).emit(event, payload);
  return true;
}

export function emitOrderUpdate(order, extra = {}) {
  if (!order) return;
  const payload = { order, ...extra, at: new Date().toISOString() };
  if (order.buyer) emitToUser(order.buyer, SOCKET_EVENTS.ORDER_UPDATED, payload);
  if (order.sellerUser) emitToUser(order.sellerUser, SOCKET_EVENTS.ORDER_UPDATED, payload);
  if (order._id || order.id) {
    emitToRoom(`order:${order._id || order.id}`, SOCKET_EVENTS.ORDER_UPDATED, payload);
  }
  emitToAdmins(SOCKET_EVENTS.ORDER_UPDATED, payload);
  emitToAdmins(SOCKET_EVENTS.ADMIN_DASHBOARD, { type: 'order', ...payload });
}

export function emitPaymentUpdate(payment) {
  if (!payment) return;
  const payload = { payment, at: new Date().toISOString() };
  if (payment.buyer) emitToUser(payment.buyer, SOCKET_EVENTS.PAYMENT_UPDATED, payload);
  if (payment.sellerUser) emitToUser(payment.sellerUser, SOCKET_EVENTS.PAYMENT_UPDATED, payload);
  emitToAdmins(SOCKET_EVENTS.PAYMENT_UPDATED, payload);
}

export function emitEscrowUpdate(escrow) {
  if (!escrow) return;
  const payload = { escrow, at: new Date().toISOString() };
  if (escrow.buyer) emitToUser(escrow.buyer, SOCKET_EVENTS.ESCROW_UPDATED, payload);
  if (escrow.sellerUser) emitToUser(escrow.sellerUser, SOCKET_EVENTS.ESCROW_UPDATED, payload);
  emitToAdmins(SOCKET_EVENTS.ESCROW_UPDATED, payload);
}

export function emitWithdrawalUpdate(withdrawal) {
  if (!withdrawal) return;
  const payload = { withdrawal, at: new Date().toISOString() };
  if (withdrawal.sellerUser || withdrawal.user) {
    emitToUser(withdrawal.sellerUser || withdrawal.user, SOCKET_EVENTS.WITHDRAWAL_UPDATED, payload);
  }
  emitToAdmins(SOCKET_EVENTS.WITHDRAWAL_UPDATED, payload);
}

export function emitDisputeUpdate(dispute, extra = {}) {
  if (!dispute) return;
  const id = dispute._id || dispute.id;
  const payload = { dispute, ...extra, at: new Date().toISOString() };
  if (dispute.buyer) emitToUser(dispute.buyer, SOCKET_EVENTS.DISPUTE_UPDATED, payload);
  if (dispute.sellerUser) emitToUser(dispute.sellerUser, SOCKET_EVENTS.DISPUTE_UPDATED, payload);
  if (id) emitToRoom(`dispute:${id}`, SOCKET_EVENTS.DISPUTE_UPDATED, payload);
  emitToAdmins(SOCKET_EVENTS.DISPUTE_UPDATED, payload);
}

export function closeSocket() {
  if (!io) return Promise.resolve();
  return new Promise((resolve) => {
    io.close(() => {
      io = null;
      resolve();
    });
  });
}

export default {
  initializeSocket,
  getIO,
  emitToUser,
  emitToAdmins,
  emitToRoom,
  emitOrderUpdate,
  emitPaymentUpdate,
  emitEscrowUpdate,
  emitWithdrawalUpdate,
  emitDisputeUpdate,
  closeSocket,
};
