import { body, param, query } from 'express-validator';
import { DOCUMENT_TYPES, DOCUMENT_ENTITY_TYPES, DOCUMENT_STATUS } from '../constants/enums.js';

export const createDocumentValidator = [
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('type').isIn(Object.values(DOCUMENT_TYPES)).withMessage('Valid document type is required'),
  body('description').optional().trim(),
  body('entityType').optional().isIn(Object.values(DOCUMENT_ENTITY_TYPES)),
  body('vehicleId').optional().isMongoId(),
  body('driverId').optional().isMongoId(),
  body('issueDate').optional().isISO8601(),
  body('expiryDate').optional().isISO8601(),
  body('reminderDaysBefore').optional().isInt({ min: 1, max: 365 }),
  body('notes').optional().trim().isLength({ max: 1000 }),
  body('tags').optional(),
];

export const updateDocumentValidator = [
  param('id').isMongoId().withMessage('Invalid document ID'),
  body('title').optional().trim().notEmpty(),
  body('type').optional().isIn(Object.values(DOCUMENT_TYPES)),
  body('description').optional().trim(),
  body('entityType').optional().isIn(Object.values(DOCUMENT_ENTITY_TYPES)),
  body('vehicleId').optional({ nullable: true }).isMongoId(),
  body('driverId').optional({ nullable: true }).isMongoId(),
  body('issueDate').optional({ nullable: true }).isISO8601(),
  body('expiryDate').optional({ nullable: true }).isISO8601(),
  body('reminderDaysBefore').optional().isInt({ min: 1, max: 365 }),
  body('notes').optional().trim().isLength({ max: 1000 }),
  body('tags').optional(),
];

export const documentIdValidator = [param('id').isMongoId().withMessage('Invalid document ID')];

export const listDocumentsValidator = [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('type').optional().isIn(Object.values(DOCUMENT_TYPES)),
  query('entityType').optional().isIn(Object.values(DOCUMENT_ENTITY_TYPES)),
  query('status').optional().isIn(Object.values(DOCUMENT_STATUS)),
  query('vehicleId').optional().isMongoId(),
  query('driverId').optional().isMongoId(),
  query('expiring').optional().isIn(['true', 'false']),
  query('search').optional().trim(),
  query('sort').optional().matches(/^[a-zA-Z]+:(asc|desc)$/),
];
