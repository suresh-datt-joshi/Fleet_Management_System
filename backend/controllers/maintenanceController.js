import catchAsync from '../utils/catchAsync.js';
import * as maintenanceService from '../services/maintenanceService.js';

export const getMaintenanceRecords = catchAsync(async (req, res) => {
  const result = await maintenanceService.getMaintenanceRecords(req.query);
  res.status(200).json({ success: true, data: result });
});

export const getMaintenanceStats = catchAsync(async (req, res) => {
  const stats = await maintenanceService.getMaintenanceStats();
  res.status(200).json({ success: true, data: stats });
});

export const getUpcomingMaintenance = catchAsync(async (req, res) => {
  const records = await maintenanceService.getUpcomingMaintenance(req.query);
  res.status(200).json({ success: true, data: records });
});

export const getMaintenanceAnalytics = catchAsync(async (req, res) => {
  const analytics = await maintenanceService.getMaintenanceAnalytics(req.query);
  res.status(200).json({ success: true, data: analytics });
});

export const getMetaVehicles = catchAsync(async (req, res) => {
  const vehicles = await maintenanceService.getMetaVehicles();
  res.status(200).json({ success: true, data: vehicles });
});

export const getMetaMechanics = catchAsync(async (req, res) => {
  const mechanics = await maintenanceService.getMetaMechanics();
  res.status(200).json({ success: true, data: mechanics });
});

export const getMaintenance = catchAsync(async (req, res) => {
  const record = await maintenanceService.getMaintenanceById(req.params.id);
  res.status(200).json({ success: true, data: { record } });
});

export const createMaintenance = catchAsync(async (req, res) => {
  const record = await maintenanceService.createMaintenance(req.body, req.user._id);
  res.status(201).json({ success: true, message: 'Work order created successfully', data: { record } });
});

export const updateMaintenance = catchAsync(async (req, res) => {
  const record = await maintenanceService.updateMaintenance(req.params.id, req.body, req.user._id);
  res.status(200).json({ success: true, message: 'Work order updated successfully', data: { record } });
});

export const deleteMaintenance = catchAsync(async (req, res) => {
  const result = await maintenanceService.deleteMaintenance(req.params.id, req.user._id);
  res.status(200).json({ success: true, ...result });
});

export const assignMechanic = catchAsync(async (req, res) => {
  const record = await maintenanceService.assignMechanic(req.params.id, req.body.mechanicId, req.user._id);
  res.status(200).json({ success: true, message: 'Mechanic assigned successfully', data: { record } });
});

export const startMaintenance = catchAsync(async (req, res) => {
  const record = await maintenanceService.startMaintenance(req.params.id, req.user._id);
  res.status(200).json({ success: true, message: 'Work order started', data: { record } });
});

export const completeMaintenance = catchAsync(async (req, res) => {
  const record = await maintenanceService.completeMaintenance(req.params.id, req.body, req.user._id);
  res.status(200).json({ success: true, message: 'Work order completed', data: { record } });
});

export const getHistory = catchAsync(async (req, res) => {
  const result = await maintenanceService.getMaintenanceHistory(req.params.id, req.query);
  res.status(200).json({ success: true, data: result });
});

export const exportCSV = catchAsync(async (req, res) => {
  const csv = await maintenanceService.exportMaintenanceCSV(req.query);
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename=maintenance-${Date.now()}.csv`);
  res.status(200).send(csv);
});
