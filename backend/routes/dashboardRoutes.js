import { Router } from 'express';
import { protect } from '../middleware/auth.js';
import { requireAnyPermission } from '../middleware/requireAnyPermission.js';
import { PERMISSIONS } from '../constants/roles.js';
import * as dashboardController from '../controllers/dashboardController.js';

const router = Router();

const dashboardAccess = requireAnyPermission(
  PERMISSIONS.VIEW_ANALYTICS,
  PERMISSIONS.VIEW_VEHICLES,
  PERMISSIONS.VIEW_TRIPS,
  PERMISSIONS.VIEW_DRIVERS
);

router.use(protect, dashboardAccess);

router.get('/overview', dashboardController.getOverview);
router.get('/summary', dashboardController.getSummary);
router.get('/charts', dashboardController.getCharts);
router.get('/activities', dashboardController.getActivities);
router.get('/alerts', dashboardController.getAlerts);
router.get('/live-vehicles', dashboardController.getLiveVehicles);

export default router;
