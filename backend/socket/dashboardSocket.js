import { PERMISSIONS } from '../constants/roles.js';
import { SOCKET_EVENTS, SOCKET_ROOMS } from '../constants/socketEvents.js';
import { socketHasPermission } from './authMiddleware.js';

export const registerDashboardSocketHandlers = (socket) => {
  const joinDashboard = () => {
    if (socketHasPermission(socket, PERMISSIONS.VIEW_ANALYTICS)) {
      socket.join(SOCKET_ROOMS.DASHBOARD);
    }
  };

  joinDashboard();

  socket.on(SOCKET_EVENTS.DASHBOARD_SUBSCRIBE, joinDashboard);

  socket.on(SOCKET_EVENTS.DASHBOARD_UNSUBSCRIBE, () => {
    socket.leave(SOCKET_ROOMS.DASHBOARD);
  });
};

export default registerDashboardSocketHandlers;
