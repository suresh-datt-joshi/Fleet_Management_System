import mongoose from 'mongoose';
import { DRIVER_HISTORY_ACTIONS } from '../constants/enums.js';

const driverHistorySchema = new mongoose.Schema(
  {
    driver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Driver',
      required: true,
      index: true,
    },
    action: {
      type: String,
      enum: Object.values(DRIVER_HISTORY_ACTIONS),
      required: true,
    },
    description: { type: String, required: true },
    changes: { type: mongoose.Schema.Types.Mixed, default: null },
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  { timestamps: true }
);

driverHistorySchema.index({ createdAt: -1 });

const DriverHistory = mongoose.model('DriverHistory', driverHistorySchema);
export default DriverHistory;
