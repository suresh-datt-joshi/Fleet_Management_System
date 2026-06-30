import { body, param } from 'express-validator';
import { TRIP_EXPENSE_CATEGORIES, CONSIGNMENT_STATUS, FUEL_TYPES } from '../constants/enums.js';

export const tripIdParamValidator = [param('id').isMongoId().withMessage('Invalid trip ID')];

export const addTripExpenseValidator = [
  ...tripIdParamValidator,
  body('category')
    .isIn(Object.values(TRIP_EXPENSE_CATEGORIES))
    .withMessage('Valid expense category is required'),
  body('amount').isFloat({ min: 0 }).withMessage('Amount must be a positive number'),
  body('description').optional().isString().trim(),
  body('vendor').optional().isString().trim(),
  body('fuelQuantity').optional({ nullable: true }).isFloat({ min: 0 }),
  body('loggedAt').optional().isISO8601(),
  body('stationId').optional({ nullable: true }).isMongoId(),
  body('fuelStation').optional().isString().trim(),
  body('fuelType').optional().isIn(Object.values(FUEL_TYPES)),
  body('odometer').optional().isFloat({ min: 0 }),
  body('receiptNumber').optional().isString().trim(),
  body('isFullTank').optional(),
  body('notes').optional().isString().trim(),
];

export const updateConsignmentValidator = [
  ...tripIdParamValidator,
  body('referenceNumber').optional().isString().trim(),
  body('description').optional().isString().trim(),
  body('status')
    .optional()
    .isIn(Object.values(CONSIGNMENT_STATUS))
    .withMessage('Invalid consignment status'),
  body('notes').optional().isString().trim(),
];

export default {
  tripIdParamValidator,
  addTripExpenseValidator,
  updateConsignmentValidator,
};
