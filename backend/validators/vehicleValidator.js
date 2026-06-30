import { body, param, query } from 'express-validator';
import { VEHICLE_STATUS } from '../constants/enums.js';

const fuelTypes = ['petrol', 'diesel', 'electric', 'cng', 'hybrid'];

const vehicleFields = {
  vehicleNumber: body('vehicleNumber').trim().notEmpty().withMessage('Vehicle number is required'),
  vin: body('vin').optional().trim(),
  model: body('model').trim().notEmpty().withMessage('Model is required'),
  manufacturer: body('manufacturer').trim().notEmpty().withMessage('Manufacturer is required'),
  year: body('year').optional().isInt({ min: 1990, max: 2100 }).withMessage('Invalid year'),
  status: body('status').optional().isIn(Object.values(VEHICLE_STATUS)),
  fuelType: body('fuelType').optional().isIn(fuelTypes),
  fuelLevel: body('fuelLevel').optional().isFloat({ min: 0, max: 100 }),
  odometer: body('odometer').optional().isFloat({ min: 0 }),
  registrationNumber: body('registrationNumber').optional().trim(),
  notes: body('notes').optional().trim().isLength({ max: 1000 }),
};

export const createVehicleValidator = [
  vehicleFields.vehicleNumber,
  vehicleFields.vin,
  vehicleFields.model,
  vehicleFields.manufacturer,
  vehicleFields.year,
  vehicleFields.status,
  vehicleFields.fuelType,
  vehicleFields.fuelLevel,
  vehicleFields.odometer,
  vehicleFields.registrationNumber,
  vehicleFields.notes,
  body('documentExpiry.insurance').optional().isISO8601(),
  body('documentExpiry.registration').optional().isISO8601(),
  body('documentExpiry.fitness').optional().isISO8601(),
  body('documentExpiry.emission').optional().isISO8601(),
  body('documentExpiry.permit').optional().isISO8601(),
];

export const updateVehicleValidator = [
  param('id').isMongoId().withMessage('Invalid vehicle ID'),
  body('vehicleNumber').optional().trim().notEmpty(),
  vehicleFields.vin,
  body('model').optional().trim().notEmpty(),
  body('manufacturer').optional().trim().notEmpty(),
  vehicleFields.year,
  vehicleFields.status,
  vehicleFields.fuelType,
  vehicleFields.fuelLevel,
  vehicleFields.odometer,
  vehicleFields.registrationNumber,
  vehicleFields.notes,
  body('documentExpiry.insurance').optional().isISO8601(),
  body('documentExpiry.registration').optional().isISO8601(),
  body('documentExpiry.fitness').optional().isISO8601(),
  body('documentExpiry.emission').optional().isISO8601(),
  body('documentExpiry.permit').optional().isISO8601(),
];

export const vehicleIdValidator = [param('id').isMongoId().withMessage('Invalid vehicle ID')];

export const assignDriverValidator = [
  param('id').isMongoId().withMessage('Invalid vehicle ID'),
  body('driverId').isMongoId().withMessage('Valid driver ID is required'),
];

export const listVehiclesValidator = [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('status').optional().isIn(Object.values(VEHICLE_STATUS)),
  query('fuelType').optional().isIn(fuelTypes),
  query('assigned').optional().isIn(['true', 'false']),
  query('sort').optional().matches(/^[a-zA-Z]+:(asc|desc)$/),
];

export const deleteImageValidator = [
  param('id').isMongoId().withMessage('Invalid vehicle ID'),
  param('publicId').notEmpty().withMessage('Image ID is required'),
];
