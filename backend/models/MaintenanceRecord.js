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
    laborHours: { type: Number, min: 0, default: 0 },
    laborCost: { type: Number, min: 0, default: 0 },
    workPerformed: { type: String, default: '', maxlength: 5000 },
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
    assignedMechanics: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    parts: [
      {
        name: { type: String, required: true, trim: true },
        quantity: { type: Number, min: 1, default: 1 },
        cost: { type: Number, min: 0, default: 0 },
        supplier: { type: String, trim: true, default: '' },
      },
    ],
    attachments: [
      {
        fileName: { type: String, required: true },
        fileUrl: { type: String, required: true },
        mimeType: { type: String, default: '' },
        publicId: { type: String, default: null },
        uploadedAt: { type: Date, default: Date.now },
        uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
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
