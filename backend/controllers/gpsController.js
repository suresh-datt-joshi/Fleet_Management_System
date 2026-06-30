import catchAsync from '../utils/catchAsync.js';
import * as gpsService from '../services/gpsService.js';
import * as geofenceService from '../services/geofenceService.js';
import * as trackingDashboardService from '../services/trackingDashboardService.js';

export const getLiveVehicles = catchAsync(async (req, res) => {
  const vehicles = await gpsService.getLiveVehicles(req.query);
  res.status(200).json({ success: true, data: vehicles });
});

export const getVehicleLive = catchAsync(async (req, res) => {
  const vehicle = await gpsService.getVehicleLive(req.params.vehicleId);
  res.status(200).json({ success: true, data: { vehicle } });
});

export const getVehicleHistory = catchAsync(async (req, res) => {
  const result = await gpsService.getVehicleHistory(req.params.vehicleId, req.query);
  res.status(200).json({ success: true, data: result });
});

export const getMockGps = catchAsync(async (req, res) => {
  const data = await gpsService.getMockGpsData();
  res.status(200).json({ success: true, data, provider: 'mock' });
});

export const getTrackingStats = catchAsync(async (req, res) => {
  const stats = await gpsService.getTrackingStats();
  res.status(200).json({ success: true, data: stats });
});

export const triggerSimulation = catchAsync(async (req, res) => {
  const updates = await gpsService.simulateFleetGpsUpdates();
  res.status(200).json({ success: true, message: 'GPS simulation triggered', data: updates });
});

export const getGeofences = catchAsync(async (req, res) => {
  const result = await geofenceService.getGeofences(req.query);
  res.status(200).json({ success: true, data: result });
});

export const getGeofence = catchAsync(async (req, res) => {
  const geofence = await geofenceService.getGeofenceById(req.params.id);
  res.status(200).json({ success: true, data: { geofence } });
});

export const createGeofence = catchAsync(async (req, res) => {
  const geofence = await geofenceService.createGeofence(req.body, req.user._id);
  res.status(201).json({ success: true, message: 'Geofence created', data: { geofence } });
});

export const updateGeofence = catchAsync(async (req, res) => {
  const geofence = await geofenceService.updateGeofence(req.params.id, req.body, req.user._id);
  res.status(200).json({ success: true, message: 'Geofence updated', data: { geofence } });
});

export const deleteGeofence = catchAsync(async (req, res) => {
  const result = await geofenceService.deleteGeofence(req.params.id, req.user._id);
  res.status(200).json({ success: true, ...result });
});

export const getGeofenceEvents = catchAsync(async (req, res) => {
  const result = await geofenceService.getGeofenceEvents(req.query);
  res.status(200).json({ success: true, data: result });
});

export const getLiveTrackingDashboard = catchAsync(async (req, res) => {
  const dashboard = await trackingDashboardService.getLiveTrackingDashboard();
  res.status(200).json({ success: true, data: dashboard });
});
