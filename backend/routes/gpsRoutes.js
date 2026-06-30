import { Router } from 'express';
import { protect } from '../middleware/auth.js';
import { requirePermission } from '../middleware/authorize.js';
import validate from '../middleware/validate.js';
import { PERMISSIONS } from '../constants/roles.js';
import * as gpsController from '../controllers/gpsController.js';
import {
  vehicleIdValidator,
  historyQueryValidator,
  createGeofenceValidator,
  updateGeofenceValidator,
  geofenceIdValidator,
} from '../validators/gpsValidator.js';

const router = Router();

router.use(protect);

router.get('/stats', requirePermission(PERMISSIONS.VIEW_TRACKING), gpsController.getTrackingStats);
router.get('/dashboard', requirePermission(PERMISSIONS.VIEW_TRACKING), gpsController.getLiveTrackingDashboard);
router.get('/live', requirePermission(PERMISSIONS.VIEW_TRACKING), gpsController.getLiveVehicles);
router.get('/mock', requirePermission(PERMISSIONS.VIEW_TRACKING), gpsController.getMockGps);
router.post('/simulate', requirePermission(PERMISSIONS.MANAGE_GEOFENCES), gpsController.triggerSimulation);
router.get('/vehicles/:vehicleId', requirePermission(PERMISSIONS.VIEW_TRACKING), vehicleIdValidator, validate, gpsController.getVehicleLive);
router.get('/vehicles/:vehicleId/history', requirePermission(PERMISSIONS.VIEW_TRACKING), historyQueryValidator, validate, gpsController.getVehicleHistory);

router.get('/geofences/events', requirePermission(PERMISSIONS.VIEW_TRACKING), gpsController.getGeofenceEvents);
router.get('/geofences', requirePermission(PERMISSIONS.VIEW_TRACKING), gpsController.getGeofences);
router.get('/geofences/:id', requirePermission(PERMISSIONS.VIEW_TRACKING), geofenceIdValidator, validate, gpsController.getGeofence);
router.post('/geofences', requirePermission(PERMISSIONS.MANAGE_GEOFENCES), createGeofenceValidator, validate, gpsController.createGeofence);
router.patch('/geofences/:id', requirePermission(PERMISSIONS.MANAGE_GEOFENCES), updateGeofenceValidator, validate, gpsController.updateGeofence);
router.delete('/geofences/:id', requirePermission(PERMISSIONS.MANAGE_GEOFENCES), geofenceIdValidator, validate, gpsController.deleteGeofence);

export default router;
