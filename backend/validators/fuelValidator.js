import { body, param, query } from 'express-validator';
import { FUEL_TYPES, FUEL_STATION_STATUS } from '../constants/enums.js';

export const createFuelLogValidator = [
  body('vehicleId').isMongoId().withMessage('Valid vehicle ID is required'),
  body('driverId').optional({ nullable: true }).isMongoId(),
  body('stationId').optional({ nullable: true }).isMongoId(),
  body('tripId').optional({ nullable: true }).isMongoId(),
  body('quantity').isFloat({ min: 0.01 }).withMessage('Quantity must be greater than 0'),
  body('cost').isFloat({ min: 0 }).withMessage('Cost must be 0 or greater'),
  body('pricePerUnit').optional().isFloat({ min: 0 }),
  body('odometer').optional().isFloat({ min: 0 }),
  body('fuelType').optional().isIn(Object.values(FUEL_TYPES)),
  body('fuelStation').optional().trim(),
  body('receiptNumber').optional().trim(),
  body('isFullTank').optional().isBoolean(),
  body('notes').optional().trim().isLength({ max: 500 }),
  body('loggedAt').optional().isISO8601(),
];

export const updateFuelLogValidator = [
  param('id').isMongoId().withMessage('Invalid fuel log ID'),
  body('vehicleId').optional().isMongoId(),
  body('driverId').optional({ nullable: true }).isMongoId(),
  body('stationId').optional({ nullable: true }).isMongoId(),
  body('quantity').optional().isFloat({ min: 0.01 }),
  body('cost').optional().isFloat({ min: 0 }),
  body('odometer').optional().isFloat({ min: 0 }),
  body('fuelType').optional().isIn(Object.values(FUEL_TYPES)),
  body('fuelStation').optional().trim(),
  body('receiptNumber').optional().trim(),
  body('isFullTank').optional().isBoolean(),
  body('notes').optional().trim().isLength({ max: 500 }),
  body('loggedAt').optional().isISO8601(),
];

export const fuelLogIdValidator = [param('id').isMongoId().withMessage('Invalid fuel log ID')];

export const listFuelLogsValidator = [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('vehicleId').optional().isMongoId(),
  query('driverId').optional().isMongoId(),
  query('stationId').optional().isMongoId(),
  query('tripId').optional().isMongoId(),
  query('fuelType').optional().isIn(Object.values(FUEL_TYPES)),
  query('from').optional().isISO8601(),
  query('to').optional().isISO8601(),
  query('search').optional().trim(),
  query('sort').optional().matches(/^[a-zA-Z]+:(asc|desc)$/),
];

export const createFuelStationValidator = [
  body('name').trim().notEmpty().withMessage('Station name is required'),
  body('brand').optional().trim(),
  body('address').optional().trim(),
  body('city').optional().trim(),
  body('state').optional().trim(),
  body('zipCode').optional().trim(),
  body('phone').optional().trim(),
  body('location.lat').optional().isFloat({ min: -90, max: 90 }),
  body('location.lng').optional().isFloat({ min: -180, max: 180 }),
  body('fuelTypes').optional().isArray(),
  body('fuelTypes.*').optional().isIn(Object.values(FUEL_TYPES)),
  body('status').optional().isIn(Object.values(FUEL_STATION_STATUS)),
  body('notes').optional().trim().isLength({ max: 500 }),
];

export const updateFuelStationValidator = [
  param('id').isMongoId().withMessage('Invalid station ID'),
  body('name').optional().trim().notEmpty(),
  body('brand').optional().trim(),
  body('address').optional().trim(),
  body('city').optional().trim(),
  body('state').optional().trim(),
  body('zipCode').optional().trim(),
  body('phone').optional().trim(),
  body('location.lat').optional().isFloat({ min: -90, max: 90 }),
  body('location.lng').optional().isFloat({ min: -180, max: 180 }),
  body('fuelTypes').optional().isArray(),
  body('fuelTypes.*').optional().isIn(Object.values(FUEL_TYPES)),
  body('status').optional().isIn(Object.values(FUEL_STATION_STATUS)),
  body('notes').optional().trim().isLength({ max: 500 }),
];

export const fuelStationIdValidator = [param('id').isMongoId().withMessage('Invalid station ID')];

export const listFuelStationsValidator = [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('status').optional().isIn(Object.values(FUEL_STATION_STATUS)),
  query('fuelType').optional().isIn(Object.values(FUEL_TYPES)),
  query('search').optional().trim(),
  query('sort').optional().matches(/^[a-zA-Z]+:(asc|desc)$/),
];
