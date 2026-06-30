import { Router } from 'express';
import { protect } from '../middleware/auth.js';
import { requirePermission } from '../middleware/authorize.js';
import validate from '../middleware/validate.js';
import { documentUpload } from '../middleware/documentUpload.js';
import { PERMISSIONS } from '../constants/roles.js';
import * as tripController from '../controllers/tripController.js';
import * as tripExpenseController from '../controllers/tripExpenseController.js';
import {
  createTripValidator,
  updateTripValidator,
  tripIdValidator,
  completeTripValidator,
  cancelTripValidator,
  reviewTripValidator,
  listTripsValidator,
} from '../validators/tripValidator.js';
import {
  addTripExpenseValidator,
  updateConsignmentValidator,
} from '../validators/tripExpenseValidator.js';

const router = Router();

router.use(protect);

router.get('/stats', requirePermission(PERMISSIONS.VIEW_TRIPS), tripController.getTripStats);
router.get('/pending-review', requirePermission(PERMISSIONS.REVIEW_TRIPS), listTripsValidator, validate, tripController.getPendingReviewTrips);
router.get('/upcoming', requirePermission(PERMISSIONS.VIEW_TRIPS), tripController.getUpcomingTrips);
router.get('/analytics', requirePermission(PERMISSIONS.VIEW_TRIPS), tripController.getTripAnalytics);
router.get('/meta/drivers', requirePermission(PERMISSIONS.VIEW_TRIPS), tripController.getMetaDrivers);
router.get('/meta/vehicles', requirePermission(PERMISSIONS.VIEW_TRIPS), tripController.getMetaVehicles);
router.get('/meta/routes', requirePermission(PERMISSIONS.VIEW_TRIPS), tripController.getMetaRoutes);
router.get('/meta/fuel-stations', requirePermission(PERMISSIONS.UPDATE_TRIPS), tripController.getMetaFuelStations);
router.get('/me/driver', requirePermission(PERMISSIONS.VIEW_TRIPS), tripController.getMyDriverProfile);
router.get('/me/active', requirePermission(PERMISSIONS.VIEW_TRIPS), tripController.getMyActiveTrip);
router.get('/me/scheduled', requirePermission(PERMISSIONS.VIEW_TRIPS), tripController.getMyScheduledTrips);
router.get('/export', requirePermission(PERMISSIONS.VIEW_TRIPS), listTripsValidator, validate, tripController.exportCSV);
router.get('/', requirePermission(PERMISSIONS.VIEW_TRIPS), listTripsValidator, validate, tripController.getTrips);

router.get('/:id/expenses', requirePermission(PERMISSIONS.VIEW_TRIPS), tripIdValidator, validate, tripExpenseController.getExpenses);
router.post(
  '/:id/expenses',
  requirePermission(PERMISSIONS.UPDATE_TRIPS),
  documentUpload.single('receipt'),
  addTripExpenseValidator,
  validate,
  tripExpenseController.addExpense
);
router.patch(
  '/:id/consignment',
  requirePermission(PERMISSIONS.UPDATE_TRIPS),
  updateConsignmentValidator,
  validate,
  tripExpenseController.updateConsignment
);

router.get('/:id/history', requirePermission(PERMISSIONS.VIEW_TRIPS), tripIdValidator, validate, tripController.getHistory);
router.get('/:id', requirePermission(PERMISSIONS.VIEW_TRIPS), tripIdValidator, validate, tripController.getTrip);

router.post('/', requirePermission(PERMISSIONS.CREATE_TRIPS), createTripValidator, validate, tripController.createTrip);
router.post('/:id/start', requirePermission(PERMISSIONS.UPDATE_TRIPS), tripIdValidator, validate, tripController.startTrip);
router.post('/:id/complete', requirePermission(PERMISSIONS.UPDATE_TRIPS), completeTripValidator, validate, tripController.completeTrip);
router.post('/:id/review', requirePermission(PERMISSIONS.REVIEW_TRIPS), reviewTripValidator, validate, tripController.reviewTrip);
router.post('/:id/cancel', requirePermission(PERMISSIONS.UPDATE_TRIPS), cancelTripValidator, validate, tripController.cancelTrip);
router.patch('/:id', requirePermission(PERMISSIONS.UPDATE_TRIPS), updateTripValidator, validate, tripController.updateTrip);
router.delete('/:id', requirePermission(PERMISSIONS.DELETE_TRIPS), tripIdValidator, validate, tripController.deleteTrip);

export default router;
