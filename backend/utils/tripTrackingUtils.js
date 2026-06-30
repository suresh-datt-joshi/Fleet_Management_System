import { haversineDistance } from './geoUtils.js';

const toPoint = (location) => {
  if (!location) return null;
  const lat = location.lat ?? location.coordinates?.[1];
  const lng = location.lng ?? location.coordinates?.[0];
  if (lat === undefined || lng === undefined) return null;
  return { lat, lng };
};

export const pathFromRoute = (route, trip) => {
  if (route?.pathCoordinates?.length > 1) {
    return route.pathCoordinates.map(([lng, lat]) => ({ lat, lng }));
  }

  const points = [];
  const origin = toPoint(trip?.origin || route?.origin);
  const destination = toPoint(trip?.destination || route?.destination);
  const stops = (route?.optimizedStops?.length ? route.optimizedStops : route?.stops) || [];

  if (origin) points.push(origin);
  stops
    .slice()
    .sort((a, b) => (a.sequence || 0) - (b.sequence || 0))
    .forEach((stop) => {
      const point = toPoint(stop);
      if (point) points.push(point);
    });
  if (destination) points.push(destination);

  return points.length > 1 ? points : [];
};

export const computePathDistanceMeters = (points) => {
  if (!points || points.length < 2) return 0;

  let total = 0;
  for (let i = 0; i < points.length - 1; i += 1) {
    total += haversineDistance(points[i].lng, points[i].lat, points[i + 1].lng, points[i + 1].lat);
  }
  return total;
};

export const computeProgressAlongPath = (path, currentLat, currentLng) => {
  if (!path?.length || currentLat === undefined || currentLng === undefined) {
    return { percent: 0, distanceCoveredMeters: 0, distanceRemainingMeters: 0 };
  }

  if (path.length === 1) {
    return { percent: 0, distanceCoveredMeters: 0, distanceRemainingMeters: 0 };
  }

  let closestIndex = 0;
  let closestDistance = Infinity;

  path.forEach((point, index) => {
    const distance = haversineDistance(currentLng, currentLat, point.lng, point.lat);
    if (distance < closestDistance) {
      closestDistance = distance;
      closestIndex = index;
    }
  });

  let covered = 0;
  for (let i = 0; i < closestIndex; i += 1) {
    covered += haversineDistance(path[i].lng, path[i].lat, path[i + 1].lng, path[i + 1].lat);
  }

  if (closestIndex < path.length - 1) {
    covered += haversineDistance(
      path[closestIndex].lng,
      path[closestIndex].lat,
      currentLng,
      currentLat
    );
  }

  const total = computePathDistanceMeters(path);
  const remaining = Math.max(0, total - covered);
  const percent = total > 0 ? Math.min(100, Math.round((covered / total) * 100)) : 0;

  return {
    percent,
    distanceCoveredMeters: Math.round(covered),
    distanceRemainingMeters: Math.round(remaining),
  };
};

export const resolveStops = (route) => {
  const stops = (route?.optimizedStops?.length ? route.optimizedStops : route?.stops) || [];
  return stops
    .slice()
    .sort((a, b) => (a.sequence || 0) - (b.sequence || 0))
    .map((stop) => ({
      id: stop._id?.toString() || `${stop.sequence}-${stop.name}`,
      sequence: stop.sequence,
      name: stop.name,
      address: stop.address || '',
      lat: stop.lat,
      lng: stop.lng,
      stopType: stop.stopType,
      estimatedDurationMinutes: stop.estimatedDurationMinutes ?? 15,
    }));
};

export const resolveCurrentAndNextStop = (stops, currentLat, currentLng, thresholdMeters = 400) => {
  if (!stops.length || currentLat === undefined || currentLng === undefined) {
    return { currentStop: null, nextStop: stops[0] || null };
  }

  let currentStop = null;
  let nextStop = null;

  for (const stop of stops) {
    const distance = haversineDistance(currentLng, currentLat, stop.lng, stop.lat);
    if (distance <= thresholdMeters) {
      currentStop = { ...stop, distanceMeters: Math.round(distance) };
    } else if (!nextStop) {
      nextStop = { ...stop, distanceMeters: Math.round(distance) };
      break;
    }
  }

  if (!currentStop && !nextStop) {
    nextStop = stops[stops.length - 1]
      ? {
          ...stops[stops.length - 1],
          distanceMeters: Math.round(
            haversineDistance(currentLng, currentLat, stops[stops.length - 1].lng, stops[stops.length - 1].lat)
          ),
        }
      : null;
  }

  return { currentStop, nextStop };
};

export const computeEta = ({ startedAt, distanceRemainingMeters, speedKmh, estimatedDurationMinutes }) => {
  const speed = speedKmh > 5 ? speedKmh : 35;
  const minutesFromSpeed =
    distanceRemainingMeters > 0 ? Math.ceil(distanceRemainingMeters / 1000 / (speed / 60)) : 0;
  const minutesFromSchedule = estimatedDurationMinutes || 0;
  const elapsedMinutes = startedAt
    ? Math.max(0, Math.round((Date.now() - new Date(startedAt).getTime()) / 60000))
    : 0;
  const remainingMinutes = Math.max(
    5,
    minutesFromSpeed || Math.max(0, minutesFromSchedule - elapsedMinutes)
  );

  return {
    estimatedArrivalAt: new Date(Date.now() + remainingMinutes * 60 * 1000).toISOString(),
    etaMinutes: remainingMinutes,
    elapsedMinutes,
  };
};

export default {
  pathFromRoute,
  computePathDistanceMeters,
  computeProgressAlongPath,
  resolveStops,
  resolveCurrentAndNextStop,
  computeEta,
};
