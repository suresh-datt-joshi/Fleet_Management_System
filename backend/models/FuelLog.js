import mongoose from 'mongoose';
import { FUEL_TYPES } from '../constants/enums.js';
import { auditFields, softDeleteFields, applySoftDeleteQuery } from '../utils/schemaHelpers.js';

const fuelLogSchema = new mongoose.Schema(
  {
    vehicle: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Vehicle',
      required: true,
      index: true,
    },
    driver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Driver',
      default: null,
    },
    trip: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Trip',
      default: null,
    },
    tripExpense: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'TripExpense',
      default: null,
    },
    station: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'FuelStation',
      default: null,
    },
    quantity: { type: Number, required: true, min: 0 },
    cost: { type: Number, required: true, min: 0 },
    pricePerUnit: { type: Number, min: 0, default: 0 },
    odometer: { type: Number, min: 0, default: 0 },
    mileage: { type: Number, min: 0, default: 0 },
    fuelStation: { type: String, trim: true, default: '' },
    fuelType: {
      type: String,
      enum: Object.values(FUEL_TYPES),
      default: FUEL_TYPES.DIESEL,
    },
    receiptNumber: { type: String, trim: true, default: '' },
    isFullTank: { type: Boolean, default: true },
    notes: { type: String, default: '', maxlength: 500 },
    loggedAt: { type: Date, default: Date.now, index: true },
    ...auditFields,
    ...softDeleteFields,
  },
  { timestamps: true }
);
fuelLogSchema.index({ loggedAt: -1, isDeleted: 1 });
fuelLogSchema.index({ trip: 1, isDeleted: 1 });
fuelLogSchema.index({ tripExpense: 1 }, { sparse: true });
applySoftDeleteQuery(fuelLogSchema);

const FuelLog = mongoose.model('FuelLog', fuelLogSchema);
export default FuelLog;
