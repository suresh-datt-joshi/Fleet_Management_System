/**
 * Mock GPS Provider — replace with real GPS API integration by implementing the same interface.
 *
 * Real provider example:
 *   export const fetchVehicleLocation = async (vehicleExternalId) => { ... }
 */
import { generateMockMovement } from '../utils/geoUtils.js';

export const PROVIDER_NAME = 'mock';

export const fetchVehicleLocation = async (vehicle, options = {}) => {
  const [lng, lat] = vehicle.currentLocation?.coordinates || [-74.006, 40.7128];
  const speed = vehicle.ignition ? Math.floor(Math.random() * 35) + 25 : 0;
  const { routePath = [], pathIndex = 0 } = options;

  if (vehicle.ignition && routePath.length > 1) {
    const nextIndex = Math.min(pathIndex + 1, routePath.length - 1);
    const target = routePath[nextIndex];
    const step = 0.18;
    const nextLat = lat + (target.lat - lat) * step;
    const nextLng = lng + (target.lng - lng) * step;
    const heading =
      (Math.atan2(target.lng - lng, target.lat - lat) * 180) / Math.PI;

    return {
      provider: PROVIDER_NAME,
      vehicleId: vehicle._id.toString(),
      vehicleNumber: vehicle.vehicleNumber,
      location: {
        lng: nextLng,
        lat: nextLat,
        address: vehicle.currentLocation?.address || '',
      },
      speed,
      heading: Number.isFinite(heading) ? heading : 0,
      fuelLevel: Math.max(0, (vehicle.fuelLevel || 100) - (vehicle.ignition ? Math.random() * 0.4 : 0)),
      ignition: vehicle.ignition,
      engineStatus: vehicle.ignition ? (speed > 5 ? 'running' : 'idle') : 'off',
      odometer: (vehicle.odometer || 0) + (speed > 0 ? speed / 360 : 0),
      timestamp: new Date().toISOString(),
      pathIndex: nextIndex,
    };
  }

  const movement = vehicle.ignition && speed > 0 ? generateMockMovement(lng, lat, speed) : { lng, lat, heading: 0 };

  return {
    provider: PROVIDER_NAME,
    vehicleId: vehicle._id.toString(),
    vehicleNumber: vehicle.vehicleNumber,
    location: {
      lng: movement.lng,
      lat: movement.lat,
      address: vehicle.currentLocation?.address || '',
    },
    speed,
    heading: movement.heading || 0,
    fuelLevel: Math.max(0, (vehicle.fuelLevel || 100) - (vehicle.ignition ? Math.random() * 0.5 : 0)),
    ignition: vehicle.ignition,
    engineStatus: vehicle.ignition ? (speed > 5 ? 'running' : 'idle') : 'off',
    odometer: (vehicle.odometer || 0) + (speed > 0 ? speed / 360 : 0),
    timestamp: new Date().toISOString(),
  };
};

export const fetchFleetLocations = async (vehicles) => {
  const results = await Promise.all(vehicles.map((v) => fetchVehicleLocation(v)));
  return results;
};

export default { PROVIDER_NAME, fetchVehicleLocation, fetchFleetLocations };
