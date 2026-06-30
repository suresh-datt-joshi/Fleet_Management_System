import catchAsync from '../utils/catchAsync.js';
import * as driverService from '../services/driverService.js';

export const getDrivers = catchAsync(async (req, res) => {
  const result = await driverService.getDrivers(req.query);
  res.status(200).json({ success: true, data: result });
});

export const getDriverStats = catchAsync(async (req, res) => {
  const stats = await driverService.getDriverStats();
  res.status(200).json({ success: true, data: stats });
});

export const getAvailableVehicles = catchAsync(async (req, res) => {
  const vehicles = await driverService.getAvailableVehicles();
  res.status(200).json({ success: true, data: vehicles });
});

export const getDriver = catchAsync(async (req, res) => {
  const driver = await driverService.getDriverById(req.params.id);
  res.status(200).json({ success: true, data: { driver } });
});

export const createDriver = catchAsync(async (req, res) => {
  const driver = await driverService.createDriver(req.body, req.user._id);
  res.status(201).json({ success: true, message: 'Driver created successfully', data: { driver } });
});

export const updateDriver = catchAsync(async (req, res) => {
  const driver = await driverService.updateDriver(req.params.id, req.body, req.user._id);
  res.status(200).json({ success: true, message: 'Driver updated successfully', data: { driver } });
});

export const deleteDriver = catchAsync(async (req, res) => {
  const result = await driverService.deleteDriver(req.params.id, req.user._id);
  res.status(200).json({ success: true, ...result });
});

export const assignVehicle = catchAsync(async (req, res) => {
  const driver = await driverService.assignVehicle(req.params.id, req.body.vehicleId, req.user._id);
  res.status(200).json({ success: true, message: 'Vehicle assigned successfully', data: { driver } });
});

export const unassignVehicle = catchAsync(async (req, res) => {
  const driver = await driverService.unassignVehicle(req.params.id, req.user._id);
  res.status(200).json({ success: true, message: 'Vehicle unassigned successfully', data: { driver } });
});

export const uploadAvatar = catchAsync(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'No image file provided' });
  }
  const driver = await driverService.uploadAvatar(req.params.id, req.file, req.user._id);
  res.status(200).json({ success: true, message: 'Avatar uploaded successfully', data: { driver } });
});

export const uploadDocument = catchAsync(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'No file provided' });
  }
  const driver = await driverService.uploadDocument(req.params.id, req.file, req.body, req.user._id);
  res.status(200).json({ success: true, message: 'Document uploaded successfully', data: { driver } });
});

export const deleteDocument = catchAsync(async (req, res) => {
  const driver = await driverService.deleteDocument(req.params.id, req.params.documentId, req.user._id);
  res.status(200).json({ success: true, message: 'Document deleted successfully', data: { driver } });
});

export const getHistory = catchAsync(async (req, res) => {
  const result = await driverService.getDriverHistory(req.params.id, req.query);
  res.status(200).json({ success: true, data: result });
});

export const exportCSV = catchAsync(async (req, res) => {
  const csv = await driverService.exportDriversCSV(req.query);
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename=drivers-${Date.now()}.csv`);
  res.status(200).send(csv);
});
