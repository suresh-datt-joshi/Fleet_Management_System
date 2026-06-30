import mongoose from 'mongoose';
import { TRIP_STATUS, CONSIGNMENT_STATUS } from '../constants/enums.js';
import { auditFields, softDeleteFields, applySoftDeleteQuery } from '../utils/schemaHelpers.js';

const locationSchema = new mongoose.Schema(
  {
    address: { type: String, default: '' },
    lat: { type: Number, default: 0 },
    lng: { type: Number, default: 0 },
  },
  { _id: false }
);

const expenseBreakdownSchema = new mongoose.Schema(
  {
    fuel: { type: Number, min: 0, default: 0 },
    tolls: { type: Number, min: 0, default: 0 },
    maintenance: { type: Number, min: 0, default: 0 },
    food: { type: Number, min: 0, default: 0 },
    lodging: { type: Number, min: 0, default: 0 },
    other: { type: Number, min: 0, default: 0 },
  },
  { _id: false }
);

const tripSchema = new mongoose.Schema(
  {
    tripNumber: {
      type: String,
      unique: true,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: Object.values(TRIP_STATUS),
      default: TRIP_STATUS.SCHEDULED,
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
    route: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Route',
      default: null,
    },
    origin: { type: locationSchema, default: () => ({}) },
    destination: { type: locationSchema, default: () => ({}) },
    scheduledAt: { type: Date, default: Date.now },
    startedAt: { type: Date, default: null },
    completedAt: { type: Date, default: null },
    distance: { type: Number, min: 0, default: 0 },
    estimatedCost: { type: Number, min: 0, default: 0 },
    fuelUsed: { type: Number, min: 0, default: 0 },
    revenue: { type: Number, min: 0, default: 0 },
    expenses: { type: Number, min: 0, default: 0 },
    expenseBreakdown: { type: expenseBreakdownSchema, default: () => ({}) },
    notes: { type: String, default: '' },
    submittedAt: { type: Date, default: null },
    reviewedAt: { type: Date, default: null },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    reviewNotes: { type: String, default: '' },
    consignment: {
      referenceNumber: { type: String, default: '' },
      description: { type: String, default: '' },
      status: {
        type: String,
        enum: Object.values(CONSIGNMENT_STATUS),
        default: CONSIGNMENT_STATUS.PENDING,
      },
      notes: { type: String, default: '' },
      updatedAt: { type: Date, default: null },
    },
    ...auditFields,
    ...softDeleteFields,
  },
  { timestamps: true }
);

tripSchema.index({ status: 1, scheduledAt: -1 });
tripSchema.index({ completedAt: -1 });
tripSchema.index({ submittedAt: -1 });
applySoftDeleteQuery(tripSchema);

const Trip = mongoose.model('Trip', tripSchema);
export default Trip;
