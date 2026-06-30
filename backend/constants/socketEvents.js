export const SOCKET_ROOMS = {
  GPS_TRACKING: 'gps:tracking',
  ALERTS: 'alerts:fleet',
  TRIPS: 'trips:fleet',
  DASHBOARD: 'dashboard:updates',
  userNotifications: (userId) => `notifications:user:${userId}`,
};

export const SOCKET_EVENTS = {
  // Client → Server
  GPS_SUBSCRIBE: 'gps:subscribe',
  GPS_UNSUBSCRIBE: 'gps:unsubscribe',
  ALERTS_SUBSCRIBE: 'alerts:subscribe',
  ALERTS_UNSUBSCRIBE: 'alerts:unsubscribe',
  TRIPS_SUBSCRIBE: 'trips:subscribe',
  TRIPS_UNSUBSCRIBE: 'trips:unsubscribe',
  DASHBOARD_SUBSCRIBE: 'dashboard:subscribe',
  DASHBOARD_UNSUBSCRIBE: 'dashboard:unsubscribe',

  // Server → Client
  CONNECTED: 'realtime:connected',
  GPS_VEHICLE_UPDATE: 'gps:vehicle-update',
  GPS_ALERT: 'gps:alert',
  ALERT_CREATED: 'alert:created',
  ALERT_UPDATED: 'alert:updated',
  ALERT_DELETED: 'alert:deleted',
  ALERTS_ALL_READ: 'alerts:all-read',
  NOTIFICATION_NEW: 'notification:new',
  NOTIFICATION_READ: 'notification:read',
  NOTIFICATIONS_ALL_READ: 'notifications:all-read',
  TRIP_STARTED: 'trip:started',
  TRIP_COMPLETED: 'trip:completed',
  TRIP_SUBMITTED: 'trip:submitted',
  TRIP_CANCELLED: 'trip:cancelled',
  TRIP_UPDATED: 'trip:updated',
  DASHBOARD_ACTIVITY: 'dashboard:activity',
};

export default { SOCKET_ROOMS, SOCKET_EVENTS };
