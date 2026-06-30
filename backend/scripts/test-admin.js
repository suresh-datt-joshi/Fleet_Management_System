/**
 * Admin Panel & Settings module integration test
 */
import dotenv from 'dotenv';
import { MongoMemoryServer } from 'mongodb-memory-server';

dotenv.config();
process.env.PORT = '6299';
process.env.DISABLE_GPS_SIMULATOR = 'true';

const BASE = `http://localhost:${process.env.PORT}/api/v1`;
let memoryServer;
let adminToken;
let managerToken;
let userId;

const assert = (cond, msg, detail = '') => {
  if (!cond) throw new Error(`FAIL: ${msg}${detail ? ` — ${detail}` : ''}`);
  console.log(`PASS: ${msg}`);
};

const request = async (path, options = {}) => {
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
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
    firstName: 'Super',
    lastName: 'Admin',
    email: 'admin@fleet.com',
    password: 'Admin@123456',
    role: USER_ROLES.SUPER_ADMIN,
    isEmailVerified: true,
    isActive: true,
  });

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

const runTests = async () => {
  console.log('\n=== Admin Panel & Settings Module Integration Tests ===\n');

  memoryServer = await MongoMemoryServer.create();
  process.env.MONGODB_URI = memoryServer.getUri();
  process.env.JWT_SECRET = 'test-jwt';
  process.env.JWT_REFRESH_SECRET = 'test-refresh';

  const { startServer } = await import('../server.js');
  await startServer();
  await new Promise((r) => setTimeout(r, 2000));

  await seed();

  const adminLogin = await request('/auth/login', {
    method: 'POST',
    body: { email: 'admin@fleet.com', password: 'Admin@123456' },
  });
  assert(adminLogin.status === 200, 'Super admin login');
  adminToken = adminLogin.data.data.accessToken;

  const managerLogin = await request('/auth/login', {
    method: 'POST',
    body: { email: 'manager@fleet.com', password: 'Manager@123456' },
  });
  assert(managerLogin.status === 200, 'Fleet manager login');
  managerToken = managerLogin.data.data.accessToken;

  const stats = await request('/admin/stats', { token: adminToken });
  assert(stats.status === 200, 'Admin stats');
  assert(stats.data.data.users.total >= 2, 'Stats show users');

  const roles = await request('/admin/roles', { token: adminToken });
  assert(roles.status === 200, 'Get roles');
  assert(roles.data.data.length === 5, 'Five roles returned');

  const permissions = await request('/admin/permissions', { token: adminToken });
  assert(permissions.status === 200, 'Get permissions');

  const settings = await request('/admin/settings', { token: managerToken });
  assert(settings.status === 200, 'Get settings (fleet manager)');
  assert(settings.data.data.settings.companyName, 'Default settings created');

  const updateSettings = await request('/admin/settings', {
    method: 'PATCH',
    token: managerToken,
    body: {
      companyName: 'Acme Fleet Co',
      fuelLowThreshold: 15,
      speedLimitKmh: 90,
      alertsEnabled: true,
    },
  });
  assert(updateSettings.status === 200, 'Update settings');
  assert(updateSettings.data.data.settings.companyName === 'Acme Fleet Co', 'Settings updated');
  assert(updateSettings.data.data.settings.fuelLowThreshold === 15, 'Threshold updated');

  const createUser = await request('/admin/users', {
    method: 'POST',
    token: adminToken,
    body: {
      firstName: 'New',
      lastName: 'Dispatcher',
      email: 'dispatcher@fleet.com',
      password: 'Dispatch@123',
      role: 'dispatcher',
      phone: '+1555123456',
    },
  });
  assert(createUser.status === 201, 'Create user', JSON.stringify(createUser.data));
  userId = createUser.data.data.user.id;
  assert(createUser.data.data.user.role === 'dispatcher', 'User role set');

  const listUsers = await request('/admin/users', { token: adminToken });
  assert(listUsers.status === 200, 'List users');
  assert(listUsers.data.data.users.length >= 3, 'Users listed');

  const getUser = await request(`/admin/users/${userId}`, { token: adminToken });
  assert(getUser.status === 200, 'Get user by ID');

  const updateUser = await request(`/admin/users/${userId}`, {
    method: 'PATCH',
    token: adminToken,
    body: { firstName: 'Updated', isActive: true },
  });
  assert(updateUser.status === 200, 'Update user');
  assert(updateUser.data.data.user.firstName === 'Updated', 'Name updated');

  const resetPw = await request(`/admin/users/${userId}/reset-password`, {
    method: 'POST',
    token: adminToken,
    body: { password: 'NewPass@123456' },
  });
  assert(resetPw.status === 200, 'Reset user password');

  const newLogin = await request('/auth/login', {
    method: 'POST',
    body: { email: 'dispatcher@fleet.com', password: 'NewPass@123456' },
  });
  assert(newLogin.status === 200, 'User can login with new password');

  const managerDenied = await request('/admin/users', { token: managerToken });
  assert(managerDenied.status === 403, 'Fleet manager cannot list users');

  const deleteUser = await request(`/admin/users/${userId}`, {
    method: 'DELETE',
    token: adminToken,
  });
  assert(deleteUser.status === 200, 'Delete user');

  const unauth = await request('/admin/stats');
  assert(unauth.status === 401, 'Unauthenticated returns 401');

  console.log('\n=== All Admin Panel & Settings Tests Passed ===\n');

  process.exit(0);
};

runTests().catch((err) => {
  console.error(err);
  process.exit(1);
});
