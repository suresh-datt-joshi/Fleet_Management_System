import { PERMISSIONS } from '../constants/roles.js';
import { SOCKET_EVENTS, SOCKET_ROOMS } from '../constants/socketEvents.js';
import { socketHasPermission } from './authMiddleware.js';
import { hasFleetAlertAccess } from '../utils/notificationTargeting.js';

export const registerAlertsSocketHandlers = (socket) => {
  const joinAlerts = () => {
    if (
      socketHasPermission(socket, PERMISSIONS.VIEW_ALERTS) &&
      hasFleetAlertAccess(socket.user?.role)
    ) {
      socket.join(SOCKET_ROOMS.ALERTS);
    }
  };

  joinAlerts();

  socket.on(SOCKET_EVENTS.ALERTS_SUBSCRIBE, joinAlerts);

  socket.on(SOCKET_EVENTS.ALERTS_UNSUBSCRIBE, () => {
    socket.leave(SOCKET_ROOMS.ALERTS);
  });
};

export default registerAlertsSocketHandlers;
