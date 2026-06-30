import mongoose from 'mongoose';
import { ROUTE_HISTORY_ACTIONS } from '../constants/enums.js';

const routeHistorySchema = new mongoose.Schema(
  {
    route: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Route',
      required: true,
      index: true,
    },
    action: {
      type: String,
      enum: Object.values(ROUTE_HISTORY_ACTIONS),
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

routeHistorySchema.index({ route: 1, createdAt: -1 });

const RouteHistory = mongoose.model('RouteHistory', routeHistorySchema);
export default RouteHistory;
