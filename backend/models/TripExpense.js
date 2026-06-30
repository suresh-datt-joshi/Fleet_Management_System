import mongoose from 'mongoose';
import { TRIP_EXPENSE_CATEGORIES } from '../constants/enums.js';
import { auditFields, softDeleteFields, applySoftDeleteQuery } from '../utils/schemaHelpers.js';

const tripExpenseSchema = new mongoose.Schema(
  {
    trip: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Trip',
      required: true,
      index: true,
    },
    driver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Driver',
      required: true,
    },
    vehicle: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Vehicle',
      required: true,
    },
    category: {
      type: String,
      enum: Object.values(TRIP_EXPENSE_CATEGORIES),
      required: true,
    },
    amount: { type: Number, required: true, min: 0 },
    description: { type: String, default: '' },
    vendor: { type: String, default: '' },
    fuelQuantity: { type: Number, min: 0, default: null },
    receiptUrl: { type: String, default: null },
    receiptPublicId: { type: String, default: null },
    receiptFileName: { type: String, default: null },
    receiptMimeType: { type: String, default: null },
    loggedAt: { type: Date, default: Date.now },
    ...auditFields,
    ...softDeleteFields,
  },
  { timestamps: true }
);

tripExpenseSchema.index({ trip: 1, loggedAt: -1 });
applySoftDeleteQuery(tripExpenseSchema);

const TripExpense = mongoose.model('TripExpense', tripExpenseSchema);
export default TripExpense;
