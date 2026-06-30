import { body, param, query } from 'express-validator';
import { TRIP_STATUS } from '../constants/enums.js';
import { FUEL_TYPES } from '../constants/enums.js';

const locationValidator = [
  body('origin.address').optional().trim(),
  body('origin.lat').optional().isFloat(),
  body('origin.lng').optional().isFloat(),
  body('destination.address').optional().trim(),
  body('destination.lat').optional().isFloat(),
  body('destination.lng').optional().isFloat(),
];

export const createTripValidator = [
  body('driverId').isMongoId().withMessage('Valid driver ID is required'),
  body('vehicleId').isMongoId().withMessage('Valid vehicle ID is required'),
  body('routeId').optional({ nullable: true }).isMongoId(),
  body('scheduledAt').optional().isISO8601(),
  body('distance').optional().isFloat({ min: 0 }),
  body('estimatedCost').optional().isFloat({ min: 0 }),
  body('fuelUsed').optional().isFloat({ min: 0 }),
  body('revenue').optional().isFloat({ min: 0 }),
  body('expenses').optional().isFloat({ min: 0 }),
  body('notes').optional().trim().isLength({ max: 1000 }),
  ...locationValidator,
];

export const updateTripValidator = [
  param('id').isMongoId().withMessage('Invalid trip ID'),
  body('driverId').optional().isMongoId(),
  body('vehicleId').optional().isMongoId(),
  body('routeId').optional({ nullable: true }).isMongoId(),
  body('scheduledAt').optional().isISO8601(),
  body('distance').optional().isFloat({ min: 0 }),
  body('estimatedCost').optional().isFloat({ min: 0 }),
  body('fuelUsed').optional().isFloat({ min: 0 }),
  body('revenue').optional().isFloat({ min: 0 }),
  body('expenses').optional().isFloat({ min: 0 }),
  body('notes').optional().trim().isLength({ max: 1000 }),
  ...locationValidator,
];

export const tripIdValidator = [param('id').isMongoId().withMessage('Invalid trip ID')];

export const completeTripValidator = [
  param('id').isMongoId().withMessage('Invalid trip ID'),
  body('distance').optional().isFloat({ min: 0 }),
  body('estimatedCost').optional().isFloat({ min: 0 }),
  body('fuelUsed').optional().isFloat({ min: 0 }),
  body('revenue').optional().isFloat({ min: 0 }),
  body('expenses').optional().isFloat({ min: 0 }),
  body('notes').optional().trim().isLength({ max: 1000 }),
  body('completedAt').optional().isISO8601(),
  body('fuelLogs').optional().isArray({ min: 1 }).withMessage('At least one fuel log is required'),
  body('fuelLogs.*.quantity').isFloat({ min: 0.01 }).withMessage('Fuel quantity must be greater than 0'),
  body('fuelLogs.*.cost').isFloat({ min: 0 }).withMessage('Fuel cost must be 0 or greater'),
  body('fuelLogs.*.stationId').optional({ nullable: true }).isMongoId(),
  body('fuelLogs.*.tripExpenseId').optional({ nullable: true }).isMongoId(),
  body('fuelLogs.*.odometer').optional().isFloat({ min: 0 }),
  body('fuelLogs.*.fuelType').optional().isIn(Object.values(FUEL_TYPES)),
  body('fuelLogs.*.fuelStation').optional().trim(),
  body('fuelLogs.*.receiptNumber').optional().trim(),
  body('fuelLogs.*.isFullTank').optional().isBoolean(),
  body('fuelLogs.*.notes').optional().trim().isLength({ max: 500 }),
  body('fuelLogs.*.loggedAt').optional().isISO8601(),
];

export const cancelTripValidator = [
  param('id').isMongoId().withMessage('Invalid trip ID'),
  body('notes').optional().trim().isLength({ max: 1000 }),
];

export const reviewTripValidator = [
  param('id').isMongoId().withMessage('Invalid trip ID'),
  body('revenue').isFloat({ min: 0 }).withMessage('Revenue must be 0 or greater'),
  body('reviewNotes').optional().trim().isLength({ max: 2000 }),
  body('notes').optional().trim().isLength({ max: 1000 }),
  body('expenseBreakdown.fuel').optional().isFloat({ min: 0 }),
  body('expenseBreakdown.tolls').optional().isFloat({ min: 0 }),
  body('expenseBreakdown.maintenance').optional().isFloat({ min: 0 }),
  body('expenseBreakdown.food').optional().isFloat({ min: 0 }),
  body('expenseBreakdown.lodging').optional().isFloat({ min: 0 }),
  body('expenseBreakdown.other').optional().isFloat({ min: 0 }),
];

export const listTripsValidator = [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('status').optional().isIn(Object.values(TRIP_STATUS)),
  query('statuses').optional().matches(/^[\w,]+$/),
  query('driverId').optional().isMongoId(),
  query('vehicleId').optional().isMongoId(),
  query('routeId').optional().isMongoId(),
  query('from').optional().isISO8601(),
  query('to').optional().isISO8601(),
  query('search').optional().trim(),
  query('sort').optional().matches(/^[a-zA-Z]+:(asc|desc)$/),
];
