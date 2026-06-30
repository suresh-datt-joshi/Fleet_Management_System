import Trip from '../models/Trip.js';
import TripHistory from '../models/TripHistory.js';
import TripExpense from '../models/TripExpense.js';
import FuelLog from '../models/FuelLog.js';
import Driver from '../models/Driver.js';
import Vehicle from '../models/Vehicle.js';
import Route from '../models/Route.js';
import Activity from '../models/Activity.js';
import * as socketService from './socketService.js';
import { notifyTripEvent } from './alertService.js';
import AppError from '../utils/AppError.js';
import { getPagination, buildPaginationMeta } from '../utils/pagination.js';
import { objectsToCSV } from '../utils/csvExport.js';
import {
  TRIP_STATUS,
  FINANCIALLY_CLOSED_TRIP_STATUSES,
  DRIVER_STATUS,
  VEHICLE_STATUS,
  ACTIVITY_TYPES,
  TRIP_HISTORY_ACTIONS,
  TRIP_EXPENSE_CATEGORIES,
  CONSIGNMENT_STATUS,
} from '../constants/enums.js';
import {
  applyDriverTripScope,
  assertTripDriverAccess,
  assertCanReviewTrip,
  getDriverIdForUser,
} from '../utils/tripAccess.js';
import * as tripExpenseService from './tripExpenseService.js';
import * as fuelService from './fuelService.js';
import * as fuelStationService from './fuelStationService.js';

const driverPopulate = { path: 'driver', select: 'firstName lastName email phone status licenseNumber' };
const vehiclePopulate = { path: 'vehicle', select: 'vehicleNumber model manufacturer status odometer fuelLevel fuelType' };
const routePopulate = { path: 'route', select: 'routeNumber name origin destination totalDistanceMeters estimatedDurationMinutes' };
const reviewerPopulate = { path: 'reviewedBy', select: 'firstName lastName email' };

const formatExpenseBreakdown = (breakdown) => ({
  fuel: breakdown?.fuel ?? 0,
  tolls: breakdown?.tolls ?? 0,
  maintenance: breakdown?.maintenance ?? 0,
  food: breakdown?.food ?? 0,
  lodging: breakdown?.lodging ?? 0,
  other: breakdown?.other ?? 0,
});

const sumExpenseBreakdown = (breakdown) => {
  const b = formatExpenseBreakdown(breakdown);
  return Math.round(Object.values(b).reduce((sum, v) => sum + v, 0) * 100) / 100;
};

const buildExpenseBreakdownFromRecords = (expenses) => {
  const sumByCategory = (cat) =>
    Math.round(expenses.filter((e) => e.category === cat).reduce((s, e) => s + (e.amount || 0), 0) * 100) / 100;

  return {
    fuel: sumByCategory(TRIP_EXPENSE_CATEGORIES.FUEL),
    tolls: sumByCategory(TRIP_EXPENSE_CATEGORIES.TOLL),
    maintenance: 0,
    food: sumByCategory(TRIP_EXPENSE_CATEGORIES.FOOD),
    lodging: sumByCategory(TRIP_EXPENSE_CATEGORIES.LODGING),
    other: sumByCategory(TRIP_EXPENSE_CATEGORIES.OTHER),
  };
};

const deriveTripDistanceIfMissing = async (trip) => {
  if (trip.distance > 0) return trip.distance;

  if (trip.route) {
    const route = await Route.findById(trip.route).select('totalDistanceMeters').lean();
    if (route?.totalDistanceMeters > 0) {
      trip.distance = Math.round((route.totalDistanceMeters / 1000) * 100) / 100;
      return trip.distance;
    }
  }

  if (trip.startOdometer > 0) {
    const vehicle = await Vehicle.findById(trip.vehicle).select('odometer').lean();
    if (vehicle?.odometer > trip.startOdometer) {
      trip.distance = Math.round((vehicle.odometer - trip.startOdometer) * 100) / 100;
      return trip.distance;
    }

    const maxFuelLog = await FuelLog.findOne({
      trip: trip._id,
      isDeleted: false,
      odometer: { $gt: 0 },
    })
      .sort({ odometer: -1 })
      .select('odometer')
      .lean();

    if (maxFuelLog?.odometer > trip.startOdometer) {
      trip.distance = Math.round((maxFuelLog.odometer - trip.startOdometer) * 100) / 100;
      return trip.distance;
    }
  }

  return trip.distance || 0;
};

const formatLocation = (loc) =>
  loc
    ? {
        address: loc.address || '',
        lat: loc.lat ?? 0,
        lng: loc.lng ?? 0,
      }
    : { address: '', lat: 0, lng: 0 };

const formatTrip = (trip) => {
  const t = trip.toObject ? trip.toObject() : trip;

  return {
    id: t._id,
    tripNumber: t.tripNumber,
    status: t.status,
    driver: t.driver
      ? {
          id: t.driver._id || t.driver,
          name: t.driver.firstName ? `${t.driver.firstName} ${t.driver.lastName}` : undefined,
          firstName: t.driver.firstName,
          lastName: t.driver.lastName,
          email: t.driver.email,
          phone: t.driver.phone,
          status: t.driver.status,
          licenseNumber: t.driver.licenseNumber,
        }
      : null,
    vehicle: t.vehicle
      ? {
          id: t.vehicle._id || t.vehicle,
          vehicleNumber: t.vehicle.vehicleNumber,
          model: t.vehicle.model,
          manufacturer: t.vehicle.manufacturer,
          status: t.vehicle.status,
          odometer: t.vehicle.odometer,
          fuelLevel: t.vehicle.fuelLevel,
        }
      : null,
    route: t.route
      ? {
          id: t.route._id || t.route,
          routeNumber: t.route.routeNumber,
          name: t.route.name,
          origin: formatLocation(t.route.origin),
          destination: formatLocation(t.route.destination),
          totalDistanceMeters: t.route.totalDistanceMeters,
          estimatedDurationMinutes: t.route.estimatedDurationMinutes,
        }
      : null,
    origin: formatLocation(t.origin),
    destination: formatLocation(t.destination),
    scheduledAt: t.scheduledAt,
    startedAt: t.startedAt,
    completedAt: t.completedAt,
    submittedAt: t.submittedAt,
    reviewedAt: t.reviewedAt,
    reviewedBy: t.reviewedBy
      ? {
          id: t.reviewedBy._id || t.reviewedBy,
          name: t.reviewedBy.firstName
            ? `${t.reviewedBy.firstName} ${t.reviewedBy.lastName}`
            : undefined,
          email: t.reviewedBy.email,
        }
      : null,
    reviewNotes: t.reviewNotes || '',
    distance: t.distance,
    estimatedCost: t.estimatedCost,
    fuelUsed: t.fuelUsed,
    revenue: t.revenue,
    expenses: t.expenses,
    expenseBreakdown: formatExpenseBreakdown(t.expenseBreakdown),
    profit: Math.round(((t.revenue || 0) - (t.expenses || 0)) * 100) / 100,
    notes: t.notes,
    consignment: t.consignment
      ? {
          referenceNumber: t.consignment.referenceNumber || '',
          description: t.consignment.description || '',
          status: t.consignment.status,
          notes: t.consignment.notes || '',
          updatedAt: t.consignment.updatedAt,
        }
      : { referenceNumber: '', description: '', status: 'pending', notes: '', updatedAt: null },
    createdAt: t.createdAt,
    updatedAt: t.updatedAt,
  };
};

const logHistory = async (tripId, action, description, userId, changes = null) => {
  await TripHistory.create({
    trip: tripId,
    action,
    description,
    performedBy: userId,
    changes,
  });
};

const logActivity = async (type, title, description, userId, entityId) => {
  const activity = await Activity.create({
    type,
    title,
    description,
    entityType: 'trip',
    entityId,
    user: userId,
  });

  socketService.emitDashboardActivity({
    id: activity._id,
    type,
    title,
    description,
    entityType: 'trip',
    entityId,
    createdAt: activity.createdAt,
  });
};

const generateTripNumber = async () => {
  const prefix = `TRP-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}`;
  const count = await Trip.countDocuments({ tripNumber: new RegExp(`^${prefix}`) });
  return `${prefix}-${String(count + 1).padStart(4, '0')}`;
};

const buildConsignmentReference = (tripNumber) => `CSG-${tripNumber.replace(/^TRP-/, '')}`;

const initializeConsignmentOnStart = (trip) => {
  const referenceNumber = trip.consignment?.referenceNumber?.trim()
    ? trip.consignment.referenceNumber
    : buildConsignmentReference(trip.tripNumber);
  const status =
    trip.consignment?.status && trip.consignment.status !== CONSIGNMENT_STATUS.PENDING
      ? trip.consignment.status
      : CONSIGNMENT_STATUS.IN_TRANSIT;

  trip.set('consignment', {
    referenceNumber,
    description: trip.consignment?.description || '',
    status,
    notes: trip.consignment?.notes || '',
    updatedAt: new Date(),
  });
};

const buildFilter = (query) => {
  const filter = { isDeleted: false };

  if (query.statuses) {
    filter.status = { $in: query.statuses.split(',').map((s) => s.trim()) };
  } else if (query.status) {
    filter.status = query.status;
  }
  if (query.driverId) filter.driver = query.driverId;
  if (query.vehicleId) filter.vehicle = query.vehicleId;
  if (query.routeId) filter.route = query.routeId;

  if (query.from) filter.scheduledAt = { ...filter.scheduledAt, $gte: new Date(query.from) };
  if (query.to) filter.scheduledAt = { ...filter.scheduledAt, $lte: new Date(query.to) };

  if (query.upcoming === 'true') {
    filter.status = TRIP_STATUS.SCHEDULED;
    filter.scheduledAt = { ...filter.scheduledAt, $gte: new Date() };
  }

  if (query.search) {
    const regex = new RegExp(query.search, 'i');
    filter.$or = [{ tripNumber: regex }, { notes: regex }, { 'origin.address': regex }, { 'destination.address': regex }];
  }

  return filter;
};

const normalizeLocation = (loc = {}) => ({
  address: loc.address?.trim() || '',
  lat: loc.lat ?? 0,
  lng: loc.lng ?? 0,
});

const assertDriverAvailable = async (driverId, excludeTripId = null) => {
  const driver = await Driver.findOne({ _id: driverId, isDeleted: false });
  if (!driver) throw new AppError('Driver not found', 404);

  if (driver.status === DRIVER_STATUS.SUSPENDED) {
    throw new AppError('Driver is suspended and cannot be assigned to a trip', 400);
  }

  const activeTripFilter = {
    driver: driverId,
    isDeleted: false,
    status: TRIP_STATUS.IN_PROGRESS,
  };
  if (excludeTripId) activeTripFilter._id = { $ne: excludeTripId };

  const activeTrip = await Trip.findOne(activeTripFilter);
  if (activeTrip) {
    throw new AppError(`Driver is already on trip ${activeTrip.tripNumber}`, 400);
  }

  return driver;
};

const assertVehicleAvailable = async (vehicleId, excludeTripId = null) => {
  const vehicle = await Vehicle.findOne({ _id: vehicleId, isDeleted: false });
  if (!vehicle) throw new AppError('Vehicle not found', 404);

  if (vehicle.status !== VEHICLE_STATUS.ACTIVE) {
    throw new AppError(`Vehicle ${vehicle.vehicleNumber} is not available (${vehicle.status})`, 400);
  }

  const activeTripFilter = {
    vehicle: vehicleId,
    isDeleted: false,
    status: TRIP_STATUS.IN_PROGRESS,
  };
  if (excludeTripId) activeTripFilter._id = { $ne: excludeTripId };

  const activeTrip = await Trip.findOne(activeTripFilter);
  if (activeTrip) {
    throw new AppError(`Vehicle is already on trip ${activeTrip.tripNumber}`, 400);
  }

  return vehicle;
};

export const getTrips = async (query, user = null) => {
  const { page, limit, skip, sort } = getPagination(query);
  const filter = buildFilter(query);
  if (user) await applyDriverTripScope(filter, user);

  const [trips, total] = await Promise.all([
    Trip.find(filter)
      .populate(driverPopulate)
      .populate(vehiclePopulate)
      .populate(routePopulate)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean(),
    Trip.countDocuments(filter),
  ]);

  return {
    trips: trips.map(formatTrip),
    pagination: buildPaginationMeta(total, page, limit),
  };
};

export const getTripById = async (id, user = null) => {
  const trip = await Trip.findOne({ _id: id, isDeleted: false })
    .populate(driverPopulate)
    .populate(vehiclePopulate)
    .populate(routePopulate)
    .lean();

  if (!trip) throw new AppError('Trip not found', 404);
  if (user) await assertTripDriverAccess(trip, user);

  const formatted = formatTrip(trip);
  const expenseData = await tripExpenseService.getTripExpenses(id, user || { role: 'super_admin' });
  return { ...formatted, expenseDetails: expenseData };
};

export const getMyDriverProfile = async (userId) => {
  const driverId = await getDriverIdForUser(userId);
  if (!driverId) return null;

  const driver = await Driver.findOne({ _id: driverId, isDeleted: false })
    .select(
      'firstName lastName email phone status licenseNumber licenseExpiry medicalCertificateExpiry documents assignedVehicle employeeId'
    )
    .populate(
      'assignedVehicle',
      'vehicleNumber model manufacturer status fuelLevel odometer documentExpiry currentLocation'
    )
    .lean();

  if (!driver) return null;

  return {
    id: driver._id,
    employeeId: driver.employeeId,
    name: `${driver.firstName} ${driver.lastName}`,
    email: driver.email,
    phone: driver.phone,
    status: driver.status,
    licenseNumber: driver.licenseNumber,
    licenseExpiry: driver.licenseExpiry,
    medicalCertificateExpiry: driver.medicalCertificateExpiry,
    documents: (driver.documents || []).map((doc) => ({
      type: doc.type,
      name: doc.name,
      expiryDate: doc.expiryDate,
    })),
    assignedVehicleId: driver.assignedVehicle?._id || driver.assignedVehicle || null,
    assignedVehicle: driver.assignedVehicle
      ? {
          id: driver.assignedVehicle._id,
          vehicleNumber: driver.assignedVehicle.vehicleNumber,
          model: driver.assignedVehicle.model,
          manufacturer: driver.assignedVehicle.manufacturer,
          status: driver.assignedVehicle.status,
          fuelLevel: driver.assignedVehicle.fuelLevel,
          odometer: driver.assignedVehicle.odometer,
          insuranceExpiry: driver.assignedVehicle.documentExpiry?.insurance || null,
          registrationExpiry: driver.assignedVehicle.documentExpiry?.registration || null,
          location: driver.assignedVehicle.currentLocation?.address || '',
        }
      : null,
  };
};

export const getMyActiveTrip = async (userId) => {
  const driverId = await getDriverIdForUser(userId);
  if (!driverId) return null;

  const trip = await Trip.findOne({
    driver: driverId,
    isDeleted: false,
    status: TRIP_STATUS.IN_PROGRESS,
  })
    .populate(driverPopulate)
    .populate(vehiclePopulate)
    .populate(routePopulate)
    .lean();

  if (!trip) return null;

  const formatted = formatTrip(trip);
  const expenseData = await tripExpenseService.getTripExpenses(trip._id, { role: 'super_admin' });
  return { ...formatted, expenseDetails: expenseData };
};

export const getMyScheduledTrips = async (userId) => {
  const driverId = await getDriverIdForUser(userId);
  if (!driverId) return [];

  const trips = await Trip.find({
    driver: driverId,
    isDeleted: false,
    status: TRIP_STATUS.SCHEDULED,
  })
    .populate(driverPopulate)
    .populate(vehiclePopulate)
    .populate(routePopulate)
    .sort({ scheduledAt: 1 })
    .limit(10)
    .lean();

  return trips.map(formatTrip);
};

export const getTripStats = async () => {
  const notDeleted = { isDeleted: { $ne: true } };
  const now = new Date();
  const weekAhead = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  const [total, scheduled, inProgress, pendingReview, completed, cancelled, upcomingWeek, revenueAgg] = await Promise.all([
    Trip.countDocuments(notDeleted),
    Trip.countDocuments({ ...notDeleted, status: TRIP_STATUS.SCHEDULED }),
    Trip.countDocuments({ ...notDeleted, status: TRIP_STATUS.IN_PROGRESS }),
    Trip.countDocuments({ ...notDeleted, status: TRIP_STATUS.PENDING_DISPATCHER_REVIEW }),
    Trip.countDocuments({ ...notDeleted, status: { $in: FINANCIALLY_CLOSED_TRIP_STATUSES } }),
    Trip.countDocuments({ ...notDeleted, status: TRIP_STATUS.CANCELLED }),
    Trip.countDocuments({
      ...notDeleted,
      status: TRIP_STATUS.SCHEDULED,
      scheduledAt: { $gte: now, $lte: weekAhead },
    }),
    Trip.aggregate([
      { $match: { ...notDeleted, status: { $in: FINANCIALLY_CLOSED_TRIP_STATUSES } } },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$revenue' },
          totalExpenses: { $sum: '$expenses' },
          totalDistance: { $sum: '$distance' },
        },
      },
    ]),
  ]);

  const agg = revenueAgg[0] || {};
  const totalRevenue = Math.round((agg.totalRevenue || 0) * 100) / 100;
  const totalExpenses = Math.round((agg.totalExpenses || 0) * 100) / 100;

  return {
    total,
    scheduled,
    inProgress,
    pendingReview,
    completed,
    cancelled,
    upcomingWeek,
    totalRevenue,
    totalExpenses,
    totalProfit: Math.round((totalRevenue - totalExpenses) * 100) / 100,
    totalDistance: Math.round((agg.totalDistance || 0) * 100) / 100,
  };
};

export const getUpcomingTrips = async (query) => {
  const days = parseInt(query.days, 10) || 7;
  const until = new Date(Date.now() + days * 24 * 60 * 60 * 1000);

  const trips = await Trip.find({
    isDeleted: false,
    status: TRIP_STATUS.SCHEDULED,
    scheduledAt: { $gte: new Date(), $lte: until },
  })
    .populate(driverPopulate)
    .populate(vehiclePopulate)
    .populate(routePopulate)
    .sort({ scheduledAt: 1 })
    .limit(parseInt(query.limit, 10) || 20)
    .lean();

  return trips.map(formatTrip);
};

export const getTripAnalytics = async (query = {}) => {
  const months = parseInt(query.months, 10) || 6;
  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - months + 1);
  startDate.setDate(1);
  startDate.setHours(0, 0, 0, 0);

  const notDeleted = { isDeleted: false, createdAt: { $gte: startDate } };

  const [byMonth, byStatus] = await Promise.all([
    Trip.aggregate([
      { $match: notDeleted },
      {
        $group: {
          _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
          count: { $sum: 1 },
          revenue: { $sum: '$revenue' },
          expenses: { $sum: '$expenses' },
          distance: { $sum: '$distance' },
          completed: {
            $sum: {
              $cond: [{ $in: ['$status', FINANCIALLY_CLOSED_TRIP_STATUSES] }, 1, 0],
            },
          },
          revenueClosed: {
            $sum: {
              $cond: [{ $in: ['$status', FINANCIALLY_CLOSED_TRIP_STATUSES] }, '$revenue', 0],
            },
          },
          expensesClosed: {
            $sum: {
              $cond: [{ $in: ['$status', FINANCIALLY_CLOSED_TRIP_STATUSES] }, '$expenses', 0],
            },
          },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]),
    Trip.aggregate([
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
      revenue: Math.round((found?.revenueClosed ?? found?.revenue ?? 0) * 100) / 100,
      expenses: Math.round((found?.expensesClosed ?? found?.expenses ?? 0) * 100) / 100,
      distance: Math.round((found?.distance || 0) * 100) / 100,
      completed: found?.completed || 0,
    });
  }

  return {
    monthlyTrend,
    byStatus: byStatus.map((s) => ({ status: s._id, count: s.count })),
  };
};

export const createTrip = async (data, userId) => {
  await assertDriverAvailable(data.driverId);
  const vehicle = await assertVehicleAvailable(data.vehicleId);

  let origin = normalizeLocation(data.origin);
  let destination = normalizeLocation(data.destination);
  let distance = data.distance ?? 0;

  if (data.routeId) {
    const route = await Route.findOne({ _id: data.routeId, isDeleted: false });
    if (!route) throw new AppError('Route not found', 404);
    origin = normalizeLocation(route.origin);
    destination = normalizeLocation(route.destination);
    if (!distance && route.totalDistanceMeters) {
      distance = Math.round((route.totalDistanceMeters / 1000) * 100) / 100;
    }
  }

  const tripNumber = data.tripNumber || (await generateTripNumber());

  const trip = await Trip.create({
    tripNumber,
    status: TRIP_STATUS.SCHEDULED,
    driver: data.driverId,
    vehicle: data.vehicleId,
    route: data.routeId || null,
    origin,
    destination,
    scheduledAt: data.scheduledAt ? new Date(data.scheduledAt) : new Date(),
    distance,
    estimatedCost: data.estimatedCost ?? 0,
    fuelUsed: data.fuelUsed ?? 0,
    revenue: data.revenue ?? 0,
    expenses: data.expenses ?? 0,
    notes: data.notes || '',
    createdBy: userId,
    updatedBy: userId,
  });

  await logHistory(trip._id, TRIP_HISTORY_ACTIONS.CREATED, `Trip ${trip.tripNumber} created`, userId);
  await logActivity(
    ACTIVITY_TYPES.TRIP_CREATED,
    'Trip scheduled',
    `${trip.tripNumber} — ${vehicle.vehicleNumber}`,
    userId,
    trip._id
  );

  const populated = await Trip.findById(trip._id)
    .populate(driverPopulate)
    .populate(vehiclePopulate)
    .populate(routePopulate)
    .lean();

  const formatted = formatTrip(populated);
  socketService.emitTripUpdated(formatted);

  await notifyTripEvent(trip, {
    title: 'New Trip Assignment',
    message: `Trip ${trip.tripNumber} scheduled for ${vehicle.vehicleNumber}`,
    event: 'assigned',
  });

  return formatted;
};

export const updateTrip = async (id, data, userId) => {
  const trip = await Trip.findOne({ _id: id, isDeleted: false });
  if (!trip) throw new AppError('Trip not found', 404);

  const originalDriverId = trip.driver.toString();
  const originalVehicleId = trip.vehicle.toString();
  const originalScheduledAt = trip.scheduledAt ? new Date(trip.scheduledAt).getTime() : null;

  if (
    [
      TRIP_STATUS.REVIEWED,
      TRIP_STATUS.COMPLETED,
      TRIP_STATUS.CANCELLED,
      TRIP_STATUS.PENDING_DISPATCHER_REVIEW,
    ].includes(trip.status)
  ) {
    throw new AppError('Cannot update a trip that is closed, cancelled, or pending review', 400);
  }

  if (trip.status === TRIP_STATUS.IN_PROGRESS) {
    const allowed = ['notes', 'estimatedCost', 'revenue', 'expenses', 'fuelUsed', 'distance'];
    const hasDisallowed = Object.keys(data).some((k) => !allowed.includes(k));
    if (hasDisallowed) {
      throw new AppError('Only notes, estimated cost, revenue, expenses, fuel, and distance can be updated while in progress', 400);
    }
  }

  if (data.driverId && data.driverId !== trip.driver.toString()) {
    if (trip.status !== TRIP_STATUS.SCHEDULED) {
      throw new AppError('Cannot change driver after trip has started', 400);
    }
    await assertDriverAvailable(data.driverId, id);
    trip.driver = data.driverId;
  }

  if (data.vehicleId && data.vehicleId !== trip.vehicle.toString()) {
    if (trip.status !== TRIP_STATUS.SCHEDULED) {
      throw new AppError('Cannot change vehicle after trip has started', 400);
    }
    await assertVehicleAvailable(data.vehicleId, id);
    trip.vehicle = data.vehicleId;
  }

  if (data.origin) trip.origin = normalizeLocation(data.origin);
  if (data.destination) trip.destination = normalizeLocation(data.destination);
  if (data.scheduledAt) trip.scheduledAt = new Date(data.scheduledAt);
  if (data.distance !== undefined) trip.distance = data.distance;
  if (data.estimatedCost !== undefined) trip.estimatedCost = data.estimatedCost;
  if (data.fuelUsed !== undefined) trip.fuelUsed = data.fuelUsed;
  if (data.revenue !== undefined) trip.revenue = data.revenue;
  if (data.expenses !== undefined) trip.expenses = data.expenses;
  if (data.notes !== undefined) trip.notes = data.notes;
  if (data.routeId !== undefined) {
    trip.route = data.routeId || null;
    if (data.routeId) {
      const route = await Route.findOne({ _id: data.routeId, isDeleted: false });
      if (!route) throw new AppError('Route not found', 404);
      trip.origin = normalizeLocation(route.origin);
      trip.destination = normalizeLocation(route.destination);
      if (data.distance === undefined && route.totalDistanceMeters) {
        trip.distance = Math.round((route.totalDistanceMeters / 1000) * 100) / 100;
      }
    }
  }

  trip.updatedBy = userId;
  await trip.save();

  await logHistory(trip._id, TRIP_HISTORY_ACTIONS.UPDATED, `Trip ${trip.tripNumber} updated`, userId);

  const populated = await Trip.findById(trip._id)
    .populate(driverPopulate)
    .populate(vehiclePopulate)
    .populate(routePopulate)
    .lean();

  const formatted = formatTrip(populated);
  socketService.emitTripUpdated(formatted);

  const scheduleChanged =
    data.scheduledAt && new Date(data.scheduledAt).getTime() !== originalScheduledAt;
  const driverChanged = data.driverId && data.driverId !== originalDriverId;
  const vehicleChanged = data.vehicleId && data.vehicleId !== originalVehicleId;
  const routeChanged = Boolean(data.origin || data.destination || data.routeId !== undefined);

  if (scheduleChanged || driverChanged || vehicleChanged || routeChanged) {
    await notifyTripEvent(trip, {
      title: 'Trip Updated',
      message: `Trip ${trip.tripNumber} details have been updated`,
      event: 'updated',
    });
  }

  if (driverChanged) {
    await notifyTripEvent({ ...trip.toObject(), driver: data.driverId }, {
      title: 'New Trip Assignment',
      message: `You have been assigned to trip ${trip.tripNumber}`,
      event: 'assigned',
    });
  }

  return formatted;
};

export const deleteTrip = async (id, userId) => {
  const trip = await Trip.findOne({ _id: id, isDeleted: false });
  if (!trip) throw new AppError('Trip not found', 404);

  if (trip.status === TRIP_STATUS.IN_PROGRESS) {
    throw new AppError('Cannot delete an active in-progress trip', 400);
  }

  trip.isDeleted = true;
  trip.deletedAt = new Date();
  trip.updatedBy = userId;
  await trip.save();

  await logHistory(trip._id, TRIP_HISTORY_ACTIONS.DELETED, `Trip ${trip.tripNumber} deleted`, userId);

  return { message: 'Trip deleted successfully' };
};

export const startTrip = async (id, userId, user = null) => {
  const trip = await Trip.findOne({ _id: id, isDeleted: false });
  if (!trip) throw new AppError('Trip not found', 404);
  if (user) await assertTripDriverAccess(trip, user);

  if (trip.status !== TRIP_STATUS.SCHEDULED) {
    throw new AppError('Only scheduled trips can be started', 400);
  }

  await assertDriverAvailable(trip.driver, id);
  await assertVehicleAvailable(trip.vehicle, id);

  const driver = await Driver.findById(trip.driver);
  if (driver && driver.status !== DRIVER_STATUS.ON_TRIP) {
    driver.status = DRIVER_STATUS.ON_TRIP;
    await driver.save();
  }

  const vehicle = await Vehicle.findById(trip.vehicle);
  if (vehicle) {
    trip.startOdometer = vehicle.odometer || 0;
    vehicle.ignition = true;
    if (driver) {
      vehicle.assignedDriver = driver._id;
    }
    await vehicle.save();
  }

  trip.status = TRIP_STATUS.IN_PROGRESS;
  trip.startedAt = new Date();
  trip.updatedBy = userId;
  initializeConsignmentOnStart(trip);
  await trip.save();

  await logHistory(trip._id, TRIP_HISTORY_ACTIONS.STARTED, `Trip ${trip.tripNumber} started`, userId);
  await logHistory(
    trip._id,
    TRIP_HISTORY_ACTIONS.CONSIGNMENT_UPDATED,
    `Consignment reference ${trip.consignment.referenceNumber} assigned`,
    userId,
    { referenceNumber: trip.consignment.referenceNumber, status: trip.consignment.status }
  );
  await logActivity(
    ACTIVITY_TYPES.TRIP_STARTED,
    'Trip started',
    `${trip.tripNumber} is now in progress`,
    userId,
    trip._id
  );

  const populated = await Trip.findById(trip._id)
    .populate(driverPopulate)
    .populate(vehiclePopulate)
    .populate(routePopulate)
    .lean();

  const formatted = formatTrip(populated);
  socketService.emitTripStarted(formatted);

  await notifyTripEvent(trip, {
    title: 'Trip Started',
    message: `Trip ${trip.tripNumber} is now in progress`,
    event: 'started',
  });

  return formatted;
};

export const completeTrip = async (id, data, userId, user = null) => {
  const trip = await Trip.findOne({ _id: id, isDeleted: false });
  if (!trip) throw new AppError('Trip not found', 404);
  if (user) await assertTripDriverAccess(trip, user);

  if (trip.status !== TRIP_STATUS.IN_PROGRESS) {
    throw new AppError('Only in-progress trips can be completed', 400);
  }

  if (data.distance !== undefined) trip.distance = data.distance;
  if (data.fuelUsed !== undefined) trip.fuelUsed = data.fuelUsed;
  if (data.revenue !== undefined) trip.revenue = data.revenue;
  if (data.expenses !== undefined) trip.expenses = data.expenses;
  if (data.notes !== undefined) trip.notes = data.notes;

  await deriveTripDistanceIfMissing(trip);

  await tripExpenseService.recalculateTripTotals(id);
  const refreshed = await Trip.findById(id);
  if (refreshed) {
    trip.expenses = refreshed.expenses;
    trip.fuelUsed = refreshed.fuelUsed;
  }

  const expenseRecords = await TripExpense.find({ trip: id, isDeleted: false }).lean();
  trip.expenseBreakdown = buildExpenseBreakdownFromRecords(expenseRecords);

  if (Array.isArray(data.fuelLogs) && data.fuelLogs.length > 0) {
    await fuelService.createFuelLogsForTripCompletion(trip, data.fuelLogs, userId);
  } else {
    await fuelService.finalizeTripFuelLogOdometers(trip, userId);
  }

  const now = data.completedAt ? new Date(data.completedAt) : new Date();
  trip.submittedAt = now;
  trip.status = TRIP_STATUS.PENDING_DISPATCHER_REVIEW;
  trip.updatedBy = userId;
  await trip.save();

  const driver = await Driver.findById(trip.driver);
  if (driver && driver.status === DRIVER_STATUS.ON_TRIP) {
    driver.status = DRIVER_STATUS.AVAILABLE;
    await driver.save();
  }

  const vehicle = await Vehicle.findById(trip.vehicle);
  if (vehicle) {
    vehicle.ignition = false;
    vehicle.speed = 0;
    vehicle.engineStatus = 'off';
    if (trip.distance > 0) {
      vehicle.odometer = Math.round((vehicle.odometer + trip.distance) * 100) / 100;
    }
    if (trip.distance > 0 && vehicle.fuelLevel !== undefined) {
      const fuelDeductionPercent = Math.min(25, trip.distance * 0.5);
      vehicle.fuelLevel = Math.max(0, Math.round((vehicle.fuelLevel - fuelDeductionPercent) * 100) / 100);
    }
    await vehicle.save();
  }

  await logHistory(
    trip._id,
    TRIP_HISTORY_ACTIONS.SUBMITTED,
    `Trip ${trip.tripNumber} submitted for dispatcher review`,
    userId,
    { distance: trip.distance, expenses: trip.expenses }
  );
  await logActivity(
    ACTIVITY_TYPES.TRIP_SUBMITTED,
    'Trip submitted for review',
    `${trip.tripNumber} is awaiting dispatcher review`,
    userId,
    trip._id
  );

  const populated = await Trip.findById(trip._id)
    .populate(driverPopulate)
    .populate(vehiclePopulate)
    .populate(routePopulate)
    .lean();

  const formatted = formatTrip(populated);
  socketService.emitTripSubmitted(formatted);

  await notifyTripEvent(trip, {
    title: 'Trip Submitted for Review',
    message: `Trip ${trip.tripNumber} has been submitted and is pending review`,
    event: 'submitted',
  });

  return formatted;
};

export const reviewTrip = async (id, data, userId, user) => {
  assertCanReviewTrip(user);

  const trip = await Trip.findOne({ _id: id, isDeleted: false });
  if (!trip) throw new AppError('Trip not found', 404);

  if (trip.status !== TRIP_STATUS.PENDING_DISPATCHER_REVIEW) {
    throw new AppError('Only trips pending dispatcher review can be reviewed', 400);
  }

  if (data.revenue === undefined || data.revenue === null) {
    throw new AppError('Revenue is required to close a trip', 400);
  }

  const expenseBreakdown = formatExpenseBreakdown(data.expenseBreakdown || trip.expenseBreakdown);
  const totalExpenses = sumExpenseBreakdown(expenseBreakdown);

  trip.revenue = data.revenue;
  trip.expenseBreakdown = expenseBreakdown;
  trip.expenses = totalExpenses;
  trip.reviewNotes = data.reviewNotes?.trim() || '';
  if (data.notes !== undefined) trip.notes = data.notes;

  const now = new Date();
  trip.status = TRIP_STATUS.REVIEWED;
  trip.reviewedAt = now;
  trip.completedAt = now;
  trip.reviewedBy = userId;
  trip.updatedBy = userId;
  await trip.save();

  await logHistory(trip._id, TRIP_HISTORY_ACTIONS.REVIEWED, `Trip ${trip.tripNumber} reviewed and closed`, userId, {
    revenue: trip.revenue,
    expenses: trip.expenses,
    profit: Math.round((trip.revenue - trip.expenses) * 100) / 100,
    reviewNotes: trip.reviewNotes,
  });
  await logActivity(
    ACTIVITY_TYPES.TRIP_REVIEWED,
    'Trip reviewed and closed',
    `${trip.tripNumber} closed — revenue ${trip.revenue}, profit ${Math.round((trip.revenue - trip.expenses) * 100) / 100}`,
    userId,
    trip._id
  );

  const populated = await Trip.findById(trip._id)
    .populate(driverPopulate)
    .populate(vehiclePopulate)
    .populate(routePopulate)
    .populate(reviewerPopulate)
    .lean();

  const formatted = formatTrip(populated);
  socketService.emitTripCompleted(formatted);
  return formatted;
};

export const getPendingReviewTrips = async (query = {}) => {
  return getTrips(
    {
      ...query,
      status: TRIP_STATUS.PENDING_DISPATCHER_REVIEW,
      sort: query.sort || 'submittedAt:desc',
    },
    null
  );
};

export const cancelTrip = async (id, data, userId, user = null) => {
  const trip = await Trip.findOne({ _id: id, isDeleted: false });
  if (!trip) throw new AppError('Trip not found', 404);
  if (user) await assertTripDriverAccess(trip, user);

  if ([TRIP_STATUS.REVIEWED, TRIP_STATUS.COMPLETED, TRIP_STATUS.CANCELLED, TRIP_STATUS.PENDING_DISPATCHER_REVIEW].includes(trip.status)) {
    throw new AppError('Trip cannot be cancelled', 400);
  }

  const wasInProgress = trip.status === TRIP_STATUS.IN_PROGRESS;

  trip.status = TRIP_STATUS.CANCELLED;
  if (data.notes) trip.notes = data.notes;
  trip.updatedBy = userId;
  await trip.save();

  if (wasInProgress) {
    const driver = await Driver.findById(trip.driver);
    if (driver && driver.status === DRIVER_STATUS.ON_TRIP) {
      driver.status = DRIVER_STATUS.AVAILABLE;
      await driver.save();
    }

    const vehicle = await Vehicle.findById(trip.vehicle);
    if (vehicle) {
      vehicle.ignition = false;
      vehicle.speed = 0;
      vehicle.engineStatus = 'off';
      await vehicle.save();
    }
  }

  await logHistory(trip._id, TRIP_HISTORY_ACTIONS.CANCELLED, `Trip ${trip.tripNumber} cancelled`, userId);
  await logActivity(
    ACTIVITY_TYPES.TRIP_CANCELLED,
    'Trip cancelled',
    `${trip.tripNumber} was cancelled`,
    userId,
    trip._id
  );

  const populated = await Trip.findById(trip._id)
    .populate(driverPopulate)
    .populate(vehiclePopulate)
    .populate(routePopulate)
    .lean();

  const formatted = formatTrip(populated);
  socketService.emitTripCancelled(formatted);

  await notifyTripEvent(trip, {
    title: 'Trip Cancelled',
    message: `Trip ${trip.tripNumber} has been cancelled`,
    event: 'cancelled',
  });

  return formatted;
};

export const getTripHistory = async (id, query) => {
  const trip = await Trip.findOne({ _id: id, isDeleted: false });
  if (!trip) throw new AppError('Trip not found', 404);

  const { page, limit, skip, sort } = getPagination(query);

  const [history, total] = await Promise.all([
    TripHistory.find({ trip: id })
      .populate('performedBy', 'firstName lastName email')
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean(),
    TripHistory.countDocuments({ trip: id }),
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

export const getMetaDrivers = async () => {
  const drivers = await Driver.find({
    isDeleted: false,
    status: { $in: [DRIVER_STATUS.AVAILABLE, DRIVER_STATUS.ON_TRIP] },
  })
    .select('firstName lastName email phone status licenseNumber assignedVehicle')
    .sort({ firstName: 1 })
    .lean();

  return drivers.map((d) => ({
    id: d._id,
    name: `${d.firstName} ${d.lastName}`,
    email: d.email,
    phone: d.phone,
    status: d.status,
    licenseNumber: d.licenseNumber,
    assignedVehicleId: d.assignedVehicle,
  }));
};

export const getMetaVehicles = async () => {
  const vehicles = await Vehicle.find({
    isDeleted: false,
    status: VEHICLE_STATUS.ACTIVE,
  })
    .select('vehicleNumber model manufacturer status odometer fuelLevel assignedDriver')
    .sort({ vehicleNumber: 1 })
    .lean();

  return vehicles.map((v) => ({
    id: v._id,
    vehicleNumber: v.vehicleNumber,
    model: v.model,
    manufacturer: v.manufacturer,
    status: v.status,
    odometer: v.odometer,
    fuelLevel: v.fuelLevel,
    assignedDriverId: v.assignedDriver,
  }));
};

export const getMetaRoutes = async () => {
  const routes = await Route.find({ isDeleted: false, status: 'active' })
    .select('routeNumber name origin destination totalDistanceMeters estimatedDurationMinutes')
    .sort({ routeNumber: 1 })
    .lean();

  return routes.map((r) => ({
    id: r._id,
    routeNumber: r.routeNumber,
    name: r.name,
    origin: formatLocation(r.origin),
    destination: formatLocation(r.destination),
    totalDistanceMeters: r.totalDistanceMeters,
    estimatedDurationMinutes: r.estimatedDurationMinutes,
  }));
};

export const getMetaFuelStations = async () => {
  const stations = await fuelStationService.getActiveStationsList();
  return stations.map((s) => ({
    id: s.id,
    name: s.name,
    brand: s.brand,
    city: s.city,
  }));
};

export const exportTripsCSV = async (query) => {
  const filter = buildFilter(query);
  const trips = await Trip.find(filter)
    .populate(driverPopulate)
    .populate(vehiclePopulate)
    .populate(routePopulate)
    .sort({ scheduledAt: -1 })
    .limit(5000)
    .lean();

  const columns = [
    { header: 'Trip Number', accessor: 'tripNumber' },
    { header: 'Status', accessor: 'status' },
    { header: 'Driver', accessor: (t) => (t.driver ? `${t.driver.firstName} ${t.driver.lastName}` : '') },
    { header: 'Vehicle', accessor: (t) => t.vehicle?.vehicleNumber || '' },
    { header: 'Route', accessor: (t) => t.route?.routeNumber || '' },
    { header: 'Origin', accessor: (t) => t.origin?.address || '' },
    { header: 'Destination', accessor: (t) => t.destination?.address || '' },
    { header: 'Scheduled', accessor: (t) => new Date(t.scheduledAt).toISOString().split('T')[0] },
    { header: 'Distance (km)', accessor: 'distance' },
    { header: 'Est. Cost', accessor: 'estimatedCost' },
    { header: 'Expenses', accessor: 'expenses' },
  ];

  return objectsToCSV(trips, columns);
};

export default {
  getTrips,
  getTripById,
  getMyDriverProfile,
  getMyActiveTrip,
  getMyScheduledTrips,
  getTripStats,
  getUpcomingTrips,
  getTripAnalytics,
  createTrip,
  updateTrip,
  deleteTrip,
  startTrip,
  completeTrip,
  reviewTrip,
  getPendingReviewTrips,
  cancelTrip,
  getTripHistory,
  getMetaDrivers,
  getMetaVehicles,
  getMetaRoutes,
  exportTripsCSV,
};
