/**
 * Maintenance Management module integration test
 */
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

dotenv.config();
process.env.PORT = '5799';
process.env.DISABLE_GPS_SIMULATOR = 'true';

const BASE = `http://localhost:${process.env.PORT}/api/v1`;
let memoryServer;
let accessToken;
let vehicleId;
let mechanicId;
let workOrderId;

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

  const mechanic = await User.create({
    firstName: 'Mike',
    lastName: 'Mechanic',
    email: 'mechanic@fleet.com',
    password: 'Mechanic@123456',
    role: USER_ROLES.MECHANIC,
    isEmailVerified: true,
    isActive: true,
  });
  mechanicId = mechanic._id.toString();

  const vehicle = await Vehicle.create({
    vehicleNumber: 'MNT-001',
    model: 'Cascadia',
    manufacturer: 'Freightliner',
    year: 2021,
    status: VEHICLE_STATUS.ACTIVE,
    odometer: 85000,
  });
  vehicleId = vehicle._id.toString();
};

const runTests = async () => {
  console.log('\n=== Maintenance Management Module Integration Tests ===\n');

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

  const metaVehicles = await request('/maintenance/meta/vehicles');
  assert(metaVehicles.status === 200, 'Meta vehicles');

  const metaMechanics = await request('/maintenance/meta/mechanics');
  assert(metaMechanics.status === 200, 'Meta mechanics');
  assert(metaMechanics.data.data.length >= 1, 'Mechanics available');

  const scheduledDate = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString();

  const create = await request('/maintenance', {
    method: 'POST',
    body: {
      vehicleId,
      title: 'Oil Change & Filter',
      type: 'preventive',
      priority: 'medium',
      scheduledDate,
      assignedMechanicIds: [mechanicId],
      odometerAtService: 85000,
    },
  });
  assert(create.status === 201, 'Create work order', JSON.stringify(create.data));
  workOrderId = create.data.data.record.id;

  const list = await request('/maintenance');
  assert(list.status === 200, 'List work orders');
  assert(list.data.data.records.length >= 1, 'Records returned');

  const detail = await request(`/maintenance/${workOrderId}`);
  assert(detail.status === 200, 'Get work order by ID');

  const assign = await request(`/maintenance/${workOrderId}/assign`, {
    method: 'POST',
    body: { mechanicIds: [mechanicId] },
  });
  assert(assign.status === 200, 'Assign mechanic');

  const start = await request(`/maintenance/${workOrderId}/start`, { method: 'POST' });
  assert(start.status === 200, 'Start work order');
  assert(start.data.data.record.status === 'in_progress', 'Status in progress');

  const Vehicle = (await import('../models/Vehicle.js')).default;
  const vehicleAfterStart = await Vehicle.findById(vehicleId);
  assert(vehicleAfterStart.status === 'maintenance', 'Vehicle set to maintenance');

  const complete = await request(`/maintenance/${workOrderId}/complete`, {
    method: 'POST',
    body: {
      workPerformed: 'Changed oil filter and engine oil. Inspected belts and fluid levels.',
      odometerAtService: 85120,
      laborHours: 2,
      laborCost: 130,
      parts: [{ name: 'Oil Filter', quantity: 1, cost: 25, supplier: 'AutoParts Co' }],
    },
  });
  assert(complete.status === 200, 'Complete work order');
  assert(complete.data.data.record.status === 'completed', 'Status completed');

  const stats = await request('/maintenance/stats');
  assert(stats.status === 200, 'Maintenance stats');
  assert(stats.data.data.completed >= 1, 'Stats show completed');

  const upcoming = await request('/maintenance/upcoming?days=30');
  assert(upcoming.status === 200, 'Upcoming maintenance');

  const analytics = await request('/maintenance/analytics?months=6');
  assert(analytics.status === 200, 'Maintenance analytics');

  const history = await request(`/maintenance/${workOrderId}/history`);
  assert(history.status === 200, 'Work order history');
  assert(history.data.data.history.length >= 3, 'History has lifecycle entries');

  const exportRes = await fetch(`${BASE}/maintenance/export`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  assert(exportRes.status === 200, 'Export CSV');
  const csv = await exportRes.text();
  assert(csv.includes('Work Order'), 'CSV has headers');

  const del = await request(`/maintenance/${workOrderId}`, { method: 'DELETE' });
  assert(del.status === 400, 'Cannot delete completed work order');

  const savedToken = accessToken;
  accessToken = null;
  const noAuth = await request('/maintenance');
  accessToken = savedToken;
  assert(noAuth.status === 401, 'Unauthenticated returns 401');

  const { stopGpsSimulator } = await import('../jobs/gpsSimulator.js');
  stopGpsSimulator();

  console.log('\n=== All Maintenance Tests Passed ===\n');
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
