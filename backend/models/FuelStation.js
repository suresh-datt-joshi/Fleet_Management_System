import mongoose from 'mongoose';
import { FUEL_TYPES, FUEL_STATION_STATUS } from '../constants/enums.js';
import { auditFields, softDeleteFields, applySoftDeleteQuery } from '../utils/schemaHelpers.js';

const fuelStationSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    brand: { type: String, trim: true, default: '' },
    address: { type: String, trim: true, default: '' },
    city: { type: String, trim: true, default: '' },
    state: { type: String, trim: true, default: '' },
    zipCode: { type: String, trim: true, default: '' },
    phone: { type: String, trim: true, default: '' },
    location: {
      type: { type: String, enum: ['Point'], default: 'Point' },
      coordinates: { type: [Number], default: [0, 0] },
    },
    fuelTypes: {
      type: [{ type: String, enum: Object.values(FUEL_TYPES) }],
      default: [FUEL_TYPES.DIESEL],
    },
    status: {
      type: String,
      enum: Object.values(FUEL_STATION_STATUS),
      default: FUEL_STATION_STATUS.ACTIVE,
      index: true,
    },
    notes: { type: String, default: '', maxlength: 500 },
    ...auditFields,
    ...softDeleteFields,
  },
  { timestamps: true }
);

fuelStationSchema.index({ location: '2dsphere' });
fuelStationSchema.index({ name: 'text', brand: 'text', city: 'text' });
applySoftDeleteQuery(fuelStationSchema);

const FuelStation = mongoose.model('FuelStation', fuelStationSchema);
export default FuelStation;
