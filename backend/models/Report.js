import mongoose from 'mongoose';
import { REPORT_TYPES, REPORT_FORMATS, REPORT_STATUS } from '../constants/enums.js';
import { auditFields } from '../utils/schemaHelpers.js';

const reportSchema = new mongoose.Schema(
  {
    reportNumber: {
      type: String,
      unique: true,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      enum: Object.values(REPORT_TYPES),
      required: true,
      index: true,
    },
    title: { type: String, required: true, trim: true },
    format: {
      type: String,
      enum: Object.values(REPORT_FORMATS),
      default: REPORT_FORMATS.CSV,
    },
    parameters: { type: mongoose.Schema.Types.Mixed, default: {} },
    recordCount: { type: Number, min: 0, default: 0 },
    fileName: { type: String, default: '' },
    status: {
      type: String,
      enum: Object.values(REPORT_STATUS),
      default: REPORT_STATUS.COMPLETED,
      index: true,
    },
    errorMessage: { type: String, default: '' },
    generatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    ...auditFields,
  },
  { timestamps: true }
);

reportSchema.index({ generatedBy: 1, createdAt: -1 });
reportSchema.index({ type: 1, createdAt: -1 });

const Report = mongoose.model('Report', reportSchema);
export default Report;
