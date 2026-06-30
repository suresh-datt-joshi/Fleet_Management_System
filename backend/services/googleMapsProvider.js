import config from '../config/index.js';
import AppError from '../utils/AppError.js';
import { decodePolyline } from '../utils/polylineUtils.js';
import { TRAFFIC_LEVELS } from '../constants/enums.js';

export const PROVIDER_NAME = 'google';

const API_BASE = 'https://maps.googleapis.com/maps/api';

const getApiKey = () => {
  const key = config.googleMaps?.apiKey;
  if (!key) throw new AppError('Google Maps API key is not configured', 503);
  return key;
};

const googleFetch = async (path, params) => {
  const url = new URL(`${API_BASE}${path}`);
  url.searchParams.set('key', getApiKey());
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      url.searchParams.set(key, value);
    }
  });

  const response = await fetch(url);
  const data = await response.json();

  if (data.status === 'REQUEST_DENIED') {
    throw new AppError(data.error_message || 'Google Maps request denied', 502);
  }

  if (data.status === 'OVER_QUERY_LIMIT') {
    throw new AppError('Google Maps quota exceeded', 429);
  }

  if (data.status === 'ZERO_RESULTS') {
    return { status: data.status, results: [], routes: [], rows: [] };
  }

  if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
    throw new AppError(data.error_message || `Google Maps error: ${data.status}`, 502);
  }

  return data;
};

const formatGeocodeResult = (result) => ({
  formattedAddress: result.formatted_address,
  placeId: result.place_id,
  location: {
    lat: result.geometry.location.lat,
    lng: result.geometry.location.lng,
  },
  types: result.types || [],
  addressComponents: (result.address_components || []).reduce((acc, component) => {
    if (component.types.includes('locality')) acc.locality = component.long_name;
    if (component.types.includes('administrative_area_level_1')) {
      acc.administrativeArea = component.short_name;
    }
    if (component.types.includes('country')) acc.country = component.long_name;
    if (component.types.includes('postal_code')) acc.postalCode = component.long_name;
    return acc;
  }, {}),
});

const formatLatLng = (input) => {
  if (typeof input === 'string') return input;
  if (input?.lat !== undefined && input?.lng !== undefined) {
    return `${input.lat},${input.lng}`;
  }
  if (input?.address) return input.address;
  throw new AppError('Invalid location input', 400);
};

export const geocode = async (address) => {
  const data = await googleFetch('/geocode/json', { address });
  return {
    provider: PROVIDER_NAME,
    results: (data.results || []).map(formatGeocodeResult),
  };
};

export const reverseGeocode = async (lat, lng) => {
  const data = await googleFetch('/geocode/json', { latlng: `${lat},${lng}` });
  return {
    provider: PROVIDER_NAME,
    results: (data.results || []).map(formatGeocodeResult),
  };
};

const inferTrafficLevel = (delayMinutes) => {
  if (delayMinutes <= 5) return TRAFFIC_LEVELS.LOW;
  if (delayMinutes <= 15) return TRAFFIC_LEVELS.MEDIUM;
  if (delayMinutes <= 30) return TRAFFIC_LEVELS.HIGH;
  return TRAFFIC_LEVELS.SEVERE;
};

export const getDirections = async ({
  origin,
  destination,
  waypoints = [],
  mode = 'driving',
  includeTraffic = false,
}) => {
  const waypointParam =
    waypoints.length > 0
      ? waypoints.map((wp) => formatLatLng(wp)).join('|')
      : undefined;

  const data = await googleFetch('/directions/json', {
    origin: formatLatLng(origin),
    destination: formatLatLng(destination),
    waypoints: waypointParam,
    mode,
    ...(includeTraffic ? { departure_time: 'now', traffic_model: 'best_guess' } : {}),
  });

  const routes = (data.routes || []).map((route) => {
    const legs = route.legs || [];
    const polyline = decodePolyline(route.overview_polyline?.points);
    const distanceMeters = legs.reduce((sum, leg) => sum + (leg.distance?.value || 0), 0);
    const durationSeconds = legs.reduce((sum, leg) => sum + (leg.duration?.value || 0), 0);
    const durationInTrafficSeconds = legs.reduce(
      (sum, leg) => sum + (leg.duration_in_traffic?.value || leg.duration?.value || 0),
      0
    );
    const trafficDelayMinutes = Math.max(
      0,
      Math.round((durationInTrafficSeconds - durationSeconds) / 60)
    );

    return {
      summary: route.summary,
      distanceMeters,
      durationSeconds: includeTraffic ? durationInTrafficSeconds : durationSeconds,
      distanceText: legs[0]?.distance?.text || '',
      durationText: legs[0]?.duration?.text || '',
      encodedPolyline: route.overview_polyline?.points || '',
      polyline,
      trafficLevel: inferTrafficLevel(trafficDelayMinutes),
      trafficDelayMinutes,
      traffic: includeTraffic
        ? {
            provider: PROVIDER_NAME,
            level: inferTrafficLevel(trafficDelayMinutes),
            delayMinutes: trafficDelayMinutes,
            description: `Live traffic adds about ${trafficDelayMinutes} min`,
            checkedAt: new Date().toISOString(),
          }
        : null,
      bounds: route.bounds
        ? {
            northeast: route.bounds.northeast,
            southwest: route.bounds.southwest,
          }
        : null,
      legs: legs.map((item) => ({
        startAddress: item.start_address,
        endAddress: item.end_address,
        distanceMeters: item.distance?.value || 0,
        durationSeconds: item.duration?.value || 0,
        durationInTrafficSeconds: item.duration_in_traffic?.value || item.duration?.value || 0,
      })),
    };
  });

  return {
    provider: PROVIDER_NAME,
    mode,
    routes,
  };
};

export const getDistanceMatrix = async ({ origins = [], destinations = [] }) => {
  const data = await googleFetch('/distancematrix/json', {
    origins: origins.map(formatLatLng).join('|'),
    destinations: destinations.map(formatLatLng).join('|'),
  });

  const originPoints = (data.origin_addresses || []).map((address, index) => ({
    address,
    ...(origins[index]?.lat !== undefined
      ? { lat: origins[index].lat, lng: origins[index].lng }
      : {}),
  }));

  const destinationPoints = (data.destination_addresses || []).map((address, index) => ({
    address,
    ...(destinations[index]?.lat !== undefined
      ? { lat: destinations[index].lat, lng: destinations[index].lng }
      : {}),
  }));

  const rows = (data.rows || []).map((row) => ({
    elements: (row.elements || []).map((element) => ({
      status: element.status,
      distanceMeters: element.distance?.value || 0,
      durationSeconds: element.duration?.value || 0,
      distanceText: element.distance?.text || '',
      durationText: element.duration?.text || '',
    })),
  }));

  return {
    provider: PROVIDER_NAME,
    origins: originPoints,
    destinations: destinationPoints,
    rows,
  };
};

export const getStaticMapUrl = ({ center, zoom = 12, width = 600, height = 400, markers = [] }) => {
  const key = getApiKey();
  const lat = center?.lat;
  const lng = center?.lng;
  const url = new URL(`${API_BASE}/staticmap`);
  url.searchParams.set('center', `${lat},${lng}`);
  url.searchParams.set('zoom', String(zoom));
  url.searchParams.set('size', `${width}x${height}`);
  url.searchParams.set('key', key);

  markers.forEach((marker) => {
    url.searchParams.append('markers', `${marker.lat},${marker.lng}`);
  });

  return {
    provider: PROVIDER_NAME,
    url: url.toString(),
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
