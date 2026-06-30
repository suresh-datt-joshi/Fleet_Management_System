/**
 * Route Management module integration test
 */
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

dotenv.config();
process.env.PORT = '5599';
process.env.DISABLE_GPS_SIMULATOR = 'true';

const BASE = `http://localhost:${process.env.PORT}/api/v1`;
let memoryServer;
let accessToken;
let routeId;

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
  const { USER_ROLES } = await import('../constants/roles.js');

  await User.create({
    firstName: 'Fleet',
    lastName: 'Manager',
    email: 'manager@fleet.com',
    password: 'Manager@123456',
    role: USER_ROLES.FLEET_MANAGER,
    isEmailVerified: true,
    isActive: true,
  });
};

const sampleRoute = () => ({
  name: 'NYC Delivery Loop',
  description: 'Multi-stop delivery route',
  origin: { address: 'Depot A, New York', lat: 40.7128, lng: -74.006 },
  destination: { address: 'Warehouse B, Brooklyn', lat: 40.6782, lng: -73.9442 },
  stops: [
    {
      sequence: 1,
      name: 'Client Alpha',
      address: 'Midtown NYC',
      lat: 40.7549,
      lng: -73.984,
      stopType: 'pickup',
      estimatedDurationMinutes: 20,
    },
    {
      sequence: 2,
      name: 'Client Beta',
      address: 'Queens',
      lat: 40.7282,
      lng: -73.7949,
      stopType: 'delivery',
      estimatedDurationMinutes: 15,
    },
  ],
  averageSpeedKmh: 40,
  tags: ['delivery', 'urban'],
});

const runTests = async () => {
  console.log('\n=== Route Management Module Integration Tests ===\n');

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

  const traffic = await request('/routes/traffic');
  assert(traffic.status === 200, 'GET /routes/traffic');
  assert(traffic.data.data.provider === 'mock', 'Mock traffic provider');

  const create = await request('/routes', { method: 'POST', body: sampleRoute() });
  assert(create.status === 201, 'Create route', JSON.stringify(create.data));
  routeId = create.data.data.route.id;
  assert(create.data.data.route.totalDistanceMeters > 0, 'Route has distance');
  assert(create.data.data.route.estimatedDurationMinutes > 0, 'Route has ETA');

  const list = await request('/routes');
  assert(list.status === 200, 'List routes');
  assert(list.data.data.routes.length >= 1, 'Routes returned');

  const detail = await request(`/routes/${routeId}`);
  assert(detail.status === 200, 'Get route by ID');
  assert(detail.data.data.route.stops.length === 2, 'Route has 2 stops');

  const optimize = await request(`/routes/${routeId}/optimize`, { method: 'POST', body: {} });
  assert(optimize.status === 200, 'Optimize route');
  assert(optimize.data.data.route.isOptimized === true, 'Route marked optimized');
  assert(optimize.data.data.route.optimizedStops.length === 2, 'Optimized stops saved');

  const duplicate = await request(`/routes/${routeId}/duplicate`, { method: 'POST' });
  assert(duplicate.status === 201, 'Duplicate route');
  assert(duplicate.data.data.route.name.includes('Copy'), 'Duplicate has copy suffix');

  const stats = await request('/routes/stats');
  assert(stats.status === 200, 'Route stats');
  assert(stats.data.data.total >= 2, 'Stats show routes');

  const history = await request(`/routes/${routeId}/history`);
  assert(history.status === 200, 'Route history');
  assert(history.data.data.history.length >= 2, 'History has optimize + create entries');

  const update = await request(`/routes/${routeId}`, {
    method: 'PATCH',
    body: { status: 'active', name: 'NYC Delivery Loop (Active)' },
  });
  assert(update.status === 200, 'Update route');
  assert(update.data.data.route.status === 'active', 'Status updated');

  const exportRes = await fetch(`${BASE}/routes/export`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  assert(exportRes.status === 200, 'Export CSV');
  const csv = await exportRes.text();
  assert(csv.includes('Route Number'), 'CSV has headers');

  const del = await request(`/routes/${routeId}`, { method: 'DELETE' });
  assert(del.status === 200, 'Delete route');

  const savedToken = accessToken;
  accessToken = null;
  const noAuth = await request('/routes');
  accessToken = savedToken;
  assert(noAuth.status === 401, 'Unauthenticated returns 401');

  const { stopGpsSimulator } = await import('../jobs/gpsSimulator.js');
  stopGpsSimulator();

  console.log('\n=== All Route Tests Passed ===\n');
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
