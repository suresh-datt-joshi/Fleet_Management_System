import mongoose from 'mongoose';
import { VEHICLE_HISTORY_ACTIONS } from '../constants/enums.js';

const vehicleHistorySchema = new mongoose.Schema(
  {
    vehicle: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Vehicle',
      required: true,
      index: true,
    },
    action: {
      type: String,
      enum: Object.values(VEHICLE_HISTORY_ACTIONS),
      required: true,
    },
    description: { type: String, required: true },
    changes: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  { timestamps: true }
);

vehicleHistorySchema.index({ createdAt: -1 });

const VehicleHistory = mongoose.model('VehicleHistory', vehicleHistorySchema);
export default VehicleHistory;
