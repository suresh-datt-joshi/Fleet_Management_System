import mongoose from 'mongoose';
import {
  DOCUMENT_TYPES,
  DOCUMENT_ENTITY_TYPES,
  DOCUMENT_STATUS,
} from '../constants/enums.js';
import { auditFields, softDeleteFields, applySoftDeleteQuery } from '../utils/schemaHelpers.js';

const fleetDocumentSchema = new mongoose.Schema(
  {
    documentNumber: {
      type: String,
      unique: true,
      required: true,
      trim: true,
      uppercase: true,
    },
    title: { type: String, required: true, trim: true, maxlength: 200 },
    description: { type: String, default: '', maxlength: 1000 },
    type: {
      type: String,
      enum: Object.values(DOCUMENT_TYPES),
      required: true,
      index: true,
    },
    entityType: {
      type: String,
      enum: Object.values(DOCUMENT_ENTITY_TYPES),
      default: DOCUMENT_ENTITY_TYPES.FLEET,
      index: true,
    },
    vehicle: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Vehicle',
      default: null,
      index: true,
    },
    driver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Driver',
      default: null,
      index: true,
    },
    fileUrl: { type: String, required: true },
    publicId: { type: String, default: null },
    fileName: { type: String, default: '' },
    fileSize: { type: Number, min: 0, default: 0 },
    mimeType: { type: String, default: '' },
    issueDate: { type: Date, default: null },
    expiryDate: { type: Date, default: null, index: true },
    status: {
      type: String,
      enum: Object.values(DOCUMENT_STATUS),
      default: DOCUMENT_STATUS.ACTIVE,
      index: true,
    },
    reminderDaysBefore: { type: Number, min: 1, max: 365, default: 30 },
    notes: { type: String, default: '', maxlength: 1000 },
    tags: [{ type: String, trim: true }],
    ...auditFields,
    ...softDeleteFields,
  },
  { timestamps: true }
);

fleetDocumentSchema.index({ title: 'text', documentNumber: 'text', description: 'text' });
fleetDocumentSchema.index({ expiryDate: 1, status: 1 });
applySoftDeleteQuery(fleetDocumentSchema);

const FleetDocument = mongoose.model('FleetDocument', fleetDocumentSchema);
export default FleetDocument;
