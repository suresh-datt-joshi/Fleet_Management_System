import User from '../models/User.js';
import Vehicle from '../models/Vehicle.js';
import MaintenanceRecord from '../models/MaintenanceRecord.js';
import Notification from '../models/Notification.js';
import Trip from '../models/Trip.js';
import { USER_ROLES, ROLE_PERMISSIONS, PERMISSIONS } from '../constants/roles.js';
import { getDriverIdForUser, getUserIdForDriver } from './driverUserLink.js';

export const MANAGEMENT_ROLES = [USER_ROLES.SUPER_ADMIN, USER_ROLES.FLEET_MANAGER, USER_ROLES.DISPATCHER];

export const isRestrictedAlertRole = (role) =>
  role === USER_ROLES.DRIVER || role === USER_ROLES.MECHANIC;

export const hasFleetAlertAccess = (role) => !isRestrictedAlertRole(role);

export const getManagementUserIds = async () => {
  const users = await User.find({
    isDeleted: false,
    isActive: true,
    role: { $in: MANAGEMENT_ROLES },
  })
    .select('_id role')
    .lean();

  return users
    .filter((user) => (ROLE_PERMISSIONS[user.role] || []).includes(PERMISSIONS.VIEW_ALERTS))
    .map((user) => user._id);
};

export const getMechanicIdsFromRecord = (record) => {
  const ids = new Set();
  (record.assignedMechanics || []).forEach((id) => ids.add(id.toString()));
  if (record.assignedMechanic) ids.add(record.assignedMechanic.toString());
  return [...ids];
};

export const resolveAlertRecipients = async (alertData) => {
  const recipientSet = new Set();
  const managementIds = await getManagementUserIds();
  managementIds.forEach((id) => recipientSet.add(id.toString()));

  const metadata = alertData.metadata || {};

  if (metadata.maintenanceId) {
    const record = await MaintenanceRecord.findById(metadata.maintenanceId)
      .select('assignedMechanic assignedMechanics')
      .lean();
    if (record) {
      getMechanicIdsFromRecord(record).forEach((id) => recipientSet.add(id));
    }
  }

  if (metadata.mechanicIds?.length) {
    metadata.mechanicIds.forEach((id) => recipientSet.add(id.toString()));
  }

  if (alertData.driver) {
    const driverUserId = await getUserIdForDriver(alertData.driver);
    if (driverUserId) recipientSet.add(driverUserId.toString());
  }

  if (alertData.vehicle) {
    const vehicle = await Vehicle.findById(alertData.vehicle).select('assignedDriver').lean();
    if (vehicle?.assignedDriver) {
      const driverUserId = await getUserIdForDriver(vehicle.assignedDriver);
      if (driverUserId) recipientSet.add(driverUserId.toString());
    }
  }

  return [...recipientSet];
};

export const getAlertIdsForUser = async (userId) => {
  const notifications = await Notification.find({ user: userId, alert: { $ne: null } })
    .select('alert')
    .lean();
  return [...new Set(notifications.map((n) => n.alert.toString()))];
};

export const getDriverContext = async (userId) => {
  const driverId = await getDriverIdForUser(userId);
  if (!driverId) return { driverId: null, vehicleIds: [], tripIds: [] };

  const [vehicles, trips] = await Promise.all([
    Vehicle.find({ assignedDriver: driverId, isDeleted: false }).select('_id').lean(),
    Trip.find({ driver: driverId, isDeleted: false }).select('_id').lean(),
  ]);

  return {
    driverId,
    vehicleIds: vehicles.map((v) => v._id),
    tripIds: trips.map((t) => t._id),
  };
};

export const getMechanicAssignedMaintenanceIds = async (userId) => {
  const records = await MaintenanceRecord.find({
    isDeleted: false,
    $or: [{ assignedMechanics: userId }, { assignedMechanic: userId }],
  })
    .select('_id')
    .lean();
  return records.map((r) => r._id);
};

export default {
  MANAGEMENT_ROLES,
  isRestrictedAlertRole,
  hasFleetAlertAccess,
  getManagementUserIds,
  getMechanicIdsFromRecord,
  resolveAlertRecipients,
  getAlertIdsForUser,
  getDriverContext,
  getMechanicAssignedMaintenanceIds,
};
