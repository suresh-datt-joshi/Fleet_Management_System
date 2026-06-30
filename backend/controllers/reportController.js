import catchAsync from '../utils/catchAsync.js';
import * as reportService from '../services/reportService.js';
import { ROLE_PERMISSIONS } from '../constants/roles.js';

const getUserPermissions = (user) => ROLE_PERMISSIONS[user.role] || [];

export const getReportCatalog = catchAsync(async (req, res) => {
  const catalog = reportService.getReportCatalog(getUserPermissions(req.user));
  res.status(200).json({ success: true, data: catalog });
});

export const getReportStats = catchAsync(async (req, res) => {
  const stats = await reportService.getReportStats();
  res.status(200).json({ success: true, data: stats });
});

export const getReportHistory = catchAsync(async (req, res) => {
  const result = await reportService.getReportHistory(req.query);
  res.status(200).json({ success: true, data: result });
});

export const getReportPreview = catchAsync(async (req, res) => {
  reportService.assertReportAccess(req.params.type, getUserPermissions(req.user));
  const preview = await reportService.getReportPreview(req.params.type, req.query);
  res.status(200).json({ success: true, data: preview });
});

export const getFleetSummary = catchAsync(async (req, res) => {
  const data = await reportService.getFleetSummaryReport(req.query);
  res.status(200).json({ success: true, data });
});

export const getFinancialReport = catchAsync(async (req, res) => {
  const data = await reportService.getFinancialReport(req.query);
  res.status(200).json({ success: true, data });
});

export const getOperationalReport = catchAsync(async (req, res) => {
  const data = await reportService.getOperationalReport(req.query);
  res.status(200).json({ success: true, data });
});

export const exportReport = catchAsync(async (req, res) => {
  const { type, ...params } = req.query;
  reportService.assertReportAccess(type, getUserPermissions(req.user));

  const { csv, fileName } = await reportService.exportReport(type, params, req.user._id);

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename=${fileName}`);
  res.status(200).send(csv);
});
