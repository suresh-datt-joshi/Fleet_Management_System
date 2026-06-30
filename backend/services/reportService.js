import Report from '../models/Report.js';
import Vehicle from '../models/Vehicle.js';
import Driver from '../models/Driver.js';
import Trip from '../models/Trip.js';
import FuelLog from '../models/FuelLog.js';
import MaintenanceRecord from '../models/MaintenanceRecord.js';
import Alert from '../models/Alert.js';
import AppError from '../utils/AppError.js';
import { getPagination, buildPaginationMeta } from '../utils/pagination.js';
import { objectsToCSV } from '../utils/csvExport.js';
import { getDashboardSummary } from './dashboardService.js';
import {
  REPORT_TYPES,
  REPORT_FORMATS,
  REPORT_STATUS,
  TRIP_STATUS,
  FINANCIALLY_CLOSED_TRIP_STATUSES,
  VEHICLE_STATUS,
  MAINTENANCE_STATUS,
} from '../constants/enums.js';
import { PERMISSIONS } from '../constants/roles.js';
import { exportVehiclesCSV } from './vehicleService.js';
import { exportDriversCSV } from './driverService.js';
import { exportTripsCSV } from './tripService.js';
import { exportFuelLogsCSV } from './fuelService.js';
import { exportMaintenanceCSV } from './maintenanceService.js';
import { exportDocumentsCSV } from './documentService.js';
import { exportAlertsCSV } from './alertService.js';
import { exportRoutesCSV } from './routeService.js';

const REPORT_CATALOG = [
  {
    type: REPORT_TYPES.FLEET_SUMMARY,
    title: 'Fleet Summary Report',
    description: 'Overview of vehicles, drivers, trips, maintenance, fuel, and financial KPIs',
    category: 'summary',
    permission: PERMISSIONS.VIEW_REPORTS,
  },
  {
    type: REPORT_TYPES.FINANCIAL,
    title: 'Financial Report',
    description: 'Revenue, expenses, fuel costs, and profit analysis by period',
    category: 'financial',
    permission: PERMISSIONS.VIEW_REPORTS,
  },
  {
    type: REPORT_TYPES.OPERATIONAL,
    title: 'Operational Report',
    description: 'Trip completion rates, fleet utilization, and maintenance metrics',
    category: 'operational',
    permission: PERMISSIONS.VIEW_REPORTS,
  },
  {
    type: REPORT_TYPES.VEHICLES,
    title: 'Vehicle Inventory Report',
    description: 'Complete vehicle listing with status, odometer, and document expiry',
    category: 'fleet',
    permission: PERMISSIONS.VIEW_VEHICLES,
  },
  {
    type: REPORT_TYPES.DRIVERS,
    title: 'Driver Roster Report',
    description: 'Driver listing with license, status, and assignment details',
    category: 'fleet',
    permission: PERMISSIONS.VIEW_DRIVERS,
  },
  {
    type: REPORT_TYPES.TRIPS,
    title: 'Trip Activity Report',
    description: 'Trip records with routes, revenue, and completion status',
    category: 'operations',
    permission: PERMISSIONS.VIEW_TRIPS,
  },
  {
    type: REPORT_TYPES.FUEL,
    title: 'Fuel Consumption Report',
    description: 'Fuel logs with quantity, cost, mileage, and vehicle details',
    category: 'operations',
    permission: PERMISSIONS.VIEW_FUEL,
  },
  {
    type: REPORT_TYPES.MAINTENANCE,
    title: 'Maintenance Report',
    description: 'Work orders with costs, schedules, and completion status',
    category: 'operations',
    permission: PERMISSIONS.VIEW_MAINTENANCE,
  },
  {
    type: REPORT_TYPES.DOCUMENTS,
    title: 'Document Compliance Report',
    description: 'Fleet documents with expiry dates and compliance status',
    category: 'compliance',
    permission: PERMISSIONS.VIEW_DOCUMENTS,
  },
  {
    type: REPORT_TYPES.ALERTS,
    title: 'Alerts Report',
    description: 'System alerts with severity, type, and read status',
    category: 'compliance',
    permission: PERMISSIONS.VIEW_ALERTS,
  },
  {
    type: REPORT_TYPES.ROUTES,
    title: 'Routes Report',
    description: 'Route templates with stops, distance, and status',
    category: 'operations',
    permission: PERMISSIONS.VIEW_TRIPS,
  },
];

const TYPE_PERMISSION_MAP = Object.fromEntries(REPORT_CATALOG.map((r) => [r.type, r.permission]));

const generateReportNumber = async () => {
  const prefix = `RPT-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}`;
  const count = await Report.countDocuments({ reportNumber: new RegExp(`^${prefix}`) });
  return `${prefix}-${String(count + 1).padStart(4, '0')}`;
};

const formatReport = (report) => {
  const r = report.toObject ? report.toObject() : report;
  return {
    id: r._id,
    reportNumber: r.reportNumber,
    type: r.type,
    title: r.title,
    format: r.format,
    parameters: r.parameters || {},
    recordCount: r.recordCount,
    fileName: r.fileName,
    status: r.status,
    errorMessage: r.errorMessage,
    generatedBy: r.generatedBy
      ? {
          id: r.generatedBy._id || r.generatedBy,
          name: r.generatedBy.firstName ? `${r.generatedBy.firstName} ${r.generatedBy.lastName}` : undefined,
        }
      : null,
    createdAt: r.createdAt,
  };
};

const parseDateRange = (query) => {
  const from = query.from ? new Date(query.from) : null;
  const to = query.to ? new Date(query.to) : null;
  return { from, to };
};

const countCsvRows = (csv) => Math.max(0, csv.split('\n').length - 1);

export const assertReportAccess = (type, userPermissions) => {
  const required = TYPE_PERMISSION_MAP[type];
  if (!required) throw new AppError('Invalid report type', 400);
  if (!userPermissions.includes(required)) {
    throw new AppError('You do not have permission to access this report', 403);
  }
};

export const getReportCatalog = (userPermissions = []) =>
  REPORT_CATALOG.filter((r) => userPermissions.includes(r.permission));

export const getReportStats = async () => {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const [total, last30Days, byType, byFormat] = await Promise.all([
    Report.countDocuments({ status: REPORT_STATUS.COMPLETED }),
    Report.countDocuments({ status: REPORT_STATUS.COMPLETED, createdAt: { $gte: thirtyDaysAgo } }),
    Report.aggregate([
      { $match: { status: REPORT_STATUS.COMPLETED } },
      { $group: { _id: '$type', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]),
    Report.aggregate([
      { $match: { status: REPORT_STATUS.COMPLETED } },
      { $group: { _id: '$format', count: { $sum: 1 } } },
    ]),
  ]);

  return {
    totalGenerated: total,
    generatedLast30Days: last30Days,
    availableReports: REPORT_CATALOG.length,
    byType: byType.map((t) => ({ type: t._id, count: t.count })),
    byFormat: byFormat.map((f) => ({ format: f._id, count: f.count })),
  };
};

export const getReportHistory = async (query) => {
  const { page, limit, skip, sort } = getPagination(query);
  const filter = {};

  if (query.type) filter.type = query.type;
  if (query.status) filter.status = query.status;
  if (query.from) filter.createdAt = { ...filter.createdAt, $gte: new Date(query.from) };
  if (query.to) filter.createdAt = { ...filter.createdAt, $lte: new Date(query.to) };

  const [reports, total] = await Promise.all([
    Report.find(filter)
      .populate('generatedBy', 'firstName lastName email')
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean(),
    Report.countDocuments(filter),
  ]);

  return {
    reports: reports.map(formatReport),
    pagination: buildPaginationMeta(total, page, limit),
  };
};

export const getFleetSummaryReport = async (query = {}) => {
  const summary = await getDashboardSummary();
  const notDeleted = { isDeleted: false };

  const [vehiclesByStatus, driversByStatus, recentTrips] = await Promise.all([
    Vehicle.aggregate([{ $match: notDeleted }, { $group: { _id: '$status', count: { $sum: 1 } } }]),
    Driver.aggregate([{ $match: notDeleted }, { $group: { _id: '$status', count: { $sum: 1 } } }]),
    Trip.find(notDeleted).sort({ scheduledAt: -1 }).limit(5).select('tripNumber status scheduledAt revenue').lean(),
  ]);

  return {
    generatedAt: new Date().toISOString(),
    period: parseDateRange(query),
    summary,
    breakdown: {
      vehiclesByStatus: vehiclesByStatus.map((v) => ({ status: v._id, count: v.count })),
      driversByStatus: driversByStatus.map((d) => ({ status: d._id, count: d.count })),
    },
    recentTrips: recentTrips.map((t) => ({
      tripNumber: t.tripNumber,
      status: t.status,
      scheduledAt: t.scheduledAt,
      revenue: t.revenue,
    })),
  };
};

export const getFinancialReport = async (query = {}) => {
  const { from, to } = parseDateRange(query);
  const notDeleted = { isDeleted: false };

  const tripMatch = {
    ...notDeleted,
    status: { $in: FINANCIALLY_CLOSED_TRIP_STATUSES },
    completedAt: {},
  };
  const fuelMatch = { ...notDeleted, loggedAt: {} };

  if (from) {
    tripMatch.completedAt.$gte = from;
    fuelMatch.loggedAt.$gte = from;
  } else {
    const defaultFrom = new Date();
    defaultFrom.setMonth(defaultFrom.getMonth() - 6);
    tripMatch.completedAt.$gte = defaultFrom;
    fuelMatch.loggedAt.$gte = defaultFrom;
  }
  if (to) {
    tripMatch.completedAt.$lte = to;
    fuelMatch.loggedAt.$lte = to;
  }

  const [tripFinancials, fuelFinancials, maintenanceCosts] = await Promise.all([
    Trip.aggregate([
      { $match: tripMatch },
      {
        $group: {
          _id: { year: { $year: '$completedAt' }, month: { $month: '$completedAt' } },
          revenue: { $sum: '$revenue' },
          expenses: { $sum: '$expenses' },
          tripCount: { $sum: 1 },
          distance: { $sum: '$distance' },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]),
    FuelLog.aggregate([
      { $match: fuelMatch },
      {
        $group: {
          _id: { year: { $year: '$loggedAt' }, month: { $month: '$loggedAt' } },
          totalCost: { $sum: '$cost' },
          totalQuantity: { $sum: '$quantity' },
          logCount: { $sum: 1 },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]),
    MaintenanceRecord.aggregate([
      {
        $match: {
          ...notDeleted,
          status: MAINTENANCE_STATUS.COMPLETED,
          ...(from || to
            ? {
                completedDate: {
                  ...(from ? { $gte: from } : {}),
                  ...(to ? { $lte: to } : {}),
                },
              }
            : {}),
        },
      },
      { $group: { _id: null, totalCost: { $sum: '$cost' }, count: { $sum: 1 } } },
    ]),
  ]);

  const monthLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  const monthly = tripFinancials.map((t) => {
    const fuel = fuelFinancials.find((f) => f._id.year === t._id.year && f._id.month === t._id.month);
    const revenue = Math.round(t.revenue * 100) / 100;
    const expenses = Math.round(t.expenses * 100) / 100;
    const fuelCost = Math.round((fuel?.totalCost || 0) * 100) / 100;
    return {
      period: `${monthLabels[t._id.month - 1]} ${t._id.year}`,
      revenue,
      tripExpenses: expenses,
      fuelCost,
      profit: Math.round((revenue - expenses - fuelCost) * 100) / 100,
      tripCount: t.tripCount,
      distance: Math.round(t.distance * 100) / 100,
    };
  });

  const totals = monthly.reduce(
    (acc, m) => ({
      revenue: acc.revenue + m.revenue,
      tripExpenses: acc.tripExpenses + m.tripExpenses,
      fuelCost: acc.fuelCost + m.fuelCost,
      profit: acc.profit + m.profit,
      tripCount: acc.tripCount + m.tripCount,
    }),
    { revenue: 0, tripExpenses: 0, fuelCost: 0, profit: 0, tripCount: 0 }
  );

  return {
    generatedAt: new Date().toISOString(),
    period: { from: tripMatch.completedAt.$gte, to: to || new Date() },
    monthly,
    totals: {
      ...totals,
      maintenanceCost: Math.round((maintenanceCosts[0]?.totalCost || 0) * 100) / 100,
      revenue: Math.round(totals.revenue * 100) / 100,
      tripExpenses: Math.round(totals.tripExpenses * 100) / 100,
      fuelCost: Math.round(totals.fuelCost * 100) / 100,
      profit: Math.round(totals.profit * 100) / 100,
    },
  };
};

export const getOperationalReport = async (query = {}) => {
  const { from, to } = parseDateRange(query);
  const notDeleted = { isDeleted: false };
  const dateFilter = {};

  if (from) dateFilter.$gte = from;
  if (to) dateFilter.$lte = to;

  const tripFilter = { ...notDeleted, ...(Object.keys(dateFilter).length ? { scheduledAt: dateFilter } : {}) };

  const [
    tripStats,
    vehicleUtilization,
    maintenanceStats,
    alertStats,
    avgTripDistance,
  ] = await Promise.all([
    Trip.aggregate([
      { $match: tripFilter },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]),
    Vehicle.aggregate([
      { $match: { ...notDeleted, status: VEHICLE_STATUS.ACTIVE } },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          avgOdometer: { $avg: '$odometer' },
          avgFuelLevel: { $avg: '$fuelLevel' },
          lowFuel: { $sum: { $cond: [{ $lte: ['$fuelLevel', 20] }, 1, 0] } },
        },
      },
    ]),
    MaintenanceRecord.aggregate([
      { $match: notDeleted },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]),
    Alert.aggregate([
      { $group: { _id: '$severity', count: { $sum: 1 }, unread: { $sum: { $cond: [{ $eq: ['$isRead', false] }, 1, 0] } } } },
    ]),
    Trip.aggregate([
      { $match: { ...notDeleted, status: { $in: FINANCIALLY_CLOSED_TRIP_STATUSES }, distance: { $gt: 0 } } },
      { $group: { _id: null, avgDistance: { $avg: '$distance' }, totalDistance: { $sum: '$distance' } } },
    ]),
  ]);

  const totalTrips = tripStats.reduce((s, t) => s + t.count, 0);
  const closedTrips = tripStats
    .filter((t) => FINANCIALLY_CLOSED_TRIP_STATUSES.includes(t._id))
    .reduce((s, t) => s + t.count, 0);

  return {
    generatedAt: new Date().toISOString(),
    period: { from, to },
    trips: {
      total: totalTrips,
      byStatus: tripStats.map((t) => ({ status: t._id, count: t.count })),
      completionRate: totalTrips ? Math.round((closedTrips / totalTrips) * 100) : 0,
      avgDistance: Math.round((avgTripDistance[0]?.avgDistance || 0) * 100) / 100,
      totalDistance: Math.round((avgTripDistance[0]?.totalDistance || 0) * 100) / 100,
    },
    fleet: {
      activeVehicles: vehicleUtilization[0]?.total || 0,
      avgOdometer: Math.round((vehicleUtilization[0]?.avgOdometer || 0) * 100) / 100,
      avgFuelLevel: Math.round((vehicleUtilization[0]?.avgFuelLevel || 0) * 100) / 100,
      lowFuelVehicles: vehicleUtilization[0]?.lowFuel || 0,
    },
    maintenance: {
      byStatus: maintenanceStats.map((m) => ({ status: m._id, count: m.count })),
    },
    alerts: {
      bySeverity: alertStats.map((a) => ({ severity: a._id, count: a.count, unread: a.unread })),
    },
  };
};

export const getReportPreview = async (type, query = {}) => {
  switch (type) {
    case REPORT_TYPES.FLEET_SUMMARY:
      return getFleetSummaryReport(query);
    case REPORT_TYPES.FINANCIAL:
      return getFinancialReport(query);
    case REPORT_TYPES.OPERATIONAL:
      return getOperationalReport(query);
    default:
      throw new AppError('Preview not available for this report type. Use export to download data.', 400);
  }
};

const exportFleetSummaryCSV = async (query) => {
  const data = await getFleetSummaryReport(query);
  const rows = [
    { metric: 'Total Vehicles', value: data.summary.vehicles.total },
    { metric: 'Active Vehicles', value: data.summary.vehicles.active },
    { metric: 'Vehicles In Maintenance', value: data.summary.vehicles.inMaintenance },
    { metric: 'Live Vehicles', value: data.summary.vehicles.live },
    { metric: 'Total Drivers', value: data.summary.drivers.total },
    { metric: 'Active Drivers', value: data.summary.drivers.active },
    { metric: 'Trips Today', value: data.summary.trips.today },
    { metric: 'Trips In Progress', value: data.summary.trips.inProgress },
    { metric: 'Trips This Month', value: data.summary.trips.thisMonth },
    { metric: 'Maintenance Due Soon', value: data.summary.maintenance.dueSoon },
    { metric: 'Maintenance Overdue', value: data.summary.maintenance.overdue },
    { metric: 'Fuel Cost This Month', value: data.summary.fuel.costThisMonth },
    { metric: 'Revenue This Month', value: data.summary.financials.revenueThisMonth },
    { metric: 'Expenses This Month', value: data.summary.financials.expensesThisMonth },
    { metric: 'Profit This Month', value: data.summary.financials.profitThisMonth },
    { metric: 'Unread Alerts', value: data.summary.alerts.unread },
    { metric: 'Critical Alerts', value: data.summary.alerts.critical },
  ];

  return objectsToCSV(rows, [
    { header: 'Metric', accessor: 'metric' },
    { header: 'Value', accessor: 'value' },
  ]);
};

const exportFinancialCSV = async (query) => {
  const data = await getFinancialReport(query);
  const rows = [
    ...data.monthly,
    {
      period: 'TOTAL',
      revenue: data.totals.revenue,
      tripExpenses: data.totals.tripExpenses,
      fuelCost: data.totals.fuelCost,
      profit: data.totals.profit,
      tripCount: data.totals.tripCount,
      distance: '',
    },
  ];

  return objectsToCSV(rows, [
    { header: 'Period', accessor: 'period' },
    { header: 'Revenue', accessor: 'revenue' },
    { header: 'Trip Expenses', accessor: 'tripExpenses' },
    { header: 'Fuel Cost', accessor: 'fuelCost' },
    { header: 'Profit', accessor: 'profit' },
    { header: 'Trip Count', accessor: 'tripCount' },
    { header: 'Distance (km)', accessor: 'distance' },
  ]);
};

const exportOperationalCSV = async (query) => {
  const data = await getOperationalReport(query);
  const rows = [
    { metric: 'Total Trips', value: data.trips.total },
    { metric: 'Completion Rate (%)', value: data.trips.completionRate },
    { metric: 'Avg Trip Distance (km)', value: data.trips.avgDistance },
    { metric: 'Total Distance (km)', value: data.trips.totalDistance },
    { metric: 'Active Vehicles', value: data.fleet.activeVehicles },
    { metric: 'Avg Odometer (km)', value: data.fleet.avgOdometer },
    { metric: 'Avg Fuel Level (%)', value: data.fleet.avgFuelLevel },
    { metric: 'Low Fuel Vehicles', value: data.fleet.lowFuelVehicles },
  ];

  return objectsToCSV(rows, [
    { header: 'Metric', accessor: 'metric' },
    { header: 'Value', accessor: 'value' },
  ]);
};

export const exportReport = async (type, query, userId) => {
  const catalogEntry = REPORT_CATALOG.find((r) => r.type === type);
  if (!catalogEntry) throw new AppError('Invalid report type', 400);

  const reportNumber = await generateReportNumber();
  const fileName = `${type}-report-${Date.now()}.csv`;

  let csv;
  try {
    switch (type) {
      case REPORT_TYPES.FLEET_SUMMARY:
        csv = await exportFleetSummaryCSV(query);
        break;
      case REPORT_TYPES.FINANCIAL:
        csv = await exportFinancialCSV(query);
        break;
      case REPORT_TYPES.OPERATIONAL:
        csv = await exportOperationalCSV(query);
        break;
      case REPORT_TYPES.VEHICLES:
        csv = await exportVehiclesCSV(query);
        break;
      case REPORT_TYPES.DRIVERS:
        csv = await exportDriversCSV(query);
        break;
      case REPORT_TYPES.TRIPS:
        csv = await exportTripsCSV(query);
        break;
      case REPORT_TYPES.FUEL:
        csv = await exportFuelLogsCSV(query);
        break;
      case REPORT_TYPES.MAINTENANCE:
        csv = await exportMaintenanceCSV(query);
        break;
      case REPORT_TYPES.DOCUMENTS:
        csv = await exportDocumentsCSV(query);
        break;
      case REPORT_TYPES.ALERTS:
        csv = await exportAlertsCSV(query);
        break;
      case REPORT_TYPES.ROUTES:
        csv = await exportRoutesCSV(query);
        break;
      default:
        throw new AppError('Unsupported report type', 400);
    }

    const recordCount = countCsvRows(csv);

    await Report.create({
      reportNumber,
      type,
      title: catalogEntry.title,
      format: REPORT_FORMATS.CSV,
      parameters: { from: query.from, to: query.to, ...query },
      recordCount,
      fileName,
      status: REPORT_STATUS.COMPLETED,
      generatedBy: userId,
      createdBy: userId,
      updatedBy: userId,
    });

    return { csv, fileName, recordCount, reportNumber };
  } catch (err) {
    await Report.create({
      reportNumber,
      type,
      title: catalogEntry.title,
      format: REPORT_FORMATS.CSV,
      parameters: { from: query.from, to: query.to, ...query },
      recordCount: 0,
      fileName,
      status: REPORT_STATUS.FAILED,
      errorMessage: err.message,
      generatedBy: userId,
      createdBy: userId,
      updatedBy: userId,
    });
    throw err;
  }
};

export default {
  getReportCatalog,
  getReportStats,
  getReportHistory,
  getFleetSummaryReport,
  getFinancialReport,
  getOperationalReport,
  getReportPreview,
  exportReport,
  assertReportAccess,
};
