import { body, param, query } from 'express-validator';
import { USER_ROLES } from '../constants/roles.js';

const passwordRules = body('password')
  .isLength({ min: 8 })
  .withMessage('Password must be at least 8 characters')
  .matches(/[A-Z]/)
  .withMessage('Password must contain at least one uppercase letter')
  .matches(/[a-z]/)
  .withMessage('Password must contain at least one lowercase letter')
  .matches(/[0-9]/)
  .withMessage('Password must contain at least one number');

export const createUserValidator = [
  body('firstName').trim().notEmpty().withMessage('First name is required').isLength({ max: 50 }),
  body('lastName').trim().notEmpty().withMessage('Last name is required').isLength({ max: 50 }),
  body('email').trim().isEmail().withMessage('Valid email is required').normalizeEmail(),
  passwordRules,
  body('phone').optional({ values: 'falsy' }).trim(),
  body('role').optional().isIn(Object.values(USER_ROLES)),
  body('isActive').optional().isBoolean(),
];

export const updateUserValidator = [
  param('id').isMongoId().withMessage('Invalid user ID'),
  body('firstName').optional().trim().notEmpty().isLength({ max: 50 }),
  body('lastName').optional().trim().notEmpty().isLength({ max: 50 }),
  body('email').optional().trim().isEmail().normalizeEmail(),
  body('phone').optional({ values: 'falsy' }).trim(),
  body('role').optional().isIn(Object.values(USER_ROLES)),
  body('isActive').optional().isBoolean(),
];

export const resetPasswordValidator = [
  param('id').isMongoId().withMessage('Invalid user ID'),
  passwordRules,
];

export const userIdValidator = [param('id').isMongoId().withMessage('Invalid user ID')];

export const listUsersValidator = [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('role').optional().isIn(Object.values(USER_ROLES)),
  query('isActive').optional().isIn(['true', 'false']),
  query('search').optional().trim(),
  query('sort').optional().matches(/^[a-zA-Z]+:(asc|desc)$/),
];

export const updateSettingsValidator = [
  body('companyName').optional().trim().isLength({ max: 120 }),
  body('companyEmail').optional({ values: 'falsy' }).trim().isEmail(),
  body('companyPhone').optional({ values: 'falsy' }).trim(),
  body('companyAddress').optional({ values: 'falsy' }).trim().isLength({ max: 500 }),
  body('timezone').optional().trim(),
  body('currency').optional().trim().isLength({ min: 3, max: 3 }),
  body('dateFormat').optional().trim(),
  body('fuelLowThreshold').optional().isFloat({ min: 0, max: 100 }),
  body('maintenanceReminderDays').optional().isInt({ min: 1, max: 90 }),
  body('documentReminderDays').optional().isInt({ min: 1, max: 365 }),
  body('speedLimitKmh').optional().isInt({ min: 1, max: 200 }),
  body('gpsUpdateIntervalSeconds').optional().isInt({ min: 5, max: 300 }),
  body('alertsEnabled').optional().isBoolean(),
  body('notificationsEnabled').optional().isBoolean(),
  body('autoSyncAlerts').optional().isBoolean(),
];
