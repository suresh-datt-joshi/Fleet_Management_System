import mongoose from 'mongoose';
import { GEOFENCE_EVENT_TYPES } from '../constants/enums.js';

const geofenceEventSchema = new mongoose.Schema(
  {
    geofence: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Geofence',
      required: true,
      index: true,
    },
    vehicle: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Vehicle',
      required: true,
      index: true,
    },
    eventType: {
      type: String,
      enum: Object.values(GEOFENCE_EVENT_TYPES),
      required: true,
    },
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
      },
      coordinates: { type: [Number], required: true },
    },
    speed: { type: Number, default: 0 },
  },
  { timestamps: true }
);

geofenceEventSchema.index({ createdAt: -1 });

const GeofenceEvent = mongoose.model('GeofenceEvent', geofenceEventSchema);
export default GeofenceEvent;
