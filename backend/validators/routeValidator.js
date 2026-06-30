import { body, param, query } from 'express-validator';
import { ROUTE_STATUS, ROUTE_STOP_TYPES } from '../constants/enums.js';

const locationValidator = (prefix, required = true) => {
  const rules = [
    body(`${prefix}.address`).optional().trim(),
    body(`${prefix}.lat`).if(() => required).isFloat({ min: -90, max: 90 }),
    body(`${prefix}.lng`).if(() => required).isFloat({ min: -180, max: 180 }),
  ];
  if (!required) {
    rules[1] = body(`${prefix}.lat`).optional().isFloat({ min: -90, max: 90 });
    rules[2] = body(`${prefix}.lng`).optional().isFloat({ min: -180, max: 180 });
  }
  return rules;
};

const stopsValidator = [
  body('stops').optional().isArray({ max: 50 }),
  body('stops.*.sequence').optional().isInt({ min: 1 }),
  body('stops.*.name').trim().notEmpty().withMessage('Stop name is required'),
  body('stops.*.address').optional().trim(),
  body('stops.*.lat').isFloat({ min: -90, max: 90 }),
  body('stops.*.lng').isFloat({ min: -180, max: 180 }),
  body('stops.*.stopType').optional().isIn(Object.values(ROUTE_STOP_TYPES)),
  body('stops.*.estimatedDurationMinutes').optional().isInt({ min: 0, max: 480 }),
  body('stops.*.notes').optional().trim().isLength({ max: 500 }),
];

export const createRouteValidator = [
  body('routeNumber').optional().trim().isLength({ min: 3, max: 30 }),
  body('name').trim().notEmpty().withMessage('Route name is required'),
  body('description').optional().trim().isLength({ max: 1000 }),
  body('status').optional().isIn(Object.values(ROUTE_STATUS)),
  ...locationValidator('origin'),
  ...locationValidator('destination'),
  ...stopsValidator,
  body('averageSpeedKmh').optional().isFloat({ min: 5, max: 150 }),
  body('tags').optional().isArray({ max: 10 }),
  body('notes').optional().trim().isLength({ max: 1000 }),
];

export const updateRouteValidator = [
  param('id').isMongoId().withMessage('Invalid route ID'),
  body('routeNumber').optional().trim().isLength({ min: 3, max: 30 }),
  body('name').optional().trim().notEmpty(),
  body('description').optional().trim().isLength({ max: 1000 }),
  body('status').optional().isIn(Object.values(ROUTE_STATUS)),
  ...locationValidator('origin', false),
  ...locationValidator('destination', false),
  ...stopsValidator,
  body('averageSpeedKmh').optional().isFloat({ min: 5, max: 150 }),
  body('tags').optional().isArray({ max: 10 }),
  body('notes').optional().trim().isLength({ max: 1000 }),
];

export const routeIdValidator = [param('id').isMongoId().withMessage('Invalid route ID')];

export const listRoutesValidator = [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('status').optional().isIn(Object.values(ROUTE_STATUS)),
  query('isOptimized').optional().isIn(['true', 'false']),
  query('trafficLevel').optional().isIn(['low', 'medium', 'high', 'severe']),
  query('search').optional().trim(),
  query('sort').optional().matches(/^[a-zA-Z]+:(asc|desc)$/),
];
