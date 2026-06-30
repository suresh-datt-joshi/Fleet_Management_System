import { body, param, query } from 'express-validator';
import { MAINTENANCE_STATUS, MAINTENANCE_TYPE, MAINTENANCE_PRIORITY } from '../constants/enums.js';

const partsValidator = [
  body('parts').optional().isArray({ max: 50 }),
  body('parts.*.name').trim().notEmpty().withMessage('Part name is required'),
  body('parts.*.quantity').optional().isInt({ min: 1 }),
  body('parts.*.cost').optional().isFloat({ min: 0 }),
];

export const createMaintenanceValidator = [
  body('vehicleId').isMongoId().withMessage('Valid vehicle ID is required'),
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('description').optional().trim(),
  body('type').optional().isIn(Object.values(MAINTENANCE_TYPE)),
  body('priority').optional().isIn(Object.values(MAINTENANCE_PRIORITY)),
  body('scheduledDate').isISO8601().withMessage('Valid scheduled date is required'),
  body('assignedMechanicId').optional({ nullable: true }).isMongoId(),
  body('odometerAtService').optional().isFloat({ min: 0 }),
  body('laborCost').optional().isFloat({ min: 0 }),
  body('serviceProvider').optional().trim(),
  body('notes').optional().trim().isLength({ max: 1000 }),
  ...partsValidator,
];

export const updateMaintenanceValidator = [
  param('id').isMongoId().withMessage('Invalid work order ID'),
  body('vehicleId').optional().isMongoId(),
  body('title').optional().trim().notEmpty(),
  body('description').optional().trim(),
  body('type').optional().isIn(Object.values(MAINTENANCE_TYPE)),
  body('priority').optional().isIn(Object.values(MAINTENANCE_PRIORITY)),
  body('scheduledDate').optional().isISO8601(),
  body('odometerAtService').optional().isFloat({ min: 0 }),
  body('laborCost').optional().isFloat({ min: 0 }),
  body('serviceProvider').optional().trim(),
  body('notes').optional().trim().isLength({ max: 1000 }),
  ...partsValidator,
];

export const maintenanceIdValidator = [param('id').isMongoId().withMessage('Invalid work order ID')];

export const assignMechanicValidator = [
  param('id').isMongoId().withMessage('Invalid work order ID'),
  body('mechanicId').isMongoId().withMessage('Valid mechanic ID is required'),
];

export const completeMaintenanceValidator = [
  param('id').isMongoId().withMessage('Invalid work order ID'),
  body('laborCost').optional().isFloat({ min: 0 }),
  body('odometerAtService').optional().isFloat({ min: 0 }),
  body('notes').optional().trim().isLength({ max: 1000 }),
  body('completedDate').optional().isISO8601(),
  ...partsValidator,
];

export const listMaintenanceValidator = [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('status').optional().isIn(Object.values(MAINTENANCE_STATUS)),
  query('type').optional().isIn(Object.values(MAINTENANCE_TYPE)),
  query('priority').optional().isIn(Object.values(MAINTENANCE_PRIORITY)),
  query('vehicleId').optional().isMongoId(),
  query('mechanicId').optional().isMongoId(),
  query('from').optional().isISO8601(),
  query('to').optional().isISO8601(),
  query('search').optional().trim(),
  query('sort').optional().matches(/^[a-zA-Z]+:(asc|desc)$/),
];
