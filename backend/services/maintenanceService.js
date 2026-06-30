import MaintenanceRecord from '../models/MaintenanceRecord.js';
import MaintenanceHistory from '../models/MaintenanceHistory.js';
import Vehicle from '../models/Vehicle.js';
import User from '../models/User.js';
import Activity from '../models/Activity.js';
import Alert from '../models/Alert.js';
import AppError from '../utils/AppError.js';
import { getPagination, buildPaginationMeta } from '../utils/pagination.js';
import { objectsToCSV } from '../utils/csvExport.js';
import {
  MAINTENANCE_STATUS,
  MAINTENANCE_TYPE,
  VEHICLE_STATUS,
  ACTIVITY_TYPES,
  MAINTENANCE_HISTORY_ACTIONS,
  ALERT_TYPES,
  ALERT_SEVERITY,
} from '../constants/enums.js';
import { USER_ROLES } from '../constants/roles.js';

const vehiclePopulate = { path: 'vehicle', select: 'vehicleNumber model manufacturer status odometer' };
const mechanicPopulate = { path: 'assignedMechanic', select: 'firstName lastName email role' };

const calculateTotalCost = (laborCost, parts = []) => {
  const partsCost = parts.reduce((sum, p) => sum + (p.cost || 0) * (p.quantity || 1), 0);
  return Math.round((laborCost + partsCost) * 100) / 100;
};

const formatMaintenance = (record) => {
  const r = record.toObject ? record.toObject() : record;
  const partsCost = (r.parts || []).reduce((sum, p) => sum + (p.cost || 0) * (p.quantity || 1), 0);

  return {
    id: r._id,
    workOrderNumber: r.workOrderNumber,
    vehicle: r.vehicle
      ? {
          id: r.vehicle._id || r.vehicle,
          vehicleNumber: r.vehicle.vehicleNumber,
          model: r.vehicle.model,
          manufacturer: r.vehicle.manufacturer,
          status: r.vehicle.status,
          odometer: r.vehicle.odometer,
        }
      : null,
    type: r.type,
    status: r.status,
    priority: r.priority,
    title: r.title,
    description: r.description,
    scheduledDate: r.scheduledDate,
    completedDate: r.completedDate,
    odometerAtService: r.odometerAtService,
    laborCost: r.laborCost,
    partsCost: Math.round(partsCost * 100) / 100,
    cost: r.cost,
    parts: (r.parts || []).map((p) => ({
      id: p._id,
      name: p.name,
      quantity: p.quantity,
      cost: p.cost,
    })),
    assignedMechanic: r.assignedMechanic
      ? {
          id: r.assignedMechanic._id || r.assignedMechanic,
          name: `${r.assignedMechanic.firstName} ${r.assignedMechanic.lastName}`,
          email: r.assignedMechanic.email,
        }
      : null,
    serviceProvider: r.serviceProvider,
    notes: r.notes,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
  };
};

const logHistory = async (maintenanceId, action, description, userId, changes = null) => {
  await MaintenanceHistory.create({
    maintenance: maintenanceId,
    action,
    description,
    performedBy: userId,
    changes,
  });
};

const logActivity = async (type, title, description, userId, entityId) => {
  await Activity.create({
    type,
    title,
    description,
    entityType: 'maintenance',
    entityId,
    user: userId,
  });
};

const generateWorkOrderNumber = async () => {
  const prefix = `WO-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}`;
  const count = await MaintenanceRecord.countDocuments({ workOrderNumber: new RegExp(`^${prefix}`) });
  return `${prefix}-${String(count + 1).padStart(4, '0')}`;
};

export const syncOverdueRecords = async () => {
  const now = new Date();
  await MaintenanceRecord.updateMany(
    {
      isDeleted: false,
      status: MAINTENANCE_STATUS.SCHEDULED,
      scheduledDate: { $lt: now },
    },
    { status: MAINTENANCE_STATUS.OVERDUE }
  );
};

const buildFilter = (query) => {
  const filter = { isDeleted: false };

  if (query.status) filter.status = query.status;
  if (query.type) filter.type = query.type;
  if (query.priority) filter.priority = query.priority;
  if (query.vehicleId) filter.vehicle = query.vehicleId;
  if (query.mechanicId) filter.assignedMechanic = query.mechanicId;

  if (query.from) filter.scheduledDate = { ...filter.scheduledDate, $gte: new Date(query.from) };
  if (query.to) filter.scheduledDate = { ...filter.scheduledDate, $lte: new Date(query.to) };

  if (query.upcoming === 'true') {
    filter.status = { $in: [MAINTENANCE_STATUS.SCHEDULED, MAINTENANCE_STATUS.OVERDUE] };
    filter.scheduledDate = { ...filter.scheduledDate, $gte: new Date() };
  }

  if (query.search) {
    const regex = new RegExp(query.search, 'i');
    filter.$or = [{ workOrderNumber: regex }, { title: regex }, { description: regex }];
  }

  return filter;
};

const normalizeParts = (parts = []) =>
  parts.map((p) => ({
    name: p.name,
    quantity: Number(p.quantity ?? 1),
    cost: Number(p.cost ?? 0),
  }));

const setVehicleMaintenanceStatus = async (vehicleId, inMaintenance) => {
  const vehicle = await Vehicle.findOne({ _id: vehicleId, isDeleted: false });
  if (!vehicle) return;

  if (inMaintenance) {
    if (vehicle.status === VEHICLE_STATUS.ACTIVE) {
      vehicle.status = VEHICLE_STATUS.MAINTENANCE;
      await vehicle.save();
    }
    return;
  }

  const activeWork = await MaintenanceRecord.countDocuments({
    vehicle: vehicleId,
    isDeleted: false,
    status: MAINTENANCE_STATUS.IN_PROGRESS,
  });

  if (activeWork === 0 && vehicle.status === VEHICLE_STATUS.MAINTENANCE) {
    vehicle.status = VEHICLE_STATUS.ACTIVE;
    await vehicle.save();
  }
};

export const getMaintenanceRecords = async (query) => {
  await syncOverdueRecords();

  const { page, limit, skip, sort } = getPagination(query);
  const filter = buildFilter(query);

  const [records, total] = await Promise.all([
    MaintenanceRecord.find(filter)
      .populate(vehiclePopulate)
      .populate(mechanicPopulate)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean(),
    MaintenanceRecord.countDocuments(filter),
  ]);

  return {
    records: records.map(formatMaintenance),
    pagination: buildPaginationMeta(total, page, limit),
  };
};

export const getMaintenanceById = async (id) => {
  await syncOverdueRecords();

  const record = await MaintenanceRecord.findOne({ _id: id, isDeleted: false })
    .populate(vehiclePopulate)
    .populate(mechanicPopulate)
    .lean();

  if (!record) throw new AppError('Work order not found', 404);
  return formatMaintenance(record);
};

export const getMaintenanceStats = async () => {
  await syncOverdueRecords();

  const notDeleted = { isDeleted: false };
  const now = new Date();
  const weekAhead = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  const [total, scheduled, inProgress, completed, overdue, upcomingWeek, costAgg] = await Promise.all([
    MaintenanceRecord.countDocuments(notDeleted),
    MaintenanceRecord.countDocuments({ ...notDeleted, status: MAINTENANCE_STATUS.SCHEDULED }),
    MaintenanceRecord.countDocuments({ ...notDeleted, status: MAINTENANCE_STATUS.IN_PROGRESS }),
    MaintenanceRecord.countDocuments({ ...notDeleted, status: MAINTENANCE_STATUS.COMPLETED }),
    MaintenanceRecord.countDocuments({ ...notDeleted, status: MAINTENANCE_STATUS.OVERDUE }),
    MaintenanceRecord.countDocuments({
      ...notDeleted,
      status: { $in: [MAINTENANCE_STATUS.SCHEDULED, MAINTENANCE_STATUS.OVERDUE] },
      scheduledDate: { $gte: now, $lte: weekAhead },
    }),
    MaintenanceRecord.aggregate([
      { $match: { ...notDeleted, status: MAINTENANCE_STATUS.COMPLETED } },
      { $group: { _id: null, totalCost: { $sum: '$cost' }, avgCost: { $avg: '$cost' } } },
    ]),
  ]);

  return {
    total,
    scheduled,
    inProgress,
    completed,
    overdue,
    upcomingWeek,
    totalCompletedCost: Math.round((costAgg[0]?.totalCost || 0) * 100) / 100,
    averageWorkOrderCost: Math.round((costAgg[0]?.avgCost || 0) * 100) / 100,
  };
};

export const getUpcomingMaintenance = async (query) => {
  await syncOverdueRecords();

  const days = parseInt(query.days, 10) || 14;
  const until = new Date(Date.now() + days * 24 * 60 * 60 * 1000);

  const records = await MaintenanceRecord.find({
    isDeleted: false,
    status: { $in: [MAINTENANCE_STATUS.SCHEDULED, MAINTENANCE_STATUS.OVERDUE] },
    scheduledDate: { $lte: until },
  })
    .populate(vehiclePopulate)
    .populate(mechanicPopulate)
    .sort({ scheduledDate: 1 })
    .limit(parseInt(query.limit, 10) || 20)
    .lean();

  return records.map(formatMaintenance);
};

export const getMaintenanceAnalytics = async (query = {}) => {
  const months = parseInt(query.months, 10) || 6;
  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - months + 1);
  startDate.setDate(1);
  startDate.setHours(0, 0, 0, 0);

  const notDeleted = { isDeleted: false, createdAt: { $gte: startDate } };

  const [byMonth, byType, byStatus] = await Promise.all([
    MaintenanceRecord.aggregate([
      { $match: notDeleted },
      {
        $group: {
          _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
          count: { $sum: 1 },
          cost: { $sum: '$cost' },
          completed: {
            $sum: { $cond: [{ $eq: ['$status', MAINTENANCE_STATUS.COMPLETED] }, 1, 0] },
          },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]),
    MaintenanceRecord.aggregate([
      { $match: notDeleted },
      { $group: { _id: '$type', count: { $sum: 1 }, cost: { $sum: '$cost' } } },
    ]),
    MaintenanceRecord.aggregate([
      { $match: { isDeleted: false } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]),
  ]);

  const monthLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const monthlyTrend = [];
  for (let i = 0; i < months; i += 1) {
    const d = new Date(startDate);
    d.setMonth(startDate.getMonth() + i);
    const year = d.getFullYear();
    const month = d.getMonth() + 1;
    const label = `${monthLabels[d.getMonth()]} ${String(year).slice(2)}`;
    const found = byMonth.find((m) => m._id.year === year && m._id.month === month);
    monthlyTrend.push({
      month: label,
      count: found?.count || 0,
      cost: Math.round((found?.cost || 0) * 100) / 100,
      completed: found?.completed || 0,
    });
  }

  return {
    monthlyTrend,
    byType: byType.map((t) => ({
      type: t._id,
      count: t.count,
      cost: Math.round(t.cost * 100) / 100,
    })),
    byStatus: byStatus.map((s) => ({ status: s._id, count: s.count })),
  };
};

export const createMaintenance = async (data, userId) => {
  const vehicle = await Vehicle.findOne({ _id: data.vehicleId, isDeleted: false });
  if (!vehicle) throw new AppError('Vehicle not found', 404);

  if (data.assignedMechanicId) {
    const mechanic = await User.findOne({
      _id: data.assignedMechanicId,
      role: USER_ROLES.MECHANIC,
      isDeleted: false,
      isActive: true,
    });
    if (!mechanic) throw new AppError('Mechanic not found', 404);
  }

  const parts = normalizeParts(data.parts);
  const laborCost = data.laborCost ?? 0;
  const workOrderNumber = data.workOrderNumber || (await generateWorkOrderNumber());

  const record = await MaintenanceRecord.create({
    workOrderNumber,
    vehicle: data.vehicleId,
    type: data.type || MAINTENANCE_TYPE.PREVENTIVE,
    status: MAINTENANCE_STATUS.SCHEDULED,
    priority: data.priority || 'medium',
    title: data.title,
    description: data.description || '',
    scheduledDate: new Date(data.scheduledDate),
    odometerAtService: data.odometerAtService ?? vehicle.odometer ?? 0,
    laborCost,
    parts,
    cost: calculateTotalCost(laborCost, parts),
    assignedMechanic: data.assignedMechanicId || null,
    serviceProvider: data.serviceProvider || '',
    notes: data.notes || '',
    createdBy: userId,
    updatedBy: userId,
  });

  await logHistory(
    record._id,
    MAINTENANCE_HISTORY_ACTIONS.CREATED,
    `Work order ${record.workOrderNumber} created`,
    userId
  );
  await logActivity(
    ACTIVITY_TYPES.MAINTENANCE_SCHEDULED,
    'Maintenance scheduled',
    `${record.workOrderNumber} — ${record.title} for ${vehicle.vehicleNumber}`,
    userId,
    record._id
  );

  const populated = await MaintenanceRecord.findById(record._id)
    .populate(vehiclePopulate)
    .populate(mechanicPopulate)
    .lean();

  return formatMaintenance(populated);
};

export const updateMaintenance = async (id, data, userId) => {
  const record = await MaintenanceRecord.findOne({ _id: id, isDeleted: false });
  if (!record) throw new AppError('Work order not found', 404);

  if (record.status === MAINTENANCE_STATUS.COMPLETED) {
    throw new AppError('Cannot update a completed work order', 400);
  }

  if (data.vehicleId && data.vehicleId !== record.vehicle.toString()) {
    const vehicle = await Vehicle.findOne({ _id: data.vehicleId, isDeleted: false });
    if (!vehicle) throw new AppError('Vehicle not found', 404);
    record.vehicle = data.vehicleId;
  }

  ['type', 'priority', 'title', 'description', 'serviceProvider', 'notes'].forEach((field) => {
    if (data[field] !== undefined) record[field] = data[field];
  });

  if (data.scheduledDate) record.scheduledDate = new Date(data.scheduledDate);
  if (data.odometerAtService !== undefined) record.odometerAtService = data.odometerAtService;
  if (data.laborCost !== undefined) record.laborCost = data.laborCost;
  if (data.parts) record.parts = normalizeParts(data.parts);

  record.cost = calculateTotalCost(record.laborCost, record.parts);
  record.updatedBy = userId;
  await record.save();

  await logHistory(record._id, MAINTENANCE_HISTORY_ACTIONS.UPDATED, `Work order ${record.workOrderNumber} updated`, userId);

  const populated = await MaintenanceRecord.findById(record._id)
    .populate(vehiclePopulate)
    .populate(mechanicPopulate)
    .lean();

  return formatMaintenance(populated);
};

export const deleteMaintenance = async (id, userId) => {
  const record = await MaintenanceRecord.findOne({ _id: id, isDeleted: false });
  if (!record) throw new AppError('Work order not found', 404);

  if ([MAINTENANCE_STATUS.IN_PROGRESS, MAINTENANCE_STATUS.COMPLETED].includes(record.status)) {
    throw new AppError('Cannot delete an active or completed work order', 400);
  }

  record.isDeleted = true;
  record.deletedAt = new Date();
  record.updatedBy = userId;
  await record.save();

  await logHistory(record._id, MAINTENANCE_HISTORY_ACTIONS.DELETED, `Work order ${record.workOrderNumber} deleted`, userId);

  return { message: 'Work order deleted successfully' };
};

export const assignMechanic = async (id, mechanicId, userId) => {
  const record = await MaintenanceRecord.findOne({ _id: id, isDeleted: false });
  if (!record) throw new AppError('Work order not found', 404);

  const mechanic = await User.findOne({
    _id: mechanicId,
    role: USER_ROLES.MECHANIC,
    isDeleted: false,
    isActive: true,
  });
  if (!mechanic) throw new AppError('Mechanic not found', 404);

  record.assignedMechanic = mechanicId;
  record.updatedBy = userId;
  await record.save();

  await logHistory(
    record._id,
    MAINTENANCE_HISTORY_ACTIONS.ASSIGNED,
    `Assigned to ${mechanic.firstName} ${mechanic.lastName}`,
    userId
  );

  const populated = await MaintenanceRecord.findById(record._id)
    .populate(vehiclePopulate)
    .populate(mechanicPopulate)
    .lean();

  return formatMaintenance(populated);
};

export const startMaintenance = async (id, userId) => {
  const record = await MaintenanceRecord.findOne({ _id: id, isDeleted: false });
  if (!record) throw new AppError('Work order not found', 404);

  if (![MAINTENANCE_STATUS.SCHEDULED, MAINTENANCE_STATUS.OVERDUE].includes(record.status)) {
    throw new AppError('Work order cannot be started in its current status', 400);
  }

  record.status = MAINTENANCE_STATUS.IN_PROGRESS;
  record.updatedBy = userId;
  await record.save();

  await setVehicleMaintenanceStatus(record.vehicle, true);

  await logHistory(record._id, MAINTENANCE_HISTORY_ACTIONS.STARTED, `Work order ${record.workOrderNumber} started`, userId);
  await logActivity(
    ACTIVITY_TYPES.MAINTENANCE_STARTED,
    'Maintenance started',
    `${record.workOrderNumber} — ${record.title}`,
    userId,
    record._id
  );

  const populated = await MaintenanceRecord.findById(record._id)
    .populate(vehiclePopulate)
    .populate(mechanicPopulate)
    .lean();

  return formatMaintenance(populated);
};

export const completeMaintenance = async (id, data, userId) => {
  const record = await MaintenanceRecord.findOne({ _id: id, isDeleted: false });
  if (!record) throw new AppError('Work order not found', 404);

  if (record.status !== MAINTENANCE_STATUS.IN_PROGRESS) {
    throw new AppError('Only in-progress work orders can be completed', 400);
  }

  if (data.laborCost !== undefined) record.laborCost = data.laborCost;
  if (data.parts) record.parts = normalizeParts(data.parts);
  if (data.odometerAtService !== undefined) record.odometerAtService = data.odometerAtService;
  if (data.notes !== undefined) record.notes = data.notes;
  if (data.completedDate) record.completedDate = new Date(data.completedDate);
  else record.completedDate = new Date();

  record.cost = calculateTotalCost(record.laborCost, record.parts);
  record.status = MAINTENANCE_STATUS.COMPLETED;
  record.updatedBy = userId;
  await record.save();

  if (record.odometerAtService) {
    const vehicle = await Vehicle.findById(record.vehicle);
    if (vehicle && record.odometerAtService > (vehicle.odometer || 0)) {
      vehicle.odometer = record.odometerAtService;
      await vehicle.save();
    }
  }

  await setVehicleMaintenanceStatus(record.vehicle, false);

  await logHistory(
    record._id,
    MAINTENANCE_HISTORY_ACTIONS.COMPLETED,
    `Work order ${record.workOrderNumber} completed — $${record.cost}`,
    userId
  );
  await logActivity(
    ACTIVITY_TYPES.MAINTENANCE_COMPLETED,
    'Maintenance completed',
    `${record.workOrderNumber} — $${record.cost}`,
    userId,
    record._id
  );

  const populated = await MaintenanceRecord.findById(record._id)
    .populate(vehiclePopulate)
    .populate(mechanicPopulate)
    .lean();

  return formatMaintenance(populated);
};

export const getMaintenanceHistory = async (id, query) => {
  const record = await MaintenanceRecord.findOne({ _id: id, isDeleted: false });
  if (!record) throw new AppError('Work order not found', 404);

  const { page, limit, skip, sort } = getPagination(query);

  const [history, total] = await Promise.all([
    MaintenanceHistory.find({ maintenance: id })
      .populate('performedBy', 'firstName lastName email')
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean(),
    MaintenanceHistory.countDocuments({ maintenance: id }),
  ]);

  return {
    history: history.map((h) => ({
      id: h._id,
      action: h.action,
      description: h.description,
      performedBy: h.performedBy
        ? { id: h.performedBy._id, name: `${h.performedBy.firstName} ${h.performedBy.lastName}` }
        : null,
      changes: h.changes,
      createdAt: h.createdAt,
    })),
    pagination: buildPaginationMeta(total, page, limit),
  };
};

export const getMetaVehicles = async () => {
  const vehicles = await Vehicle.find({
    isDeleted: false,
    status: { $in: [VEHICLE_STATUS.ACTIVE, VEHICLE_STATUS.MAINTENANCE] },
  })
    .select('vehicleNumber model manufacturer status odometer')
    .sort({ vehicleNumber: 1 })
    .lean();

  return vehicles.map((v) => ({
    id: v._id,
    vehicleNumber: v.vehicleNumber,
    model: v.model,
    manufacturer: v.manufacturer,
    status: v.status,
    odometer: v.odometer,
  }));
};

export const getMetaMechanics = async () => {
  const mechanics = await User.find({
    role: USER_ROLES.MECHANIC,
    isDeleted: false,
    isActive: true,
  })
    .select('firstName lastName email')
    .sort({ firstName: 1 })
    .lean();

  return mechanics.map((m) => ({
    id: m._id,
    name: `${m.firstName} ${m.lastName}`,
    email: m.email,
  }));
};

export const exportMaintenanceCSV = async (query) => {
  await syncOverdueRecords();
  const filter = buildFilter(query);
  const records = await MaintenanceRecord.find(filter)
    .populate(vehiclePopulate)
    .populate(mechanicPopulate)
    .sort({ scheduledDate: -1 })
    .limit(5000)
    .lean();

  const columns = [
    { header: 'Work Order', accessor: 'workOrderNumber' },
    { header: 'Vehicle', accessor: (r) => r.vehicle?.vehicleNumber || '' },
    { header: 'Title', accessor: 'title' },
    { header: 'Type', accessor: 'type' },
    { header: 'Status', accessor: 'status' },
    { header: 'Priority', accessor: 'priority' },
    { header: 'Scheduled', accessor: (r) => new Date(r.scheduledDate).toISOString().split('T')[0] },
    { header: 'Mechanic', accessor: (r) => (r.assignedMechanic ? `${r.assignedMechanic.firstName} ${r.assignedMechanic.lastName}` : '') },
    { header: 'Cost', accessor: 'cost' },
  ];

  return objectsToCSV(records, columns);
};

export default {
  getMaintenanceRecords,
  getMaintenanceById,
  getMaintenanceStats,
  getUpcomingMaintenance,
  getMaintenanceAnalytics,
  createMaintenance,
  updateMaintenance,
  deleteMaintenance,
  assignMechanic,
  startMaintenance,
  completeMaintenance,
  getMaintenanceHistory,
  getMetaVehicles,
  getMetaMechanics,
  exportMaintenanceCSV,
  syncOverdueRecords,
};
