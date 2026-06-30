import mongoose from 'mongoose';
import { ALERT_TYPES, ALERT_SEVERITY } from '../constants/enums.js';

const alertSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: Object.values(ALERT_TYPES),
      required: true,
      index: true,
    },
    severity: {
      type: String,
      enum: Object.values(ALERT_SEVERITY),
      default: ALERT_SEVERITY.MEDIUM,
      index: true,
    },
    title: { type: String, required: true, trim: true },
    message: { type: String, required: true, trim: true },
    vehicle: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Vehicle',
      default: null,
    },
    driver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Driver',
      default: null,
    },
    isRead: { type: Boolean, default: false, index: true },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

alertSchema.index({ createdAt: -1 });

const Alert = mongoose.model('Alert', alertSchema);
export default Alert;
