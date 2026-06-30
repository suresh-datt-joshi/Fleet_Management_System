import config from '../config/index.js';
import AppError from '../utils/AppError.js';
import * as mockMapsProvider from './mockMapsProvider.js';
import * as googleMapsProvider from './googleMapsProvider.js';

const DEFAULT_CENTER = { lat: 40.7128, lng: -74.006 };
const DEFAULT_ZOOM = 12;

const isValidApiKey = (key) => Boolean(key && key !== 'your-google-maps-api-key');

const getProvider = () => {
  if (isValidApiKey(config.googleMaps?.apiKey)) {
    return googleMapsProvider;
  }
  return mockMapsProvider;
};

export const getMapsConfig = () => {
  const provider = getProvider();
  return {
    provider: provider.PROVIDER_NAME,
    enabled: true,
    defaultCenter: DEFAULT_CENTER,
    defaultZoom: DEFAULT_ZOOM,
    libraries: ['places', 'geometry'],
    clientKeyConfigured: isValidApiKey(config.googleMaps?.apiKey),
  };
};

export const getBrowserConfig = () => {
  const apiKey = config.googleMaps?.apiKey;
  const enabled = isValidApiKey(apiKey);

  return {
    enabled,
    provider: enabled ? googleMapsProvider.PROVIDER_NAME : mockMapsProvider.PROVIDER_NAME,
    apiKey: enabled ? apiKey : null,
  };
};

export const geocodeAddress = async (address) => {
  if (!address?.trim()) throw new AppError('Address is required', 400);
  const provider = getProvider();
  const result = await provider.geocode(address.trim());
  if (!result.results?.length) throw new AppError('No results found for address', 404);
  return result;
};

export const reverseGeocodeLocation = async (lat, lng) => {
  const provider = getProvider();
  const result = await provider.reverseGeocode(lat, lng);
  if (!result.results?.length) throw new AppError('No results found for coordinates', 404);
  return result;
};

export const getDirections = async (payload) => {
  if (!payload.origin) throw new AppError('Origin is required', 400);
  if (!payload.destination) throw new AppError('Destination is required', 400);

  const provider = getProvider();
  const result = await provider.getDirections({
    origin: payload.origin,
    destination: payload.destination,
    waypoints: payload.waypoints || [],
    mode: payload.mode || 'driving',
  });

  if (!result.routes?.length) throw new AppError('No routes found', 404);
  return result;
};

export const getDistanceMatrix = async (payload) => {
  if (!payload.origins?.length) throw new AppError('At least one origin is required', 400);
  if (!payload.destinations?.length) throw new AppError('At least one destination is required', 400);

  const provider = getProvider();
  return provider.getDistanceMatrix({
    origins: payload.origins,
    destinations: payload.destinations,
  });
};

export const getStaticMapUrl = async (payload) => {
  if (!payload.center?.lat || !payload.center?.lng) {
    throw new AppError('Map center coordinates are required', 400);
  }

  const provider = getProvider();
  return provider.getStaticMapUrl({
    center: payload.center,
    zoom: payload.zoom,
    width: payload.width,
    height: payload.height,
    markers: payload.markers || [],
  });
};

export const getRouteMetrics = async ({ origin, destination, stops = [] }) => {
  if (!isValidApiKey(config.googleMaps?.apiKey)) {
    return null;
  }

  const orderedStops = [...stops].sort((a, b) => (a.sequence || 0) - (b.sequence || 0));
  const result = await googleMapsProvider.getDirections({
    origin,
    destination,
    waypoints: orderedStops.map((stop) => ({
      lat: stop.lat,
      lng: stop.lng,
      address: stop.address,
    })),
    mode: 'driving',
    includeTraffic: true,
  });

  const route = result.routes?.[0];
  if (!route) return null;

  const stopDurationMinutes = orderedStops.reduce(
    (sum, stop) => sum + (stop.estimatedDurationMinutes || 0),
    0
  );
  const drivingMinutes = Math.ceil((route.durationSeconds || 0) / 60);

  return {
    provider: googleMapsProvider.PROVIDER_NAME,
    pathCoordinates: (route.polyline || []).map((point) => [point.lng, point.lat]),
    totalDistanceMeters: route.distanceMeters || 0,
    estimatedDurationMinutes: drivingMinutes + stopDurationMinutes,
    estimatedArrivalAt: new Date(Date.now() + (drivingMinutes + stopDurationMinutes) * 60 * 1000),
    trafficLevel: route.trafficLevel || 'low',
    trafficDelayMinutes: route.trafficDelayMinutes || 0,
    traffic: route.traffic || null,
  };
};

export default {
  getMapsConfig,
  getBrowserConfig,
  geocodeAddress,
  reverseGeocodeLocation,
  getDirections,
  getDistanceMatrix,
  getStaticMapUrl,
  getRouteMetrics,
};
