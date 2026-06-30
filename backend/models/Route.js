import mongoose from 'mongoose';
import { ROUTE_STATUS, ROUTE_STOP_TYPES } from '../constants/enums.js';
import { auditFields, softDeleteFields, applySoftDeleteQuery } from '../utils/schemaHelpers.js';

const locationSchema = new mongoose.Schema(
  {
    address: { type: String, default: '', trim: true },
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
  },
  { _id: false }
);

const stopSchema = new mongoose.Schema(
  {
    sequence: { type: Number, required: true, min: 1 },
    name: { type: String, required: true, trim: true },
    address: { type: String, default: '', trim: true },
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
    stopType: {
      type: String,
      enum: Object.values(ROUTE_STOP_TYPES),
      default: ROUTE_STOP_TYPES.WAYPOINT,
    },
    estimatedDurationMinutes: { type: Number, min: 0, default: 15 },
    notes: { type: String, default: '', maxlength: 500 },
  },
  { _id: true }
);

const routeSchema = new mongoose.Schema(
  {
    routeNumber: {
      type: String,
      unique: true,
      required: true,
      trim: true,
      uppercase: true,
    },
    name: { type: String, required: true, trim: true, maxlength: 120 },
    description: { type: String, default: '', maxlength: 1000 },
    status: {
      type: String,
      enum: Object.values(ROUTE_STATUS),
      default: ROUTE_STATUS.DRAFT,
      index: true,
    },
    origin: { type: locationSchema, required: true },
    destination: { type: locationSchema, required: true },
    stops: { type: [stopSchema], default: [] },
    optimizedStops: { type: [stopSchema], default: [] },
    pathCoordinates: {
      type: [[Number]],
      default: [],
    },
    totalDistanceMeters: { type: Number, min: 0, default: 0 },
    estimatedDurationMinutes: { type: Number, min: 0, default: 0 },
    estimatedArrivalAt: { type: Date, default: null },
    trafficLevel: { type: String, default: 'low' },
    trafficDelayMinutes: { type: Number, min: 0, default: 0 },
    averageSpeedKmh: { type: Number, min: 1, default: 45 },
    isOptimized: { type: Boolean, default: false },
    optimizedAt: { type: Date, default: null },
    tags: [{ type: String, trim: true }],
    notes: { type: String, default: '', maxlength: 1000 },
    ...auditFields,
    ...softDeleteFields,
  },
  { timestamps: true }
);

routeSchema.index({ name: 'text', routeNumber: 'text', description: 'text' });
routeSchema.index({ status: 1, createdAt: -1 });
applySoftDeleteQuery(routeSchema);

const Route = mongoose.model('Route', routeSchema);
export default Route;
