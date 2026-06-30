/**
 * Driver module integration test
 */
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

dotenv.config();
process.env.PORT = '5399';

const BASE = `http://localhost:${process.env.PORT}/api/v1`;
let memoryServer;
let accessToken;
let driverId;
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
    vehicleNumber: 'FL-DRV-01',
    model: 'Transit',
    manufacturer: 'Ford',
    year: 2022,
    status: VEHICLE_STATUS.ACTIVE,
  });
  vehicleId = vehicle._id.toString();
};

const runTests = async () => {
  console.log('\n=== Driver Module Integration Tests ===\n');

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

  const create = await request('/drivers', {
    method: 'POST',
    body: {
      employeeId: 'EMP-5001',
      firstName: 'Alice',
      lastName: 'Brown',
      email: 'alice.brown@fleet.com',
      phone: '+1-555-0200',
      licenseNumber: 'DL-5001',
      licenseExpiry: '2027-08-15',
      experienceYears: 5,
      medicalCertificateExpiry: '2026-12-01',
      performanceScore: 88,
      emergencyContact: { name: 'Bob Brown', phone: '+1-555-0201', relation: 'Spouse' },
    },
  });
  assert(create.status === 201, 'Create driver', JSON.stringify(create.data));
  driverId = create.data.data.driver._id;

  const list = await request('/drivers?page=1&limit=10&search=Alice');
  assert(list.status === 200, 'List drivers');
  assert(list.data.data.drivers.length >= 1, 'Search finds driver');

  const getOne = await request(`/drivers/${driverId}`);
  assert(getOne.status === 200, 'Get driver by ID');

  const update = await request(`/drivers/${driverId}`, {
    method: 'PATCH',
    body: { performanceScore: 92, status: 'available' },
  });
  assert(update.status === 200, 'Update driver');
  assert(update.data.data.driver.performanceScore === 92, 'Score updated');

  const assign = await request(`/drivers/${driverId}/assign-vehicle`, {
    method: 'POST',
    body: { vehicleId },
  });
  assert(assign.status === 200, 'Assign vehicle');
  assert(assign.data.data.driver.assignedVehicle, 'Vehicle assigned');

  const history = await request(`/drivers/${driverId}/history`);
  assert(history.status === 200, 'Get driver history');
  assert(history.data.data.history.length >= 3, 'History has entries');

  const stats = await request('/drivers/stats');
  assert(stats.status === 200, 'Get driver stats');
  assert(stats.data.data.total >= 1, 'Stats total >= 1');

  const exportRes = await fetch(`${BASE}/drivers/export`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  assert(exportRes.status === 200, 'Export CSV');
  const csv = await exportRes.text();
  assert(csv.includes('Alice'), 'CSV contains driver name');

  const unassign = await request(`/drivers/${driverId}/assign-vehicle`, { method: 'DELETE' });
  assert(unassign.status === 200, 'Unassign vehicle');

  const del = await request(`/drivers/${driverId}`, { method: 'DELETE' });
  assert(del.status === 200, 'Soft delete driver');

  const notFound = await request(`/drivers/${driverId}`);
  assert(notFound.status === 404, 'Deleted driver returns 404');

  const savedToken = accessToken;
  accessToken = null;
  const noAuth = await request('/drivers');
  accessToken = savedToken;
  assert(noAuth.status === 401, 'Unauthenticated returns 401');

  console.log('\n=== All Driver Tests Passed ===\n');
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
