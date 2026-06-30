import { body, param, query } from 'express-validator';
import { GEOFENCE_TYPES } from '../constants/enums.js';

export const vehicleIdValidator = [param('vehicleId').isMongoId().withMessage('Invalid vehicle ID')];

export const historyQueryValidator = [
  ...vehicleIdValidator,
  query('from').optional().isISO8601(),
  query('to').optional().isISO8601(),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 500 }),
];

export const createGeofenceValidator = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('description').optional().trim(),
  body('type').isIn(Object.values(GEOFENCE_TYPES)),
  body('center.lng').if(body('type').equals('circle')).isFloat(),
  body('center.lat').if(body('type').equals('circle')).isFloat(),
  body('radius').optional().isFloat({ min: 50 }),
  body('color').optional().trim(),
  body('alertOnEnter').optional().isBoolean(),
  body('alertOnExit').optional().isBoolean(),
  body('speedLimit').optional({ nullable: true }).isFloat({ min: 1 }),
  body('isActive').optional().isBoolean(),
];

export const updateGeofenceValidator = [
  param('id').isMongoId().withMessage('Invalid geofence ID'),
  body('name').optional().trim().notEmpty(),
  body('description').optional().trim(),
  body('type').optional().isIn(Object.values(GEOFENCE_TYPES)),
  body('center.lng').optional().isFloat(),
  body('center.lat').optional().isFloat(),
  body('radius').optional().isFloat({ min: 50 }),
  body('color').optional().trim(),
  body('alertOnEnter').optional().isBoolean(),
  body('alertOnExit').optional().isBoolean(),
  body('speedLimit').optional({ nullable: true }).isFloat({ min: 1 }),
  body('isActive').optional().isBoolean(),
];

export const geofenceIdValidator = [param('id').isMongoId().withMessage('Invalid geofence ID')];
