import mongoose from 'mongoose';
import { TRIP_HISTORY_ACTIONS } from '../constants/enums.js';

const tripHistorySchema = new mongoose.Schema(
  {
    trip: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Trip',
      required: true,
      index: true,
    },
    action: {
      type: String,
      enum: Object.values(TRIP_HISTORY_ACTIONS),
      required: true,
    },
    description: { type: String, default: '' },
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    changes: { type: mongoose.Schema.Types.Mixed, default: null },
  },
  { timestamps: true }
);

tripHistorySchema.index({ trip: 1, createdAt: -1 });

const TripHistory = mongoose.model('TripHistory', tripHistorySchema);
export default TripHistory;
