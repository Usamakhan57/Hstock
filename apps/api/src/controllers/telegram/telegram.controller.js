import { asyncHandler } from '../../utils/asyncHandler.js';
import { sendSuccess } from '../../utils/response.js';
import * as telegramService from '../../services/telegram.service.js';

export const connect = asyncHandler(async (req, res) => {
  const data = await telegramService.createConnectLink(req.user.id);
  return sendSuccess(res, { message: 'Telegram connect link created', data });
});

export const status = asyncHandler(async (req, res) => {
  const data = await telegramService.getConnectionStatus(req.user.id);
  return sendSuccess(res, { message: 'Telegram connection status', data });
});

export const updateSettings = asyncHandler(async (req, res) => {
  const data = await telegramService.updateTelegramSettings(req.user.id, req.body);
  return sendSuccess(res, { message: 'Telegram settings updated', data });
});

export const disconnect = asyncHandler(async (req, res) => {
  const data = await telegramService.disconnectTelegram(req.user.id);
  return sendSuccess(res, { message: 'Telegram disconnected', data });
});

export const webhook = asyncHandler(async (req, res) => {
  telegramService.assertWebhookSecret(req.get('X-Telegram-Bot-Api-Secret-Token'));
  const result = await telegramService.processTelegramUpdate(req.body);
  return sendSuccess(res, { message: 'Webhook processed', data: result });
});

export default {
  connect,
  status,
  updateSettings,
  disconnect,
  webhook,
};
