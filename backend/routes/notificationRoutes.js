import { Router } from 'express';
import { protect } from '../middleware/auth.js';
import { requirePermission } from '../middleware/authorize.js';
import validate from '../middleware/validate.js';
import { PERMISSIONS } from '../constants/roles.js';
import * as alertController from '../controllers/alertController.js';
import { listNotificationsValidator, notificationIdValidator } from '../validators/alertValidator.js';

const router = Router();

router.use(protect);

router.get('/stats', requirePermission(PERMISSIONS.VIEW_ALERTS), alertController.getNotificationStats);
router.post('/mark-all-read', requirePermission(PERMISSIONS.VIEW_ALERTS), alertController.markAllNotificationsAsRead);
router.get('/', requirePermission(PERMISSIONS.VIEW_ALERTS), listNotificationsValidator, validate, alertController.getNotifications);

router.patch('/:id/read', requirePermission(PERMISSIONS.VIEW_ALERTS), notificationIdValidator, validate, alertController.markNotificationAsRead);
router.delete('/:id', requirePermission(PERMISSIONS.VIEW_ALERTS), notificationIdValidator, validate, alertController.deleteNotification);

export default router;
