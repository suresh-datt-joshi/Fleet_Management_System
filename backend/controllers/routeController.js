import catchAsync from '../utils/catchAsync.js';
import * as routeService from '../services/routeService.js';

export const getRoutes = catchAsync(async (req, res) => {
  const result = await routeService.getRoutes(req.query);
  res.status(200).json({ success: true, data: result });
});

export const getRouteStats = catchAsync(async (req, res) => {
  const stats = await routeService.getRouteStats();
  res.status(200).json({ success: true, data: stats });
});

export const getTrafficPreview = catchAsync(async (req, res) => {
  const traffic = await routeService.getTrafficPreview();
  res.status(200).json({ success: true, data: traffic });
});

export const getRoute = catchAsync(async (req, res) => {
  const route = await routeService.getRouteById(req.params.id);
  res.status(200).json({ success: true, data: { route } });
});

export const createRoute = catchAsync(async (req, res) => {
  const route = await routeService.createRoute(req.body, req.user._id);
  res.status(201).json({ success: true, message: 'Route created successfully', data: { route } });
});

export const updateRoute = catchAsync(async (req, res) => {
  const route = await routeService.updateRoute(req.params.id, req.body, req.user._id);
  res.status(200).json({ success: true, message: 'Route updated successfully', data: { route } });
});

export const deleteRoute = catchAsync(async (req, res) => {
  const result = await routeService.deleteRoute(req.params.id, req.user._id);
  res.status(200).json({ success: true, ...result });
});

export const optimizeRoute = catchAsync(async (req, res) => {
  const result = await routeService.optimizeRouteById(req.params.id, req.user._id, req.body);
  res.status(200).json({
    success: true,
    message: 'Route optimized successfully',
    data: result,
  });
});

export const duplicateRoute = catchAsync(async (req, res) => {
  const route = await routeService.duplicateRoute(req.params.id, req.user._id);
  res.status(201).json({ success: true, message: 'Route duplicated successfully', data: { route } });
});

export const getHistory = catchAsync(async (req, res) => {
  const result = await routeService.getRouteHistory(req.params.id, req.query);
  res.status(200).json({ success: true, data: result });
});

export const exportCSV = catchAsync(async (req, res) => {
  const csv = await routeService.exportRoutesCSV(req.query);
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename=routes-${Date.now()}.csv`);
  res.status(200).send(csv);
});
