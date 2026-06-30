import { Router } from 'express';
import { protect } from '../middleware/auth.js';
import { requirePermission } from '../middleware/authorize.js';
import validate from '../middleware/validate.js';
import { PERMISSIONS } from '../constants/roles.js';
import * as fuelController from '../controllers/fuelController.js';
import {
  createFuelLogValidator,
  updateFuelLogValidator,
  fuelLogIdValidator,
  listFuelLogsValidator,
  createFuelStationValidator,
  updateFuelStationValidator,
  fuelStationIdValidator,
  listFuelStationsValidator,
} from '../validators/fuelValidator.js';

const router = Router();

router.use(protect);

router.get('/stats', requirePermission(PERMISSIONS.VIEW_FUEL), fuelController.getFuelStats);
router.get('/analytics', requirePermission(PERMISSIONS.VIEW_FUEL), fuelController.getFuelAnalytics);
router.get('/meta/vehicles', requirePermission(PERMISSIONS.VIEW_FUEL), fuelController.getMetaVehicles);
router.get('/meta/stations', requirePermission(PERMISSIONS.VIEW_FUEL), fuelController.getActiveStations);

router.get('/logs/export', requirePermission(PERMISSIONS.VIEW_FUEL), listFuelLogsValidator, validate, fuelController.exportFuelLogs);
router.get('/logs', requirePermission(PERMISSIONS.VIEW_FUEL), listFuelLogsValidator, validate, fuelController.getFuelLogs);
router.get('/logs/:id', requirePermission(PERMISSIONS.VIEW_FUEL), fuelLogIdValidator, validate, fuelController.getFuelLog);
router.post('/logs', requirePermission(PERMISSIONS.MANAGE_FUEL), createFuelLogValidator, validate, fuelController.createFuelLog);
router.patch('/logs/:id', requirePermission(PERMISSIONS.MANAGE_FUEL), updateFuelLogValidator, validate, fuelController.updateFuelLog);
router.delete('/logs/:id', requirePermission(PERMISSIONS.MANAGE_FUEL), fuelLogIdValidator, validate, fuelController.deleteFuelLog);

router.get('/stations', requirePermission(PERMISSIONS.VIEW_FUEL), listFuelStationsValidator, validate, fuelController.getFuelStations);
router.get('/stations/:id', requirePermission(PERMISSIONS.VIEW_FUEL), fuelStationIdValidator, validate, fuelController.getFuelStation);
router.post('/stations', requirePermission(PERMISSIONS.MANAGE_FUEL), createFuelStationValidator, validate, fuelController.createFuelStation);
router.patch('/stations/:id', requirePermission(PERMISSIONS.MANAGE_FUEL), updateFuelStationValidator, validate, fuelController.updateFuelStation);
router.delete('/stations/:id', requirePermission(PERMISSIONS.MANAGE_FUEL), fuelStationIdValidator, validate, fuelController.deleteFuelStation);

export default router;
