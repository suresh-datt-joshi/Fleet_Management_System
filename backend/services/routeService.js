import Route from '../models/Route.js';
import RouteHistory from '../models/RouteHistory.js';
import Activity from '../models/Activity.js';
import AppError from '../utils/AppError.js';
import { getPagination, buildPaginationMeta } from '../utils/pagination.js';
import { objectsToCSV } from '../utils/csvExport.js';
import { escapeRegex } from '../utils/escapeRegex.js';
import { optimizeRouteAsync, computeRouteMetricsAsync } from './routeOptimizationService.js';
import { getTrafficConditions } from './mockTrafficService.js';
import * as mapsService from './mapsService.js';
import config from '../config/index.js';
import {
  ROUTE_STATUS,
  ROUTE_HISTORY_ACTIONS,
  ACTIVITY_TYPES,
} from '../constants/enums.js';

const isGoogleMapsEnabled = () =>
  Boolean(config.googleMaps?.apiKey && config.googleMaps.apiKey !== 'your-google-maps-api-key');

const formatRoute = (route) => {
  const r = route.toObject ? route.toObject() : route;
  return {
    id: r._id,
    routeNumber: r.routeNumber,
    name: r.name,
    description: r.description,
    status: r.status,
    origin: r.origin,
    destination: r.destination,
    stops: (r.stops || []).map((s) => ({
      id: s._id,
      sequence: s.sequence,
      name: s.name,
      address: s.address,
      lat: s.lat,
      lng: s.lng,
      stopType: s.stopType,
      estimatedDurationMinutes: s.estimatedDurationMinutes,
      notes: s.notes,
    })),
    optimizedStops: (r.optimizedStops || []).map((s) => ({
      id: s._id,
      sequence: s.sequence,
      name: s.name,
      address: s.address,
      lat: s.lat,
      lng: s.lng,
      stopType: s.stopType,
      estimatedDurationMinutes: s.estimatedDurationMinutes,
      notes: s.notes,
    })),
    pathCoordinates: r.pathCoordinates || [],
    totalDistanceMeters: r.totalDistanceMeters,
    totalDistanceKm: Number((r.totalDistanceMeters / 1000).toFixed(2)),
    estimatedDurationMinutes: r.estimatedDurationMinutes,
    estimatedArrivalAt: r.estimatedArrivalAt,
    trafficLevel: r.trafficLevel,
    trafficDelayMinutes: r.trafficDelayMinutes,
    averageSpeedKmh: r.averageSpeedKmh,
    isOptimized: r.isOptimized,
    optimizedAt: r.optimizedAt,
    tags: r.tags || [],
    notes: r.notes,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
  };
};

const logHistory = async (routeId, action, description, userId, changes = null) => {
  await RouteHistory.create({
    route: routeId,
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
    entityType: 'route',
    entityId,
    user: userId,
  });
};

const generateRouteNumber = async () => {
  const prefix = `RT-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}`;
  const count = await Route.countDocuments({ routeNumber: new RegExp(`^${prefix}`) });
  return `${prefix}-${String(count + 1).padStart(4, '0')}`;
};

const normalizeStops = (stops = []) =>
  stops.map((stop, index) => ({
    sequence: stop.sequence ?? index + 1,
    name: stop.name,
    address: stop.address || '',
    lat: stop.lat,
    lng: stop.lng,
    stopType: stop.stopType || 'waypoint',
    estimatedDurationMinutes: stop.estimatedDurationMinutes ?? 15,
    notes: stop.notes || '',
  }));

const buildFilter = (query) => {
  const filter = { isDeleted: false };

  if (query.status) filter.status = query.status;
  if (query.isOptimized === 'true') filter.isOptimized = true;
  if (query.isOptimized === 'false') filter.isOptimized = false;
  if (query.trafficLevel) filter.trafficLevel = query.trafficLevel;

  if (query.search) {
    const regex = new RegExp(escapeRegex(query.search), 'i');
    filter.$or = [{ name: regex }, { routeNumber: regex }, { description: regex }];
  }

  if (query.tag) {
    filter.tags = query.tag;
  }

  return filter;
};

export const getRoutes = async (query) => {
  const { page, limit, skip, sort } = getPagination(query);
  const filter = buildFilter(query);

  const [routes, total] = await Promise.all([
    Route.find(filter).sort(sort).skip(skip).limit(limit).lean(),
    Route.countDocuments(filter),
  ]);

  return {
    routes: routes.map(formatRoute),
    pagination: buildPaginationMeta(total, page, limit),
  };
};

export const getRouteById = async (id) => {
  const route = await Route.findOne({ _id: id, isDeleted: false }).lean();
  if (!route) throw new AppError('Route not found', 404);
  return formatRoute(route);
};

export const getRouteStats = async () => {
  const notDeleted = { isDeleted: false };
  const [total, active, draft, optimized, avgDistance] = await Promise.all([
    Route.countDocuments(notDeleted),
    Route.countDocuments({ ...notDeleted, status: ROUTE_STATUS.ACTIVE }),
    Route.countDocuments({ ...notDeleted, status: ROUTE_STATUS.DRAFT }),
    Route.countDocuments({ ...notDeleted, isOptimized: true }),
    Route.aggregate([
      { $match: notDeleted },
      { $group: { _id: null, avg: { $avg: '$totalDistanceMeters' } } },
    ]),
  ]);

  return {
    total,
    active,
    draft,
    optimized,
    averageDistanceKm: Number(((avgDistance[0]?.avg || 0) / 1000).toFixed(1)),
    trafficProvider: isGoogleMapsEnabled() ? 'google' : 'mock',
  };
};

export const createRoute = async (data, userId) => {
  const stops = normalizeStops(data.stops);
  const metrics = await computeRouteMetricsAsync({
    origin: data.origin,
    destination: data.destination,
    stops,
    averageSpeedKmh: data.averageSpeedKmh || 45,
  });

  const routeNumber = data.routeNumber?.toUpperCase() || (await generateRouteNumber());

  const existing = await Route.findOne({ routeNumber, isDeleted: false });
  if (existing) throw new AppError('Route number already exists', 409);

  const route = await Route.create({
    routeNumber,
    name: data.name,
    description: data.description || '',
    status: data.status || ROUTE_STATUS.DRAFT,
    origin: data.origin,
    destination: data.destination,
    stops,
    pathCoordinates: metrics.pathCoordinates,
    totalDistanceMeters: metrics.totalDistanceMeters,
    estimatedDurationMinutes: metrics.estimatedDurationMinutes,
    estimatedArrivalAt: metrics.estimatedArrivalAt,
    trafficLevel: metrics.trafficLevel,
    trafficDelayMinutes: metrics.trafficDelayMinutes,
    averageSpeedKmh: data.averageSpeedKmh || 45,
    tags: data.tags || [],
    notes: data.notes || '',
    createdBy: userId,
    updatedBy: userId,
  });

  await logHistory(route._id, ROUTE_HISTORY_ACTIONS.CREATED, `Route ${route.routeNumber} created`, userId);
  await logActivity(
    ACTIVITY_TYPES.ROUTE_CREATED,
    'Route created',
    `${route.routeNumber} — ${route.name}`,
    userId,
    route._id
  );

  return formatRoute(route);
};

export const updateRoute = async (id, data, userId) => {
  const route = await Route.findOne({ _id: id, isDeleted: false });
  if (!route) throw new AppError('Route not found', 404);

  if (data.routeNumber && data.routeNumber.toUpperCase() !== route.routeNumber) {
    const existing = await Route.findOne({
      routeNumber: data.routeNumber.toUpperCase(),
      isDeleted: false,
      _id: { $ne: id },
    });
    if (existing) throw new AppError('Route number already exists', 409);
    route.routeNumber = data.routeNumber.toUpperCase();
  }

  const updatable = ['name', 'description', 'status', 'origin', 'destination', 'tags', 'notes', 'averageSpeedKmh'];
  updatable.forEach((field) => {
    if (data[field] !== undefined) route[field] = data[field];
  });

  if (data.stops) {
    route.stops = normalizeStops(data.stops);
    route.isOptimized = false;
    route.optimizedStops = [];
    route.optimizedAt = null;
  }

  const metrics = await computeRouteMetricsAsync({
    origin: route.origin,
    destination: route.destination,
    stops: route.stops,
    averageSpeedKmh: route.averageSpeedKmh,
  });

  route.pathCoordinates = metrics.pathCoordinates;
  route.totalDistanceMeters = metrics.totalDistanceMeters;
  route.estimatedDurationMinutes = metrics.estimatedDurationMinutes;
  route.estimatedArrivalAt = metrics.estimatedArrivalAt;
  route.trafficLevel = metrics.trafficLevel;
  route.trafficDelayMinutes = metrics.trafficDelayMinutes;
  route.updatedBy = userId;

  await route.save();

  await logHistory(route._id, ROUTE_HISTORY_ACTIONS.UPDATED, `Route ${route.routeNumber} updated`, userId);
  await logActivity(
    ACTIVITY_TYPES.ROUTE_UPDATED,
    'Route updated',
    `${route.routeNumber} — ${route.name}`,
    userId,
    route._id
  );

  return formatRoute(route);
};

export const deleteRoute = async (id, userId) => {
  const route = await Route.findOne({ _id: id, isDeleted: false });
  if (!route) throw new AppError('Route not found', 404);

  route.isDeleted = true;
  route.deletedAt = new Date();
  route.status = ROUTE_STATUS.ARCHIVED;
  route.updatedBy = userId;
  await route.save();

  await logHistory(route._id, ROUTE_HISTORY_ACTIONS.DELETED, `Route ${route.routeNumber} deleted`, userId);

  return { message: 'Route deleted successfully' };
};

export const optimizeRouteById = async (id, userId, options = {}) => {
  const route = await Route.findOne({ _id: id, isDeleted: false });
  if (!route) throw new AppError('Route not found', 404);

  const beforeDuration = route.estimatedDurationMinutes || 0;
  const beforeDistance = route.totalDistanceMeters || 0;

  const result = await optimizeRouteAsync({
    origin: route.origin,
    destination: route.destination,
    stops: route.stops.map((s) => s.toObject()),
    averageSpeedKmh: route.averageSpeedKmh,
    trafficOptions: options,
  });

  result.savings = {
    durationMinutes: Math.max(0, beforeDuration - result.estimatedDurationMinutes),
    distanceMeters: Math.max(0, beforeDistance - result.totalDistanceMeters),
  };

  route.optimizedStops = result.optimizedStops;
  route.pathCoordinates = result.pathCoordinates;
  route.totalDistanceMeters = result.totalDistanceMeters;
  route.estimatedDurationMinutes = result.estimatedDurationMinutes;
  route.estimatedArrivalAt = result.estimatedArrivalAt;
  route.trafficLevel = result.trafficLevel;
  route.trafficDelayMinutes = result.trafficDelayMinutes;
  route.isOptimized = true;
  route.optimizedAt = result.optimizedAt;
  route.updatedBy = userId;

  await route.save();

  const historyMessage =
    result.savings.durationMinutes > 0
      ? `Route ${route.routeNumber} optimized for live traffic — ${result.savings.durationMinutes} min faster`
      : `Route ${route.routeNumber} optimized for current traffic conditions`;

  await logHistory(route._id, ROUTE_HISTORY_ACTIONS.OPTIMIZED, historyMessage, userId, {
    savings: result.savings,
    optimizationType: result.optimizationType,
  });
  await logActivity(
    ACTIVITY_TYPES.ROUTE_OPTIMIZED,
    'Route optimized for traffic',
    historyMessage,
    userId,
    route._id
  );

  return {
    route: formatRoute(route),
    optimization: {
      savings: result.savings,
      traffic: result.traffic,
      optimizationType: result.optimizationType,
    },
  };
};

export const duplicateRoute = async (id, userId) => {
  const source = await Route.findOne({ _id: id, isDeleted: false }).lean();
  if (!source) throw new AppError('Route not found', 404);

  const routeNumber = await generateRouteNumber();
  const duplicate = await Route.create({
    routeNumber,
    name: `${source.name} (Copy)`,
    description: source.description,
    status: ROUTE_STATUS.DRAFT,
    origin: source.origin,
    destination: source.destination,
    stops: source.stops.map(({ sequence, name, address, lat, lng, stopType, estimatedDurationMinutes, notes }) => ({
      sequence,
      name,
      address,
      lat,
      lng,
      stopType,
      estimatedDurationMinutes,
      notes,
    })),
    averageSpeedKmh: source.averageSpeedKmh,
    tags: source.tags,
    notes: source.notes,
    createdBy: userId,
    updatedBy: userId,
  });

  const metrics = await computeRouteMetricsAsync({
    origin: duplicate.origin,
    destination: duplicate.destination,
    stops: duplicate.stops,
    averageSpeedKmh: duplicate.averageSpeedKmh,
  });

  duplicate.pathCoordinates = metrics.pathCoordinates;
  duplicate.totalDistanceMeters = metrics.totalDistanceMeters;
  duplicate.estimatedDurationMinutes = metrics.estimatedDurationMinutes;
  duplicate.estimatedArrivalAt = metrics.estimatedArrivalAt;
  duplicate.trafficLevel = metrics.trafficLevel;
  duplicate.trafficDelayMinutes = metrics.trafficDelayMinutes;
  await duplicate.save();

  await logHistory(
    duplicate._id,
    ROUTE_HISTORY_ACTIONS.DUPLICATED,
    `Duplicated from ${source.routeNumber}`,
    userId
  );

  return formatRoute(duplicate);
};

export const getRouteHistory = async (id, query) => {
  const route = await Route.findOne({ _id: id, isDeleted: false });
  if (!route) throw new AppError('Route not found', 404);

  const { page, limit, skip, sort } = getPagination(query);

  const [history, total] = await Promise.all([
    RouteHistory.find({ route: id })
      .populate('performedBy', 'firstName lastName email')
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean(),
    RouteHistory.countDocuments({ route: id }),
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

export const getTrafficPreview = async () => {
  if (isGoogleMapsEnabled()) {
    try {
      const metrics = await mapsService.getRouteMetrics({
        origin: { address: 'New York, NY' },
        destination: { address: 'Times Square, New York, NY' },
      });
      if (metrics?.traffic) {
        return metrics.traffic;
      }
    } catch {
      // fall back to mock preview
    }
  }

  return getTrafficConditions();
};

export const exportRoutesCSV = async (query) => {
  const filter = buildFilter(query);
  const routes = await Route.find(filter).sort({ createdAt: -1 }).limit(5000).lean();

  const columns = [
    { header: 'Route Number', accessor: 'routeNumber' },
    { header: 'Name', accessor: 'name' },
    { header: 'Status', accessor: 'status' },
    { header: 'Origin', accessor: (r) => r.origin?.address || '' },
    { header: 'Destination', accessor: (r) => r.destination?.address || '' },
    { header: 'Stops', accessor: (r) => r.stops?.length || 0 },
    { header: 'Distance (km)', accessor: (r) => ((r.totalDistanceMeters || 0) / 1000).toFixed(2) },
    { header: 'Duration (min)', accessor: 'estimatedDurationMinutes' },
    { header: 'Traffic', accessor: 'trafficLevel' },
    { header: 'Optimized', accessor: (r) => (r.isOptimized ? 'Yes' : 'No') },
    { header: 'Created At', accessor: (r) => new Date(r.createdAt).toISOString() },
  ];

  return objectsToCSV(routes, columns);
};

export default {
  getRoutes,
  getRouteById,
  getRouteStats,
  createRoute,
  updateRoute,
  deleteRoute,
  optimizeRouteById,
  duplicateRoute,
  getRouteHistory,
  getTrafficPreview,
  exportRoutesCSV,
};
