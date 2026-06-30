/**
 * Document Management module integration test
 */
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

dotenv.config();
process.env.PORT = '5899';
process.env.DISABLE_GPS_SIMULATOR = 'true';

const BASE = `http://localhost:${process.env.PORT}/api/v1`;
let memoryServer;
let accessToken;
let vehicleId;
let documentId;

const assert = (cond, msg, detail = '') => {
  if (!cond) throw new Error(`FAIL: ${msg}${detail ? ` — ${detail}` : ''}`);
  console.log(`PASS: ${msg}`);
};

const request = async (path, options = {}) => {
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      ...(options.headers || {}),
    },
    body: options.body,
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
    vehicleNumber: 'DOC-001',
    model: 'Transit',
    manufacturer: 'Ford',
    year: 2022,
    status: VEHICLE_STATUS.ACTIVE,
  });
  vehicleId = vehicle._id.toString();
};

const uploadDocument = async (fields, fileContent = 'test pdf content') => {
  const formData = new FormData();
  formData.append('file', new Blob([fileContent], { type: 'application/pdf' }), 'insurance-policy.pdf');
  Object.entries(fields).forEach(([key, value]) => formData.append(key, value));

  const res = await fetch(`${BASE}/documents`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}` },
    body: formData,
  });
  const data = await res.json();
  return { status: res.status, data };
};

const runTests = async () => {
  console.log('\n=== Document Management Module Integration Tests ===\n');

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
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'manager@fleet.com', password: 'Manager@123456' }),
  });
  assert(login.status === 200, 'Fleet manager login');
  accessToken = login.data.data.accessToken;

  const metaVehicles = await request('/documents/meta/vehicles');
  assert(metaVehicles.status === 200, 'Meta vehicles');

  const metaDrivers = await request('/documents/meta/drivers');
  assert(metaDrivers.status === 200, 'Meta drivers');

  const expiringDate = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString();

  const create = await uploadDocument({
    title: 'Vehicle Insurance Policy',
    type: 'insurance',
    vehicleId,
    issueDate: new Date().toISOString(),
    expiryDate: expiringDate,
    reminderDaysBefore: '30',
    notes: 'Annual insurance renewal',
  });
  assert(create.status === 201, 'Upload document', JSON.stringify(create.data));
  documentId = create.data.data.document.id;
  assert(create.data.data.document.fileUrl, 'Document has file URL');

  const expiredCreate = await uploadDocument(
    {
      title: 'Expired Registration',
      type: 'registration',
      vehicleId,
      expiryDate: new Date(Date.now() - 86400000).toISOString(),
    },
    'expired doc'
  );
  assert(expiredCreate.status === 201, 'Upload expired document');

  const list = await request('/documents');
  assert(list.status === 200, 'List documents');
  assert(list.data.data.documents.length >= 2, 'Documents listed');

  const detail = await request(`/documents/${documentId}`);
  assert(detail.status === 200, 'Get document by ID');

  const stats = await request('/documents/stats');
  assert(stats.status === 200, 'Document stats');
  assert(stats.data.data.total >= 2, 'Stats show documents');

  const expiring = await request('/documents/expiring?days=30');
  assert(expiring.status === 200, 'Expiring documents');
  assert(expiring.data.data.length >= 1, 'Expiring docs returned');

  const analytics = await request('/documents/analytics');
  assert(analytics.status === 200, 'Document analytics');

  const download = await request(`/documents/${documentId}/download`);
  assert(download.status === 200, 'Download info');
  assert(download.data.data.downloadUrl, 'Download URL returned');

  const update = await request(`/documents/${documentId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title: 'Updated Insurance Policy', notes: 'Updated notes' }),
  });
  assert(update.status === 200, 'Update document metadata');

  const exportRes = await fetch(`${BASE}/documents/export`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  assert(exportRes.status === 200, 'Export CSV');
  const csv = await exportRes.text();
  assert(csv.includes('Document #'), 'CSV has headers');

  const del = await request(`/documents/${documentId}`, { method: 'DELETE' });
  assert(del.status === 200, 'Delete document');

  const savedToken = accessToken;
  accessToken = null;
  const noAuth = await request('/documents');
  accessToken = savedToken;
  assert(noAuth.status === 401, 'Unauthenticated returns 401');

  const { stopGpsSimulator } = await import('../jobs/gpsSimulator.js');
  stopGpsSimulator();

  console.log('\n=== All Document Tests Passed ===\n');
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
