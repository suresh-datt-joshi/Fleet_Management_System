import { SOCKET_EVENTS } from '../constants/socketEvents.js';
import { socketAuthMiddleware } from './authMiddleware.js';
import { registerGpsSocketHandlers } from './gpsSocket.js';
import { registerAlertsSocketHandlers } from './alertsSocket.js';
import { registerTripsSocketHandlers } from './tripsSocket.js';
import { registerNotificationsSocketHandlers } from './notificationsSocket.js';
import { registerDashboardSocketHandlers } from './dashboardSocket.js';
import * as socketService from '../services/socketService.js';

export const initSockets = (io) => {
  socketService.initSocketService(io);

  io.use(socketAuthMiddleware);

  io.on('connection', (socket) => {
    socketService.onConnectionOpen();

    registerGpsSocketHandlers(socket);
    registerAlertsSocketHandlers(socket);
    registerTripsSocketHandlers(socket);
    registerNotificationsSocketHandlers(socket);
    registerDashboardSocketHandlers(socket);

    socket.emit(SOCKET_EVENTS.CONNECTED, {
      userId: socket.userId,
      role: socket.userRole,
      permissions: socket.permissions,
      timestamp: new Date().toISOString(),
    });

    socket.on('disconnect', () => {
      socketService.onConnectionClose();
    });
  });
};

export default initSockets;
