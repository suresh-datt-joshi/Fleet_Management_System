import mongoose from 'mongoose';
import { GEOFENCE_TYPES } from '../constants/enums.js';
import { auditFields, softDeleteFields, applySoftDeleteQuery } from '../utils/schemaHelpers.js';

const geofenceSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    type: {
      type: String,
      enum: Object.values(GEOFENCE_TYPES),
      default: GEOFENCE_TYPES.CIRCLE,
    },
    center: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
      },
      coordinates: { type: [Number], default: [0, 0] },
    },
    radius: { type: Number, default: 500, min: 50 },
    polygon: {
      type: {
        type: String,
        enum: ['Polygon'],
      },
      coordinates: { type: [[[Number]]], default: undefined },
    },
    color: { type: String, default: '#1565C0' },
    isActive: { type: Boolean, default: true, index: true },
    alertOnEnter: { type: Boolean, default: false },
    alertOnExit: { type: Boolean, default: true },
    speedLimit: { type: Number, default: null },
    ...auditFields,
    ...softDeleteFields,
  },
  { timestamps: true }
);

geofenceSchema.index({ center: '2dsphere' });
geofenceSchema.index({ polygon: '2dsphere' });
applySoftDeleteQuery(geofenceSchema);

const Geofence = mongoose.model('Geofence', geofenceSchema);
export default Geofence;
