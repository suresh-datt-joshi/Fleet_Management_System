import mongoose from 'mongoose';
import { MAINTENANCE_HISTORY_ACTIONS } from '../constants/enums.js';

const maintenanceHistorySchema = new mongoose.Schema(
  {
    maintenance: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MaintenanceRecord',
      required: true,
      index: true,
    },
    action: {
      type: String,
      enum: Object.values(MAINTENANCE_HISTORY_ACTIONS),
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

maintenanceHistorySchema.index({ maintenance: 1, createdAt: -1 });

const MaintenanceHistory = mongoose.model('MaintenanceHistory', maintenanceHistorySchema);
export default MaintenanceHistory;
