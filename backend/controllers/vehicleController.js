import catchAsync from '../utils/catchAsync.js';
import * as vehicleService from '../services/vehicleService.js';

export const getVehicles = catchAsync(async (req, res) => {
  const result = await vehicleService.getVehicles(req.query);
  res.status(200).json({ success: true, data: result });
});

export const getVehicleStats = catchAsync(async (req, res) => {
  const stats = await vehicleService.getVehicleStats();
  res.status(200).json({ success: true, data: stats });
});

export const getAvailableDrivers = catchAsync(async (req, res) => {
  const drivers = await vehicleService.getAvailableDrivers();
  res.status(200).json({ success: true, data: drivers });
});

export const getVehicle = catchAsync(async (req, res) => {
  const vehicle = await vehicleService.getVehicleById(req.params.id);
  res.status(200).json({ success: true, data: { vehicle } });
});

export const createVehicle = catchAsync(async (req, res) => {
  const vehicle = await vehicleService.createVehicle(req.body, req.user._id);
  res.status(201).json({ success: true, message: 'Vehicle created successfully', data: { vehicle } });
});

export const updateVehicle = catchAsync(async (req, res) => {
  const vehicle = await vehicleService.updateVehicle(req.params.id, req.body, req.user._id);
  res.status(200).json({ success: true, message: 'Vehicle updated successfully', data: { vehicle } });
});

export const deleteVehicle = catchAsync(async (req, res) => {
  const result = await vehicleService.deleteVehicle(req.params.id, req.user._id);
  res.status(200).json({ success: true, ...result });
});

export const assignDriver = catchAsync(async (req, res) => {
  const vehicle = await vehicleService.assignDriver(req.params.id, req.body.driverId, req.user._id);
  res.status(200).json({ success: true, message: 'Driver assigned successfully', data: { vehicle } });
});

export const unassignDriver = catchAsync(async (req, res) => {
  const vehicle = await vehicleService.unassignDriver(req.params.id, req.user._id);
  res.status(200).json({ success: true, message: 'Driver unassigned successfully', data: { vehicle } });
});

export const uploadImage = catchAsync(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'No image file provided' });
  }
  const vehicle = await vehicleService.uploadVehicleImage(req.params.id, req.file, req.user._id);
  res.status(200).json({ success: true, message: 'Image uploaded successfully', data: { vehicle } });
});

export const deleteImage = catchAsync(async (req, res) => {
  const vehicle = await vehicleService.deleteVehicleImage(
    req.params.id,
    req.params.publicId,
    req.user._id
  );
  res.status(200).json({ success: true, message: 'Image deleted successfully', data: { vehicle } });
});

export const getHistory = catchAsync(async (req, res) => {
  const result = await vehicleService.getVehicleHistory(req.params.id, req.query);
  res.status(200).json({ success: true, data: result });
});

export const exportCSV = catchAsync(async (req, res) => {
  const csv = await vehicleService.exportVehiclesCSV(req.query);
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename=vehicles-${Date.now()}.csv`);
  res.status(200).send(csv);
});
