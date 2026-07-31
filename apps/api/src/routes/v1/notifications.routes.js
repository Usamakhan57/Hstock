import { Router } from 'express';
import { requireAuth } from '../../middlewares/index.js';
import * as notificationsController from '../../controllers/notifications/notifications.controller.js';

const router = Router();

router.use(requireAuth);

router.get('/', notificationsController.listMine);
router.get('/unread-count', notificationsController.unreadCount);
router.patch('/read-all', notificationsController.markAllRead);
router.patch('/:id/read', notificationsController.markRead);
router.delete('/:id', notificationsController.remove);

export default router;
