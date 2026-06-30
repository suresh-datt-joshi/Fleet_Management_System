/**
 * Reports & Export module integration test
 */
import dotenv from 'dotenv';
import { MongoMemoryServer } from 'mongodb-memory-server';

dotenv.config();
process.env.PORT = '6199';
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
  const Trip = (await import('../models/Trip.js')).default;
  const Driver = (await import('../models/Driver.js')).default;
  const { USER_ROLES } = await import('../constants/roles.js');
  const { VEHICLE_STATUS, DRIVER_STATUS, TRIP_STATUS } = await import('../constants/enums.js');

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
    vehicleNumber: 'RPT-001',
    model: 'Sprinter',
    manufacturer: 'Mercedes',
    year: 2022,
    status: VEHICLE_STATUS.ACTIVE,
    fuelLevel: 75,
    odometer: 45000,
  });
  vehicleId = vehicle._id.toString();

  const driver = await Driver.create({
    firstName: 'Report',
    lastName: 'Driver',
    email: 'reportdriver@fleet.com',
    licenseNumber: 'DL-RPT-001',
    licenseExpiry: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
    status: DRIVER_STATUS.AVAILABLE,
  });

  await Trip.create({
    tripNumber: 'TRP-RPT-001',
    status: TRIP_STATUS.COMPLETED,
    driver: driver._id,
    vehicle: vehicle._id,
    scheduledAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    completedAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
    distance: 120,
    revenue: 2500,
    expenses: 800,
  });
};

const runTests = async () => {
  console.log('\n=== Reports & Export Module Integration Tests ===\n');

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

  const catalog = await request('/reports/catalog');
  assert(catalog.status === 200, 'Report catalog');
  assert(catalog.data.data.length >= 5, 'Catalog has reports');

  const stats = await request('/reports/stats');
  assert(stats.status === 200, 'Report stats');
  assert(stats.data.data.availableReports >= 5, 'Stats show available reports');

  const summary = await request('/reports/summary');
  assert(summary.status === 200, 'Fleet summary report');
  assert(summary.data.data.summary.vehicles.total >= 1, 'Summary includes vehicles');

  const financial = await request('/reports/financial');
  assert(financial.status === 200, 'Financial report');
  assert(Array.isArray(financial.data.data.monthly), 'Financial has monthly data');

  const operational = await request('/reports/operational');
  assert(operational.status === 200, 'Operational report');
  assert(operational.data.data.trips.total >= 1, 'Operational includes trips');

  const preview = await request('/reports/preview/fleet_summary');
  assert(preview.status === 200, 'Report preview');
  assert(preview.data.data.summary, 'Preview has summary');

  const exportVehicles = await request('/reports/export?type=vehicles');
  assert(exportVehicles.status === 200, 'Export vehicles CSV');
  assert(typeof exportVehicles.data === 'string' && exportVehicles.data.includes('Vehicle Number'), 'CSV has headers');

  const exportTrips = await request('/reports/export?type=trips');
  assert(exportTrips.status === 200, 'Export trips CSV');

  const exportFinancial = await request('/reports/export?type=financial');
  assert(exportFinancial.status === 200, 'Export financial CSV');
  assert(exportFinancial.data.includes('Revenue'), 'Financial CSV has revenue column');

  const exportSummary = await request('/reports/export?type=fleet_summary');
  assert(exportSummary.status === 200, 'Export fleet summary CSV');

  const history = await request('/reports/history');
  assert(history.status === 200, 'Report history');
  assert(history.data.data.reports.length >= 4, 'History records exports');
  assert(history.data.data.reports[0].reportNumber.startsWith('RPT-'), 'Report number generated');

  const statsAfter = await request('/reports/stats');
  assert(statsAfter.data.data.totalGenerated >= 4, 'Stats updated after exports');

  const unauth = await request('/reports/catalog');
  const savedToken = accessToken;
  accessToken = null;
  const unauthRes = await request('/reports/catalog');
  accessToken = savedToken;
  assert(unauthRes.status === 401, 'Unauthenticated returns 401');

  console.log('\n=== All Reports & Export Tests Passed ===\n');

  process.exit(0);
};

runTests().catch((err) => {
  console.error(err);
  process.exit(1);
});
