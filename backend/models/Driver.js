import mongoose from 'mongoose';
import { DRIVER_STATUS } from '../constants/enums.js';
import { auditFields, softDeleteFields, applySoftDeleteQuery } from '../utils/schemaHelpers.js';

const driverSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    employeeId: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
    },
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    email: { type: String, lowercase: true, trim: true },
    phone: { type: String, trim: true },
    licenseNumber: { type: String, required: true, trim: true },
    licenseExpiry: { type: Date, required: true },
    experienceYears: { type: Number, min: 0, default: 0 },
    medicalCertificateExpiry: { type: Date, default: null },
    emergencyContact: {
      name: { type: String, default: '' },
      phone: { type: String, default: '' },
      relation: { type: String, default: '' },
    },
    status: {
      type: String,
      enum: Object.values(DRIVER_STATUS),
      default: DRIVER_STATUS.AVAILABLE,
      index: true,
    },
    performanceScore: { type: Number, min: 0, max: 100, default: 80 },
    assignedVehicle: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Vehicle',
      default: null,
    },
    avatar: { type: String, default: null },
    notes: { type: String, default: '', maxlength: 1000 },
    documents: [
      {
        type: {
          type: String,
          enum: ['license', 'medical', 'id_proof', 'training', 'other'],
          required: true,
        },
        name: { type: String, required: true, trim: true },
        url: { type: String, required: true },
        publicId: { type: String, default: null },
        expiryDate: { type: Date, default: null },
      },
    ],
    ...auditFields,
    ...softDeleteFields,
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_, ret) => {
        delete ret.__v;
        return ret;
      },
    },
  }
);

driverSchema.virtual('fullName').get(function fullName() {
  return `${this.firstName} ${this.lastName}`;
});

driverSchema.index({ status: 1, isDeleted: 1 });
driverSchema.index({ firstName: 'text', lastName: 'text', email: 'text', employeeId: 'text', licenseNumber: 'text' });
applySoftDeleteQuery(driverSchema);

const Driver = mongoose.model('Driver', driverSchema);
export default Driver;
