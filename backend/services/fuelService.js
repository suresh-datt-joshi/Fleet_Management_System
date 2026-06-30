import FuelLog from '../models/FuelLog.js';
import FuelStation from '../models/FuelStation.js';
import Vehicle from '../models/Vehicle.js';
import Driver from '../models/Driver.js';
import Activity from '../models/Activity.js';
import AppError from '../utils/AppError.js';
import { getPagination, buildPaginationMeta } from '../utils/pagination.js';
import { objectsToCSV } from '../utils/csvExport.js';
import { ACTIVITY_TYPES } from '../constants/enums.js';

const vehiclePopulate = { path: 'vehicle', select: 'vehicleNumber model manufacturer fuelType odometer' };
const driverPopulate = { path: 'driver', select: 'firstName lastName employeeId' };
const stationPopulate = { path: 'station', select: 'name brand city address' };
const tripPopulate = { path: 'trip', select: 'tripNumber status completedAt' };

const formatFuelLog = (log) => {
  const l = log.toObject ? log.toObject() : log;
  return {
    id: l._id,
    vehicle: l.vehicle
      ? {
          id: l.vehicle._id || l.vehicle,
          vehicleNumber: l.vehicle.vehicleNumber,
          model: l.vehicle.model,
          manufacturer: l.vehicle.manufacturer,
          fuelType: l.vehicle.fuelType,
        }
      : null,
    driver: l.driver
      ? {
          id: l.driver._id || l.driver,
          name: l.driver.firstName ? `${l.driver.firstName} ${l.driver.lastName}` : null,
          employeeId: l.driver.employeeId,
        }
      : null,
    station: l.station
      ? {
          id: l.station._id || l.station,
          name: l.station.name,
          brand: l.station.brand,
          city: l.station.city,
        }
      : null,
    trip: l.trip
      ? {
          id: l.trip._id || l.trip,
          tripNumber: l.trip.tripNumber,
          status: l.trip.status,
          completedAt: l.trip.completedAt,
        }
      : null,
    quantity: l.quantity,
    cost: l.cost,
    pricePerUnit: l.pricePerUnit,
    odometer: l.odometer,
    mileage: l.mileage,
    fuelStation: l.fuelStation,
    fuelType: l.fuelType,
    receiptNumber: l.receiptNumber,
    isFullTank: l.isFullTank,
    notes: l.notes,
    loggedAt: l.loggedAt,
    createdAt: l.createdAt,
    updatedAt: l.updatedAt,
  };
};

export const calculateMileage = async (vehicleId, odometer, quantity, excludeLogId = null) => {
  if (!odometer || !quantity || quantity <= 0) return 0;

  const filter = {
    vehicle: vehicleId,
    isDeleted: false,
    odometer: { $lt: odometer, $gt: 0 },
    isFullTank: true,
  };
  if (excludeLogId) filter._id = { $ne: excludeLogId };

  const previousLog = await FuelLog.findOne(filter).sort({ odometer: -1 }).lean();
  if (!previousLog) return 0;

  const distanceKm = odometer - previousLog.odometer;
  if (distanceKm <= 0) return 0;

  return Math.round((distanceKm / quantity) * 100) / 100;
};

const resolveStationName = async (stationId, fallback = '') => {
  if (!stationId) return fallback;
  const station = await FuelStation.findOne({ _id: stationId, isDeleted: false }).lean();
  return station ? station.name : fallback;
};

const syncVehicleOdometer = async (vehicleId, odometer) => {
  if (!odometer) return;
  const vehicle = await Vehicle.findById(vehicleId);
  if (vehicle && odometer > (vehicle.odometer || 0)) {
    vehicle.odometer = odometer;
    await vehicle.save();
  }
};

const logActivity = async (vehicle, quantity, cost, userId, entityId) => {
  await Activity.create({
    type: ACTIVITY_TYPES.FUEL_LOGGED,
    title: 'Fuel logged',
    description: `${vehicle.vehicleNumber} — ${quantity}L for $${cost.toFixed(2)}`,
    entityType: 'fuel',
    entityId,
    user: userId,
  });
};

const buildLogFilter = (query) => {
  const filter = { isDeleted: false };

  if (query.vehicleId) filter.vehicle = query.vehicleId;
  if (query.driverId) filter.driver = query.driverId;
  if (query.stationId) filter.station = query.stationId;
  if (query.tripId) filter.trip = query.tripId;
  if (query.fuelType) filter.fuelType = query.fuelType;

  if (query.from) filter.loggedAt = { ...filter.loggedAt, $gte: new Date(query.from) };
  if (query.to) filter.loggedAt = { ...filter.loggedAt, $lte: new Date(query.to) };

  if (query.search) {
    const regex = new RegExp(query.search, 'i');
    filter.$or = [{ fuelStation: regex }, { receiptNumber: regex }, { notes: regex }];
  }

  return filter;
};

export const getFuelLogs = async (query) => {
  const { page, limit, skip, sort } = getPagination(query);
  const filter = buildLogFilter(query);

  const [logs, total] = await Promise.all([
    FuelLog.find(filter)
      .populate(vehiclePopulate)
      .populate(driverPopulate)
      .populate(stationPopulate)
      .populate(tripPopulate)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean(),
    FuelLog.countDocuments(filter),
  ]);

  return {
    logs: logs.map(formatFuelLog),
    pagination: buildPaginationMeta(total, page, limit),
  };
};

export const getFuelLogById = async (id) => {
  const log = await FuelLog.findOne({ _id: id, isDeleted: false })
    .populate(vehiclePopulate)
    .populate(driverPopulate)
    .populate(stationPopulate)
    .populate(tripPopulate)
    .lean();

  if (!log) throw new AppError('Fuel log not found', 404);
  return formatFuelLog(log);
};

export const createFuelLog = async (data, userId) => {
  const vehicle = await Vehicle.findOne({ _id: data.vehicleId, isDeleted: false });
  if (!vehicle) throw new AppError('Vehicle not found', 404);

  if (data.driverId) {
    const driver = await Driver.findOne({ _id: data.driverId, isDeleted: false });
    if (!driver) throw new AppError('Driver not found', 404);
  }

  const quantity = Number(data.quantity);
  const cost = Number(data.cost);
  const odometer = Number(data.odometer || 0);
  const pricePerUnit = data.pricePerUnit ?? (quantity > 0 ? cost / quantity : 0);

  const mileage = await calculateMileage(vehicle._id, odometer, quantity);
  const stationName = await resolveStationName(data.stationId, data.fuelStation || '');

  const log = await FuelLog.create({
    vehicle: data.vehicleId,
    driver: data.driverId || vehicle.assignedDriver || null,
    trip: data.tripId || null,
    tripExpense: data.tripExpenseId || null,
    station: data.stationId || null,
    quantity,
    cost,
    pricePerUnit: Math.round(pricePerUnit * 100) / 100,
    odometer,
    mileage,
    fuelStation: stationName,
    fuelType: data.fuelType || vehicle.fuelType,
    receiptNumber: data.receiptNumber || '',
    isFullTank: data.isFullTank !== false,
    notes: data.notes || '',
    loggedAt: data.loggedAt ? new Date(data.loggedAt) : new Date(),
    createdBy: userId,
    updatedBy: userId,
  });

  await syncVehicleOdometer(vehicle._id, odometer);
  await logActivity(vehicle, quantity, cost, userId, log._id);

  const populated = await FuelLog.findById(log._id)
    .populate(vehiclePopulate)
    .populate(driverPopulate)
    .populate(stationPopulate)
    .populate(tripPopulate)
    .lean();

  return formatFuelLog(populated);
};

export const createFuelLogsForTripCompletion = async (trip, fuelLogs = [], userId) => {
  if (!Array.isArray(fuelLogs) || fuelLogs.length === 0) {
    throw new AppError('At least one fuel log entry is required to complete the trip', 400);
  }

  const created = [];
  for (const entry of fuelLogs) {
    const existing = entry.tripExpenseId
      ? await FuelLog.findOne({ tripExpense: entry.tripExpenseId, isDeleted: false })
          .populate(vehiclePopulate)
          .populate(driverPopulate)
          .populate(stationPopulate)
          .populate(tripPopulate)
          .lean()
      : null;

    if (existing) {
      created.push(formatFuelLog(existing));
      continue;
    }

    const log = await createFuelLog(
      {
        ...entry,
        vehicleId: trip.vehicle,
        driverId: trip.driver,
        tripId: trip._id,
      },
      userId
    );
    created.push(log);
  }

  return created;
};

export const updateFuelLog = async (id, data, userId) => {
  const log = await FuelLog.findOne({ _id: id, isDeleted: false });
  if (!log) throw new AppError('Fuel log not found', 404);

  if (data.vehicleId && data.vehicleId !== log.vehicle.toString()) {
    const vehicle = await Vehicle.findOne({ _id: data.vehicleId, isDeleted: false });
    if (!vehicle) throw new AppError('Vehicle not found', 404);
    log.vehicle = data.vehicleId;
  }

  if (data.driverId !== undefined) log.driver = data.driverId || null;
  if (data.stationId !== undefined) {
    log.station = data.stationId || null;
    log.fuelStation = await resolveStationName(data.stationId, data.fuelStation || log.fuelStation);
  } else if (data.fuelStation !== undefined) {
    log.fuelStation = data.fuelStation;
  }

  ['quantity', 'cost', 'odometer', 'fuelType', 'receiptNumber', 'notes'].forEach((field) => {
    if (data[field] !== undefined) log[field] = data[field];
  });

  if (data.isFullTank !== undefined) log.isFullTank = data.isFullTank;
  if (data.loggedAt) log.loggedAt = new Date(data.loggedAt);

  if (data.quantity !== undefined || data.cost !== undefined) {
    log.pricePerUnit =
      log.quantity > 0 ? Math.round((log.cost / log.quantity) * 100) / 100 : log.pricePerUnit;
  }

  log.mileage = await calculateMileage(log.vehicle, log.odometer, log.quantity, log._id);
  log.updatedBy = userId;
  await log.save();

  await syncVehicleOdometer(log.vehicle, log.odometer);

  const populated = await FuelLog.findById(log._id)
    .populate(vehiclePopulate)
    .populate(driverPopulate)
    .populate(stationPopulate)
    .lean();

  return formatFuelLog(populated);
};

export const deleteFuelLog = async (id, userId) => {
  const log = await FuelLog.findOne({ _id: id, isDeleted: false });
  if (!log) throw new AppError('Fuel log not found', 404);

  log.isDeleted = true;
  log.deletedAt = new Date();
  log.updatedBy = userId;
  await log.save();

  return { message: 'Fuel log deleted successfully' };
};

export const getFuelStats = async () => {
  const notDeleted = { isDeleted: false };
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const [totalLogs, stationsCount, monthAgg, avgMileageAgg, totalCostAll] = await Promise.all([
    FuelLog.countDocuments(notDeleted),
    FuelStation.countDocuments({ ...notDeleted, status: 'active' }),
    FuelLog.aggregate([
      { $match: { ...notDeleted, loggedAt: { $gte: monthStart } } },
      {
        $group: {
          _id: null,
          totalQuantity: { $sum: '$quantity' },
          totalCost: { $sum: '$cost' },
          avgPrice: { $avg: '$pricePerUnit' },
        },
      },
    ]),
    FuelLog.aggregate([
      { $match: { ...notDeleted, mileage: { $gt: 0 } } },
      { $group: { _id: null, avgMileage: { $avg: '$mileage' } } },
    ]),
    FuelLog.aggregate([
      { $match: notDeleted },
      { $group: { _id: null, totalCost: { $sum: '$cost' } } },
    ]),
  ]);

  const month = monthAgg[0] || { totalQuantity: 0, totalCost: 0, avgPrice: 0 };

  return {
    totalLogs,
    activeStations: stationsCount,
    quantityThisMonth: Math.round(month.totalQuantity * 100) / 100,
    costThisMonth: Math.round(month.totalCost * 100) / 100,
    avgPricePerUnit: Math.round((month.avgPrice || 0) * 100) / 100,
    averageMileage: Math.round((avgMileageAgg[0]?.avgMileage || 0) * 100) / 100,
    totalCostAllTime: Math.round((totalCostAll[0]?.totalCost || 0) * 100) / 100,
  };
};

export const getFuelAnalytics = async (query = {}) => {
  const months = parseInt(query.months, 10) || 6;
  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - months + 1);
  startDate.setDate(1);
  startDate.setHours(0, 0, 0, 0);

  const notDeleted = { isDeleted: false, loggedAt: { $gte: startDate } };

  const [byMonth, byVehicle, byFuelType, byStation] = await Promise.all([
    FuelLog.aggregate([
      { $match: notDeleted },
      {
        $group: {
          _id: { year: { $year: '$loggedAt' }, month: { $month: '$loggedAt' } },
          quantity: { $sum: '$quantity' },
          cost: { $sum: '$cost' },
          avgMileage: { $avg: { $cond: [{ $gt: ['$mileage', 0] }, '$mileage', null] } },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]),
    FuelLog.aggregate([
      { $match: notDeleted },
      {
        $group: {
          _id: '$vehicle',
          quantity: { $sum: '$quantity' },
          cost: { $sum: '$cost' },
          avgMileage: { $avg: { $cond: [{ $gt: ['$mileage', 0] }, '$mileage', null] } },
        },
      },
      { $sort: { cost: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: 'vehicles',
          localField: '_id',
          foreignField: '_id',
          as: 'vehicle',
        },
      },
      { $unwind: { path: '$vehicle', preserveNullAndEmptyArrays: true } },
    ]),
    FuelLog.aggregate([
      { $match: notDeleted },
      {
        $group: {
          _id: '$fuelType',
          quantity: { $sum: '$quantity' },
          cost: { $sum: '$cost' },
        },
      },
    ]),
    FuelLog.aggregate([
      { $match: { ...notDeleted, station: { $ne: null } } },
      {
        $group: {
          _id: '$station',
          quantity: { $sum: '$quantity' },
          cost: { $sum: '$cost' },
          visits: { $sum: 1 },
        },
      },
      { $sort: { cost: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: 'fuelstations',
          localField: '_id',
          foreignField: '_id',
          as: 'station',
        },
      },
      { $unwind: { path: '$station', preserveNullAndEmptyArrays: true } },
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
      quantity: Math.round((found?.quantity || 0) * 100) / 100,
      cost: Math.round((found?.cost || 0) * 100) / 100,
      avgMileage: Math.round((found?.avgMileage || 0) * 100) / 100,
    });
  }

  return {
    monthlyTrend,
    topVehicles: byVehicle.map((v) => ({
      vehicleId: v._id,
      vehicleNumber: v.vehicle?.vehicleNumber || 'Unknown',
      quantity: Math.round(v.quantity * 100) / 100,
      cost: Math.round(v.cost * 100) / 100,
      avgMileage: Math.round((v.avgMileage || 0) * 100) / 100,
    })),
    byFuelType: byFuelType.map((f) => ({
      fuelType: f._id,
      quantity: Math.round(f.quantity * 100) / 100,
      cost: Math.round(f.cost * 100) / 100,
    })),
    topStations: byStation.map((s) => ({
      stationId: s._id,
      name: s.station?.name || 'Unknown',
      quantity: Math.round(s.quantity * 100) / 100,
      cost: Math.round(s.cost * 100) / 100,
      visits: s.visits,
    })),
  };
};

export const getMetaVehicles = async () => {
  const vehicles = await Vehicle.find({ isDeleted: false, status: 'active' })
    .select('vehicleNumber model manufacturer fuelType odometer assignedDriver')
    .populate('assignedDriver', 'firstName lastName')
    .sort({ vehicleNumber: 1 })
    .lean();

  return vehicles.map((v) => ({
    id: v._id,
    vehicleNumber: v.vehicleNumber,
    model: v.model,
    manufacturer: v.manufacturer,
    fuelType: v.fuelType,
    odometer: v.odometer,
    driver: v.assignedDriver
      ? { id: v.assignedDriver._id, name: `${v.assignedDriver.firstName} ${v.assignedDriver.lastName}` }
      : null,
  }));
};

export const exportFuelLogsCSV = async (query) => {
  const filter = buildLogFilter(query);
  const logs = await FuelLog.find(filter)
    .populate(vehiclePopulate)
    .populate(driverPopulate)
    .populate(stationPopulate)
    .sort({ loggedAt: -1 })
    .limit(5000)
    .lean();

  const columns = [
    { header: 'Date', accessor: (l) => new Date(l.loggedAt).toISOString().split('T')[0] },
    { header: 'Vehicle', accessor: (l) => l.vehicle?.vehicleNumber || '' },
    { header: 'Driver', accessor: (l) => (l.driver ? `${l.driver.firstName} ${l.driver.lastName}` : '') },
    { header: 'Station', accessor: (l) => l.station?.name || l.fuelStation || '' },
    { header: 'Fuel Type', accessor: 'fuelType' },
    { header: 'Quantity (L)', accessor: 'quantity' },
    { header: 'Cost', accessor: 'cost' },
    { header: 'Price/Unit', accessor: 'pricePerUnit' },
    { header: 'Odometer', accessor: 'odometer' },
    { header: 'Mileage (km/L)', accessor: 'mileage' },
    { header: 'Receipt', accessor: 'receiptNumber' },
  ];

  return objectsToCSV(logs, columns);
};

export default {
  getFuelLogs,
  getFuelLogById,
  createFuelLog,
  updateFuelLog,
  deleteFuelLog,
  getFuelStats,
  getFuelAnalytics,
  getMetaVehicles,
  exportFuelLogsCSV,
  calculateMileage,
};
