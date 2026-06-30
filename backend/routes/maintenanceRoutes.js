import { Router } from 'express';
import { protect } from '../middleware/auth.js';
import { requirePermission } from '../middleware/authorize.js';
import validate from '../middleware/validate.js';
import { PERMISSIONS } from '../constants/roles.js';
import * as maintenanceController from '../controllers/maintenanceController.js';
import {
  createMaintenanceValidator,
  updateMaintenanceValidator,
  maintenanceIdValidator,
  assignMechanicValidator,
  completeMaintenanceValidator,
  listMaintenanceValidator,
} from '../validators/maintenanceValidator.js';

const router = Router();

router.use(protect);

router.get('/stats', requirePermission(PERMISSIONS.VIEW_MAINTENANCE), maintenanceController.getMaintenanceStats);
router.get('/upcoming', requirePermission(PERMISSIONS.VIEW_MAINTENANCE), maintenanceController.getUpcomingMaintenance);
router.get('/analytics', requirePermission(PERMISSIONS.VIEW_MAINTENANCE), maintenanceController.getMaintenanceAnalytics);
router.get('/meta/vehicles', requirePermission(PERMISSIONS.VIEW_MAINTENANCE), maintenanceController.getMetaVehicles);
router.get('/meta/mechanics', requirePermission(PERMISSIONS.VIEW_MAINTENANCE), maintenanceController.getMetaMechanics);
router.get('/export', requirePermission(PERMISSIONS.VIEW_MAINTENANCE), listMaintenanceValidator, validate, maintenanceController.exportCSV);
router.get('/', requirePermission(PERMISSIONS.VIEW_MAINTENANCE), listMaintenanceValidator, validate, maintenanceController.getMaintenanceRecords);

router.get('/:id/history', requirePermission(PERMISSIONS.VIEW_MAINTENANCE), maintenanceIdValidator, validate, maintenanceController.getHistory);
router.get('/:id', requirePermission(PERMISSIONS.VIEW_MAINTENANCE), maintenanceIdValidator, validate, maintenanceController.getMaintenance);

router.post('/', requirePermission(PERMISSIONS.MANAGE_MAINTENANCE), createMaintenanceValidator, validate, maintenanceController.createMaintenance);
router.post('/:id/assign', requirePermission(PERMISSIONS.ASSIGN_WORK_ORDERS), assignMechanicValidator, validate, maintenanceController.assignMechanic);
router.post('/:id/start', requirePermission(PERMISSIONS.MANAGE_MAINTENANCE), maintenanceIdValidator, validate, maintenanceController.startMaintenance);
router.post('/:id/complete', requirePermission(PERMISSIONS.MANAGE_MAINTENANCE), completeMaintenanceValidator, validate, maintenanceController.completeMaintenance);
router.patch('/:id', requirePermission(PERMISSIONS.MANAGE_MAINTENANCE), updateMaintenanceValidator, validate, maintenanceController.updateMaintenance);
router.delete('/:id', requirePermission(PERMISSIONS.MANAGE_MAINTENANCE), maintenanceIdValidator, validate, maintenanceController.deleteMaintenance);

export default router;
