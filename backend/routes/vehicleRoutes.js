import { Router } from 'express';
import { protect } from '../middleware/auth.js';
import { requirePermission } from '../middleware/authorize.js';
import validate from '../middleware/validate.js';
import { upload } from '../middleware/upload.js';
import { PERMISSIONS } from '../constants/roles.js';
import * as vehicleController from '../controllers/vehicleController.js';
import {
  createVehicleValidator,
  updateVehicleValidator,
  vehicleIdValidator,
  assignDriverValidator,
  listVehiclesValidator,
  deleteImageValidator,
} from '../validators/vehicleValidator.js';

const router = Router();

router.use(protect);

router.get('/stats', requirePermission(PERMISSIONS.VIEW_VEHICLES), vehicleController.getVehicleStats);
router.get('/meta/drivers', requirePermission(PERMISSIONS.ASSIGN_VEHICLES), vehicleController.getAvailableDrivers);
router.get('/export', requirePermission(PERMISSIONS.VIEW_VEHICLES), listVehiclesValidator, validate, vehicleController.exportCSV);
router.get('/', requirePermission(PERMISSIONS.VIEW_VEHICLES), listVehiclesValidator, validate, vehicleController.getVehicles);
router.get('/:id/history', requirePermission(PERMISSIONS.VIEW_VEHICLES), vehicleIdValidator, validate, vehicleController.getHistory);
router.get('/:id', requirePermission(PERMISSIONS.VIEW_VEHICLES), vehicleIdValidator, validate, vehicleController.getVehicle);

router.post('/', requirePermission(PERMISSIONS.CREATE_VEHICLES), createVehicleValidator, validate, vehicleController.createVehicle);
router.patch('/:id', requirePermission(PERMISSIONS.UPDATE_VEHICLES), updateVehicleValidator, validate, vehicleController.updateVehicle);
router.delete('/:id', requirePermission(PERMISSIONS.DELETE_VEHICLES), vehicleIdValidator, validate, vehicleController.deleteVehicle);

router.post('/:id/assign-driver', requirePermission(PERMISSIONS.ASSIGN_VEHICLES), assignDriverValidator, validate, vehicleController.assignDriver);
router.delete('/:id/assign-driver', requirePermission(PERMISSIONS.ASSIGN_VEHICLES), vehicleIdValidator, validate, vehicleController.unassignDriver);

router.post(
  '/:id/images',
  requirePermission(PERMISSIONS.UPDATE_VEHICLES),
  vehicleIdValidator,
  validate,
  upload.single('image'),
  vehicleController.uploadImage
);
router.delete(
  '/:id/images/:publicId',
  requirePermission(PERMISSIONS.UPDATE_VEHICLES),
  deleteImageValidator,
  validate,
  vehicleController.deleteImage
);

export default router;
