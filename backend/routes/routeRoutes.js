import { Router } from 'express';
import { protect } from '../middleware/auth.js';
import { requirePermission } from '../middleware/authorize.js';
import validate from '../middleware/validate.js';
import { PERMISSIONS } from '../constants/roles.js';
import * as routeController from '../controllers/routeController.js';
import {
  createRouteValidator,
  updateRouteValidator,
  routeIdValidator,
  listRoutesValidator,
} from '../validators/routeValidator.js';

const router = Router();

router.use(protect);

router.get('/stats', requirePermission(PERMISSIONS.VIEW_TRIPS), routeController.getRouteStats);
router.get('/traffic', requirePermission(PERMISSIONS.VIEW_TRIPS), routeController.getTrafficPreview);
router.get('/export', requirePermission(PERMISSIONS.VIEW_TRIPS), listRoutesValidator, validate, routeController.exportCSV);
router.get('/', requirePermission(PERMISSIONS.VIEW_TRIPS), listRoutesValidator, validate, routeController.getRoutes);

router.get('/:id/history', requirePermission(PERMISSIONS.VIEW_TRIPS), routeIdValidator, validate, routeController.getHistory);
router.get('/:id', requirePermission(PERMISSIONS.VIEW_TRIPS), routeIdValidator, validate, routeController.getRoute);

router.post('/', requirePermission(PERMISSIONS.MANAGE_ROUTES), createRouteValidator, validate, routeController.createRoute);
router.post('/:id/optimize', requirePermission(PERMISSIONS.MANAGE_ROUTES), routeIdValidator, validate, routeController.optimizeRoute);
router.post('/:id/duplicate', requirePermission(PERMISSIONS.MANAGE_ROUTES), routeIdValidator, validate, routeController.duplicateRoute);
router.patch('/:id', requirePermission(PERMISSIONS.MANAGE_ROUTES), updateRouteValidator, validate, routeController.updateRoute);
router.delete('/:id', requirePermission(PERMISSIONS.MANAGE_ROUTES), routeIdValidator, validate, routeController.deleteRoute);

export default router;
