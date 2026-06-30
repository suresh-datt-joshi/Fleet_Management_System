export const TEST_TYPES = {
  INTEGRATION: 'integration',
  UNIT: 'unit',
  SMOKE: 'smoke',
  FRONTEND: 'frontend',
};

export const TEST_SUITES = [
  { id: 'auth', name: 'Authentication', module: 2, type: TEST_TYPES.INTEGRATION, script: 'test-auth.js', npmScript: 'test:auth' },
  { id: 'dashboard', name: 'Dashboard & Analytics', module: 3, type: TEST_TYPES.INTEGRATION, script: 'test-dashboard.js', npmScript: 'test:dashboard' },
  { id: 'vehicles', name: 'Vehicle Management', module: 4, type: TEST_TYPES.INTEGRATION, script: 'test-vehicles.js', npmScript: 'test:vehicles' },
  { id: 'drivers', name: 'Driver Management', module: 5, type: TEST_TYPES.INTEGRATION, script: 'test-drivers.js', npmScript: 'test:drivers' },
  { id: 'gps', name: 'GPS Tracking & Geofencing', module: 6, type: TEST_TYPES.INTEGRATION, script: 'test-gps.js', npmScript: 'test:gps' },
  { id: 'routes', name: 'Route Management', module: 7, type: TEST_TYPES.INTEGRATION, script: 'test-routes.js', npmScript: 'test:routes' },
  { id: 'fuel', name: 'Fuel Management', module: 8, type: TEST_TYPES.INTEGRATION, script: 'test-fuel.js', npmScript: 'test:fuel' },
  { id: 'maintenance', name: 'Maintenance Management', module: 9, type: TEST_TYPES.INTEGRATION, script: 'test-maintenance.js', npmScript: 'test:maintenance' },
  { id: 'documents', name: 'Document Management', module: 10, type: TEST_TYPES.INTEGRATION, script: 'test-documents.js', npmScript: 'test:documents' },
  { id: 'trips', name: 'Trip Management', module: 11, type: TEST_TYPES.INTEGRATION, script: 'test-trips.js', npmScript: 'test:trips' },
  { id: 'alerts', name: 'Alerts & Notifications', module: 12, type: TEST_TYPES.INTEGRATION, script: 'test-alerts.js', npmScript: 'test:alerts' },
  { id: 'reports', name: 'Reports & Export', module: 13, type: TEST_TYPES.INTEGRATION, script: 'test-reports.js', npmScript: 'test:reports' },
  { id: 'admin', name: 'Admin Panel & Settings', module: 14, type: TEST_TYPES.INTEGRATION, script: 'test-admin.js', npmScript: 'test:admin' },
  { id: 'maps', name: 'Maps Integration', module: 16, type: TEST_TYPES.INTEGRATION, script: 'test-maps.js', npmScript: 'test:maps' },
];

export const UNIT_TEST_GROUPS = [
  { id: 'geo-utils', name: 'Geo Utilities', file: 'geoUtils.test.js' },
  { id: 'polyline-utils', name: 'Polyline Utilities', file: 'polylineUtils.test.js' },
  { id: 'pagination', name: 'Pagination Utilities', file: 'pagination.test.js' },
  { id: 'roles', name: 'RBAC Configuration', file: 'roles.test.js' },
];

export const FRONTEND_TEST_GROUPS = [
  { id: 'formatters', name: 'Formatters', file: 'formatters.test.js' },
  { id: 'polyline-utils', name: 'Polyline Utilities', file: 'polylineUtils.test.js' },
  { id: 'auth-slice', name: 'Auth Redux Slice', file: 'authSlice.test.js' },
];

export const getIntegrationSuites = () => TEST_SUITES.filter((s) => s.type === TEST_TYPES.INTEGRATION);

export default {
  TEST_TYPES,
  TEST_SUITES,
  UNIT_TEST_GROUPS,
  FRONTEND_TEST_GROUPS,
  getIntegrationSuites,
};
