/**
 * Alerts & Notifications module integration test
 */
import dotenv from 'dotenv';
import { MongoMemoryServer } from 'mongodb-memory-server';

dotenv.config();
process.env.PORT = '6099';
process.env.DISABLE_GPS_SIMULATOR = 'true';

const BASE = `http://localhost:${process.env.PORT}/api/v1`;
let memoryServer;
let accessToken;
let vehicleId;
let driverId;
let alertId;
let notificationId;

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
  const Driver = (await import('../models/Driver.js')).default;
  const { USER_ROLES } = await import('../constants/roles.js');
  const { VEHICLE_STATUS, DRIVER_STATUS } = await import('../constants/enums.js');

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
    vehicleNumber: 'ALT-001',
    model: 'Sprinter',
    manufacturer: 'Mercedes',
    year: 2022,
    status: VEHICLE_STATUS.ACTIVE,
    fuelLevel: 15,
    documentExpiry: {
      insurance: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
    },
  });
  vehicleId = vehicle._id.toString();

  const driver = await Driver.create({
    firstName: 'Alert',
    lastName: 'Driver',
    email: 'alertdriver@fleet.com',
    licenseNumber: 'DL-ALT-001',
    licenseExpiry: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
    status: DRIVER_STATUS.AVAILABLE,
    assignedVehicle: vehicle._id,
  });
  driverId = driver._id.toString();
};

const runTests = async () => {
  console.log('\n=== Alerts & Notifications Module Integration Tests ===\n');

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

  const create = await request('/alerts', {
    method: 'POST',
    body: {
      type: 'low_fuel',
      severity: 'high',
      title: 'Low Fuel Test Alert',
      message: 'Vehicle ALT-001 fuel level critical',
      vehicleId,
      driverId,
    },
  });
  assert(create.status === 201, 'Create alert', JSON.stringify(create.data));
  alertId = create.data.data.alert.id;
  assert(create.data.data.alert.type === 'low_fuel', 'Alert type set');

  const list = await request('/alerts');
  assert(list.status === 200, 'List alerts');
  assert(list.data.data.alerts.length >= 1, 'Alerts returned');

  const detail = await request(`/alerts/${alertId}`);
  assert(detail.status === 200, 'Get alert by ID');

  const stats = await request('/alerts/stats');
  assert(stats.status === 200, 'Alert stats');
  assert(stats.data.data.total >= 1, 'Stats show alerts');
  assert(stats.data.data.unread >= 1, 'Unread count');

  const analytics = await request('/alerts/analytics?days=30');
  assert(analytics.status === 200, 'Alert analytics');

  const notifList = await request('/notifications');
  assert(notifList.status === 200, 'List notifications');
  assert(notifList.data.data.notifications.length >= 1, 'Notifications fan-out created');
  notificationId = notifList.data.data.notifications[0].id;

  const notifStats = await request('/notifications/stats');
  assert(notifStats.status === 200, 'Notification stats');
  assert(notifStats.data.data.unread >= 1, 'Notification unread count');

  const markNotifRead = await request(`/notifications/${notificationId}/read`, { method: 'PATCH' });
  assert(markNotifRead.status === 200, 'Mark notification as read');
  assert(markNotifRead.data.data.notification.isRead === true, 'Notification is read');

  const markRead = await request(`/alerts/${alertId}/read`, { method: 'PATCH' });
  assert(markRead.status === 200, 'Mark alert as read');
  assert(markRead.data.data.alert.isRead === true, 'Alert is read');

  const sync = await request('/alerts/sync', { method: 'POST' });
  assert(sync.status === 200, 'Sync alerts');
  assert(sync.data.data.synced >= 1, 'Sync created alerts from fleet data');

  const update = await request(`/alerts/${alertId}`, {
    method: 'PATCH',
    body: { severity: 'critical', message: 'Updated alert message' },
  });
  assert(update.status === 200, 'Update alert');
  assert(update.data.data.alert.severity === 'critical', 'Severity updated');

  const exportRes = await request('/alerts/export');
  assert(exportRes.status === 200, 'Export CSV');
  assert(typeof exportRes.data === 'string' && exportRes.data.includes('Type'), 'CSV has headers');

  const markAll = await request('/notifications/mark-all-read', { method: 'POST' });
  assert(markAll.status === 200, 'Mark all notifications read');

  const create2 = await request('/alerts', {
    method: 'POST',
    body: {
      type: 'overspeed',
      severity: 'medium',
      title: 'Overspeed Alert',
      message: 'Speed limit exceeded',
      vehicleId,
    },
  });
  assert(create2.status === 201, 'Create second alert');
  const alert2Id = create2.data.data.alert.id;

  const bulkDelete = await request('/alerts/bulk-delete', {
    method: 'POST',
    body: { ids: [alert2Id] },
  });
  assert(bulkDelete.status === 200, 'Bulk delete alerts');

  const deleteRes = await request(`/alerts/${alertId}`, { method: 'DELETE' });
  assert(deleteRes.status === 200, 'Delete alert');

  const unauth = await request('/alerts');
  const savedToken = accessToken;
  accessToken = null;
  const unauthRes = await request('/alerts');
  accessToken = savedToken;
  assert(unauthRes.status === 401, 'Unauthenticated returns 401');

  console.log('\n=== All Alerts & Notifications Tests Passed ===\n');

  process.exit(0);
};

runTests().catch((err) => {
  console.error(err);
  process.exit(1);
});
