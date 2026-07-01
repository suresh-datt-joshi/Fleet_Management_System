import mongoose from 'mongoose';
import { MECHANIC_HISTORY_ACTIONS } from '../constants/enums.js';

const mechanicHistorySchema = new mongoose.Schema(
  {
    mechanic: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Mechanic',
      required: true,
      index: true,
    },
    action: {
      type: String,
      enum: Object.values(MECHANIC_HISTORY_ACTIONS),
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

mechanicHistorySchema.index({ createdAt: -1 });

const MechanicHistory = mongoose.model('MechanicHistory', mechanicHistorySchema);
export default MechanicHistory;
