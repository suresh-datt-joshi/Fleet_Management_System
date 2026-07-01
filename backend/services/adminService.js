import User from '../models/User.js';
import FleetSettings from '../models/FleetSettings.js';
import Vehicle from '../models/Vehicle.js';
import Driver from '../models/Driver.js';
import Trip from '../models/Trip.js';
import AppError from '../utils/AppError.js';
import { getPagination, buildPaginationMeta } from '../utils/pagination.js';
import { USER_ROLES, ROLE_LABELS, ROLE_PERMISSIONS, PERMISSIONS } from '../constants/roles.js';
import { linkUserToDriverProfile } from '../utils/driverUserLink.js';
import { linkUserToMechanicProfile } from '../utils/mechanicUserLink.js';

const formatUser = (user) => {
  const u = user.toObject ? user.toObject() : user;
  return {
    id: u._id,
    firstName: u.firstName,
    lastName: u.lastName,
    fullName: u.fullName || `${u.firstName} ${u.lastName}`,
    email: u.email,
    phone: u.phone || '',
    role: u.role,
    roleLabel: ROLE_LABELS[u.role] || u.role,
    avatar: u.avatar,
    isEmailVerified: u.isEmailVerified,
    isActive: u.isActive,
    lastLogin: u.lastLogin,
    createdAt: u.createdAt,
    updatedAt: u.updatedAt,
  };
};

const formatSettings = (settings) => {
  const s = settings.toObject ? settings.toObject() : settings;
  return {
    id: s._id,
    companyName: s.companyName,
    companyEmail: s.companyEmail,
    companyPhone: s.companyPhone,
    companyAddress: s.companyAddress,
    companyLocation: {
      address: s.companyLocation?.address || '',
      lat: s.companyLocation?.lat ?? null,
      lng: s.companyLocation?.lng ?? null,
      placeId: s.companyLocation?.placeId || '',
    },
    timezone: s.timezone,
    currency: s.currency,
    dateFormat: s.dateFormat,
    fuelLowThreshold: s.fuelLowThreshold,
    maintenanceReminderDays: s.maintenanceReminderDays,
    documentReminderDays: s.documentReminderDays,
    speedLimitKmh: s.speedLimitKmh,
    gpsUpdateIntervalSeconds: s.gpsUpdateIntervalSeconds,
    alertsEnabled: s.alertsEnabled,
    notificationsEnabled: s.notificationsEnabled,
    autoSyncAlerts: s.autoSyncAlerts,
    updatedAt: s.updatedAt,
  };
};

const buildUserFilter = (query) => {
  const filter = { isDeleted: false };

  if (query.role) filter.role = query.role;
  if (query.isActive !== undefined) filter.isActive = query.isActive === 'true';

  if (query.search) {
    const regex = new RegExp(query.search, 'i');
    filter.$or = [{ firstName: regex }, { lastName: regex }, { email: regex }, { phone: regex }];
  }

  return filter;
};

const assertCanManageRole = (actor, targetRole) => {
  if (targetRole === USER_ROLES.SUPER_ADMIN && actor.role !== USER_ROLES.SUPER_ADMIN) {
    throw new AppError('Only super admins can assign the super admin role', 403);
  }
};

const assertNotLastSuperAdmin = async (userId, newRole = null) => {
  const user = await User.findOne({ _id: userId, isDeleted: false });
  if (!user || user.role !== USER_ROLES.SUPER_ADMIN) return;

  if (newRole && newRole !== USER_ROLES.SUPER_ADMIN) {
    const count = await User.countDocuments({
      isDeleted: false,
      role: USER_ROLES.SUPER_ADMIN,
      isActive: true,
    });
    if (count <= 1) {
      throw new AppError('Cannot change role of the last super admin', 400);
    }
  }
};

export const getAdminStats = async () => {
  const notDeleted = { isDeleted: false };

  const [totalUsers, activeUsers, inactiveUsers, byRole, totalVehicles, totalDrivers, totalTrips, recentLogins] =
    await Promise.all([
      User.countDocuments(notDeleted),
      User.countDocuments({ ...notDeleted, isActive: true }),
      User.countDocuments({ ...notDeleted, isActive: false }),
      User.aggregate([{ $match: notDeleted }, { $group: { _id: '$role', count: { $sum: 1 } } }]),
      Vehicle.countDocuments(notDeleted),
      Driver.countDocuments(notDeleted),
      Trip.countDocuments(notDeleted),
      User.find({ ...notDeleted, lastLogin: { $ne: null } })
        .sort({ lastLogin: -1 })
        .limit(5)
        .select('firstName lastName email role lastLogin')
        .lean(),
    ]);

  return {
    users: {
      total: totalUsers,
      active: activeUsers,
      inactive: inactiveUsers,
      byRole: byRole.map((r) => ({ role: r._id, label: ROLE_LABELS[r._id] || r._id, count: r.count })),
    },
    fleet: {
      vehicles: totalVehicles,
      drivers: totalDrivers,
      trips: totalTrips,
    },
    recentLogins: recentLogins.map((u) => ({
      id: u._id,
      name: `${u.firstName} ${u.lastName}`,
      email: u.email,
      role: u.role,
      lastLogin: u.lastLogin,
    })),
  };
};

export const getUsers = async (query) => {
  const { page, limit, skip, sort } = getPagination(query);
  const filter = buildUserFilter(query);

  const [users, total] = await Promise.all([
    User.find(filter).sort(sort).skip(skip).limit(limit).lean(),
    User.countDocuments(filter),
  ]);

  return {
    users: users.map(formatUser),
    pagination: buildPaginationMeta(total, page, limit),
  };
};

export const getUserById = async (id) => {
  const user = await User.findOne({ _id: id, isDeleted: false }).lean();
  if (!user) throw new AppError('User not found', 404);
  return formatUser(user);
};

export const createUser = async (data, actorId, actor) => {
  assertCanManageRole(actor, data.role || USER_ROLES.DISPATCHER);

  const existing = await User.findOne({ email: data.email.toLowerCase(), isDeleted: false });
  if (existing) throw new AppError('Email already in use', 400);

  const user = await User.create({
    firstName: data.firstName,
    lastName: data.lastName,
    email: data.email,
    password: data.password,
    phone: data.phone || '',
    role: data.role || USER_ROLES.DISPATCHER,
    isEmailVerified: true,
    isActive: data.isActive !== false,
    createdBy: actorId,
    updatedBy: actorId,
  });

  await linkUserToDriverProfile(user);
  await linkUserToMechanicProfile(user);

  return formatUser(user);
};

export const updateUser = async (id, data, actorId, actor) => {
  const user = await User.findOne({ _id: id, isDeleted: false });
  if (!user) throw new AppError('User not found', 404);

  if (data.role && data.role !== user.role) {
    assertCanManageRole(actor, data.role);
    await assertNotLastSuperAdmin(id, data.role);
  }

  if (id === actorId.toString() && data.isActive === false) {
    throw new AppError('You cannot deactivate your own account', 400);
  }

  if (data.email && data.email.toLowerCase() !== user.email) {
    const existing = await User.findOne({ email: data.email.toLowerCase(), isDeleted: false, _id: { $ne: id } });
    if (existing) throw new AppError('Email already in use', 400);
    user.email = data.email;
  }

  ['firstName', 'lastName', 'phone', 'role', 'isActive'].forEach((field) => {
    if (data[field] !== undefined) user[field] = data[field];
  });

  user.updatedBy = actorId;
  await user.save();

  await linkUserToDriverProfile(user);
  await linkUserToMechanicProfile(user);

  return formatUser(user);
};

export const deleteUser = async (id, actorId, actor) => {
  if (id === actorId.toString()) {
    throw new AppError('You cannot delete your own account', 400);
  }

  const user = await User.findOne({ _id: id, isDeleted: false });
  if (!user) throw new AppError('User not found', 404);

  if (user.role === USER_ROLES.SUPER_ADMIN) {
    const count = await User.countDocuments({
      isDeleted: false,
      role: USER_ROLES.SUPER_ADMIN,
      isActive: true,
    });
    if (count <= 1) {
      throw new AppError('Cannot delete the last super admin', 400);
    }
  }

  if (user.role === USER_ROLES.SUPER_ADMIN && actor.role !== USER_ROLES.SUPER_ADMIN) {
    throw new AppError('Only super admins can delete super admin accounts', 403);
  }

  user.isDeleted = true;
  user.deletedAt = new Date();
  user.isActive = false;
  user.updatedBy = actorId;
  await user.save();

  return { message: 'User deleted successfully' };
};

export const resetUserPassword = async (id, newPassword, actorId, actor) => {
  const user = await User.findOne({ _id: id, isDeleted: false }).select('+password');
  if (!user) throw new AppError('User not found', 404);

  if (user.role === USER_ROLES.SUPER_ADMIN && actor.role !== USER_ROLES.SUPER_ADMIN && id !== actorId.toString()) {
    throw new AppError('Only super admins can reset super admin passwords', 403);
  }

  user.password = newPassword;
  user.updatedBy = actorId;
  await user.save();

  return { message: 'Password reset successfully' };
};

export const getRoles = async () =>
  Object.values(USER_ROLES).map((role) => ({
    role,
    label: ROLE_LABELS[role],
    permissions: ROLE_PERMISSIONS[role] || [],
    permissionCount: (ROLE_PERMISSIONS[role] || []).length,
  }));

export const getPermissions = async () =>
  Object.entries(PERMISSIONS).map(([key, value]) => ({
    key,
    value,
  }));

export const getSettings = async () => {
  const settings = await FleetSettings.getSingleton();
  return formatSettings(settings);
};

export const updateSettings = async (data, userId) => {
  const settings = await FleetSettings.getSingleton();

  const allowed = [
    'companyName',
    'companyEmail',
    'companyPhone',
    'companyAddress',
    'timezone',
    'currency',
    'dateFormat',
    'fuelLowThreshold',
    'maintenanceReminderDays',
    'documentReminderDays',
    'speedLimitKmh',
    'gpsUpdateIntervalSeconds',
    'alertsEnabled',
    'notificationsEnabled',
    'autoSyncAlerts',
  ];

  allowed.forEach((field) => {
    if (data[field] !== undefined) settings[field] = data[field];
  });

  if (data.companyLocation !== undefined) {
    settings.companyLocation = {
      address: data.companyLocation.address ?? settings.companyLocation?.address ?? '',
      lat: data.companyLocation.lat ?? null,
      lng: data.companyLocation.lng ?? null,
      placeId: data.companyLocation.placeId ?? settings.companyLocation?.placeId ?? '',
    };
  }

  settings.updatedBy = userId;
  await settings.save();

  return formatSettings(settings);
};

export default {
  getAdminStats,
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  resetUserPassword,
  getRoles,
  getPermissions,
  getSettings,
  updateSettings,
};
