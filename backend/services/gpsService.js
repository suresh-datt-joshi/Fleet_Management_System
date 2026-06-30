import Vehicle from '../models/Vehicle.js';
import GpsLocationHistory from '../models/GpsLocationHistory.js';
import Geofence from '../models/Geofence.js';
import GeofenceEvent from '../models/GeofenceEvent.js';
import Alert from '../models/Alert.js';
import AppError from '../utils/AppError.js';
import { getPagination, buildPaginationMeta } from '../utils/pagination.js';
import { isPointInGeofence } from '../utils/geoUtils.js';
import * as mockGpsProvider from './mockGpsProvider.js';
import {
  VEHICLE_STATUS,
  ALERT_TYPES,
  ALERT_SEVERITY,
  GEOFENCE_EVENT_TYPES,
  ACTIVITY_TYPES,
} from '../constants/enums.js';
import Activity from '../models/Activity.js';
import Trip from '../models/Trip.js';
import * as socketService from './socketService.js';
import { pathFromRoute } from '../utils/tripTrackingUtils.js';
import { TRIP_STATUS } from '../constants/enums.js';

const OVERSPEED_LIMIT = 80;
const LOW_FUEL_THRESHOLD = 20;

const vehicleGeofenceState = new Map();
const vehiclePathState = new Map();

/** @deprecated Socket IO is initialized via initSockets; kept for gpsSimulator compatibility */
export const setGpsSocketIO = () => {};

const emitVehicleUpdate = (payload) => {
  socketService.emitGpsVehicleUpdate(payload);
};

const emitGpsAlert = (payload) => {
  socketService.emitGpsAlert(payload);
};

const formatLiveVehicle = (vehicle) => ({
  id: vehicle._id,
  vehicleNumber: vehicle.vehicleNumber,
  model: vehicle.model,
  manufacturer: vehicle.manufacturer,
  status: vehicle.status,
  fuelLevel: vehicle.fuelLevel,
  speed: vehicle.speed,
  heading: vehicle.heading || 0,
  ignition: vehicle.ignition,
  engineStatus: vehicle.engineStatus,
  odometer: vehicle.odometer,
  location: {
    lng: vehicle.currentLocation?.coordinates?.[0] || 0,
    lat: vehicle.currentLocation?.coordinates?.[1] || 0,
    address: vehicle.currentLocation?.address || '',
  },
  driver: vehicle.assignedDriver
    ? {
        id: vehicle.assignedDriver._id,
        name: `${vehicle.assignedDriver.firstName} ${vehicle.assignedDriver.lastName}`,
      }
    : null,
  lastUpdated: vehicle.updatedAt,
});

export const getLiveVehicles = async (query = {}) => {
  const filter = { isDeleted: false, status: VEHICLE_STATUS.ACTIVE };

  if (query.vehicleId) filter._id = query.vehicleId;
  if (query.ignition === 'true') filter.ignition = true;
  if (query.ignition === 'false') filter.ignition = false;

  const vehicles = await Vehicle.find(filter)
    .populate('assignedDriver', 'firstName lastName employeeId phone')
    .lean();

  return vehicles.map(formatLiveVehicle);
};

export const getVehicleLive = async (vehicleId) => {
  const vehicle = await Vehicle.findOne({ _id: vehicleId, isDeleted: false })
    .populate('assignedDriver', 'firstName lastName employeeId phone')
    .lean();

  if (!vehicle) throw new AppError('Vehicle not found', 404);
  return formatLiveVehicle(vehicle);
};

export const getVehicleHistory = async (vehicleId, query) => {
  const vehicle = await Vehicle.findOne({ _id: vehicleId, isDeleted: false });
  if (!vehicle) throw new AppError('Vehicle not found', 404);

  const { page, limit, skip, sort } = getPagination(query);
  const filter = { vehicle: vehicleId };

  if (query.from) filter.recordedAt = { ...filter.recordedAt, $gte: new Date(query.from) };
  if (query.to) filter.recordedAt = { ...filter.recordedAt, $lte: new Date(query.to) };

  const [history, total] = await Promise.all([
    GpsLocationHistory.find(filter).sort(sort).skip(skip).limit(limit).lean(),
    GpsLocationHistory.countDocuments(filter),
  ]);

  const route = history.map((h) => ({
    id: h._id,
    lng: h.location.coordinates[0],
    lat: h.location.coordinates[1],
    speed: h.speed,
    heading: h.heading,
    fuelLevel: h.fuelLevel,
    ignition: h.ignition,
    recordedAt: h.recordedAt,
  }));

  return { route, pagination: buildPaginationMeta(total, page, limit) };
};

export const getMockGpsData = async () => {
  const vehicles = await Vehicle.find({ isDeleted: false, status: VEHICLE_STATUS.ACTIVE }).lean();
  return mockGpsProvider.fetchFleetLocations(vehicles);
};

const createAlert = async (type, title, message, vehicle, severity = ALERT_SEVERITY.MEDIUM) => {
  const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000);
  const recent = await Alert.findOne({
    vehicle: vehicle._id,
    type,
    createdAt: { $gte: fiveMinAgo },
  });
  if (recent) return recent;
  const alert = await Alert.create({
    type,
    severity,
    title,
    message,
    vehicle: vehicle._id,
    driver: vehicle.assignedDriver || null,
  });

  await Activity.create({
    type: ACTIVITY_TYPES.ALERT_TRIGGERED,
    title,
    description: message,
    entityType: 'alert',
    entityId: alert._id,
  });

  emitGpsAlert({
    id: alert._id,
    type,
    severity,
    title,
    message,
    vehicleId: vehicle._id,
    vehicleNumber: vehicle.vehicleNumber,
    createdAt: alert.createdAt,
  });

  return alert;
};

const checkGeofences = async (vehicle, lng, lat, speed) => {
  const geofences = await Geofence.find({ isDeleted: false, isActive: true }).lean();
  const vehicleId = vehicle._id.toString();
  const prevState = vehicleGeofenceState.get(vehicleId) || {};

  for (const geofence of geofences) {
    const inside = isPointInGeofence(lng, lat, geofence);
    const wasInside = prevState[geofence._id.toString()] || false;

    if (inside && !wasInside && geofence.alertOnEnter) {
      await GeofenceEvent.create({
        geofence: geofence._id,
        vehicle: vehicle._id,
        eventType: GEOFENCE_EVENT_TYPES.ENTER,
        location: { type: 'Point', coordinates: [lng, lat] },
        speed,
      });
      await createAlert(
        ALERT_TYPES.GEOFENCE_ENTER,
        'Geofence Entry',
        `Vehicle ${vehicle.vehicleNumber} entered geofence "${geofence.name}"`,
        vehicle,
        ALERT_SEVERITY.LOW
      );
    }

    if (!inside && wasInside && geofence.alertOnExit) {
      await GeofenceEvent.create({
        geofence: geofence._id,
        vehicle: vehicle._id,
        eventType: GEOFENCE_EVENT_TYPES.EXIT,
        location: { type: 'Point', coordinates: [lng, lat] },
        speed,
      });
      await createAlert(
        ALERT_TYPES.GEOFENCE_EXIT,
        'Geofence Exit',
        `Vehicle ${vehicle.vehicleNumber} exited geofence "${geofence.name}"`,
        vehicle,
        ALERT_SEVERITY.HIGH
      );
    }

    if (geofence.speedLimit && inside && speed > geofence.speedLimit) {
      await createAlert(
        ALERT_TYPES.OVERSPEED,
        'Geofence Overspeed',
        `Vehicle ${vehicle.vehicleNumber} exceeded ${geofence.speedLimit} km/h in "${geofence.name}"`,
        vehicle,
        ALERT_SEVERITY.HIGH
      );
    }

    prevState[geofence._id.toString()] = inside;
  }

  vehicleGeofenceState.set(vehicleId, prevState);
};

export const processGpsUpdate = async (vehicle, gpsData) => {
  const { lng, lat, address, speed, heading, fuelLevel, ignition, engineStatus, odometer } = gpsData;

  vehicle.currentLocation = {
    type: 'Point',
    coordinates: [lng, lat],
    address: address || vehicle.currentLocation?.address || '',
  };
  vehicle.speed = speed;
  vehicle.heading = heading;
  vehicle.fuelLevel = fuelLevel;
  vehicle.ignition = ignition;
  vehicle.engineStatus = engineStatus;
  if (odometer) vehicle.odometer = odometer;

  await vehicle.save();

  const activeTrip = await Trip.findOne({
    vehicle: vehicle._id,
    status: TRIP_STATUS.IN_PROGRESS,
    isDeleted: false,
  }).select('_id driver');

  await GpsLocationHistory.create({
    vehicle: vehicle._id,
    driver: activeTrip?.driver || vehicle.assignedDriver,
    location: { type: 'Point', coordinates: [lng, lat] },
    address: vehicle.currentLocation.address,
    speed,
    heading,
    fuelLevel,
    ignition,
    engineStatus,
    odometer: vehicle.odometer,
    recordedAt: new Date(),
  });

  if (speed > OVERSPEED_LIMIT) {
    await createAlert(
      ALERT_TYPES.OVERSPEED,
      'Overspeed Detected',
      `Vehicle ${vehicle.vehicleNumber} traveling at ${Math.round(speed)} km/h`,
      vehicle,
      ALERT_SEVERITY.HIGH
    );
  }

  if (fuelLevel <= LOW_FUEL_THRESHOLD && fuelLevel > 0) {
    await createAlert(
      ALERT_TYPES.LOW_FUEL,
      'Low Fuel Alert',
      `Vehicle ${vehicle.vehicleNumber} fuel at ${Math.round(fuelLevel)}%`,
      vehicle,
      ALERT_SEVERITY.HIGH
    );
  }

  await checkGeofences(vehicle, lng, lat, speed);

  const populated = await Vehicle.findById(vehicle._id)
    .populate('assignedDriver', 'firstName lastName employeeId phone')
    .lean();

  const payload = formatLiveVehicle({ ...populated, heading });
  emitVehicleUpdate(payload);
  return payload;
};

export const simulateFleetGpsUpdates = async () => {
  const vehicles = await Vehicle.find({
    isDeleted: false,
    status: VEHICLE_STATUS.ACTIVE,
    ignition: true,
  });

  const activeTrips = await Trip.find({
    isDeleted: false,
    status: TRIP_STATUS.IN_PROGRESS,
  })
    .populate(
      'route',
      'pathCoordinates stops optimizedStops origin destination totalDistanceMeters estimatedDurationMinutes'
    )
    .lean();

  const tripByVehicle = new Map(activeTrips.map((trip) => [trip.vehicle.toString(), trip]));

  const updates = [];
  for (const vehicle of vehicles) {
    const trip = tripByVehicle.get(vehicle._id.toString());
    const routePath = trip ? pathFromRoute(trip.route, trip) : [];
    const vehicleKey = vehicle._id.toString();
    const currentPathState = vehiclePathState.get(vehicleKey) || { pathIndex: 0 };

    const gpsData = await mockGpsProvider.fetchVehicleLocation(vehicle, {
      routePath,
      pathIndex: currentPathState.pathIndex,
    });

    if (gpsData.pathIndex !== undefined) {
      vehiclePathState.set(vehicleKey, { pathIndex: gpsData.pathIndex });
    }

    const updated = await processGpsUpdate(vehicle, {
      lng: gpsData.location.lng,
      lat: gpsData.location.lat,
      address: gpsData.location.address,
      speed: gpsData.speed,
      heading: gpsData.heading,
      fuelLevel: gpsData.fuelLevel,
      ignition: gpsData.ignition,
      engineStatus: gpsData.engineStatus,
      odometer: gpsData.odometer,
    });
    updates.push(updated);
  }

  return updates;
};

export const getTrackingStats = async () => {
  const notDeleted = { isDeleted: false, status: VEHICLE_STATUS.ACTIVE };
  const [total, live, moving, idle, lowFuel, activeTrips] = await Promise.all([
    Vehicle.countDocuments(notDeleted),
    Vehicle.countDocuments({ ...notDeleted, ignition: true }),
    Vehicle.countDocuments({ ...notDeleted, ignition: true, speed: { $gt: 5 } }),
    Vehicle.countDocuments({ ...notDeleted, ignition: true, speed: { $lte: 5 } }),
    Vehicle.countDocuments({ ...notDeleted, fuelLevel: { $lte: LOW_FUEL_THRESHOLD } }),
    Trip.countDocuments({ isDeleted: false, status: TRIP_STATUS.IN_PROGRESS }),
  ]);

  return {
    total,
    live,
    moving,
    idle,
    lowFuel,
    activeTrips,
    geofenceCount: await Geofence.countDocuments({ isDeleted: false, isActive: true }),
    provider: mockGpsProvider.PROVIDER_NAME,
  };
};

export default {
  setGpsSocketIO,
  getLiveVehicles,
  getVehicleLive,
  getVehicleHistory,
  getMockGpsData,
  processGpsUpdate,
  simulateFleetGpsUpdates,
  getTrackingStats,
};
