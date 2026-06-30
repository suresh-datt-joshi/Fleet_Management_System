import catchAsync from '../utils/catchAsync.js';
import * as adminService from '../services/adminService.js';

export const getAdminStats = catchAsync(async (req, res) => {
  const stats = await adminService.getAdminStats();
  res.status(200).json({ success: true, data: stats });
});

export const getUsers = catchAsync(async (req, res) => {
  const result = await adminService.getUsers(req.query);
  res.status(200).json({ success: true, data: result });
});

export const getUser = catchAsync(async (req, res) => {
  const user = await adminService.getUserById(req.params.id);
  res.status(200).json({ success: true, data: { user } });
});

export const createUser = catchAsync(async (req, res) => {
  const user = await adminService.createUser(req.body, req.user._id, req.user);
  res.status(201).json({ success: true, message: 'User created successfully', data: { user } });
});

export const updateUser = catchAsync(async (req, res) => {
  const user = await adminService.updateUser(req.params.id, req.body, req.user._id, req.user);
  res.status(200).json({ success: true, message: 'User updated successfully', data: { user } });
});

export const deleteUser = catchAsync(async (req, res) => {
  const result = await adminService.deleteUser(req.params.id, req.user._id, req.user);
  res.status(200).json({ success: true, ...result });
});

export const resetUserPassword = catchAsync(async (req, res) => {
  const result = await adminService.resetUserPassword(req.params.id, req.body.password, req.user._id, req.user);
  res.status(200).json({ success: true, ...result });
});

export const getRoles = catchAsync(async (req, res) => {
  const roles = await adminService.getRoles();
  res.status(200).json({ success: true, data: roles });
});

export const getPermissions = catchAsync(async (req, res) => {
  const permissions = await adminService.getPermissions();
  res.status(200).json({ success: true, data: permissions });
});

export const getSettings = catchAsync(async (req, res) => {
  const settings = await adminService.getSettings();
  res.status(200).json({ success: true, data: { settings } });
});

export const updateSettings = catchAsync(async (req, res) => {
  const settings = await adminService.updateSettings(req.body, req.user._id);
  res.status(200).json({ success: true, message: 'Settings updated successfully', data: { settings } });
});
