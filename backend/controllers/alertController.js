import catchAsync from '../utils/catchAsync.js';
import * as alertService from '../services/alertService.js';

export const getAlerts = catchAsync(async (req, res) => {
  const result = await alertService.getAlerts(req.query, req.user);
  res.status(200).json({ success: true, data: result });
});

export const getAlertStats = catchAsync(async (req, res) => {
  const stats = await alertService.getAlertStats(req.user);
  res.status(200).json({ success: true, data: stats });
});

export const getAlertAnalytics = catchAsync(async (req, res) => {
  const analytics = await alertService.getAlertAnalytics(req.query);
  res.status(200).json({ success: true, data: analytics });
});

export const getMetaVehicles = catchAsync(async (req, res) => {
  const vehicles = await alertService.getMetaVehicles();
  res.status(200).json({ success: true, data: vehicles });
});

export const getMetaDrivers = catchAsync(async (req, res) => {
  const drivers = await alertService.getMetaDrivers();
  res.status(200).json({ success: true, data: drivers });
});

export const getAlert = catchAsync(async (req, res) => {
  const alert = await alertService.getAlertById(req.params.id);
  res.status(200).json({ success: true, data: { alert } });
});

export const createAlert = catchAsync(async (req, res) => {
  const alert = await alertService.createAlert(req.body, req.user._id);
  res.status(201).json({ success: true, message: 'Alert created successfully', data: { alert } });
});

export const updateAlert = catchAsync(async (req, res) => {
  const alert = await alertService.updateAlert(req.params.id, req.body);
  res.status(200).json({ success: true, message: 'Alert updated successfully', data: { alert } });
});

export const markAlertAsRead = catchAsync(async (req, res) => {
  const alert = await alertService.markAlertAsRead(req.params.id);
  res.status(200).json({ success: true, message: 'Alert marked as read', data: { alert } });
});

export const markAllAlertsAsRead = catchAsync(async (req, res) => {
  const result = await alertService.markAllAlertsAsRead(req.user);
  res.status(200).json({ success: true, message: 'All alerts marked as read', data: result });
});

export const deleteAlert = catchAsync(async (req, res) => {
  const result = await alertService.deleteAlert(req.params.id);
  res.status(200).json({ success: true, ...result });
});

export const bulkDeleteAlerts = catchAsync(async (req, res) => {
  const result = await alertService.bulkDeleteAlerts(req.body.ids);
  res.status(200).json({ success: true, message: 'Alerts deleted', data: result });
});

export const syncAlerts = catchAsync(async (req, res) => {
  const result = await alertService.syncAlerts(req.user._id);
  res.status(200).json({ success: true, message: 'Alert sync completed', data: result });
});

export const exportAlerts = catchAsync(async (req, res) => {
  const csv = await alertService.exportAlertsCSV(req.query);
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename=alerts-${Date.now()}.csv`);
  res.status(200).send(csv);
});

export const getNotifications = catchAsync(async (req, res) => {
  const result = await alertService.getNotifications(req.user._id, req.query);
  res.status(200).json({ success: true, data: result });
});

export const getNotificationStats = catchAsync(async (req, res) => {
  const stats = await alertService.getNotificationStats(req.user._id);
  res.status(200).json({ success: true, data: stats });
});

export const markNotificationAsRead = catchAsync(async (req, res) => {
  const notification = await alertService.markNotificationAsRead(req.user._id, req.params.id);
  res.status(200).json({ success: true, message: 'Notification marked as read', data: { notification } });
});

export const markAllNotificationsAsRead = catchAsync(async (req, res) => {
  const result = await alertService.markAllNotificationsAsRead(req.user._id);
  res.status(200).json({ success: true, message: 'All notifications marked as read', data: result });
});

export const deleteNotification = catchAsync(async (req, res) => {
  const result = await alertService.deleteNotification(req.user._id, req.params.id);
  res.status(200).json({ success: true, ...result });
});
