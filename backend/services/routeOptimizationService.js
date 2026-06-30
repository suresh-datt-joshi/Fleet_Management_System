import { haversineDistance } from '../utils/geoUtils.js';
import { getTrafficConditions, applyTrafficToDuration } from './mockTrafficService.js';
import * as mapsService from './mapsService.js';

const DEFAULT_SPEED_KMH = 45;
const METERS_PER_KM = 1000;
const MINUTES_PER_HOUR = 60;

const toPoint = (location) => ({
  lat: location.lat,
  lng: location.lng,
  name: location.name || location.address || 'Point',
  address: location.address || '',
});

const distanceBetween = (a, b) => haversineDistance(a.lng, a.lat, b.lng, b.lat);

export const calculateSegmentMetrics = (points, averageSpeedKmh = DEFAULT_SPEED_KMH) => {
  let totalDistanceMeters = 0;
  let drivingMinutes = 0;

  for (let i = 0; i < points.length - 1; i += 1) {
    const segmentMeters = distanceBetween(points[i], points[i + 1]);
    totalDistanceMeters += segmentMeters;
    drivingMinutes += (segmentMeters / METERS_PER_KM / averageSpeedKmh) * MINUTES_PER_HOUR;
  }

  return {
    totalDistanceMeters: Math.round(totalDistanceMeters),
    drivingMinutes: Math.round(drivingMinutes),
  };
};

export const buildPathCoordinates = (points) =>
  points.map((p) => [p.lng, p.lat]);

const nearestNeighborOrder = (origin, stops, destination) => {
  const remaining = stops.map((stop, index) => ({ ...stop, originalIndex: index }));
  const ordered = [];
  let current = origin;

  while (remaining.length > 0) {
    let nearestIdx = 0;
    let nearestDist = Infinity;

    for (let i = 0; i < remaining.length; i += 1) {
      const dist = distanceBetween(current, remaining[i]);
      if (dist < nearestDist) {
        nearestDist = dist;
        nearestIdx = i;
      }
    }

    const next = remaining.splice(nearestIdx, 1)[0];
    ordered.push(next);
    current = next;
  }

  // Ensure destination is last in path calculation (return ordered stops only)
  return ordered;
};

export const optimizeRoute = ({
  origin,
  destination,
  stops = [],
  averageSpeedKmh = DEFAULT_SPEED_KMH,
  trafficOptions = {},
}) => {
  const originPoint = toPoint(origin);
  const destinationPoint = toPoint(destination);
  const stopPoints = stops.map((s) => ({
    ...s,
    lat: s.lat,
    lng: s.lng,
    name: s.name,
    address: s.address || '',
    stopType: s.stopType,
    estimatedDurationMinutes: s.estimatedDurationMinutes ?? 15,
    notes: s.notes || '',
  }));

  const optimizedStops = nearestNeighborOrder(originPoint, stopPoints, destinationPoint).map(
    (stop, index) => ({
      ...stop,
      sequence: index + 1,
    })
  );

  const pathPoints = [originPoint, ...optimizedStops, destinationPoint];
  const { totalDistanceMeters, drivingMinutes } = calculateSegmentMetrics(pathPoints, averageSpeedKmh);

  const stopDurationMinutes = optimizedStops.reduce(
    (sum, s) => sum + (s.estimatedDurationMinutes || 0),
    0
  );

  const traffic = getTrafficConditions(trafficOptions);
  const baseDuration = drivingMinutes + stopDurationMinutes;
  const estimatedDurationMinutes = applyTrafficToDuration(baseDuration, traffic);
  const estimatedArrivalAt = new Date(Date.now() + estimatedDurationMinutes * 60 * 1000);

  const originalPath = [originPoint, ...stopPoints, destinationPoint];
  const originalMetrics = calculateSegmentMetrics(originalPath, averageSpeedKmh);
  const originalBaseDuration =
    originalMetrics.drivingMinutes +
    stopPoints.reduce((sum, s) => sum + (s.estimatedDurationMinutes || 0), 0);
  const originalDuration = applyTrafficToDuration(originalBaseDuration, traffic);

  return {
    optimizedStops,
    pathCoordinates: buildPathCoordinates(pathPoints),
    totalDistanceMeters,
    estimatedDurationMinutes,
    estimatedArrivalAt,
    trafficLevel: traffic.level,
    trafficDelayMinutes: traffic.delayMinutes + Math.round(baseDuration * (traffic.multiplier - 1)),
    isOptimized: true,
    optimizedAt: new Date(),
    savings: {
      distanceMeters: Math.max(0, originalMetrics.totalDistanceMeters - totalDistanceMeters),
      durationMinutes: Math.max(0, originalDuration - estimatedDurationMinutes),
    },
    traffic,
  };
};

export const computeRouteMetrics = ({
  origin,
  destination,
  stops = [],
  averageSpeedKmh = DEFAULT_SPEED_KMH,
  trafficOptions = {},
}) => {
  const originPoint = toPoint(origin);
  const destinationPoint = toPoint(destination);
  const orderedStops = [...stops].sort((a, b) => a.sequence - b.sequence);
  const stopPoints = orderedStops.map((s) => toPoint(s));
  const pathPoints = [originPoint, ...stopPoints, destinationPoint];

  const { totalDistanceMeters, drivingMinutes } = calculateSegmentMetrics(pathPoints, averageSpeedKmh);
  const stopDurationMinutes = orderedStops.reduce(
    (sum, s) => sum + (s.estimatedDurationMinutes || 0),
    0
  );

  const traffic = getTrafficConditions(trafficOptions);
  const baseDuration = drivingMinutes + stopDurationMinutes;
  const estimatedDurationMinutes = applyTrafficToDuration(baseDuration, traffic);

  return {
    pathCoordinates: buildPathCoordinates(pathPoints),
    totalDistanceMeters,
    estimatedDurationMinutes,
    estimatedArrivalAt: new Date(Date.now() + estimatedDurationMinutes * 60 * 1000),
    trafficLevel: traffic.level,
    trafficDelayMinutes: traffic.delayMinutes + Math.round(baseDuration * (traffic.multiplier - 1)),
    traffic,
    metricsProvider: 'estimate',
  };
};

export const computeRouteMetricsAsync = async (params) => {
  try {
    const googleMetrics = await mapsService.getRouteMetrics({
      origin: params.origin,
      destination: params.destination,
      stops: params.stops || [],
    });

    if (googleMetrics) {
      return {
        ...googleMetrics,
        metricsProvider: googleMetrics.provider,
      };
    }
  } catch (error) {
    console.warn('Google route metrics unavailable, using estimate:', error.message);
  }

  return computeRouteMetrics(params);
};

export const optimizeRouteAsync = async (params) => {
  const orderedStops = [...(params.stops || [])]
    .sort((a, b) => (a.sequence || 0) - (b.sequence || 0))
    .map((stop, index) => ({
      sequence: stop.sequence ?? index + 1,
      name: stop.name,
      address: stop.address || '',
      lat: stop.lat,
      lng: stop.lng,
      stopType: stop.stopType,
      estimatedDurationMinutes: stop.estimatedDurationMinutes ?? 15,
      notes: stop.notes || '',
    }));

  try {
    const googleMetrics = await mapsService.getRouteMetrics({
      origin: params.origin,
      destination: params.destination,
      stops: orderedStops,
    });

    if (googleMetrics) {
      return {
        optimizedStops: orderedStops,
        pathCoordinates: googleMetrics.pathCoordinates,
        totalDistanceMeters: googleMetrics.totalDistanceMeters,
        estimatedDurationMinutes: googleMetrics.estimatedDurationMinutes,
        estimatedArrivalAt: googleMetrics.estimatedArrivalAt,
        trafficLevel: googleMetrics.trafficLevel,
        trafficDelayMinutes: googleMetrics.trafficDelayMinutes,
        isOptimized: true,
        optimizedAt: new Date(),
        traffic: googleMetrics.traffic,
        metricsProvider: googleMetrics.provider,
        optimizationType: 'traffic',
        savings: { distanceMeters: 0, durationMinutes: 0 },
      };
    }
  } catch (error) {
    console.warn('Google traffic route optimization unavailable, using estimate:', error.message);
  }

  const traffic = getTrafficConditions(params.trafficOptions || {});
  const metrics = computeRouteMetrics({
    origin: params.origin,
    destination: params.destination,
    stops: orderedStops,
    averageSpeedKmh: params.averageSpeedKmh,
    trafficOptions: params.trafficOptions,
  });

  return {
    optimizedStops: orderedStops,
    pathCoordinates: metrics.pathCoordinates,
    totalDistanceMeters: metrics.totalDistanceMeters,
    estimatedDurationMinutes: metrics.estimatedDurationMinutes,
    estimatedArrivalAt: metrics.estimatedArrivalAt,
    trafficLevel: metrics.trafficLevel,
    trafficDelayMinutes: metrics.trafficDelayMinutes,
    isOptimized: true,
    optimizedAt: new Date(),
    traffic: metrics.traffic,
    metricsProvider: 'estimate',
    optimizationType: 'traffic_estimate',
    savings: { distanceMeters: 0, durationMinutes: 0 },
  };
};

export default {
  optimizeRoute,
  optimizeRouteAsync,
  computeRouteMetrics,
  computeRouteMetricsAsync,
  calculateSegmentMetrics,
  buildPathCoordinates,
};
