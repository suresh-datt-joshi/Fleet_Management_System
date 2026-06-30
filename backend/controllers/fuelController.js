import catchAsync from '../utils/catchAsync.js';
import * as fuelService from '../services/fuelService.js';
import * as fuelStationService from '../services/fuelStationService.js';

export const getFuelLogs = catchAsync(async (req, res) => {
  const result = await fuelService.getFuelLogs(req.query);
  res.status(200).json({ success: true, data: result });
});

export const getFuelLog = catchAsync(async (req, res) => {
  const log = await fuelService.getFuelLogById(req.params.id);
  res.status(200).json({ success: true, data: { log } });
});

export const createFuelLog = catchAsync(async (req, res) => {
  const log = await fuelService.createFuelLog(req.body, req.user._id);
  res.status(201).json({ success: true, message: 'Fuel log created successfully', data: { log } });
});

export const updateFuelLog = catchAsync(async (req, res) => {
  const log = await fuelService.updateFuelLog(req.params.id, req.body, req.user._id);
  res.status(200).json({ success: true, message: 'Fuel log updated successfully', data: { log } });
});

export const deleteFuelLog = catchAsync(async (req, res) => {
  const result = await fuelService.deleteFuelLog(req.params.id, req.user._id);
  res.status(200).json({ success: true, ...result });
});

export const getFuelStats = catchAsync(async (req, res) => {
  const stats = await fuelService.getFuelStats();
  res.status(200).json({ success: true, data: stats });
});

export const getFuelAnalytics = catchAsync(async (req, res) => {
  const analytics = await fuelService.getFuelAnalytics(req.query);
  res.status(200).json({ success: true, data: analytics });
});

export const getMetaVehicles = catchAsync(async (req, res) => {
  const vehicles = await fuelService.getMetaVehicles();
  res.status(200).json({ success: true, data: vehicles });
});

export const exportFuelLogs = catchAsync(async (req, res) => {
  const csv = await fuelService.exportFuelLogsCSV(req.query);
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename=fuel-logs-${Date.now()}.csv`);
  res.status(200).send(csv);
});

export const getFuelStations = catchAsync(async (req, res) => {
  const result = await fuelStationService.getFuelStations(req.query);
  res.status(200).json({ success: true, data: result });
});

export const getFuelStation = catchAsync(async (req, res) => {
  const station = await fuelStationService.getFuelStationById(req.params.id);
  res.status(200).json({ success: true, data: { station } });
});

export const createFuelStation = catchAsync(async (req, res) => {
  const station = await fuelStationService.createFuelStation(req.body, req.user._id);
  res.status(201).json({ success: true, message: 'Fuel station created successfully', data: { station } });
});

export const updateFuelStation = catchAsync(async (req, res) => {
  const station = await fuelStationService.updateFuelStation(req.params.id, req.body, req.user._id);
  res.status(200).json({ success: true, message: 'Fuel station updated successfully', data: { station } });
});

export const deleteFuelStation = catchAsync(async (req, res) => {
  const result = await fuelStationService.deleteFuelStation(req.params.id, req.user._id);
  res.status(200).json({ success: true, ...result });
});

export const getActiveStations = catchAsync(async (req, res) => {
  const stations = await fuelStationService.getActiveStationsList();
  res.status(200).json({ success: true, data: stations });
});
