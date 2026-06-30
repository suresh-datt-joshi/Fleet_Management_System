import { PERMISSIONS } from '../constants/roles.js';
import { SOCKET_EVENTS, SOCKET_ROOMS } from '../constants/socketEvents.js';
import { socketHasPermission } from './authMiddleware.js';

export const registerNotificationsSocketHandlers = (socket) => {
  if (socketHasPermission(socket, PERMISSIONS.VIEW_ALERTS) && socket.userId) {
    socket.join(SOCKET_ROOMS.userNotifications(socket.userId));
  }
};

export default registerNotificationsSocketHandlers;
