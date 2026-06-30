import { Router } from 'express';
import { protect } from '../middleware/auth.js';
import { requirePermission } from '../middleware/authorize.js';
import validate from '../middleware/validate.js';
import { PERMISSIONS } from '../constants/roles.js';
import * as alertController from '../controllers/alertController.js';
import {
  createAlertValidator,
  updateAlertValidator,
  alertIdValidator,
  listAlertsValidator,
  bulkDeleteValidator,
  listNotificationsValidator,
  notificationIdValidator,
} from '../validators/alertValidator.js';

const router = Router();

router.use(protect);

router.get('/stats', requirePermission(PERMISSIONS.VIEW_ALERTS), alertController.getAlertStats);
router.get('/analytics', requirePermission(PERMISSIONS.VIEW_ALERTS), alertController.getAlertAnalytics);
router.get('/meta/vehicles', requirePermission(PERMISSIONS.VIEW_ALERTS), alertController.getMetaVehicles);
router.get('/meta/drivers', requirePermission(PERMISSIONS.VIEW_ALERTS), alertController.getMetaDrivers);
router.get('/export', requirePermission(PERMISSIONS.VIEW_ALERTS), listAlertsValidator, validate, alertController.exportAlerts);
router.post('/sync', requirePermission(PERMISSIONS.MANAGE_ALERTS), alertController.syncAlerts);
router.post('/mark-all-read', requirePermission(PERMISSIONS.VIEW_ALERTS), alertController.markAllAlertsAsRead);
router.post('/bulk-delete', requirePermission(PERMISSIONS.MANAGE_ALERTS), bulkDeleteValidator, validate, alertController.bulkDeleteAlerts);
router.get('/', requirePermission(PERMISSIONS.VIEW_ALERTS), listAlertsValidator, validate, alertController.getAlerts);

router.get('/:id', requirePermission(PERMISSIONS.VIEW_ALERTS), alertIdValidator, validate, alertController.getAlert);
router.post('/', requirePermission(PERMISSIONS.MANAGE_ALERTS), createAlertValidator, validate, alertController.createAlert);
router.patch('/:id/read', requirePermission(PERMISSIONS.VIEW_ALERTS), alertIdValidator, validate, alertController.markAlertAsRead);
router.patch('/:id', requirePermission(PERMISSIONS.MANAGE_ALERTS), updateAlertValidator, validate, alertController.updateAlert);
router.delete('/:id', requirePermission(PERMISSIONS.MANAGE_ALERTS), alertIdValidator, validate, alertController.deleteAlert);

export default router;
