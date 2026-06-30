export const ROUTE_STATUS = {
  DRAFT: 'draft',
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  ARCHIVED: 'archived',
};

export const ROUTE_STOP_TYPES = {
  PICKUP: 'pickup',
  DELIVERY: 'delivery',
  WAYPOINT: 'waypoint',
  FUEL: 'fuel',
  REST: 'rest',
};

export const TRAFFIC_LEVELS = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  SEVERE: 'severe',
};

export const statusColors = {
  draft: 'default',
  active: 'success',
  inactive: 'warning',
  archived: 'error',
};

export const trafficColors = {
  low: 'success',
  medium: 'warning',
  high: 'error',
  severe: 'error',
};

export const stopTypeLabels = {
  pickup: 'Pickup',
  delivery: 'Delivery',
  waypoint: 'Waypoint',
  fuel: 'Fuel Stop',
  rest: 'Rest Stop',
};

export const formatDistance = (meters) => {
  if (!meters) return '0 km';
  const km = meters / 1000;
  return km < 1 ? `${Math.round(meters)} m` : `${km.toFixed(1)} km`;
};

export const formatDuration = (minutes) => {
  if (!minutes) return '0 min';
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m ? `${h}h ${m}m` : `${h}h`;
};

export const getDisplayStops = (route) => {
  if (!route) return [];
  return [...(route.stops || [])].sort((a, b) => (a.sequence || 0) - (b.sequence || 0));
};

export const normalizeLocation = (location) => {
  if (!location) return null;
  const lat = Number(location.lat);
  const lng = Number(location.lng);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  return { ...location, lat, lng };
};

/** Backend stores path as [lng, lat]; maps expect [lat, lng]. */
export const pathCoordinatesToLatLng = (pathCoordinates = []) =>
  pathCoordinates
    .filter((coord) => Array.isArray(coord) && coord.length >= 2)
    .map(([lng, lat]) => [Number(lat), Number(lng)])
    .filter(([lat, lng]) => Number.isFinite(lat) && Number.isFinite(lng));

export const interpolateWaypointPath = (waypoints, stepsPerSegment = 16) => {
  if (waypoints.length < 2) return waypoints;

  const path = [];
  for (let i = 0; i < waypoints.length - 1; i += 1) {
    const [lat1, lng1] = waypoints[i];
    const [lat2, lng2] = waypoints[i + 1];
    for (let step = 0; step <= stepsPerSegment; step += 1) {
      if (i > 0 && step === 0) continue;
      const t = step / stepsPerSegment;
      path.push([lat1 + (lat2 - lat1) * t, lng1 + (lng2 - lng1) * t]);
    }
  }
  return path;
};

export const buildWaypointPath = (route, stops) => {
  const origin = normalizeLocation(route?.origin);
  const destination = normalizeLocation(route?.destination);
  if (!origin || !destination) return [];

  const stopPoints = stops
    .map(normalizeLocation)
    .filter(Boolean)
    .map((s) => [s.lat, s.lng]);

  return [ [origin.lat, origin.lng], ...stopPoints, [destination.lat, destination.lng] ];
};

export const buildMapPoints = (route) => {
  if (!route) return { path: [], markers: [], waypointPath: [] };
  const stops = getDisplayStops(route).map(normalizeLocation).filter(Boolean);
  const waypointPath = buildWaypointPath(route, stops);
  const storedPath = pathCoordinatesToLatLng(route.pathCoordinates);
  const simplePath = waypointPath.length >= 2 ? interpolateWaypointPath(waypointPath) : [];
  const path = storedPath.length >= 2 ? storedPath : simplePath;
  const markers = [];

  const origin = normalizeLocation(route.origin);
  if (origin) {
    markers.push({ type: 'origin', label: 'Origin', address: origin.address, ...origin });
  }

  stops.forEach((s, i) => {
    markers.push({
      type: 'stop',
      label: `${i + 1}. ${s.name}`,
      stopNumber: i + 1,
      ...s,
    });
  });

  const destination = normalizeLocation(route.destination);
  if (destination) {
    markers.push({
      type: 'destination',
      label: 'Destination',
      address: destination.address,
      ...destination,
    });
  }

  return { path, markers, waypointPath };
};
