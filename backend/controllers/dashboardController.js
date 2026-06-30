import catchAsync from '../utils/catchAsync.js';
import * as dashboardService from '../services/dashboardService.js';

export const getSummary = catchAsync(async (req, res) => {
  const summary = await dashboardService.getDashboardSummary();
  res.status(200).json({ success: true, data: summary });
});

export const getCharts = catchAsync(async (req, res) => {
  const charts = await dashboardService.getDashboardCharts();
  res.status(200).json({ success: true, data: charts });
});

export const getActivities = catchAsync(async (req, res) => {
  const limit = Math.min(parseInt(req.query.limit, 10) || 10, 50);
  const activities = await dashboardService.getRecentActivities(limit);
  res.status(200).json({ success: true, data: activities });
});

export const getAlerts = catchAsync(async (req, res) => {
  const limit = Math.min(parseInt(req.query.limit, 10) || 8, 50);
  const alerts = await dashboardService.getDashboardAlerts(limit);
  res.status(200).json({ success: true, data: alerts });
});

export const getLiveVehicles = catchAsync(async (req, res) => {
  const vehicles = await dashboardService.getLiveVehicles();
  res.status(200).json({ success: true, data: vehicles });
});

export const getOverview = catchAsync(async (req, res) => {
  const [summary, charts, activities, alerts, liveVehicles] = await Promise.all([
    dashboardService.getDashboardSummary(),
    dashboardService.getDashboardCharts(),
    dashboardService.getRecentActivities(10),
    dashboardService.getDashboardAlerts(8),
    dashboardService.getLiveVehicles(),
  ]);

  res.status(200).json({
    success: true,
    data: { summary, charts, activities, alerts, liveVehicles },
  });
});
