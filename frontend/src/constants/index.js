export const USER_ROLES = {
  SUPER_ADMIN: 'super_admin',
  FLEET_MANAGER: 'fleet_manager',
  DISPATCHER: 'dispatcher',
  DRIVER: 'driver',
  MECHANIC: 'mechanic',
};

export const ROLE_LABELS = {
  super_admin: 'Super Admin',
  fleet_manager: 'Fleet Manager',
  dispatcher: 'Dispatcher',
  driver: 'Driver',
  mechanic: 'Mechanic',
};

export const VEHICLE_STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  MAINTENANCE: 'maintenance',
  RETIRED: 'retired',
};

export const TRIP_STATUS = {
  SCHEDULED: 'scheduled',
  IN_PROGRESS: 'in_progress',
  PENDING_DISPATCHER_REVIEW: 'pending_dispatcher_review',
  REVIEWED: 'reviewed',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
};

export const FINANCIALLY_CLOSED_TRIP_STATUSES = [TRIP_STATUS.REVIEWED, TRIP_STATUS.COMPLETED];

export const TRIP_EXPENSE_CATEGORIES = {
  FUEL: 'fuel',
  FOOD: 'food',
  TOLL: 'toll',
  LODGING: 'lodging',
  OTHER: 'other',
};

export const CONSIGNMENT_STATUS = {
  PENDING: 'pending',
  PICKED_UP: 'picked_up',
  IN_TRANSIT: 'in_transit',
  DELIVERED: 'delivered',
  PARTIAL: 'partial',
  FAILED: 'failed',
};

export const DRIVER_STATUS = {
  AVAILABLE: 'available',
  ON_TRIP: 'on_trip',
  OFF_DUTY: 'off_duty',
  SUSPENDED: 'suspended',
};

export const ALERT_TYPES = {
  LOW_FUEL: 'low_fuel',
  OVERSPEED: 'overspeed',
  MAINTENANCE_DUE: 'maintenance_due',
  INSURANCE_EXPIRY: 'insurance_expiry',
  DOCUMENT_EXPIRY: 'document_expiry',
  GEOFENCE_EXIT: 'geofence_exit',
};

export const DOCUMENT_TYPES = {
  INSURANCE: 'insurance',
  REGISTRATION: 'registration',
  FITNESS: 'fitness',
  EMISSION: 'emission',
  PERMIT: 'permit',
  LICENSE: 'license',
  MEDICAL: 'medical',
  CONTRACT: 'contract',
  OTHER: 'other',
};

export const DOCUMENT_ENTITY_TYPES = {
  VEHICLE: 'vehicle',
  DRIVER: 'driver',
  FLEET: 'fleet',
};

export const PERMISSIONS = {
  VIEW_VEHICLES: 'view_vehicles',
  CREATE_VEHICLES: 'create_vehicles',
  UPDATE_VEHICLES: 'update_vehicles',
  DELETE_VEHICLES: 'delete_vehicles',
  ASSIGN_VEHICLES: 'assign_vehicles',
  CREATE_DRIVERS: 'create_drivers',
  VIEW_DRIVERS: 'view_drivers',
  UPDATE_DRIVERS: 'update_drivers',
  DELETE_DRIVERS: 'delete_drivers',
  ASSIGN_DRIVERS: 'assign_drivers',
  VIEW_TRACKING: 'view_tracking',
  MANAGE_GEOFENCES: 'manage_geofences',
  VIEW_TRIPS: 'view_trips',
  MANAGE_ROUTES: 'manage_routes',
  CREATE_TRIPS: 'create_trips',
  UPDATE_TRIPS: 'update_trips',
  REVIEW_TRIPS: 'review_trips',
  DELETE_TRIPS: 'delete_trips',
  VIEW_REPORTS: 'view_reports',
  EXPORT_REPORTS: 'export_reports',
  VIEW_ANALYTICS: 'view_analytics',
  VIEW_FUEL: 'view_fuel',
  MANAGE_FUEL: 'manage_fuel',
  VIEW_MAINTENANCE: 'view_maintenance',
  MANAGE_MAINTENANCE: 'manage_maintenance',
  ASSIGN_WORK_ORDERS: 'assign_work_orders',
  VIEW_DOCUMENTS: 'view_documents',
  MANAGE_DOCUMENTS: 'manage_documents',
  VIEW_ALERTS: 'view_alerts',
  MANAGE_ALERTS: 'manage_alerts',
  VIEW_ADMIN_PANEL: 'view_admin_panel',
  MANAGE_USERS: 'manage_users',
  MANAGE_SETTINGS: 'manage_settings',
};

export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';
export const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';
