import mongoose from 'mongoose';

const gpsLocationHistorySchema = new mongoose.Schema(
  {
    vehicle: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Vehicle',
      required: true,
      index: true,
    },
    driver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Driver',
      default: null,
    },
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
      },
      coordinates: { type: [Number], required: true },
    },
    address: { type: String, default: '' },
    speed: { type: Number, default: 0 },
    heading: { type: Number, default: 0 },
    fuelLevel: { type: Number, default: 100 },
    ignition: { type: Boolean, default: false },
    engineStatus: {
      type: String,
      enum: ['running', 'idle', 'off'],
      default: 'off',
    },
    odometer: { type: Number, default: 0 },
    recordedAt: { type: Date, default: Date.now, index: true },
  },
  { timestamps: true }
);

gpsLocationHistorySchema.index({ vehicle: 1, recordedAt: -1 });
gpsLocationHistorySchema.index({ location: '2dsphere' });

const GpsLocationHistory = mongoose.model('GpsLocationHistory', gpsLocationHistorySchema);
export default GpsLocationHistory;
