/**
 * Vehicle module integration test
 */
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

dotenv.config();
process.env.PORT = '5299';

const BASE = `http://localhost:${process.env.PORT}/api/v1`;
let memoryServer;
let accessToken;
let vehicleId;
let driverId;

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
  const Driver = (await import('../models/Driver.js')).default;
  const { USER_ROLES } = await import('../constants/roles.js');
  const { DRIVER_STATUS } = await import('../constants/enums.js');

  await User.create({
    firstName: 'Fleet',
    lastName: 'Manager',
    email: 'manager@fleet.com',
    password: 'Manager@123456',
    role: USER_ROLES.FLEET_MANAGER,
    isEmailVerified: true,
    isActive: true,
  });

  const driver = await Driver.create({
    employeeId: 'DRV-V01',
    firstName: 'John',
    lastName: 'Doe',
    licenseNumber: 'DL-V-001',
    licenseExpiry: new Date('2027-01-01'),
    status: DRIVER_STATUS.AVAILABLE,
  });
  driverId = driver._id.toString();
};

const runTests = async () => {
  console.log('\n=== Vehicle Module Integration Tests ===\n');

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

  const create = await request('/vehicles', {
    method: 'POST',
    body: {
      vehicleNumber: 'FL-TEST-99',
      vin: 'VIN999888777',
      model: 'Sprinter',
      manufacturer: 'Mercedes-Benz',
      year: 2023,
      fuelType: 'diesel',
      odometer: 12000,
      registrationNumber: 'RC-12345',
      documentExpiry: {
        insurance: '2027-06-01',
        registration: '2027-12-01',
      },
    },
  });
  assert(create.status === 201, 'Create vehicle', JSON.stringify(create.data));
  vehicleId = create.data.data.vehicle._id;

  const list = await request('/vehicles?page=1&limit=10&search=FL-TEST');
  assert(list.status === 200, 'List vehicles');
  assert(list.data.data.vehicles.length >= 1, 'Search finds vehicle');

  const getOne = await request(`/vehicles/${vehicleId}`);
  assert(getOne.status === 200, 'Get vehicle by ID');

  const update = await request(`/vehicles/${vehicleId}`, {
    method: 'PATCH',
    body: { odometer: 15000, status: 'maintenance' },
  });
  assert(update.status === 200, 'Update vehicle');
  assert(update.data.data.vehicle.odometer === 15000, 'Odometer updated');

  const assign = await request(`/vehicles/${vehicleId}/assign-driver`, {
    method: 'POST',
    body: { driverId },
  });
  assert(assign.status === 200, 'Assign driver');
  assert(assign.data.data.vehicle.assignedDriver, 'Driver assigned on vehicle');

  const history = await request(`/vehicles/${vehicleId}/history`);
  assert(history.status === 200, 'Get vehicle history');
  assert(history.data.data.history.length >= 3, 'History has entries');

  const stats = await request('/vehicles/stats');
  assert(stats.status === 200, 'Get vehicle stats');
  assert(stats.data.data.total >= 1, 'Stats total >= 1');

  const exportRes = await fetch(`${BASE}/vehicles/export`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  assert(exportRes.status === 200, 'Export CSV');
  const csv = await exportRes.text();
  assert(csv.includes('FL-TEST-99'), 'CSV contains vehicle number');

  const unassign = await request(`/vehicles/${vehicleId}/assign-driver`, { method: 'DELETE' });
  assert(unassign.status === 200, 'Unassign driver');

  const del = await request(`/vehicles/${vehicleId}`, { method: 'DELETE' });
  assert(del.status === 200, 'Soft delete vehicle');

  const notFound = await request(`/vehicles/${vehicleId}`);
  assert(notFound.status === 404, 'Deleted vehicle returns 404');

  const savedToken = accessToken;
  accessToken = null;
  const noAuth = await request('/vehicles');
  accessToken = savedToken;
  assert(noAuth.status === 401, 'Unauthenticated returns 401');

  console.log('\n=== All Vehicle Tests Passed ===\n');
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
