import Vehicle from '../models/Vehicle.js';
import Driver from '../models/Driver.js';
import Trip from '../models/Trip.js';
import FuelLog from '../models/FuelLog.js';
import MaintenanceRecord from '../models/MaintenanceRecord.js';
import Alert from '../models/Alert.js';
import Notification from '../models/Notification.js';
import { isRestrictedAlertRole } from '../utils/notificationTargeting.js';
import Activity from '../models/Activity.js';
import {
  VEHICLE_STATUS,
  DRIVER_STATUS,
  TRIP_STATUS,
  FINANCIALLY_CLOSED_TRIP_STATUSES,
  MAINTENANCE_STATUS,
} from '../constants/enums.js';

const startOfDay = (date = new Date()) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
};

const startOfMonth = (date = new Date()) => {
  const d = new Date(date);
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return d;
};

const monthsAgo = (n) => {
  const d = new Date();
  d.setMonth(d.getMonth() - n);
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return d;
};

const monthLabel = (date) =>
  date.toLocaleString('en-US', { month: 'short', year: '2-digit' });

export const getDashboardSummary = async () => {
  const today = startOfDay();
  const monthStart = startOfMonth();
  const notDeleted = { isDeleted: false };

  const [
    totalVehicles,
    activeVehicles,
    vehiclesInMaintenance,
    totalDrivers,
    activeDrivers,
    tripsToday,
    tripsInProgress,
    tripsThisMonth,
    maintenanceDue,
    maintenanceOverdue,
    unreadAlerts,
    criticalAlerts,
    fuelThisMonth,
    revenueThisMonth,
    expensesThisMonth,
    liveVehicles,
  ] = await Promise.all([
    Vehicle.countDocuments(notDeleted),
    Vehicle.countDocuments({ ...notDeleted, status: VEHICLE_STATUS.ACTIVE }),
    Vehicle.countDocuments({ ...notDeleted, status: VEHICLE_STATUS.MAINTENANCE }),
    Driver.countDocuments(notDeleted),
    Driver.countDocuments({
      ...notDeleted,
      status: { $in: [DRIVER_STATUS.AVAILABLE, DRIVER_STATUS.ON_TRIP] },
    }),
    Trip.countDocuments({ ...notDeleted, scheduledAt: { $gte: today } }),
    Trip.countDocuments({ ...notDeleted, status: TRIP_STATUS.IN_PROGRESS }),
    Trip.countDocuments({ ...notDeleted, scheduledAt: { $gte: monthStart } }),
    MaintenanceRecord.countDocuments({
      ...notDeleted,
      status: MAINTENANCE_STATUS.SCHEDULED,
      scheduledDate: { $lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) },
    }),
    MaintenanceRecord.countDocuments({
      ...notDeleted,
      status: { $in: [MAINTENANCE_STATUS.SCHEDULED, MAINTENANCE_STATUS.OVERDUE] },
      scheduledDate: { $lt: new Date() },
    }),
    Alert.countDocuments({ isRead: false }),
    Alert.countDocuments({ severity: 'critical', isRead: false }),
    FuelLog.aggregate([
      { $match: { ...notDeleted, loggedAt: { $gte: monthStart } } },
      { $group: { _id: null, totalQuantity: { $sum: '$quantity' }, totalCost: { $sum: '$cost' } } },
    ]),
    Trip.aggregate([
      {
        $match: {
          ...notDeleted,
          status: { $in: FINANCIALLY_CLOSED_TRIP_STATUSES },
          completedAt: { $gte: monthStart },
        },
      },
      { $group: { _id: null, total: { $sum: '$revenue' } } },
    ]),
    Trip.aggregate([
      {
        $match: {
          ...notDeleted,
          status: { $in: FINANCIALLY_CLOSED_TRIP_STATUSES },
          completedAt: { $gte: monthStart },
        },
      },
      { $group: { _id: null, total: { $sum: '$expenses' } } },
    ]),
    Vehicle.countDocuments({
      ...notDeleted,
      status: VEHICLE_STATUS.ACTIVE,
      ignition: true,
    }),
  ]);

  const fuelStats = fuelThisMonth[0] || { totalQuantity: 0, totalCost: 0 };
  const revenue = revenueThisMonth[0]?.total || 0;
  const expenses = expensesThisMonth[0]?.total || 0;

  return {
    vehicles: {
      total: totalVehicles,
      active: activeVehicles,
      inMaintenance: vehiclesInMaintenance,
      live: liveVehicles,
    },
    drivers: {
      total: totalDrivers,
      active: activeDrivers,
    },
    trips: {
      today: tripsToday,
      inProgress: tripsInProgress,
      thisMonth: tripsThisMonth,
    },
    maintenance: {
      dueSoon: maintenanceDue,
      overdue: maintenanceOverdue,
    },
    fuel: {
      quantityThisMonth: Math.round(fuelStats.totalQuantity * 100) / 100,
      costThisMonth: Math.round(fuelStats.totalCost * 100) / 100,
    },
    financials: {
      revenueThisMonth: Math.round(revenue * 100) / 100,
      expensesThisMonth: Math.round(expenses * 100) / 100,
      profitThisMonth: Math.round((revenue - expenses) * 100) / 100,
    },
    alerts: {
      unread: unreadAlerts,
      critical: criticalAlerts,
    },
  };
};

export const getDashboardCharts = async () => {
  const sixMonthsAgo = monthsAgo(5);
  const notDeleted = { isDeleted: false };

  const [tripsByMonth, fuelByMonth, revenueExpensesByMonth, vehicleStatusBreakdown, tripStatusBreakdown] =
    await Promise.all([
      Trip.aggregate([
        {
          $match: {
            ...notDeleted,
            scheduledAt: { $gte: sixMonthsAgo },
          },
        },
        {
          $group: {
            _id: {
              year: { $year: '$scheduledAt' },
              month: { $month: '$scheduledAt' },
            },
            total: { $sum: 1 },
            completed: {
              $sum: {
                $cond: [{ $in: ['$status', FINANCIALLY_CLOSED_TRIP_STATUSES] }, 1, 0],
              },
            },
          },
        },
        { $sort: { '_id.year': 1, '_id.month': 1 } },
      ]),
      FuelLog.aggregate([
        { $match: { ...notDeleted, loggedAt: { $gte: sixMonthsAgo } } },
        {
          $group: {
            _id: {
              year: { $year: '$loggedAt' },
              month: { $month: '$loggedAt' },
            },
            quantity: { $sum: '$quantity' },
            cost: { $sum: '$cost' },
          },
        },
        { $sort: { '_id.year': 1, '_id.month': 1 } },
      ]),
      Trip.aggregate([
        {
          $match: {
            ...notDeleted,
            status: { $in: FINANCIALLY_CLOSED_TRIP_STATUSES },
            completedAt: { $gte: sixMonthsAgo },
          },
        },
        {
          $group: {
            _id: {
              year: { $year: '$completedAt' },
              month: { $month: '$completedAt' },
            },
            revenue: { $sum: '$revenue' },
            expenses: { $sum: '$expenses' },
          },
        },
        { $sort: { '_id.year': 1, '_id.month': 1 } },
      ]),
      Vehicle.aggregate([
        { $match: notDeleted },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
      Trip.aggregate([
        { $match: { ...notDeleted, scheduledAt: { $gte: sixMonthsAgo } } },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
    ]);

  const tripsTrend = [];
  const tripsCompletedTrend = [];
  for (let i = 5; i >= 0; i -= 1) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const label = monthLabel(d);
    const found = tripsByMonth.find(
      (t) => t._id.year === d.getFullYear() && t._id.month === d.getMonth() + 1
    );
    tripsTrend.push({ month: label, total: found?.total || 0, completed: found?.completed || 0 });
  }

  const fuelTrend = [];
  for (let i = 5; i >= 0; i -= 1) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const label = monthLabel(d);
    const found = fuelByMonth.find(
      (f) => f._id.year === d.getFullYear() && f._id.month === d.getMonth() + 1
    );
    fuelTrend.push({
      month: label,
      quantity: Math.round((found?.quantity || 0) * 100) / 100,
      cost: Math.round((found?.cost || 0) * 100) / 100,
    });
  }

  const financialTrend = [];
  for (let i = 5; i >= 0; i -= 1) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const label = monthLabel(d);
    const found = revenueExpensesByMonth.find(
      (r) => r._id.year === d.getFullYear() && r._id.month === d.getMonth() + 1
    );
    financialTrend.push({
      month: label,
      revenue: Math.round((found?.revenue || 0) * 100) / 100,
      expenses: Math.round((found?.expenses || 0) * 100) / 100,
    });
  }

  return {
    tripsTrend,
    fuelTrend,
    financialTrend,
    vehicleStatusBreakdown: vehicleStatusBreakdown.map((v) => ({
      status: v._id,
      count: v.count,
    })),
    tripStatusBreakdown: tripStatusBreakdown.map((t) => ({
      status: t._id,
      count: t.count,
    })),
  };
};

export const getRecentActivities = async (limit = 10) => {
  const activities = await Activity.find()
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate('user', 'firstName lastName email')
    .lean();

  return activities.map((a) => ({
    id: a._id,
    type: a.type,
    title: a.title,
    description: a.description,
    entityType: a.entityType,
    entityId: a.entityId,
    user: a.user
      ? { id: a.user._id, name: `${a.user.firstName} ${a.user.lastName}` }
      : null,
    createdAt: a.createdAt,
  }));
};

export const getDashboardAlerts = async (limit = 8, user = null) => {
  if (user && isRestrictedAlertRole(user.role)) {
    const notifications = await Notification.find({ user: user._id })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    return notifications.map((n) => ({
      id: n._id,
      type: n.metadata?.alertType || n.type,
      severity: n.metadata?.severity || 'medium',
      title: n.title,
      message: n.message,
      isRead: n.isRead,
      vehicle: n.metadata?.vehicleNumber ? { number: n.metadata.vehicleNumber } : null,
      driver: null,
      createdAt: n.createdAt,
    }));
  }

  const alerts = await Alert.find()
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate('vehicle', 'vehicleNumber model')
    .populate('driver', 'firstName lastName')
    .lean();

  return alerts.map((a) => ({
    id: a._id,
    type: a.type,
    severity: a.severity,
    title: a.title,
    message: a.message,
    isRead: a.isRead,
    vehicle: a.vehicle
      ? { id: a.vehicle._id, number: a.vehicle.vehicleNumber, model: a.vehicle.model }
      : null,
    driver: a.driver
      ? { id: a.driver._id, name: `${a.driver.firstName} ${a.driver.lastName}` }
      : null,
    createdAt: a.createdAt,
  }));
};

export const getLiveVehicles = async () => {
  const vehicles = await Vehicle.find({
    isDeleted: false,
    status: VEHICLE_STATUS.ACTIVE,
  })
    .select('vehicleNumber model manufacturer fuelLevel speed ignition engineStatus currentLocation assignedDriver')
    .populate('assignedDriver', 'firstName lastName')
    .limit(20)
    .lean();

  return vehicles.map((v) => ({
    id: v._id,
    vehicleNumber: v.vehicleNumber,
    model: v.model,
    manufacturer: v.manufacturer,
    fuelLevel: v.fuelLevel,
    speed: v.speed,
    ignition: v.ignition,
    engineStatus: v.engineStatus,
    location: {
      lat: v.currentLocation?.coordinates?.[1] || 0,
      lng: v.currentLocation?.coordinates?.[0] || 0,
      address: v.currentLocation?.address || '',
    },
    driver: v.assignedDriver
      ? { id: v.assignedDriver._id, name: `${v.assignedDriver.firstName} ${v.assignedDriver.lastName}` }
      : null,
  }));
};

export default {
  getDashboardSummary,
  getDashboardCharts,
  getRecentActivities,
  getDashboardAlerts,
  getLiveVehicles,
};
