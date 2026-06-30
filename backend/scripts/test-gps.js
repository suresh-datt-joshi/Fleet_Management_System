/**
 * GPS Tracking module integration test
 */
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

dotenv.config();
process.env.PORT = '5499';
process.env.DISABLE_GPS_SIMULATOR = 'true';

const BASE = `http://localhost:${process.env.PORT}/api/v1`;
let memoryServer;
let accessToken;
let vehicleId;

const assert = (cond, msg, detail = '') => {
  if (!cond) throw new Error(`FAIL: ${msg}${detail ? ` — ${detail}` : ''}`);
  console.log(`PASS: ${msg}`);
};

const request = async (path, options = {}) => {
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      ...(options.headers || {}),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  const contentType = res.headers.get('content-type') || '';
  const data = contentType.includes('json') ? await res.json() : await res.text();
  return { status: res.status, data };
};

const seed = async () => {
  const User = (await import('../models/User.js')).default;
  const Vehicle = (await import('../models/Vehicle.js')).default;
  const { USER_ROLES } = await import('../constants/roles.js');
  const { VEHICLE_STATUS } = await import('../constants/enums.js');

  await User.create({
    firstName: 'Fleet',
    lastName: 'Manager',
    email: 'manager@fleet.com',
    password: 'Manager@123456',
    role: USER_ROLES.FLEET_MANAGER,
    isEmailVerified: true,
    isActive: true,
  });

  const vehicle = await Vehicle.create({
    vehicleNumber: 'GPS-001',
    model: 'Sprinter',
    manufacturer: 'Mercedes',
    year: 2023,
    status: VEHICLE_STATUS.ACTIVE,
    ignition: true,
    speed: 45,
    fuelLevel: 75,
    currentLocation: { type: 'Point', coordinates: [-74.006, 40.7128], address: 'New York, NY' },
  });
  vehicleId = vehicle._id.toString();
};

const runTests = async () => {
  console.log('\n=== GPS Tracking Module Integration Tests ===\n');

  memoryServer = await MongoMemoryServer.create();
  process.env.MONGODB_URI = memoryServer.getUri();
  process.env.JWT_SECRET = 'test-jwt';
  process.env.JWT_REFRESH_SECRET = 'test-refresh';

  const { startServer } = await import('../server.js');
  await startServer();
  await new Promise((r) => setTimeout(r, 2000));

  await seed();

  const login = await request('/auth/login', {
    method: 'POST',
    body: { email: 'manager@fleet.com', password: 'Manager@123456' },
  });
  assert(login.status === 200, 'Fleet manager login');
  accessToken = login.data.data.accessToken;

  const live = await request('/gps/live');
  assert(live.status === 200, 'GET /gps/live');
  assert(live.data.data.length >= 1, 'Live vehicles returned');

  const vehicleLive = await request(`/gps/vehicles/${vehicleId}`);
  assert(vehicleLive.status === 200, 'GET vehicle live data');
  assert(vehicleLive.data.data.vehicle.vehicleNumber === 'GPS-001', 'Correct vehicle');

  const mock = await request('/gps/mock');
  assert(mock.status === 200, 'GET /gps/mock');
  assert(mock.data.provider === 'mock', 'Mock provider');

  const simulate = await request('/gps/simulate', { method: 'POST' });
  assert(simulate.status === 200, 'POST /gps/simulate');
  assert(simulate.data.data.length >= 1, 'Simulation updated vehicles');

  const history = await request(`/gps/vehicles/${vehicleId}/history?limit=10`);
  assert(history.status === 200, 'GET vehicle history');
  assert(history.data.data.route.length >= 1, 'History route points exist');

  const geofence = await request('/gps/geofences', {
    method: 'POST',
    body: {
      name: 'NYC Depot',
      type: 'circle',
      center: { lng: -74.006, lat: 40.7128 },
      radius: 1000,
      alertOnExit: true,
      color: '#1565C0',
    },
  });
  assert(geofence.status === 201, 'Create geofence', JSON.stringify(geofence.data));
  const geofenceId = geofence.data.data.geofence.id;

  const geofences = await request('/gps/geofences');
  assert(geofences.status === 200, 'List geofences');
  assert(geofences.data.data.geofences.length >= 1, 'Geofences listed');

  const stats = await request('/gps/stats');
  assert(stats.status === 200, 'GET tracking stats');
  assert(stats.data.data.provider === 'mock', 'Stats show mock provider');

  const delGeofence = await request(`/gps/geofences/${geofenceId}`, { method: 'DELETE' });
  assert(delGeofence.status === 200, 'Delete geofence');

  const savedToken = accessToken;
  accessToken = null;
  const noAuth = await request('/gps/live');
  accessToken = savedToken;
  assert(noAuth.status === 401, 'Unauthenticated returns 401');

  const { stopGpsSimulator } = await import('../jobs/gpsSimulator.js');
  stopGpsSimulator();

  console.log('\n=== All GPS Tests Passed ===\n');
  await mongoose.disconnect();
  await memoryServer.stop();
  process.exit(0);
};

runTests().catch(async (err) => {
  console.error('\nTest suite failed:', err.message);
  try {
    const { stopGpsSimulator } = await import('../jobs/gpsSimulator.js');
    stopGpsSimulator();
  } catch { /* ignore */ }
  await mongoose.disconnect().catch(() => {});
  if (memoryServer) await memoryServer.stop().catch(() => {});
  process.exit(1);
});
