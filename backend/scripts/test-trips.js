/**
 * Trip Management module integration test
 */
import dotenv from 'dotenv';
import { MongoMemoryServer } from 'mongodb-memory-server';

dotenv.config();
process.env.PORT = '5999';
process.env.DISABLE_GPS_SIMULATOR = 'true';

const BASE = `http://localhost:${process.env.PORT}/api/v1`;
let memoryServer;
let accessToken;
let driverId;
let vehicleId;
let routeId;
let tripId;

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
  const Vehicle = (await import('../models/Vehicle.js')).default;
  const Route = (await import('../models/Route.js')).default;
  const { USER_ROLES } = await import('../constants/roles.js');
  const { VEHICLE_STATUS, DRIVER_STATUS, ROUTE_STATUS } = await import('../constants/enums.js');

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
    vehicleNumber: 'TRP-001',
    model: 'Cascadia',
    manufacturer: 'Freightliner',
    year: 2021,
    status: VEHICLE_STATUS.ACTIVE,
    odometer: 50000,
    fuelLevel: 80,
  });
  vehicleId = vehicle._id.toString();

  const driver = await Driver.create({
    firstName: 'John',
    lastName: 'Driver',
    email: 'driver@fleet.com',
    licenseNumber: 'DL-TRP-001',
    licenseExpiry: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
    status: DRIVER_STATUS.AVAILABLE,
    assignedVehicle: vehicle._id,
  });
  driverId = driver._id.toString();

  const route = await Route.create({
    routeNumber: 'RT-TRP-001',
    name: 'Warehouse to Depot',
    status: ROUTE_STATUS.ACTIVE,
    origin: { address: 'Warehouse A', lat: 12.9716, lng: 77.5946 },
    destination: { address: 'Depot B', lat: 13.0827, lng: 80.2707 },
    totalDistanceMeters: 350000,
    estimatedDurationMinutes: 360,
  });
  routeId = route._id.toString();
};

const runTests = async () => {
  console.log('\n=== Trip Management Module Integration Tests ===\n');

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

  const metaDrivers = await request('/trips/meta/drivers');
  assert(metaDrivers.status === 200, 'Meta drivers');
  assert(metaDrivers.data.data.length >= 1, 'Drivers available');

  const metaVehicles = await request('/trips/meta/vehicles');
  assert(metaVehicles.status === 200, 'Meta vehicles');

  const metaRoutes = await request('/trips/meta/routes');
  assert(metaRoutes.status === 200, 'Meta routes');
  assert(metaRoutes.data.data.length >= 1, 'Routes available');

  const scheduledAt = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString();

  const create = await request('/trips', {
    method: 'POST',
    body: {
      driverId,
      vehicleId,
      routeId,
      scheduledAt,
      origin: { address: 'Warehouse A', lat: 12.9716, lng: 77.5946 },
      destination: { address: 'Depot B', lat: 13.0827, lng: 80.2707 },
      revenue: 5000,
      expenses: 1200,
      notes: 'Test trip',
    },
  });
  assert(create.status === 201, 'Create trip', JSON.stringify(create.data));
  tripId = create.data.data.trip.id;
  assert(create.data.data.trip.tripNumber.startsWith('TRP-'), 'Trip number generated');
  assert(create.data.data.trip.status === 'scheduled', 'Status is scheduled');
  assert(create.data.data.trip.route?.routeNumber === 'RT-TRP-001', 'Route linked');

  const list = await request('/trips');
  assert(list.status === 200, 'List trips');
  assert(list.data.data.trips.length >= 1, 'Trips returned');

  const detail = await request(`/trips/${tripId}`);
  assert(detail.status === 200, 'Get trip by ID');

  const stats = await request('/trips/stats');
  assert(stats.status === 200, 'Trip stats');
  assert(stats.data.data.total >= 1, 'Stats show trips');

  const upcoming = await request('/trips/upcoming?days=7');
  assert(upcoming.status === 200, 'Upcoming trips');

  const analytics = await request('/trips/analytics');
  assert(analytics.status === 200, 'Trip analytics');

  const start = await request(`/trips/${tripId}/start`, { method: 'POST' });
  assert(start.status === 200, 'Start trip');
  assert(start.data.data.trip.status === 'in_progress', 'Status in progress');

  const Driver = (await import('../models/Driver.js')).default;
  const driverAfterStart = await Driver.findById(driverId);
  assert(driverAfterStart.status === 'on_trip', 'Driver set to on_trip');

  const update = await request(`/trips/${tripId}`, {
    method: 'PATCH',
    body: { revenue: 5500, distance: 350 },
  });
  assert(update.status === 200, 'Update in-progress trip');
  assert(update.data.data.trip.revenue === 5500, 'Revenue updated');

  const complete = await request(`/trips/${tripId}/complete`, {
    method: 'POST',
    body: { distance: 350, fuelUsed: 45, revenue: 5500, expenses: 1300 },
  });
  assert(complete.status === 200, 'Complete trip');
  assert(complete.data.data.trip.status === 'pending_dispatcher_review', 'Status pending review');

  const driverAfterComplete = await Driver.findById(driverId);
  assert(driverAfterComplete.status === 'available', 'Driver back to available');

  const review = await request(`/trips/${tripId}/review`, {
    method: 'POST',
    body: {
      revenue: 5500,
      expenseBreakdown: { fuel: 800, tolls: 200, maintenance: 100, food: 100, lodging: 100, other: 0 },
      reviewNotes: 'Approved by dispatcher',
    },
  });
  assert(review.status === 200, 'Review trip');
  assert(review.data.data.trip.status === 'reviewed', 'Status reviewed');
  assert(review.data.data.trip.profit === 4200, 'Profit calculated');

  const Vehicle = (await import('../models/Vehicle.js')).default;
  const vehicleAfterComplete = await Vehicle.findById(vehicleId);
  assert(vehicleAfterComplete.odometer === 50350, 'Vehicle odometer updated');

  const history = await request(`/trips/${tripId}/history`);
  assert(history.status === 200, 'Trip history');
  assert(history.data.data.history.length >= 4, 'History entries recorded');

  const exportRes = await request('/trips/export');
  assert(exportRes.status === 200, 'Export CSV');
  assert(typeof exportRes.data === 'string' && exportRes.data.includes('Trip Number'), 'CSV has headers');

  const scheduledAt2 = new Date(Date.now() + 86400000).toISOString();
  const create2 = await request('/trips', {
    method: 'POST',
    body: {
      driverId,
      vehicleId,
      scheduledAt: scheduledAt2,
      origin: { address: 'Point A', lat: 1, lng: 1 },
      destination: { address: 'Point B', lat: 2, lng: 2 },
    },
  });
  assert(create2.status === 201, 'Create second trip');
  const trip2Id = create2.data.data.trip.id;

  const cancel = await request(`/trips/${trip2Id}/cancel`, {
    method: 'POST',
    body: { notes: 'Cancelled by test' },
  });
  assert(cancel.status === 200, 'Cancel trip');
  assert(cancel.data.data.trip.status === 'cancelled', 'Status cancelled');

  const deleteCancelled = await request(`/trips/${trip2Id}`, { method: 'DELETE' });
  assert(deleteCancelled.status === 200, 'Delete cancelled trip');

  const scheduledAt3 = new Date(Date.now() + 2 * 86400000).toISOString();
  const create3 = await request('/trips', {
    method: 'POST',
    body: {
      driverId,
      vehicleId,
      scheduledAt: scheduledAt3,
      origin: { address: 'Point C', lat: 3, lng: 3 },
      destination: { address: 'Point D', lat: 4, lng: 4 },
    },
  });
  assert(create3.status === 201, 'Create trip for delete test');
  const trip3Id = create3.data.data.trip.id;

  const deleteRes = await request(`/trips/${trip3Id}`, { method: 'DELETE' });
  assert(deleteRes.status === 200, 'Delete scheduled trip');

  const unauth = await request('/trips', { headers: { Authorization: '' } });
  assert(unauth.status === 401, 'Unauthenticated returns 401');

  console.log('\n=== All Trip Tests Passed ===\n');

  process.exit(0);
};

runTests().catch((err) => {
  console.error(err);
  process.exit(1);
});
