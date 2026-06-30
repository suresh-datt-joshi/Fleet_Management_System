export const ALERT_TYPES = {
  LOW_FUEL: 'low_fuel',
  OVERSPEED: 'overspeed',
  MAINTENANCE_DUE: 'maintenance_due',
  INSURANCE_EXPIRY: 'insurance_expiry',
  DOCUMENT_EXPIRY: 'document_expiry',
  GEOFENCE_EXIT: 'geofence_exit',
  GEOFENCE_ENTER: 'geofence_enter',
};

export const ALERT_SEVERITY = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical',
};

export const alertTypeLabels = {
  low_fuel: 'Low Fuel',
  overspeed: 'Overspeed',
  maintenance_due: 'Maintenance Due',
  insurance_expiry: 'Insurance Expiry',
  document_expiry: 'Document Expiry',
  geofence_exit: 'Geofence Exit',
  geofence_enter: 'Geofence Enter',
};

export const severityColors = {
  low: 'default',
  medium: 'warning',
  high: 'error',
  critical: 'error',
};

export const severityLabels = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  critical: 'Critical',
};

export const notificationTypeLabels = {
  alert: 'Alert',
  system: 'System',
  maintenance: 'Maintenance',
  document: 'Document',
  trip: 'Trip',
  geofence: 'Geofence',
  fuel: 'Fuel',
};
