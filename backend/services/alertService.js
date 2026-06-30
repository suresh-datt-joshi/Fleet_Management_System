import Alert from '../models/Alert.js';
import Notification from '../models/Notification.js';
import Vehicle from '../models/Vehicle.js';
import Driver from '../models/Driver.js';
import MaintenanceRecord from '../models/MaintenanceRecord.js';
import FleetDocument from '../models/FleetDocument.js';
import User from '../models/User.js';
import Activity from '../models/Activity.js';
import AppError from '../utils/AppError.js';
import { getPagination, buildPaginationMeta } from '../utils/pagination.js';
import { objectsToCSV } from '../utils/csvExport.js';
import {
  ALERT_TYPES,
  ALERT_SEVERITY,
  NOTIFICATION_TYPES,
  MAINTENANCE_STATUS,
  DOCUMENT_STATUS,
  VEHICLE_STATUS,
  ACTIVITY_TYPES,
} from '../constants/enums.js';
import { PERMISSIONS, ROLE_PERMISSIONS } from '../constants/roles.js';
import * as socketService from './socketService.js';

const vehiclePopulate = { path: 'vehicle', select: 'vehicleNumber model manufacturer status fuelLevel' };
const driverPopulate = { path: 'driver', select: 'firstName lastName email phone' };

const DEDUP_WINDOW_MS = 5 * 60 * 1000;

const formatAlert = (alert) => {
  const a = alert.toObject ? alert.toObject() : alert;
  return {
    id: a._id,
    type: a.type,
    severity: a.severity,
    title: a.title,
    message: a.message,
    isRead: a.isRead,
    vehicle: a.vehicle
      ? {
          id: a.vehicle._id || a.vehicle,
          vehicleNumber: a.vehicle.vehicleNumber,
          model: a.vehicle.model,
          manufacturer: a.vehicle.manufacturer,
        }
      : null,
    driver: a.driver
      ? {
          id: a.driver._id || a.driver,
          name: a.driver.firstName ? `${a.driver.firstName} ${a.driver.lastName}` : undefined,
          email: a.driver.email,
        }
      : null,
    metadata: a.metadata || {},
    createdAt: a.createdAt,
    updatedAt: a.updatedAt,
  };
};

const formatNotification = (notification) => {
  const n = notification.toObject ? notification.toObject() : notification;
  return {
    id: n._id,
    type: n.type,
    title: n.title,
    message: n.message,
    isRead: n.isRead,
    readAt: n.readAt,
    alertId: n.alert?._id || n.alert || null,
    entityType: n.entityType,
    entityId: n.entityId,
    metadata: n.metadata || {},
    createdAt: n.createdAt,
  };
};

const buildFilter = (query) => {
  const filter = {};

  if (query.type) filter.type = query.type;
  if (query.severity) filter.severity = query.severity;
  if (query.isRead !== undefined) filter.isRead = query.isRead === 'true';
  if (query.vehicleId) filter.vehicle = query.vehicleId;
  if (query.driverId) filter.driver = query.driverId;

  if (query.from) filter.createdAt = { ...filter.createdAt, $gte: new Date(query.from) };
  if (query.to) filter.createdAt = { ...filter.createdAt, $lte: new Date(query.to) };

  if (query.unread === 'true') filter.isRead = false;

  if (query.search) {
    const regex = new RegExp(query.search, 'i');
    filter.$or = [{ title: regex }, { message: regex }];
  }

  return filter;
};

const logActivity = async (title, description, userId, entityId) => {
  await Activity.create({
    type: ACTIVITY_TYPES.ALERT_TRIGGERED,
    title,
    description,
    entityType: 'alert',
    entityId,
    user: userId,
  });
};

export const fanOutNotification = async (alert, notificationType = NOTIFICATION_TYPES.ALERT) => {
  const users = await User.find({
    isDeleted: false,
    isActive: true,
  }).lean();

  const eligible = users
    .filter((user) => (ROLE_PERMISSIONS[user.role] || []).includes(PERMISSIONS.VIEW_ALERTS))
    .map((user) => user._id);

  if (eligible.length === 0) return;

  const fiveMinAgo = new Date(Date.now() - DEDUP_WINDOW_MS);
  const existing = await Notification.findOne({
    alert: alert._id,
    createdAt: { $gte: fiveMinAgo },
  });
  if (existing) return;

  await Notification.insertMany(
    eligible.map((userId) => ({
      user: userId,
      type: notificationType,
      title: alert.title,
      message: alert.message,
      alert: alert._id,
      entityType: 'alert',
      entityId: alert._id,
      metadata: { alertType: alert.type, severity: alert.severity },
    }))
  );

  const notifications = await Notification.find({ alert: alert._id, user: { $in: eligible } }).lean();
  for (const notification of notifications) {
    socketService.emitNotificationNew(notification.user, formatNotification(notification));
  }
};

const createAlertRecord = async (data, userId = null, fanOut = true) => {
  const fiveMinAgo = new Date(Date.now() - DEDUP_WINDOW_MS);
  const dedupFilter = {
    type: data.type,
    createdAt: { $gte: fiveMinAgo },
  };

  if (data.vehicle) dedupFilter.vehicle = data.vehicle;
  if (data.metadata?.documentId) dedupFilter['metadata.documentId'] = data.metadata.documentId;
  if (data.metadata?.maintenanceId) dedupFilter['metadata.maintenanceId'] = data.metadata.maintenanceId;

  const recent = await Alert.findOne(dedupFilter);
  if (recent) return formatAlert(recent);

  const alert = await Alert.create({
    type: data.type,
    severity: data.severity || ALERT_SEVERITY.MEDIUM,
    title: data.title,
    message: data.message,
    vehicle: data.vehicle || null,
    driver: data.driver || null,
    metadata: data.metadata || {},
    isRead: false,
  });

  if (userId) {
    await logActivity(data.title, data.message, userId, alert._id);
  }

  if (fanOut) {
    await fanOutNotification(alert);
  }

  const populated = await Alert.findById(alert._id).populate(vehiclePopulate).populate(driverPopulate).lean();
  const formatted = formatAlert(populated);
  socketService.emitAlertCreated(formatted);
  return formatted;
};

export const getAlerts = async (query) => {
  const { page, limit, skip, sort } = getPagination(query);
  const filter = buildFilter(query);

  const [alerts, total] = await Promise.all([
    Alert.find(filter).populate(vehiclePopulate).populate(driverPopulate).sort(sort).skip(skip).limit(limit).lean(),
    Alert.countDocuments(filter),
  ]);

  return {
    alerts: alerts.map(formatAlert),
    pagination: buildPaginationMeta(total, page, limit),
  };
};

export const getAlertById = async (id) => {
  const alert = await Alert.findById(id).populate(vehiclePopulate).populate(driverPopulate).lean();
  if (!alert) throw new AppError('Alert not found', 404);
  return formatAlert(alert);
};

export const getAlertStats = async () => {
  const [total, unread, critical, high, byType] = await Promise.all([
    Alert.countDocuments(),
    Alert.countDocuments({ isRead: false }),
    Alert.countDocuments({ severity: ALERT_SEVERITY.CRITICAL, isRead: false }),
    Alert.countDocuments({ severity: ALERT_SEVERITY.HIGH, isRead: false }),
    Alert.aggregate([{ $group: { _id: '$type', count: { $sum: 1 }, unread: { $sum: { $cond: [{ $eq: ['$isRead', false] }, 1, 0] } } } }]),
  ]);

  return {
    total,
    unread,
    critical,
    high,
    byType: byType.map((t) => ({ type: t._id, count: t.count, unread: t.unread })),
  };
};

export const getAlertAnalytics = async (query = {}) => {
  const days = parseInt(query.days, 10) || 30;
  const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const [byDay, bySeverity, byType] = await Promise.all([
    Alert.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]),
    Alert.aggregate([{ $match: { createdAt: { $gte: startDate } } }, { $group: { _id: '$severity', count: { $sum: 1 } } }]),
    Alert.aggregate([{ $match: { createdAt: { $gte: startDate } } }, { $group: { _id: '$type', count: { $sum: 1 } } }]),
  ]);

  return {
    dailyTrend: byDay.map((d) => ({ date: d._id, count: d.count })),
    bySeverity: bySeverity.map((s) => ({ severity: s._id, count: s.count })),
    byType: byType.map((t) => ({ type: t._id, count: t.count })),
  };
};

export const createAlert = async (data, userId) =>
  createAlertRecord(
    {
      type: data.type,
      severity: data.severity,
      title: data.title,
      message: data.message,
      vehicle: data.vehicleId || null,
      driver: data.driverId || null,
      metadata: data.metadata || {},
    },
    userId,
    true
  );

export const updateAlert = async (id, data) => {
  const alert = await Alert.findById(id);
  if (!alert) throw new AppError('Alert not found', 404);

  if (data.severity) alert.severity = data.severity;
  if (data.title) alert.title = data.title;
  if (data.message) alert.message = data.message;
  if (data.isRead !== undefined) alert.isRead = data.isRead;

  await alert.save();

  const populated = await Alert.findById(alert._id).populate(vehiclePopulate).populate(driverPopulate).lean();
  const formatted = formatAlert(populated);
  socketService.emitAlertUpdated(formatted);
  return formatted;
};

export const markAlertAsRead = async (id) => {
  const alert = await Alert.findById(id);
  if (!alert) throw new AppError('Alert not found', 404);
  alert.isRead = true;
  await alert.save();

  await Notification.updateMany({ alert: id, isRead: false }, { isRead: true, readAt: new Date() });

  const populated = await Alert.findById(alert._id).populate(vehiclePopulate).populate(driverPopulate).lean();
  const formatted = formatAlert(populated);
  socketService.emitAlertUpdated(formatted);
  return formatted;
};

export const markAllAlertsAsRead = async () => {
  const result = await Alert.updateMany({ isRead: false }, { isRead: true });
  await Notification.updateMany({ isRead: false }, { isRead: true, readAt: new Date() });
  socketService.emitAlertsAllRead({ modifiedCount: result.modifiedCount });
  return { modifiedCount: result.modifiedCount };
};

export const deleteAlert = async (id) => {
  const alert = await Alert.findById(id);
  if (!alert) throw new AppError('Alert not found', 404);
  await Notification.deleteMany({ alert: id });
  await Alert.findByIdAndDelete(id);
  socketService.emitAlertDeleted(id);
  return { message: 'Alert deleted successfully' };
};

export const bulkDeleteAlerts = async (ids) => {
  await Notification.deleteMany({ alert: { $in: ids } });
  const result = await Alert.deleteMany({ _id: { $in: ids } });
  return { deletedCount: result.deletedCount };
};

export const syncAlerts = async (userId = null) => {
  const created = [];
  const now = new Date();
  const thirtyDays = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  const lowFuelVehicles = await Vehicle.find({
    isDeleted: false,
    status: VEHICLE_STATUS.ACTIVE,
    fuelLevel: { $lte: 20 },
  }).lean();

  for (const vehicle of lowFuelVehicles) {
    const alert = await createAlertRecord(
      {
        type: ALERT_TYPES.LOW_FUEL,
        severity: vehicle.fuelLevel <= 10 ? ALERT_SEVERITY.CRITICAL : ALERT_SEVERITY.HIGH,
        title: 'Low Fuel Alert',
        message: `Vehicle ${vehicle.vehicleNumber} fuel level at ${vehicle.fuelLevel}%`,
        vehicle: vehicle._id,
        driver: vehicle.assignedDriver || null,
      },
      userId,
      true
    );
    created.push(alert);
  }

  const overdueMaintenance = await MaintenanceRecord.find({
    isDeleted: false,
    status: { $in: [MAINTENANCE_STATUS.SCHEDULED, MAINTENANCE_STATUS.OVERDUE] },
    scheduledDate: { $lt: now },
  })
    .populate('vehicle', 'vehicleNumber assignedDriver')
    .lean();

  for (const record of overdueMaintenance) {
    const alert = await createAlertRecord(
      {
        type: ALERT_TYPES.MAINTENANCE_DUE,
        severity: ALERT_SEVERITY.HIGH,
        title: 'Maintenance Overdue',
        message: `${record.title} (${record.workOrderNumber}) is overdue for ${record.vehicle?.vehicleNumber || 'vehicle'}`,
        vehicle: record.vehicle?._id || null,
        driver: record.vehicle?.assignedDriver || null,
        metadata: { maintenanceId: record._id, workOrderNumber: record.workOrderNumber },
      },
      userId,
      true
    );
    created.push(alert);
  }

  const expiringDocs = await FleetDocument.find({
    isDeleted: false,
    expiryDate: { $ne: null, $lte: thirtyDays },
    status: { $in: [DOCUMENT_STATUS.EXPIRING_SOON, DOCUMENT_STATUS.EXPIRED] },
  }).lean();

  for (const doc of expiringDocs) {
    const isExpired = doc.status === DOCUMENT_STATUS.EXPIRED;
    const alert = await createAlertRecord(
      {
        type: ALERT_TYPES.DOCUMENT_EXPIRY,
        severity: isExpired ? ALERT_SEVERITY.HIGH : ALERT_SEVERITY.MEDIUM,
        title: isExpired ? 'Document Expired' : 'Document Expiring Soon',
        message: `${doc.title} (${doc.documentNumber}) ${isExpired ? 'has expired' : 'is expiring soon'}`,
        vehicle: doc.vehicle || null,
        driver: doc.driver || null,
        metadata: { documentId: doc._id, documentNumber: doc.documentNumber },
      },
      userId,
      true
    );
    created.push(alert);
  }

  const vehiclesWithExpiry = await Vehicle.find({
    isDeleted: false,
    status: VEHICLE_STATUS.ACTIVE,
    $or: [
      { 'documentExpiry.insurance': { $ne: null, $lte: thirtyDays } },
      { 'documentExpiry.registration': { $ne: null, $lte: thirtyDays } },
    ],
  }).lean();

  for (const vehicle of vehiclesWithExpiry) {
    const docTypes = [
      { key: 'insurance', label: 'Insurance' },
      { key: 'registration', label: 'Registration' },
    ];

    for (const { key, label } of docTypes) {
      const expiry = vehicle.documentExpiry?.[key];
      if (!expiry || expiry > thirtyDays) continue;

      const isExpired = expiry < now;
      const alert = await createAlertRecord(
        {
          type: ALERT_TYPES.INSURANCE_EXPIRY,
          severity: isExpired ? ALERT_SEVERITY.CRITICAL : ALERT_SEVERITY.HIGH,
          title: `${label} ${isExpired ? 'Expired' : 'Expiring Soon'}`,
          message: `${label} for ${vehicle.vehicleNumber} ${isExpired ? 'has expired' : `expires on ${expiry.toISOString().split('T')[0]}`}`,
          vehicle: vehicle._id,
          driver: vehicle.assignedDriver || null,
          metadata: { documentType: key, expiryDate: expiry },
        },
        userId,
        true
      );
      created.push(alert);
    }
  }

  const uniqueCreated = created.filter((a, i, arr) => arr.findIndex((x) => x.id === a.id) === i);

  return {
    synced: uniqueCreated.length,
    alerts: uniqueCreated,
  };
};

export const exportAlertsCSV = async (query) => {
  const filter = buildFilter(query);
  const alerts = await Alert.find(filter)
    .populate(vehiclePopulate)
    .populate(driverPopulate)
    .sort({ createdAt: -1 })
    .limit(5000)
    .lean();

  const columns = [
    { header: 'Type', accessor: 'type' },
    { header: 'Severity', accessor: 'severity' },
    { header: 'Title', accessor: 'title' },
    { header: 'Message', accessor: 'message' },
    { header: 'Vehicle', accessor: (a) => a.vehicle?.vehicleNumber || '' },
    { header: 'Driver', accessor: (a) => (a.driver ? `${a.driver.firstName} ${a.driver.lastName}` : '') },
    { header: 'Read', accessor: (a) => (a.isRead ? 'Yes' : 'No') },
    { header: 'Created', accessor: (a) => new Date(a.createdAt).toISOString() },
  ];

  return objectsToCSV(alerts, columns);
};

export const getNotifications = async (userId, query) => {
  const { page, limit, skip, sort } = getPagination(query);
  const filter = { user: userId };

  if (query.isRead !== undefined) filter.isRead = query.isRead === 'true';
  if (query.type) filter.type = query.type;
  if (query.unread === 'true') filter.isRead = false;

  const [notifications, total, unreadCount] = await Promise.all([
    Notification.find(filter).sort(sort).skip(skip).limit(limit).lean(),
    Notification.countDocuments(filter),
    Notification.countDocuments({ user: userId, isRead: false }),
  ]);

  return {
    notifications: notifications.map(formatNotification),
    unreadCount,
    pagination: buildPaginationMeta(total, page, limit),
  };
};

export const getNotificationStats = async (userId) => {
  const [total, unread, byType] = await Promise.all([
    Notification.countDocuments({ user: userId }),
    Notification.countDocuments({ user: userId, isRead: false }),
    Notification.aggregate([
      { $match: { user: userId } },
      { $group: { _id: '$type', count: { $sum: 1 }, unread: { $sum: { $cond: [{ $eq: ['$isRead', false] }, 1, 0] } } } },
    ]),
  ]);

  return {
    total,
    unread,
    byType: byType.map((t) => ({ type: t._id, count: t.count, unread: t.unread })),
  };
};

export const markNotificationAsRead = async (userId, id) => {
  const notification = await Notification.findOne({ _id: id, user: userId });
  if (!notification) throw new AppError('Notification not found', 404);

  notification.isRead = true;
  notification.readAt = new Date();
  await notification.save();

  const formatted = formatNotification(notification);
  socketService.emitNotificationRead(userId, formatted);
  return formatted;
};

export const markAllNotificationsAsRead = async (userId) => {
  const result = await Notification.updateMany({ user: userId, isRead: false }, { isRead: true, readAt: new Date() });
  socketService.emitNotificationsAllRead(userId, { modifiedCount: result.modifiedCount });
  return { modifiedCount: result.modifiedCount };
};

export const deleteNotification = async (userId, id) => {
  const notification = await Notification.findOneAndDelete({ _id: id, user: userId });
  if (!notification) throw new AppError('Notification not found', 404);
  return { message: 'Notification deleted successfully' };
};

export const getMetaVehicles = async () => {
  const vehicles = await Vehicle.find({ isDeleted: false })
    .select('vehicleNumber model')
    .sort({ vehicleNumber: 1 })
    .lean();
  return vehicles.map((v) => ({ id: v._id, vehicleNumber: v.vehicleNumber, model: v.model }));
};

export const getMetaDrivers = async () => {
  const drivers = await Driver.find({ isDeleted: false })
    .select('firstName lastName email')
    .sort({ firstName: 1 })
    .lean();
  return drivers.map((d) => ({ id: d._id, name: `${d.firstName} ${d.lastName}`, email: d.email }));
};

export default {
  getAlerts,
  getAlertById,
  getAlertStats,
  getAlertAnalytics,
  createAlert,
  updateAlert,
  markAlertAsRead,
  markAllAlertsAsRead,
  deleteAlert,
  bulkDeleteAlerts,
  syncAlerts,
  exportAlertsCSV,
  getNotifications,
  getNotificationStats,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  getMetaVehicles,
  getMetaDrivers,
};
