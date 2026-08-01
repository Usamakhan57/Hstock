import { asyncHandler } from '../../utils/asyncHandler.js';
import { sendSuccess } from '../../utils/response.js';
import * as telegramService from '../../services/telegram.service.js';

export const overview = asyncHandler(async (_req, res) => {
  const data = await telegramService.getTelegramStatistics();
  return sendSuccess(res, { message: 'Telegram statistics', data });
});

export const botStatus = asyncHandler(async (_req, res) => {
  const data = await telegramService.getBotStatus();
  return sendSuccess(res, { message: 'Telegram bot status', data });
});

export const connectedUsers = asyncHandler(async (req, res) => {
  const result = await telegramService.searchConnectedUsers(req.query);
  return sendSuccess(res, {
    message: 'Connected Telegram users',
    data: result.items,
    meta: result.meta,
  });
});

export const logs = asyncHandler(async (req, res) => {
  const result = await telegramService.listMessageLogs(req.query);
  return sendSuccess(res, {
    message: 'Telegram message logs',
    data: result.items,
    meta: result.meta,
  });
});

export const broadcasts = asyncHandler(async (req, res) => {
  const result = await telegramService.listBroadcasts(req.query);
  return sendSuccess(res, {
    message: 'Telegram broadcast history',
    data: result.items,
    meta: result.meta,
  });
});

export const createBroadcast = asyncHandler(async (req, res) => {
  const data = await telegramService.createBroadcast({
    ...req.body,
    createdBy: req.user.id,
  });
  return sendSuccess(res, {
    statusCode: 201,
    message: 'Broadcast queued',
    data,
  });
});

export default {
  overview,
  botStatus,
  connectedUsers,
  logs,
  broadcasts,
  createBroadcast,
};
