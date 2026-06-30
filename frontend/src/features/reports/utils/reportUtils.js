export const REPORT_TYPES = {
  FLEET_SUMMARY: 'fleet_summary',
  FINANCIAL: 'financial',
  OPERATIONAL: 'operational',
  VEHICLES: 'vehicles',
  DRIVERS: 'drivers',
  TRIPS: 'trips',
  FUEL: 'fuel',
  MAINTENANCE: 'maintenance',
  DOCUMENTS: 'documents',
  ALERTS: 'alerts',
  ROUTES: 'routes',
};

export const REPORT_CATEGORIES = {
  summary: 'Summary',
  financial: 'Financial',
  operational: 'Operational',
  fleet: 'Fleet',
  operations: 'Operations',
  compliance: 'Compliance',
};

export const categoryColors = {
  summary: '#1565C0',
  financial: '#2E7D32',
  operational: '#ED6C02',
  fleet: '#00897B',
  operations: '#7B1FA2',
  compliance: '#D32F2F',
};

export const formatCurrency = (value) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value || 0);

export const formatNumber = (value) => new Intl.NumberFormat('en-US').format(value || 0);
