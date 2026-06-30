import { Router } from 'express';
import { protect } from '../middleware/auth.js';
import { requirePermission } from '../middleware/authorize.js';
import validate from '../middleware/validate.js';
import { upload } from '../middleware/upload.js';
import { uploadDriverFile } from '../middleware/uploadDriver.js';
import { PERMISSIONS } from '../constants/roles.js';
import * as driverController from '../controllers/driverController.js';
import {
  createDriverValidator,
  updateDriverValidator,
  driverIdValidator,
  assignVehicleValidator,
  listDriversValidator,
  documentIdValidator,
} from '../validators/driverValidator.js';

const router = Router();

router.use(protect);

router.get('/stats', requirePermission(PERMISSIONS.VIEW_DRIVERS), driverController.getDriverStats);
router.get('/meta/vehicles', requirePermission(PERMISSIONS.ASSIGN_DRIVERS), driverController.getAvailableVehicles);
router.get('/export', requirePermission(PERMISSIONS.VIEW_DRIVERS), listDriversValidator, validate, driverController.exportCSV);
router.get('/', requirePermission(PERMISSIONS.VIEW_DRIVERS), listDriversValidator, validate, driverController.getDrivers);
router.get('/:id/history', requirePermission(PERMISSIONS.VIEW_DRIVERS), driverIdValidator, validate, driverController.getHistory);
router.get('/:id', requirePermission(PERMISSIONS.VIEW_DRIVERS), driverIdValidator, validate, driverController.getDriver);

router.post('/', requirePermission(PERMISSIONS.CREATE_DRIVERS), createDriverValidator, validate, driverController.createDriver);
router.patch('/:id', requirePermission(PERMISSIONS.UPDATE_DRIVERS), updateDriverValidator, validate, driverController.updateDriver);
router.delete('/:id', requirePermission(PERMISSIONS.DELETE_DRIVERS), driverIdValidator, validate, driverController.deleteDriver);

router.post('/:id/assign-vehicle', requirePermission(PERMISSIONS.ASSIGN_DRIVERS), assignVehicleValidator, validate, driverController.assignVehicle);
router.delete('/:id/assign-vehicle', requirePermission(PERMISSIONS.ASSIGN_DRIVERS), driverIdValidator, validate, driverController.unassignVehicle);

router.post(
  '/:id/avatar',
  requirePermission(PERMISSIONS.UPDATE_DRIVERS),
  driverIdValidator,
  validate,
  upload.single('avatar'),
  driverController.uploadAvatar
);

router.post(
  '/:id/documents',
  requirePermission(PERMISSIONS.UPDATE_DRIVERS),
  driverIdValidator,
  validate,
  uploadDriverFile.single('file'),
  driverController.uploadDocument
);

router.delete(
  '/:id/documents/:documentId',
  requirePermission(PERMISSIONS.UPDATE_DRIVERS),
  documentIdValidator,
  validate,
  driverController.deleteDocument
);

export default router;
