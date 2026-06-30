import Trip from '../models/Trip.js';
import Vehicle from '../models/Vehicle.js';
import GpsLocationHistory from '../models/GpsLocationHistory.js';
import { TRIP_STATUS, VEHICLE_STATUS } from '../constants/enums.js';
import * as gpsService from './gpsService.js';
import {
  pathFromRoute,
  computeProgressAlongPath,
  resolveStops,
  resolveCurrentAndNextStop,
  computeEta,
  computePathDistanceMeters,
} from '../utils/tripTrackingUtils.js';

const formatRouteForTracking = (route) => {
  if (!route) return null;

  return {
    id: route._id,
    routeNumber: route.routeNumber,
    name: route.name,
    origin: route.origin,
    destination: route.destination,
    totalDistanceMeters: route.totalDistanceMeters,
    estimatedDurationMinutes: route.estimatedDurationMinutes,
    estimatedArrivalAt: route.estimatedArrivalAt,
    pathCoordinates: route.pathCoordinates || [],
    stops: resolveStops(route),
  };
};

const formatLiveFromVehicle = (vehicle) => ({
  lat: vehicle.currentLocation?.coordinates?.[1] ?? 0,
  lng: vehicle.currentLocation?.coordinates?.[0] ?? 0,
  address: vehicle.currentLocation?.address || '',
  speed: vehicle.speed || 0,
  heading: vehicle.heading || 0,
  fuelLevel: vehicle.fuelLevel ?? 0,
  ignition: Boolean(vehicle.ignition),
  engineStatus: vehicle.engineStatus || 'off',
  lastUpdated: vehicle.updatedAt,
});

const buildActiveTripEntry = async (trip, vehicleMap, breadcrumbMap) => {
  const vehicleDoc = vehicleMap.get(trip.vehicle._id.toString());
  const live = vehicleDoc ? formatLiveFromVehicle(vehicleDoc) : null;
  const route = formatRouteForTracking(trip.route);
  const plannedPath = pathFromRoute(trip.route, trip);
  const progress = computeProgressAlongPath(plannedPath, live?.lat, live?.lng);
  const { currentStop, nextStop } = resolveCurrentAndNextStop(route?.stops || [], live?.lat, live?.lng);
  const eta = computeEta({
    startedAt: trip.startedAt,
    distanceRemainingMeters: progress.distanceRemainingMeters,
    speedKmh: live?.speed || 0,
    estimatedDurationMinutes: route?.estimatedDurationMinutes || trip.route?.estimatedDurationMinutes,
  });

  const totalDistanceMeters =
    route?.totalDistanceMeters ||
    trip.route?.totalDistanceMeters ||
    computePathDistanceMeters(plannedPath) ||
    (trip.distance ? trip.distance * 1000 : 0);

  return {
    id: trip._id,
    tripNumber: trip.tripNumber,
    status: trip.status,
    startedAt: trip.startedAt,
    scheduledAt: trip.scheduledAt,
    origin: trip.origin,
    destination: trip.destination,
    distance: trip.distance,
    driver: trip.driver
      ? {
          id: trip.driver._id,
          name: `${trip.driver.firstName} ${trip.driver.lastName}`,
          phone: trip.driver.phone,
          email: trip.driver.email,
          status: trip.driver.status,
          licenseNumber: trip.driver.licenseNumber,
        }
      : null,
    vehicle: trip.vehicle
      ? {
          id: trip.vehicle._id,
          vehicleNumber: trip.vehicle.vehicleNumber,
          model: trip.vehicle.model,
          manufacturer: trip.vehicle.manufacturer,
          status: trip.vehicle.status,
          odometer: trip.vehicle.odometer,
          fuelLevel: vehicleDoc?.fuelLevel ?? trip.vehicle.fuelLevel,
        }
      : null,
    route,
    live,
    progress: {
      percent: progress.percent,
      distanceCoveredKm: Number((progress.distanceCoveredMeters / 1000).toFixed(2)),
      distanceRemainingKm: Number((progress.distanceRemainingMeters / 1000).toFixed(2)),
      totalDistanceKm: Number((totalDistanceMeters / 1000).toFixed(2)),
    },
    eta,
    currentStop,
    nextStop,
    plannedPath,
    breadcrumbPath: breadcrumbMap.get(trip.vehicle._id.toString()) || [],
  };
};

export const getLiveTrackingDashboard = async () => {
  const [activeTrips, vehicles, stats] = await Promise.all([
    Trip.find({ isDeleted: false, status: TRIP_STATUS.IN_PROGRESS })
      .populate('driver', 'firstName lastName email phone status licenseNumber')
      .populate('vehicle', 'vehicleNumber model manufacturer status odometer fuelLevel')
      .populate(
        'route',
        'routeNumber name origin destination totalDistanceMeters estimatedDurationMinutes estimatedArrivalAt pathCoordinates stops optimizedStops'
      )
      .sort({ startedAt: -1 })
      .lean(),
    Vehicle.find({ isDeleted: false, status: VEHICLE_STATUS.ACTIVE })
      .populate('assignedDriver', 'firstName lastName employeeId phone')
      .lean(),
    gpsService.getTrackingStats(),
  ]);

  const vehicleMap = new Map(vehicles.map((vehicle) => [vehicle._id.toString(), vehicle]));
  const vehicleIds = activeTrips.map((trip) => trip.vehicle._id);

  const histories = await Promise.all(
    vehicleIds.map(async (vehicleId) => {
      const history = await GpsLocationHistory.find({ vehicle: vehicleId })
        .sort({ recordedAt: -1 })
        .limit(50)
        .lean();
      return {
        vehicleId: vehicleId.toString(),
        route: history
          .reverse()
          .map((point) => ({
            lat: point.location.coordinates[1],
            lng: point.location.coordinates[0],
            speed: point.speed,
            recordedAt: point.recordedAt,
          })),
      };
    })
  );

  const breadcrumbMap = new Map(histories.map((item) => [item.vehicleId, item.route]));
  const formattedActiveTrips = await Promise.all(
    activeTrips.map((trip) => buildActiveTripEntry(trip, vehicleMap, breadcrumbMap))
  );

  const liveVehicles = vehicles.map((vehicle) => {
    const activeTrip = formattedActiveTrips.find(
      (trip) => trip.vehicle?.id?.toString() === vehicle._id.toString()
    );

    return {
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
            phone: vehicle.assignedDriver.phone,
          }
        : null,
      activeTripId: activeTrip?.id || null,
      activeTripNumber: activeTrip?.tripNumber || null,
    };
  });

  return {
    stats: {
      ...stats,
      activeTrips: formattedActiveTrips.length,
    },
    activeTrips: formattedActiveTrips,
    vehicles: liveVehicles,
    provider: stats.provider,
    updatedAt: new Date().toISOString(),
  };
};

export default { getLiveTrackingDashboard };
