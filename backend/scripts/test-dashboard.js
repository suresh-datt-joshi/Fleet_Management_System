/**
 * Dashboard module integration test
 */
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

dotenv.config();
process.env.PORT = '5199';

const BASE = `http://localhost:${process.env.PORT}/api/v1`;
let memoryServer;
let accessToken;

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
  const data = await res.json();
  return { status: res.status, data };
};

const seedTestData = async () => {
  const User = (await import('../models/User.js')).default;
  const Vehicle = (await import('../models/Vehicle.js')).default;
  const Driver = (await import('../models/Driver.js')).default;
  const Trip = (await import('../models/Trip.js')).default;
  const FuelLog = (await import('../models/FuelLog.js')).default;
  const MaintenanceRecord = (await import('../models/MaintenanceRecord.js')).default;
  const Alert = (await import('../models/Alert.js')).default;
  const Activity = (await import('../models/Activity.js')).default;
  const { USER_ROLES } = await import('../constants/roles.js');
  const {
    VEHICLE_STATUS,
    DRIVER_STATUS,
    TRIP_STATUS,
    MAINTENANCE_STATUS,
    MAINTENANCE_TYPE,
    ALERT_TYPES,
    ALERT_SEVERITY,
    ACTIVITY_TYPES,
  } = await import('../constants/enums.js');

  const admin = await User.create({
    firstName: 'Admin',
    lastName: 'User',
    email: 'admin@fleet.com',
    password: 'Admin@123456',
    role: USER_ROLES.SUPER_ADMIN,
    isEmailVerified: true,
    isActive: true,
  });

  const driver = await Driver.create({
    employeeId: 'DRV-T01',
    firstName: 'Test',
    lastName: 'Driver',
    licenseNumber: 'DL-TEST-001',
    licenseExpiry: new Date('2027-01-01'),
    status: DRIVER_STATUS.AVAILABLE,
  });

  const vehicle = await Vehicle.create({
    vehicleNumber: 'TEST-001',
    model: 'Test Van',
    manufacturer: 'Ford',
    year: 2023,
    status: VEHICLE_STATUS.ACTIVE,
    fuelLevel: 75,
    ignition: true,
    speed: 40,
    assignedDriver: driver._id,
    currentLocation: { type: 'Point', coordinates: [-74.006, 40.7128], address: 'NYC' },
  });

  await Trip.create({
    tripNumber: 'TRP-TEST-001',
    status: TRIP_STATUS.COMPLETED,
    driver: driver._id,
    vehicle: vehicle._id,
    scheduledAt: new Date(),
    completedAt: new Date(),
    distance: 100,
    revenue: 500,
    expenses: 100,
  });

  await Trip.create({
    tripNumber: 'TRP-TEST-002',
    status: TRIP_STATUS.IN_PROGRESS,
    driver: driver._id,
    vehicle: vehicle._id,
    scheduledAt: new Date(),
    startedAt: new Date(),
    distance: 50,
  });

  await FuelLog.create({
    vehicle: vehicle._id,
    driver: driver._id,
    quantity: 50,
    cost: 200,
    loggedAt: new Date(),
  });

  await MaintenanceRecord.create({
    workOrderNumber: 'WO-TEST-001',
    vehicle: vehicle._id,
    type: MAINTENANCE_TYPE.PREVENTIVE,
    status: MAINTENANCE_STATUS.SCHEDULED,
    title: 'Test maintenance',
    scheduledDate: new Date(Date.now() + 3 * 86400000),
  });

  await Alert.create({
    type: ALERT_TYPES.LOW_FUEL,
    severity: ALERT_SEVERITY.HIGH,
    title: 'Test Alert',
    message: 'Test low fuel',
    vehicle: vehicle._id,
  });

  await Activity.create({
    type: ACTIVITY_TYPES.TRIP_COMPLETED,
    title: 'Test activity',
    description: 'Test trip completed',
    entityType: 'trip',
    user: admin._id,
  });

  return admin;
};

const runTests = async () => {
  console.log('\n=== Dashboard Module Integration Tests ===\n');

  memoryServer = await MongoMemoryServer.create();
  process.env.MONGODB_URI = memoryServer.getUri();
  process.env.JWT_SECRET = 'test-jwt';
  process.env.JWT_REFRESH_SECRET = 'test-refresh';

  const { startServer } = await import('../server.js');
  await startServer();
  await new Promise((r) => setTimeout(r, 2000));

  await seedTestData();

  const loginRes = await request('/auth/login', {
    method: 'POST',
    body: { email: 'admin@fleet.com', password: 'Admin@123456' },
  });
  assert(loginRes.status === 200, 'Admin login', JSON.stringify(loginRes.data));
  accessToken = loginRes.data.data.accessToken;

  const overview = await request('/dashboard/overview');
  assert(overview.status === 200, 'GET /dashboard/overview returns 200');
  assert(overview.data.data.summary?.vehicles?.total >= 1, 'Summary has vehicle count');
  assert(overview.data.data.charts?.tripsTrend?.length === 6, 'Charts have 6 month trips trend');
  assert(Array.isArray(overview.data.data.activities), 'Activities array returned');
  assert(Array.isArray(overview.data.data.alerts), 'Alerts array returned');
  assert(Array.isArray(overview.data.data.liveVehicles), 'Live vehicles returned');

  const summary = await request('/dashboard/summary');
  assert(summary.status === 200, 'GET /dashboard/summary returns 200');
  assert(typeof summary.data.data.financials?.revenueThisMonth === 'number', 'Financials present');

  const charts = await request('/dashboard/charts');
  assert(charts.status === 200, 'GET /dashboard/charts returns 200');
  assert(charts.data.data.fuelTrend?.length === 6, 'Fuel trend has 6 months');

  const noAuth = await fetch(`${BASE}/dashboard/summary`);
  assert(noAuth.status === 401, 'Unauthenticated request returns 401');

  console.log('\n=== All Dashboard Tests Passed ===\n');
  await mongoose.disconnect();
  await memoryServer.stop();
  process.exit(0);
};

runTests().catch(async (err) => {
  console.error('\nTest suite failed:', err.message);
  await mongoose.disconnect().catch(() => {});
  if (memoryServer) await memoryServer.stop().catch(() => {});
  process.exit(1);
});
