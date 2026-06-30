import mongoose from 'mongoose';
import { MAINTENANCE_STATUS, MAINTENANCE_TYPE } from '../constants/enums.js';
import { auditFields, softDeleteFields, applySoftDeleteQuery } from '../utils/schemaHelpers.js';

const maintenanceSchema = new mongoose.Schema(
  {
    workOrderNumber: {
      type: String,
      unique: true,
      required: true,
      trim: true,
    },
    vehicle: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Vehicle',
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: Object.values(MAINTENANCE_TYPE),
      default: MAINTENANCE_TYPE.PREVENTIVE,
    },
    status: {
      type: String,
      enum: Object.values(MAINTENANCE_STATUS),
      default: MAINTENANCE_STATUS.SCHEDULED,
      index: true,
    },
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    scheduledDate: { type: Date, required: true, index: true },
    completedDate: { type: Date, default: null },
    odometerAtService: { type: Number, min: 0, default: 0 },
    laborCost: { type: Number, min: 0, default: 0 },
    cost: { type: Number, min: 0, default: 0 },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'medium',
    },
    serviceProvider: { type: String, trim: true, default: '' },
    notes: { type: String, default: '', maxlength: 1000 },
    assignedMechanic: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    parts: [
      {
        name: { type: String, required: true, trim: true },
        quantity: { type: Number, min: 1, default: 1 },
        cost: { type: Number, min: 0, default: 0 },
      },
    ],
    ...auditFields,
    ...softDeleteFields,
  },
  { timestamps: true }
);

maintenanceSchema.index({ scheduledDate: 1, status: 1 });
applySoftDeleteQuery(maintenanceSchema);

const MaintenanceRecord = mongoose.model('MaintenanceRecord', maintenanceSchema);
export default MaintenanceRecord;
