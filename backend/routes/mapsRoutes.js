import { Router } from 'express';
import { protect } from '../middleware/auth.js';
import { requirePermission } from '../middleware/authorize.js';
import validate from '../middleware/validate.js';
import { PERMISSIONS } from '../constants/roles.js';
import * as mapsController from '../controllers/mapsController.js';
import {
  geocodeValidator,
  reverseGeocodeValidator,
  directionsValidator,
  distanceMatrixValidator,
  staticMapValidator,
} from '../validators/mapsValidator.js';

const router = Router();

router.get('/browser-config', mapsController.getBrowserConfig);

router.use(protect);

router.get('/config', requirePermission(PERMISSIONS.VIEW_TRACKING), mapsController.getConfig);

router.post(
  '/geocode',
  requirePermission(PERMISSIONS.VIEW_TRACKING),
  geocodeValidator,
  validate,
  mapsController.geocode
);

router.post(
  '/reverse-geocode',
  requirePermission(PERMISSIONS.VIEW_TRACKING),
  reverseGeocodeValidator,
  validate,
  mapsController.reverseGeocode
);

router.post(
  '/directions',
  requirePermission(PERMISSIONS.VIEW_TRACKING),
  directionsValidator,
  validate,
  mapsController.getDirections
);

router.post(
  '/distance-matrix',
  requirePermission(PERMISSIONS.VIEW_TRACKING),
  distanceMatrixValidator,
  validate,
  mapsController.getDistanceMatrix
);

router.get(
  '/static',
  requirePermission(PERMISSIONS.VIEW_TRACKING),
  staticMapValidator,
  validate,
  mapsController.getStaticMap
);

export default router;
