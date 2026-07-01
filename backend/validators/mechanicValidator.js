import { body, param, query } from 'express-validator';
import { MECHANIC_STATUS, MECHANIC_SPECIALIZATIONS } from '../constants/enums.js';

const docTypes = ['certification', 'training', 'id_proof', 'other'];

export const createMechanicValidator = [
  body('firstName').trim().notEmpty().withMessage('First name is required'),
  body('lastName').trim().notEmpty().withMessage('Last name is required'),
  body('email').optional().trim().isEmail().withMessage('Valid email required'),
  body('phone').optional().trim(),
  body('employeeId').optional().trim(),
  body('certificationNumber').trim().notEmpty().withMessage('Certification number is required'),
  body('certificationExpiry').isISO8601().withMessage('Valid certification expiry date required'),
  body('specialization').optional().isIn(Object.values(MECHANIC_SPECIALIZATIONS)),
  body('experienceYears').optional().isInt({ min: 0 }),
  body('status').optional().isIn(Object.values(MECHANIC_STATUS)),
  body('performanceScore').optional().isInt({ min: 0, max: 100 }),
  body('notes').optional().trim().isLength({ max: 1000 }),
];

export const updateMechanicValidator = [
  param('id').isMongoId().withMessage('Invalid mechanic ID'),
  body('firstName').optional().trim().notEmpty(),
  body('lastName').optional().trim().notEmpty(),
  body('email').optional().trim().isEmail(),
  body('phone').optional().trim(),
  body('employeeId').optional().trim(),
  body('certificationNumber').optional().trim().notEmpty(),
  body('certificationExpiry').optional().isISO8601(),
  body('specialization').optional().isIn(Object.values(MECHANIC_SPECIALIZATIONS)),
  body('experienceYears').optional().isInt({ min: 0 }),
  body('status').optional().isIn(Object.values(MECHANIC_STATUS)),
  body('performanceScore').optional().isInt({ min: 0, max: 100 }),
  body('notes').optional().trim().isLength({ max: 1000 }),
];

export const mechanicIdValidator = [param('id').isMongoId().withMessage('Invalid mechanic ID')];

export const listMechanicsValidator = [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('status').optional().isIn(Object.values(MECHANIC_STATUS)),
  query('specialization').optional().isIn(Object.values(MECHANIC_SPECIALIZATIONS)),
  query('minScore').optional().isInt({ min: 0, max: 100 }),
  query('sort').optional().matches(/^[a-zA-Z]+:(asc|desc)$/),
];

export const documentIdValidator = [
  param('id').isMongoId().withMessage('Invalid mechanic ID'),
  param('documentId').isMongoId().withMessage('Invalid document ID'),
];

export const uploadDocumentValidator = [
  param('id').isMongoId().withMessage('Invalid mechanic ID'),
  body('type').optional().isIn(docTypes),
  body('name').optional().trim().notEmpty(),
  body('expiryDate').optional().isISO8601(),
];
