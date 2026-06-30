import { SOCKET_ROOMS, SOCKET_EVENTS } from '../constants/socketEvents.js';

let ioInstance = null;
let activeConnections = 0;

export const initSocketService = (io) => {
  ioInstance = io;
};

export const getIO = () => ioInstance;

export const getActiveConnections = () => activeConnections;

export const onConnectionOpen = () => {
  activeConnections += 1;
};

export const onConnectionClose = () => {
  activeConnections = Math.max(0, activeConnections - 1);
};

const emitToRoom = (room, event, payload) => {
  if (!ioInstance) return;
  ioInstance.to(room).emit(event, payload);
};

export const emitToGpsTracking = (event, payload) => {
  emitToRoom(SOCKET_ROOMS.GPS_TRACKING, event, payload);
};

export const emitToAlerts = (event, payload) => {
  emitToRoom(SOCKET_ROOMS.ALERTS, event, payload);
};

export const emitToTrips = (event, payload) => {
  emitToRoom(SOCKET_ROOMS.TRIPS, event, payload);
};

export const emitToDashboard = (event, payload) => {
  emitToRoom(SOCKET_ROOMS.DASHBOARD, event, payload);
};

export const emitToUser = (userId, event, payload) => {
  if (!userId) return;
  emitToRoom(SOCKET_ROOMS.userNotifications(userId.toString()), event, payload);
};

export const emitGpsVehicleUpdate = (payload) => {
  emitToGpsTracking(SOCKET_EVENTS.GPS_VEHICLE_UPDATE, payload);
};

export const emitGpsAlert = (payload) => {
  emitToGpsTracking(SOCKET_EVENTS.GPS_ALERT, payload);
};

export const emitAlertCreated = (alert) => {
  emitToAlerts(SOCKET_EVENTS.ALERT_CREATED, alert);
};

export const emitAlertUpdated = (alert) => {
  emitToAlerts(SOCKET_EVENTS.ALERT_UPDATED, alert);
};

export const emitAlertDeleted = (alertId) => {
  emitToAlerts(SOCKET_EVENTS.ALERT_DELETED, { id: alertId });
};

export const emitAlertsAllRead = (payload = {}) => {
  emitToAlerts(SOCKET_EVENTS.ALERTS_ALL_READ, payload);
};

export const emitNotificationNew = (userId, notification) => {
  emitToUser(userId, SOCKET_EVENTS.NOTIFICATION_NEW, notification);
};

export const emitNotificationRead = (userId, notification) => {
  emitToUser(userId, SOCKET_EVENTS.NOTIFICATION_READ, notification);
};

export const emitNotificationsAllRead = (userId, payload = {}) => {
  emitToUser(userId, SOCKET_EVENTS.NOTIFICATIONS_ALL_READ, payload);
};

export const emitTripStarted = (trip) => {
  emitToTrips(SOCKET_EVENTS.TRIP_STARTED, trip);
};

export const emitTripCompleted = (trip) => {
  emitToTrips(SOCKET_EVENTS.TRIP_COMPLETED, trip);
};

export const emitTripSubmitted = (trip) => {
  emitToTrips(SOCKET_EVENTS.TRIP_SUBMITTED, trip);
};

export const emitTripCancelled = (trip) => {
  emitToTrips(SOCKET_EVENTS.TRIP_CANCELLED, trip);
};

export const emitTripUpdated = (trip) => {
  emitToTrips(SOCKET_EVENTS.TRIP_UPDATED, trip);
};

export const emitDashboardActivity = (activity) => {
  emitToDashboard(SOCKET_EVENTS.DASHBOARD_ACTIVITY, activity);
};

export const getRoomStats = async () => {
  if (!ioInstance) {
    return {
      activeConnections,
      rooms: {},
    };
  }

  const sockets = await ioInstance.fetchSockets();
  const rooms = {};

  for (const socket of sockets) {
    for (const room of socket.rooms) {
      if (room === socket.id) continue;
      rooms[room] = (rooms[room] || 0) + 1;
    }
  }

  return {
    activeConnections: sockets.length,
    rooms,
  };
};

export default {
  initSocketService,
  getIO,
  getActiveConnections,
  onConnectionOpen,
  onConnectionClose,
  emitGpsVehicleUpdate,
  emitGpsAlert,
  emitAlertCreated,
  emitAlertUpdated,
  emitAlertDeleted,
  emitAlertsAllRead,
  emitNotificationNew,
  emitNotificationRead,
  emitNotificationsAllRead,
  emitTripStarted,
  emitTripCompleted,
  emitTripSubmitted,
  emitTripCancelled,
  emitTripUpdated,
  emitDashboardActivity,
  getRoomStats,
};
