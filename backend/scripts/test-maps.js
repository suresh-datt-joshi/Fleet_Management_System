/**
 * Maps Integration module test
 */
import dotenv from 'dotenv';
import { MongoMemoryServer } from 'mongodb-memory-server';

dotenv.config();
process.env.PORT = '6299';
process.env.DISABLE_GPS_SIMULATOR = 'true';

const BASE = `http://localhost:${process.env.PORT}/api/v1`;
let memoryServer;
let accessToken;
let httpServer;

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
    firstName: 'Maps',
    lastName: 'Manager',
    email: 'maps@fleet.com',
    password: 'Manager@123456',
    role: USER_ROLES.FLEET_MANAGER,
    isEmailVerified: true,
    isActive: true,
  });
};

const runTests = async () => {
  console.log('\n=== Maps Integration Module Tests ===\n');

  memoryServer = await MongoMemoryServer.create();
  process.env.MONGODB_URI = memoryServer.getUri();
  process.env.JWT_SECRET = 'test-jwt';
  process.env.JWT_REFRESH_SECRET = 'test-refresh';
  delete process.env.GOOGLE_MAPS_API_KEY;

  const serverModule = await import('../server.js');
  await serverModule.startServer();
  httpServer = serverModule.httpServer;
  await new Promise((r) => setTimeout(r, 2000));

  await seed();

  const login = await request('/auth/login', {
    method: 'POST',
    body: { email: 'maps@fleet.com', password: 'Manager@123456' },
  });
  assert(login.status === 200, 'Fleet manager login');
  accessToken = login.data.data.accessToken;

  const config = await request('/maps/config');
  assert(config.status === 200, 'GET /maps/config');
  assert(config.data.data.provider === 'mock', 'Mock provider when no API key');
  assert(config.data.data.defaultCenter?.lat, 'Default center returned');

  const geocode = await request('/maps/geocode', {
    method: 'POST',
    body: { address: '1600 Amphitheatre Parkway, Mountain View' },
  });
  assert(geocode.status === 200, 'POST /maps/geocode');
  assert(geocode.data.data.results.length >= 1, 'Geocode results returned');
  assert(geocode.data.data.results[0].location?.lat, 'Geocode has coordinates');

  const reverse = await request('/maps/reverse-geocode', {
    method: 'POST',
    body: { lat: 40.7128, lng: -74.006 },
  });
  assert(reverse.status === 200, 'POST /maps/reverse-geocode');
  assert(reverse.data.data.results[0].formattedAddress, 'Reverse geocode address returned');

  const directions = await request('/maps/directions', {
    method: 'POST',
    body: {
      origin: { lat: 40.7128, lng: -74.006, address: 'New York, NY' },
      destination: { lat: 40.758, lng: -73.9855, address: 'Times Square' },
    },
  });
  assert(directions.status === 200, 'POST /maps/directions');
  assert(directions.data.data.routes[0].polyline?.length >= 2, 'Directions polyline returned');
  assert(directions.data.data.routes[0].distanceMeters > 0, 'Directions distance calculated');

  const matrix = await request('/maps/distance-matrix', {
    method: 'POST',
    body: {
      origins: [{ lat: 40.7128, lng: -74.006 }],
      destinations: [{ lat: 40.758, lng: -73.9855 }, { lat: 40.6892, lng: -74.0445 }],
    },
  });
  assert(matrix.status === 200, 'POST /maps/distance-matrix');
  assert(matrix.data.data.rows[0].elements.length === 2, 'Distance matrix elements returned');

  const staticMap = await request('/maps/static?lat=40.7128&lng=-74.006&zoom=12');
  assert(staticMap.status === 200, 'GET /maps/static');
  assert(staticMap.data.data.url, 'Static map URL returned');

  const invalidGeocode = await request('/maps/geocode', {
    method: 'POST',
    body: { address: '' },
  });
  assert(invalidGeocode.status === 400, 'Empty address rejected');

  const savedToken = accessToken;
  accessToken = null;
  const noAuth = await request('/maps/config');
  accessToken = savedToken;
  assert(noAuth.status === 401, 'Unauthenticated returns 401');

  console.log('\n=== All Maps Tests Passed ===\n');
};

const cleanup = async () => {
  if (httpServer) {
    await new Promise((resolve) => httpServer.close(resolve));
  }
  if (memoryServer) {
    await memoryServer.stop();
  }
  process.exit(0);
};

runTests()
  .then(cleanup)
  .catch(async (err) => {
    console.error(err);
    await cleanup();
    process.exit(1);
  });
