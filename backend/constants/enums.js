export const VEHICLE_STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  MAINTENANCE: 'maintenance',
  RETIRED: 'retired',
};

export const DRIVER_STATUS = {
  AVAILABLE: 'available',
  ON_TRIP: 'on_trip',
  OFF_DUTY: 'off_duty',
  SUSPENDED: 'suspended',
};

export const TRIP_STATUS = {
  SCHEDULED: 'scheduled',
  IN_PROGRESS: 'in_progress',
  PENDING_DISPATCHER_REVIEW: 'pending_dispatcher_review',
  REVIEWED: 'reviewed',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
};

/** Trips included in financial reports and analytics */
export const FINANCIALLY_CLOSED_TRIP_STATUSES = [TRIP_STATUS.REVIEWED, TRIP_STATUS.COMPLETED];

export const ROUTE_STATUS = {
  DRAFT: 'draft',
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  ARCHIVED: 'archived',
};

export const ROUTE_STOP_TYPES = {
  PICKUP: 'pickup',
  DELIVERY: 'delivery',
  WAYPOINT: 'waypoint',
  FUEL: 'fuel',
  REST: 'rest',
};

export const TRAFFIC_LEVELS = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  SEVERE: 'severe',
};

export const FUEL_TYPES = {
  PETROL: 'petrol',
  DIESEL: 'diesel',
  ELECTRIC: 'electric',
  CNG: 'cng',
  HYBRID: 'hybrid',
};

export const FUEL_STATION_STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
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

export const DOCUMENT_STATUS = {
  ACTIVE: 'active',
  EXPIRING_SOON: 'expiring_soon',
  EXPIRED: 'expired',
  ARCHIVED: 'archived',
};

export const MAINTENANCE_STATUS = {
  SCHEDULED: 'scheduled',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  OVERDUE: 'overdue',
};

export const MAINTENANCE_TYPE = {
  PREVENTIVE: 'preventive',
  REPAIR: 'repair',
  INSPECTION: 'inspection',
};

export const MAINTENANCE_PRIORITY = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical',
};

export const ALERT_TYPES = {
  LOW_FUEL: 'low_fuel',
  OVERSPEED: 'overspeed',
  MAINTENANCE_DUE: 'maintenance_due',
  INSURANCE_EXPIRY: 'insurance_expiry',
  DOCUMENT_EXPIRY: 'document_expiry',
  GEOFENCE_EXIT: 'geofence_exit',
  GEOFENCE_ENTER: 'geofence_enter',
};

export const GEOFENCE_TYPES = {
  CIRCLE: 'circle',
  POLYGON: 'polygon',
};

export const GEOFENCE_EVENT_TYPES = {
  ENTER: 'enter',
  EXIT: 'exit',
};

export const ALERT_SEVERITY = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical',
};

export const NOTIFICATION_TYPES = {
  ALERT: 'alert',
  SYSTEM: 'system',
  MAINTENANCE: 'maintenance',
  DOCUMENT: 'document',
  TRIP: 'trip',
  GEOFENCE: 'geofence',
  FUEL: 'fuel',
};

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

export const REPORT_FORMATS = {
  CSV: 'csv',
  JSON: 'json',
};

export const REPORT_STATUS = {
  COMPLETED: 'completed',
  FAILED: 'failed',
};

export const ACTIVITY_TYPES = {
  TRIP_CREATED: 'trip_created',
  TRIP_STARTED: 'trip_started',
  TRIP_COMPLETED: 'trip_completed',
  TRIP_SUBMITTED: 'trip_submitted',
  TRIP_REVIEWED: 'trip_reviewed',
  TRIP_CANCELLED: 'trip_cancelled',
  VEHICLE_ADDED: 'vehicle_added',
  VEHICLE_UPDATED: 'vehicle_updated',
  VEHICLE_DELETED: 'vehicle_deleted',
  DRIVER_ADDED: 'driver_added',
  DRIVER_UPDATED: 'driver_updated',
  DRIVER_DELETED: 'driver_deleted',
  DRIVER_ASSIGNED: 'driver_assigned',
  DRIVER_UNASSIGNED: 'driver_unassigned',
  MAINTENANCE_SCHEDULED: 'maintenance_scheduled',
  MAINTENANCE_STARTED: 'maintenance_started',
  MAINTENANCE_COMPLETED: 'maintenance_completed',
  FUEL_LOGGED: 'fuel_logged',
  ALERT_TRIGGERED: 'alert_triggered',
  ROUTE_CREATED: 'route_created',
  ROUTE_UPDATED: 'route_updated',
  ROUTE_OPTIMIZED: 'route_optimized',
  DOCUMENT_UPLOADED: 'document_uploaded',
  DOCUMENT_EXPIRING: 'document_expiring',
};

export const DRIVER_HISTORY_ACTIONS = {
  CREATED: 'created',
  UPDATED: 'updated',
  DELETED: 'deleted',
  VEHICLE_ASSIGNED: 'vehicle_assigned',
  VEHICLE_UNASSIGNED: 'vehicle_unassigned',
  STATUS_CHANGED: 'status_changed',
  DOCUMENT_ADDED: 'document_added',
  DOCUMENT_REMOVED: 'document_removed',
  AVATAR_UPDATED: 'avatar_updated',
};

export const VEHICLE_HISTORY_ACTIONS = {
  CREATED: 'created',
  UPDATED: 'updated',
  DELETED: 'deleted',
  ASSIGNED: 'driver_assigned',
  UNASSIGNED: 'driver_unassigned',
  STATUS_CHANGED: 'status_changed',
  IMAGE_ADDED: 'image_added',
  IMAGE_REMOVED: 'image_removed',
};

export const ROUTE_HISTORY_ACTIONS = {
  CREATED: 'created',
  UPDATED: 'updated',
  DELETED: 'deleted',
  OPTIMIZED: 'optimized',
  DUPLICATED: 'duplicated',
  STATUS_CHANGED: 'status_changed',
};

export const MAINTENANCE_HISTORY_ACTIONS = {
  CREATED: 'created',
  UPDATED: 'updated',
  DELETED: 'deleted',
  ASSIGNED: 'mechanic_assigned',
  STARTED: 'started',
  REPORT_SUBMITTED: 'report_submitted',
  COMPLETED: 'completed',
  STATUS_CHANGED: 'status_changed',
};

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

export const TRIP_HISTORY_ACTIONS = {
  CREATED: 'created',
  UPDATED: 'updated',
  DELETED: 'deleted',
  STARTED: 'started',
  COMPLETED: 'completed',
  SUBMITTED: 'submitted',
  REVIEWED: 'reviewed',
  CANCELLED: 'cancelled',
  STATUS_CHANGED: 'status_changed',
  EXPENSE_ADDED: 'expense_added',
  CONSIGNMENT_UPDATED: 'consignment_updated',
};

export default {
  VEHICLE_STATUS,
  DRIVER_STATUS,
  TRIP_STATUS,
  MAINTENANCE_STATUS,
  MAINTENANCE_TYPE,
  ALERT_TYPES,
  ALERT_SEVERITY,
  ACTIVITY_TYPES,
};
