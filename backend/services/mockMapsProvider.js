import { haversineDistance } from '../utils/geoUtils.js';
import { encodePolyline } from '../utils/polylineUtils.js';

export const PROVIDER_NAME = 'mock';

const DEFAULT_CENTER = { lat: 40.7128, lng: -74.006 };

const hashString = (str) => {
  let hash = 0;
  for (let i = 0; i < str.length; i += 1) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
};

const jitterFromSeed = (seed, scale = 0.05) => {
  const angle = (seed % 360) * (Math.PI / 180);
  return {
    lat: DEFAULT_CENTER.lat + Math.sin(angle) * scale,
    lng: DEFAULT_CENTER.lng + Math.cos(angle) * scale,
  };
};

const normalizeLocation = (input) => {
  if (typeof input === 'string') return { address: input };
  if (input?.lat !== undefined && input?.lng !== undefined) {
    return { lat: Number(input.lat), lng: Number(input.lng), address: input.address };
  }
  return { address: input?.address || '' };
};

const interpolateRoute = (origin, destination, steps = 12) => {
  const points = [];
  for (let i = 0; i <= steps; i += 1) {
    const t = i / steps;
    points.push({
      lat: origin.lat + (destination.lat - origin.lat) * t,
      lng: origin.lng + (destination.lng - origin.lng) * t,
    });
  }
  return points;
};

export const geocode = async (address) => {
  const seed = hashString(address);
  const location = jitterFromSeed(seed);

  return {
    provider: PROVIDER_NAME,
    results: [
      {
        formattedAddress: `${address}, New York, NY, USA (mock)`,
        placeId: `mock-place-${seed}`,
        location,
        types: ['mock'],
        addressComponents: {
          locality: 'New York',
          administrativeArea: 'NY',
          country: 'USA',
        },
      },
    ],
  };
};

export const reverseGeocode = async (lat, lng) => {
  const seed = hashString(`${lat},${lng}`);

  return {
    provider: PROVIDER_NAME,
    results: [
      {
        formattedAddress: `Mock Address ${seed % 1000}, New York, NY ${10000 + (seed % 89999)}, USA`,
        placeId: `mock-reverse-${seed}`,
        location: { lat: Number(lat), lng: Number(lng) },
        types: ['street_address'],
        addressComponents: {
          locality: 'New York',
          administrativeArea: 'NY',
          country: 'USA',
        },
      },
    ],
  };
};

export const getDirections = async ({ origin, destination, waypoints = [], mode = 'driving' }) => {
  const start = normalizeLocation(origin);
  const end = normalizeLocation(destination);

  let originPoint = start.lat !== undefined ? { lat: start.lat, lng: start.lng } : jitterFromSeed(hashString(start.address));
  let destPoint = end.lat !== undefined ? { lat: end.lat, lng: end.lng } : jitterFromSeed(hashString(end.address), 0.08);

  const viaPoints = waypoints.map((wp, index) => {
    const loc = normalizeLocation(wp);
    if (loc.lat !== undefined) return { lat: loc.lat, lng: loc.lng };
    return jitterFromSeed(hashString(loc.address || `wp-${index}`), 0.03 * (index + 1));
  });

  const segments = [originPoint, ...viaPoints, destPoint];
  const polyline = segments.flatMap((point, index) => {
    if (index === segments.length - 1) return [];
    return interpolateRoute(point, segments[index + 1], 8).slice(0, -1);
  });
  polyline.push(destPoint);

  const distanceMeters = Math.round(
    segments.slice(1).reduce((total, point, index) => {
      const prev = segments[index];
      return total + haversineDistance(prev.lng, prev.lat, point.lng, point.lat);
    }, 0)
  );

  const durationSeconds = Math.max(300, Math.round((distanceMeters / 1000 / 45) * 3600));

  return {
    provider: PROVIDER_NAME,
    mode,
    routes: [
      {
        summary: `${start.address || 'Origin'} to ${end.address || 'Destination'} (mock)`,
        distanceMeters,
        durationSeconds,
        distanceText: `${(distanceMeters / 1000).toFixed(1)} km`,
        durationText: `${Math.round(durationSeconds / 60)} mins`,
        encodedPolyline: encodePolyline(polyline),
        polyline,
        bounds: {
          northeast: {
            lat: Math.max(...polyline.map((p) => p.lat)),
            lng: Math.max(...polyline.map((p) => p.lng)),
          },
          southwest: {
            lat: Math.min(...polyline.map((p) => p.lat)),
            lng: Math.min(...polyline.map((p) => p.lng)),
          },
        },
        legs: [
          {
            startAddress: start.address || 'Origin',
            endAddress: end.address || 'Destination',
            distanceMeters,
            durationSeconds,
          },
        ],
      },
    ],
  };
};

export const getDistanceMatrix = async ({ origins = [], destinations = [] }) => {
  const resolvePoint = (item, index) => {
    const loc = normalizeLocation(item);
    if (loc.lat !== undefined) return { lat: loc.lat, lng: loc.lng };
    return jitterFromSeed(hashString(loc.address || `point-${index}`), 0.02 * (index + 1));
  };

  const originPoints = origins.map(resolvePoint);
  const destinationPoints = destinations.map(resolvePoint);

  const rows = originPoints.map((origin) => ({
    elements: destinationPoints.map((destination) => {
      const distanceMeters = Math.round(
        haversineDistance(origin.lng, origin.lat, destination.lng, destination.lat)
      );
      const durationSeconds = Math.max(120, Math.round((distanceMeters / 1000 / 40) * 3600));

      return {
        status: 'OK',
        distanceMeters,
        durationSeconds,
        distanceText: `${(distanceMeters / 1000).toFixed(1)} km`,
        durationText: `${Math.round(durationSeconds / 60)} mins`,
      };
    }),
  }));

  return {
    provider: PROVIDER_NAME,
    origins: originPoints,
    destinations: destinationPoints,
    rows,
  };
};

export const getStaticMapUrl = ({ center, zoom = 12, width = 600, height = 400, markers = [] }) => {
  const lat = center?.lat ?? DEFAULT_CENTER.lat;
  const lng = center?.lng ?? DEFAULT_CENTER.lng;
  const markerQuery = markers
    .map((m) => `markers=${m.lat},${m.lng}`)
    .join('&');

  return {
    provider: PROVIDER_NAME,
    url: `https://staticmap.openstreetmap.de/staticmap.php?center=${lat},${lng}&zoom=${zoom}&size=${width}x${height}&${markerQuery}`,
  };
};

export default {
  PROVIDER_NAME,
  geocode,
  reverseGeocode,
  getDirections,
  getDistanceMatrix,
  getStaticMapUrl,
};
