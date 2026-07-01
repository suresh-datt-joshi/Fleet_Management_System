import mongoose from 'mongoose';
import { MECHANIC_STATUS, MECHANIC_SPECIALIZATIONS } from '../constants/enums.js';
import { auditFields, softDeleteFields, applySoftDeleteQuery } from '../utils/schemaHelpers.js';

const mechanicSchema = new mongoose.Schema(
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
    certificationNumber: { type: String, required: true, trim: true },
    certificationExpiry: { type: Date, required: true },
    specialization: {
      type: String,
      enum: Object.values(MECHANIC_SPECIALIZATIONS),
      default: MECHANIC_SPECIALIZATIONS.GENERAL,
    },
    experienceYears: { type: Number, min: 0, default: 0 },
    status: {
      type: String,
      enum: Object.values(MECHANIC_STATUS),
      default: MECHANIC_STATUS.AVAILABLE,
      index: true,
    },
    performanceScore: { type: Number, min: 0, max: 100, default: 80 },
    avatar: { type: String, default: null },
    notes: { type: String, default: '', maxlength: 1000 },
    documents: [
      {
        type: {
          type: String,
          enum: ['certification', 'training', 'id_proof', 'other'],
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

mechanicSchema.virtual('fullName').get(function fullName() {
  return `${this.firstName} ${this.lastName}`;
});

mechanicSchema.index({ status: 1, isDeleted: 1 });
mechanicSchema.index({
  firstName: 'text',
  lastName: 'text',
  email: 'text',
  employeeId: 'text',
  certificationNumber: 'text',
});
applySoftDeleteQuery(mechanicSchema);

const Mechanic = mongoose.model('Mechanic', mechanicSchema);
export default Mechanic;
