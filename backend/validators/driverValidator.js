import { body, param, query } from 'express-validator';
import { DRIVER_STATUS } from '../constants/enums.js';

const docTypes = ['license', 'medical', 'id_proof', 'training', 'other'];

export const createDriverValidator = [
  body('firstName').trim().notEmpty().withMessage('First name is required'),
  body('lastName').trim().notEmpty().withMessage('Last name is required'),
  body('email').optional().trim().isEmail().withMessage('Valid email required'),
  body('phone').optional().trim(),
  body('employeeId').optional().trim(),
  body('licenseNumber').trim().notEmpty().withMessage('License number is required'),
  body('licenseExpiry').isISO8601().withMessage('Valid license expiry date required'),
  body('experienceYears').optional().isInt({ min: 0 }),
  body('medicalCertificateExpiry').optional().isISO8601(),
  body('status').optional().isIn(Object.values(DRIVER_STATUS)),
  body('performanceScore').optional().isInt({ min: 0, max: 100 }),
  body('notes').optional().trim().isLength({ max: 1000 }),
  body('emergencyContact.name').optional().trim(),
  body('emergencyContact.phone').optional().trim(),
  body('emergencyContact.relation').optional().trim(),
];

export const updateDriverValidator = [
  param('id').isMongoId().withMessage('Invalid driver ID'),
  body('firstName').optional().trim().notEmpty(),
  body('lastName').optional().trim().notEmpty(),
  body('email').optional().trim().isEmail(),
  body('phone').optional().trim(),
  body('employeeId').optional().trim(),
  body('licenseNumber').optional().trim().notEmpty(),
  body('licenseExpiry').optional().isISO8601(),
  body('experienceYears').optional().isInt({ min: 0 }),
  body('medicalCertificateExpiry').optional().isISO8601(),
  body('status').optional().isIn(Object.values(DRIVER_STATUS)),
  body('performanceScore').optional().isInt({ min: 0, max: 100 }),
  body('notes').optional().trim().isLength({ max: 1000 }),
  body('emergencyContact.name').optional().trim(),
  body('emergencyContact.phone').optional().trim(),
  body('emergencyContact.relation').optional().trim(),
];

export const driverIdValidator = [param('id').isMongoId().withMessage('Invalid driver ID')];

export const assignVehicleValidator = [
  param('id').isMongoId().withMessage('Invalid driver ID'),
  body('vehicleId').isMongoId().withMessage('Valid vehicle ID is required'),
];

export const listDriversValidator = [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('status').optional().isIn(Object.values(DRIVER_STATUS)),
  query('assigned').optional().isIn(['true', 'false']),
  query('minScore').optional().isInt({ min: 0, max: 100 }),
  query('sort').optional().matches(/^[a-zA-Z]+:(asc|desc)$/),
];

export const documentIdValidator = [
  param('id').isMongoId().withMessage('Invalid driver ID'),
  param('documentId').isMongoId().withMessage('Invalid document ID'),
];

export const uploadDocumentValidator = [
  param('id').isMongoId().withMessage('Invalid driver ID'),
  body('type').optional().isIn(docTypes),
  body('name').optional().trim().notEmpty(),
  body('expiryDate').optional().isISO8601(),
];
