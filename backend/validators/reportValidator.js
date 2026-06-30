import { param, query } from 'express-validator';
import { REPORT_TYPES } from '../constants/enums.js';

export const reportTypeValidator = [
  param('type').isIn(Object.values(REPORT_TYPES)).withMessage('Invalid report type'),
];

export const listReportsValidator = [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('type').optional().isIn(Object.values(REPORT_TYPES)),
  query('status').optional().isIn(['completed', 'failed']),
  query('from').optional().isISO8601(),
  query('to').optional().isISO8601(),
  query('sort').optional().matches(/^[a-zA-Z]+:(asc|desc)$/),
];

export const reportQueryValidator = [
  query('from').optional().isISO8601(),
  query('to').optional().isISO8601(),
];

export const exportReportValidator = [
  query('type').isIn(Object.values(REPORT_TYPES)).withMessage('Report type is required'),
  query('from').optional().isISO8601(),
  query('to').optional().isISO8601(),
];

export const previewReportValidator = [
  param('type').isIn([REPORT_TYPES.FLEET_SUMMARY, REPORT_TYPES.FINANCIAL, REPORT_TYPES.OPERATIONAL]).withMessage(
    'Preview available for summary reports only'
  ),
  query('from').optional().isISO8601(),
  query('to').optional().isISO8601(),
];
