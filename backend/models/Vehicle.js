import mongoose from 'mongoose';
import { VEHICLE_STATUS } from '../constants/enums.js';
import { auditFields, softDeleteFields, applySoftDeleteQuery } from '../utils/schemaHelpers.js';

const documentExpirySchema = new mongoose.Schema(
  {
    insurance: { type: Date, default: null },
    registration: { type: Date, default: null },
    fitness: { type: Date, default: null },
    emission: { type: Date, default: null },
    permit: { type: Date, default: null },
  },
  { _id: false }
);

const vehicleSchema = new mongoose.Schema(
  {
    vehicleNumber: {
      type: String,
      required: [true, 'Vehicle number is required'],
      unique: true,
      trim: true,
      uppercase: true,
    },
    vin: {
      type: String,
      trim: true,
      sparse: true,
    },
    model: { type: String, required: true, trim: true },
    manufacturer: { type: String, required: true, trim: true },
    year: { type: Number, min: 1990, max: 2100 },
    status: {
      type: String,
      enum: Object.values(VEHICLE_STATUS),
      default: VEHICLE_STATUS.ACTIVE,
    },
    fuelType: {
      type: String,
      enum: ['petrol', 'diesel', 'electric', 'cng', 'hybrid'],
      default: 'diesel',
    },
    fuelLevel: { type: Number, min: 0, max: 100, default: 100 },
    odometer: { type: Number, min: 0, default: 0 },
    assignedDriver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Driver',
      default: null,
    },
    documentExpiry: { type: documentExpirySchema, default: () => ({}) },
    registrationNumber: { type: String, trim: true, default: '' },
    notes: { type: String, default: '', maxlength: 1000 },
    image: { type: String, default: null },
    images: [
      {
        url: { type: String, required: true },
        publicId: { type: String, default: null },
        _id: false,
      },
    ],
    currentLocation: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
      },
      coordinates: { type: [Number], default: [0, 0] },
      address: { type: String, default: '' },
    },
    speed: { type: Number, default: 0 },
    heading: { type: Number, default: 0 },
    ignition: { type: Boolean, default: false },
    engineStatus: {
      type: String,
      enum: ['running', 'idle', 'off'],
      default: 'off',
    },
    ...auditFields,
    ...softDeleteFields,
  },
  { timestamps: true }
);

vehicleSchema.index({ status: 1, isDeleted: 1 });
vehicleSchema.index({ manufacturer: 1 });
vehicleSchema.index({ vehicleNumber: 'text', model: 'text', manufacturer: 'text', vin: 'text' });
vehicleSchema.index({ 'currentLocation': '2dsphere' });
applySoftDeleteQuery(vehicleSchema);

const Vehicle = mongoose.model('Vehicle', vehicleSchema);
export default Vehicle;
