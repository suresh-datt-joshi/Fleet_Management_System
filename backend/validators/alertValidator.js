import { body, param, query } from 'express-validator';
import { ALERT_TYPES, ALERT_SEVERITY } from '../constants/enums.js';

export const createAlertValidator = [
  body('type').isIn(Object.values(ALERT_TYPES)).withMessage('Valid alert type is required'),
  body('severity').optional().isIn(Object.values(ALERT_SEVERITY)),
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('message').trim().notEmpty().withMessage('Message is required'),
  body('vehicleId').optional({ nullable: true }).isMongoId(),
  body('driverId').optional({ nullable: true }).isMongoId(),
  body('metadata').optional().isObject(),
];

export const updateAlertValidator = [
  param('id').isMongoId().withMessage('Invalid alert ID'),
  body('severity').optional().isIn(Object.values(ALERT_SEVERITY)),
  body('title').optional().trim().notEmpty(),
  body('message').optional().trim().notEmpty(),
  body('isRead').optional().isBoolean(),
];

export const alertIdValidator = [param('id').isMongoId().withMessage('Invalid alert ID')];

export const notificationIdValidator = [param('id').isMongoId().withMessage('Invalid notification ID')];

export const listAlertsValidator = [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('type').optional().isIn(Object.values(ALERT_TYPES)),
  query('severity').optional().isIn(Object.values(ALERT_SEVERITY)),
  query('isRead').optional().isIn(['true', 'false']),
  query('unread').optional().isIn(['true']),
  query('vehicleId').optional().isMongoId(),
  query('driverId').optional().isMongoId(),
  query('from').optional().isISO8601(),
  query('to').optional().isISO8601(),
  query('search').optional().trim(),
  query('sort').optional().matches(/^[a-zA-Z]+:(asc|desc)$/),
];

export const bulkDeleteValidator = [
  body('ids').isArray({ min: 1 }).withMessage('ids array is required'),
  body('ids.*').isMongoId().withMessage('Each id must be valid'),
];

export const listNotificationsValidator = [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('isRead').optional().isIn(['true', 'false']),
  query('unread').optional().isIn(['true']),
  query('type').optional().trim(),
  query('sort').optional().matches(/^[a-zA-Z]+:(asc|desc)$/),
];
