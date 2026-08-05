import { asyncHandler } from '../../utils/asyncHandler.js';
import { sendSuccess } from '../../utils/response.js';
import * as orderService from '../../services/order.service.js';
import * as escrowService from '../../services/escrow.service.js';
import * as inventoryService from '../../services/inventory.service.js';

export const buyNow = asyncHandler(async (req, res) => {
  const data = await orderService.buyNow(req.body, req.user, {
    ip: req.ip,
    userAgent: req.get('user-agent'),
  });
  return sendSuccess(res, {
    statusCode: 201,
    message: 'Order created — redirect buyer to payment URL',
    data,
  });
});

export const listOrders = asyncHandler(async (req, res) => {
  const result = await orderService.listOrders(req.query, req.user);
  return sendSuccess(res, {
    message: 'Orders',
    data: result.items,
    meta: result.meta,
  });
});

export const getOrder = asyncHandler(async (req, res) => {
  const data = await orderService.getOrder(req.params.id, req.user);
  return sendSuccess(res, { message: 'Order', data });
});

export const getDelivery = asyncHandler(async (req, res) => {
  const data = await inventoryService.getOrderDeliveryForBuyer(req.params.id, req.user);
  return sendSuccess(res, { message: 'Order delivery', data });
});

export const cancelOrder = asyncHandler(async (req, res) => {
  const data = await orderService.cancelOrder(
    req.params.id,
    req.user,
    req.body?.reason,
  );
  return sendSuccess(res, { message: 'Order cancelled', data });
});

export const markDelivered = asyncHandler(async (req, res) => {
  const body = req.body && typeof req.body === 'object' ? req.body : {};
  const hasAccounts = Array.isArray(body.accounts) && body.accounts.length > 0;
  const hasCredentials = body.credentials && typeof body.credentials === 'object'
    && Object.keys(body.credentials).length > 0;
  const hasMessage = Boolean(String(body.message || '').trim());

  if (hasAccounts || hasCredentials || hasMessage) {
    await inventoryService.fulfillManualDeliveryOrder(req.params.id, req.user, body);
  }

  const data = await escrowService.markOrderDelivered(req.params.id, req.user);
  return sendSuccess(res, { message: 'Order marked delivered', data });
});

export default {
  buyNow,
  listOrders,
  getOrder,
  getDelivery,
  cancelOrder,
  markDelivered,
};
