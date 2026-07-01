import mongoose from 'mongoose';
import { ACTIVITY_TYPES } from '../constants/enums.js';

const activitySchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: Object.values(ACTIVITY_TYPES),
      required: true,
      index: true,
    },
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    entityType: {
      type: String,
      enum: ['vehicle', 'driver', 'mechanic', 'trip', 'route', 'maintenance', 'fuel', 'document', 'alert'],
      default: 'trip',
    },
    entityId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

activitySchema.index({ createdAt: -1 });

const Activity = mongoose.model('Activity', activitySchema);
export default Activity;
