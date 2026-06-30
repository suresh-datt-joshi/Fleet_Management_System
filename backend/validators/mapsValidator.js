import { body, query } from 'express-validator';

const latValidator = (field) =>
  body(field).isFloat({ min: -90, max: 90 }).withMessage(`${field} must be between -90 and 90`);

const lngValidator = (field) =>
  body(field).isFloat({ min: -180, max: 180 }).withMessage(`${field} must be between -180 and 180`);

export const geocodeValidator = [
  body('address').trim().notEmpty().withMessage('Address is required'),
];

export const reverseGeocodeValidator = [
  latValidator('lat'),
  lngValidator('lng'),
];

export const directionsValidator = [
  body('origin').notEmpty().withMessage('Origin is required'),
  body('destination').notEmpty().withMessage('Destination is required'),
  body('waypoints').optional().isArray({ max: 23 }),
  body('mode')
    .optional()
    .isIn(['driving', 'walking', 'bicycling', 'transit'])
    .withMessage('Invalid travel mode'),
];

export const distanceMatrixValidator = [
  body('origins').isArray({ min: 1, max: 10 }).withMessage('Origins must be a non-empty array'),
  body('destinations').isArray({ min: 1, max: 10 }).withMessage('Destinations must be a non-empty array'),
];

export const staticMapValidator = [
  query('lat').isFloat({ min: -90, max: 90 }),
  query('lng').isFloat({ min: -180, max: 180 }),
  query('zoom').optional().isInt({ min: 1, max: 21 }),
  query('width').optional().isInt({ min: 100, max: 1280 }),
  query('height').optional().isInt({ min: 100, max: 1280 }),
];

export default {
  geocodeValidator,
  reverseGeocodeValidator,
  directionsValidator,
  distanceMatrixValidator,
  staticMapValidator,
};
