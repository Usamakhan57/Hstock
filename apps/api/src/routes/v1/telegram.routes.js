import { Router } from 'express';
import { validate, requireAuth } from '../../middlewares/index.js';
import { telegramSettingsSchema } from '../../validators/telegram.validator.js';
import * as telegramController from '../../controllers/telegram/telegram.controller.js';

const router = Router();

/**
 * Public Telegram webhook (secured by X-Telegram-Bot-Api-Secret-Token).
 */
router.post('/webhook', telegramController.webhook);

/**
 * Authenticated account Telegram connection endpoints.
 */
router.get('/me', requireAuth, telegramController.status);
router.post('/me/connect', requireAuth, telegramController.connect);
router.patch(
  '/me/settings',
  requireAuth,
  validate(telegramSettingsSchema),
  telegramController.updateSettings,
);
router.delete('/me', requireAuth, telegramController.disconnect);

export default router;
