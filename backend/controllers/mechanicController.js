import catchAsync from '../utils/catchAsync.js';
import * as mechanicService from '../services/mechanicService.js';

export const getMechanics = catchAsync(async (req, res) => {
  const result = await mechanicService.getMechanics(req.query);
  res.status(200).json({ success: true, data: result });
});

export const getMechanicStats = catchAsync(async (req, res) => {
  const stats = await mechanicService.getMechanicStats();
  res.status(200).json({ success: true, data: stats });
});

export const getMechanic = catchAsync(async (req, res) => {
  const mechanic = await mechanicService.getMechanicById(req.params.id);
  res.status(200).json({ success: true, data: { mechanic } });
});

export const createMechanic = catchAsync(async (req, res) => {
  const mechanic = await mechanicService.createMechanic(req.body, req.user._id);
  res.status(201).json({ success: true, message: 'Mechanic created successfully', data: { mechanic } });
});

export const updateMechanic = catchAsync(async (req, res) => {
  const mechanic = await mechanicService.updateMechanic(req.params.id, req.body, req.user._id);
  res.status(200).json({ success: true, message: 'Mechanic updated successfully', data: { mechanic } });
});

export const deleteMechanic = catchAsync(async (req, res) => {
  const result = await mechanicService.deleteMechanic(req.params.id, req.user._id);
  res.status(200).json({ success: true, ...result });
});

export const uploadAvatar = catchAsync(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'No image file provided' });
  }
  const mechanic = await mechanicService.uploadAvatar(req.params.id, req.file, req.user._id);
  res.status(200).json({ success: true, message: 'Avatar uploaded successfully', data: { mechanic } });
});

export const uploadDocument = catchAsync(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'No file provided' });
  }
  const mechanic = await mechanicService.uploadDocument(req.params.id, req.file, req.body, req.user._id);
  res.status(200).json({ success: true, message: 'Document uploaded successfully', data: { mechanic } });
});

export const deleteDocument = catchAsync(async (req, res) => {
  const mechanic = await mechanicService.deleteDocument(req.params.id, req.params.documentId, req.user._id);
  res.status(200).json({ success: true, message: 'Document deleted successfully', data: { mechanic } });
});

export const getHistory = catchAsync(async (req, res) => {
  const result = await mechanicService.getMechanicHistory(req.params.id, req.query);
  res.status(200).json({ success: true, data: result });
});

export const exportCSV = catchAsync(async (req, res) => {
  const csv = await mechanicService.exportMechanicsCSV(req.query);
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename=mechanics-${Date.now()}.csv`);
  res.status(200).send(csv);
});
