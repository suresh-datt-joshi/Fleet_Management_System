/**
 * Fuel Management module integration test
 */
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

dotenv.config();
process.env.PORT = '5699';
process.env.DISABLE_GPS_SIMULATOR = 'true';

const BASE = `http://localhost:${process.env.PORT}/api/v1`;
let memoryServer;
let accessToken;
let vehicleId;
let stationId;
let logId;

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
    vehicleNumber: 'FUEL-001',
    model: 'Actros',
    manufacturer: 'Mercedes',
    year: 2022,
    status: VEHICLE_STATUS.ACTIVE,
    fuelType: 'diesel',
    odometer: 10000,
  });
  vehicleId = vehicle._id.toString();
};

const runTests = async () => {
  console.log('\n=== Fuel Management Module Integration Tests ===\n');

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

  const createStation = await request('/fuel/stations', {
    method: 'POST',
    body: {
      name: 'Shell Midtown',
      brand: 'Shell',
      city: 'New York',
      address: '123 Main St',
      fuelTypes: ['diesel', 'petrol'],
      location: { lat: 40.758, lng: -73.9855 },
    },
  });
  assert(createStation.status === 201, 'Create fuel station', JSON.stringify(createStation.data));
  stationId = createStation.data.data.station.id;

  const stations = await request('/fuel/stations');
  assert(stations.status === 200, 'List fuel stations');
  assert(stations.data.data.stations.length >= 1, 'Stations returned');

  const metaStations = await request('/fuel/meta/stations');
  assert(metaStations.status === 200, 'Meta stations list');

  const metaVehicles = await request('/fuel/meta/vehicles');
  assert(metaVehicles.status === 200, 'Meta vehicles list');
  assert(metaVehicles.data.data.length >= 1, 'Vehicles for fuel logging');

  const log1 = await request('/fuel/logs', {
    method: 'POST',
    body: {
      vehicleId,
      stationId,
      quantity: 50,
      cost: 85,
      odometer: 10000,
      fuelType: 'diesel',
      isFullTank: true,
      receiptNumber: 'RCP-001',
    },
  });
  assert(log1.status === 201, 'Create first fuel log', JSON.stringify(log1.data));
  logId = log1.data.data.log.id;

  const log2 = await request('/fuel/logs', {
    method: 'POST',
    body: {
      vehicleId,
      stationId,
      quantity: 45,
      cost: 78,
      odometer: 10550,
      fuelType: 'diesel',
      isFullTank: true,
    },
  });
  assert(log2.status === 201, 'Create second fuel log');
  assert(log2.data.data.log.mileage > 0, 'Mileage calculated', `mileage=${log2.data.data.log.mileage}`);

  const logs = await request('/fuel/logs');
  assert(logs.status === 200, 'List fuel logs');
  assert(logs.data.data.logs.length >= 2, 'Logs listed');

  const detail = await request(`/fuel/logs/${logId}`);
  assert(detail.status === 200, 'Get fuel log by ID');

  const stats = await request('/fuel/stats');
  assert(stats.status === 200, 'Fuel stats');
  assert(stats.data.data.totalLogs >= 2, 'Stats show logs');
  assert(stats.data.data.averageMileage > 0, 'Average mileage computed');

  const analytics = await request('/fuel/analytics?months=6');
  assert(analytics.status === 200, 'Fuel analytics');
  assert(analytics.data.data.monthlyTrend.length === 6, '6 month trend');

  const update = await request(`/fuel/logs/${logId}`, {
    method: 'PATCH',
    body: { notes: 'Updated test log', cost: 86 },
  });
  assert(update.status === 200, 'Update fuel log');

  const exportRes = await fetch(`${BASE}/fuel/logs/export`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  assert(exportRes.status === 200, 'Export CSV');
  const csv = await exportRes.text();
  assert(csv.includes('Vehicle'), 'CSV has headers');

  const delLog = await request(`/fuel/logs/${logId}`, { method: 'DELETE' });
  assert(delLog.status === 200, 'Delete fuel log');

  const delLog2 = await request(`/fuel/logs/${log2.data.data.log.id}`, { method: 'DELETE' });
  assert(delLog2.status === 200, 'Delete second fuel log');

  const delStation = await request(`/fuel/stations/${stationId}`, { method: 'DELETE' });
  assert(delStation.status === 200, 'Delete fuel station');

  const savedToken = accessToken;
  accessToken = null;
  const noAuth = await request('/fuel/logs');
  accessToken = savedToken;
  assert(noAuth.status === 401, 'Unauthenticated returns 401');

  const { stopGpsSimulator } = await import('../jobs/gpsSimulator.js');
  stopGpsSimulator();

  console.log('\n=== All Fuel Tests Passed ===\n');
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
