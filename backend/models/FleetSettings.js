import mongoose from 'mongoose';

const SETTINGS_KEY = 'default';

const fleetSettingsSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      default: SETTINGS_KEY,
      unique: true,
      immutable: true,
    },
    companyName: { type: String, default: 'Fleet Management System', trim: true, maxlength: 120 },
    companyEmail: { type: String, default: '', trim: true, lowercase: true },
    companyPhone: { type: String, default: '', trim: true },
    companyAddress: { type: String, default: '', trim: true, maxlength: 500 },
    companyLocation: {
      address: { type: String, default: '', trim: true, maxlength: 500 },
      lat: { type: Number, default: null },
      lng: { type: Number, default: null },
      placeId: { type: String, default: '', trim: true },
    },
    timezone: { type: String, default: 'UTC', trim: true },
    currency: { type: String, default: 'USD', trim: true, uppercase: true },
    dateFormat: { type: String, default: 'YYYY-MM-DD', trim: true },
    fuelLowThreshold: { type: Number, default: 20, min: 0, max: 100 },
    maintenanceReminderDays: { type: Number, default: 7, min: 1, max: 90 },
    documentReminderDays: { type: Number, default: 30, min: 1, max: 365 },
    speedLimitKmh: { type: Number, default: 80, min: 1, max: 200 },
    gpsUpdateIntervalSeconds: { type: Number, default: 30, min: 5, max: 300 },
    alertsEnabled: { type: Boolean, default: true },
    notificationsEnabled: { type: Boolean, default: true },
    autoSyncAlerts: { type: Boolean, default: true },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  { timestamps: true }
);

fleetSettingsSchema.statics.getSingleton = async function getSingleton() {
  let settings = await this.findOne({ key: SETTINGS_KEY });
  if (!settings) {
    settings = await this.create({ key: SETTINGS_KEY });
  }
  return settings;
};

const FleetSettings = mongoose.model('FleetSettings', fleetSettingsSchema);
export default FleetSettings;
